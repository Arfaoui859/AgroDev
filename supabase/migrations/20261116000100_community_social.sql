-- Persistent, per-user agricultural community.
-- Run with the Supabase migration workflow before enabling the mobile screens.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  category text not null default 'general',
  media_urls text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_created_idx
  on public.community_posts (created_at desc)
  where status = 'published';
create index if not exists community_posts_author_idx
  on public.community_posts (author_id, created_at desc);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at asc);

create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_likes enable row level security;

drop policy if exists "community posts readable by authenticated users" on public.community_posts;
create policy "community posts readable by authenticated users"
  on public.community_posts for select to authenticated
  using (status = 'published' or author_id = auth.uid());

drop policy if exists "users create own community posts" on public.community_posts;
create policy "users create own community posts"
  on public.community_posts for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "authors update own community posts" on public.community_posts;
create policy "authors update own community posts"
  on public.community_posts for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "authors delete own community posts" on public.community_posts;
create policy "authors delete own community posts"
  on public.community_posts for delete to authenticated
  using (author_id = auth.uid());

drop policy if exists "community comments readable by authenticated users" on public.community_comments;
create policy "community comments readable by authenticated users"
  on public.community_comments for select to authenticated
  using (exists (
    select 1 from public.community_posts p
    where p.id = post_id and (p.status = 'published' or p.author_id = auth.uid())
  ));

drop policy if exists "users create own community comments" on public.community_comments;
create policy "users create own community comments"
  on public.community_comments for insert to authenticated
  with check (author_id = auth.uid() and exists (
    select 1 from public.community_posts p where p.id = post_id and p.status = 'published'
  ));

drop policy if exists "authors delete own community comments" on public.community_comments;
create policy "authors delete own community comments"
  on public.community_comments for delete to authenticated
  using (author_id = auth.uid());

drop policy if exists "community likes readable by authenticated users" on public.community_post_likes;
create policy "community likes readable by authenticated users"
  on public.community_post_likes for select to authenticated
  using (exists (
    select 1 from public.community_posts p
    where p.id = post_id and (p.status = 'published' or p.author_id = auth.uid())
  ));

drop policy if exists "users like community posts as themselves" on public.community_post_likes;
create policy "users like community posts as themselves"
  on public.community_post_likes for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.community_posts p where p.id = post_id and p.status = 'published'
  ));

drop policy if exists "users remove own community likes" on public.community_post_likes;
create policy "users remove own community likes"
  on public.community_post_likes for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, delete on public.community_comments to authenticated;
grant select, insert, delete on public.community_post_likes to authenticated;
