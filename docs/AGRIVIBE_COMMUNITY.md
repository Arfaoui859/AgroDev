# AgriVibe Community — implementation and activation

## What is implemented on `mobile-development`

- A mobile community feed with categories, post creation, likes, comments and a Home preview.
- Express endpoints under `/api/community`.
- Verified Supabase JWT identity is required. The API derives the author from the verified request identity; it never trusts a user ID sent by the app.
- RLS-protected tables for posts, comments and likes.
- No seeded/demo posts, fake engagement counters or client-side-only successful writes.

## Database activation required

The schema is defined in:

`supabase/migrations/20261116000100_community_social.sql`

Apply this migration to the intended Supabase project before enabling the community in a deployed environment. It creates:

- `public.community_posts`
- `public.community_comments`
- `public.community_post_likes`

The migration enables RLS, grants access to authenticated users and constrains writes to the caller's own identity. Do not disable RLS to make the screens work.

## API

All endpoints require a verified Supabase session:

- `GET /api/community/posts?limit=30&offset=0&category=all`
- `POST /api/community/posts` — body: `{ "content": "...", "category": "general" }`
- `GET /api/community/posts/:postId/comments`
- `POST /api/community/posts/:postId/comments` — body: `{ "content": "..." }`
- `POST /api/community/posts/:postId/like` — toggles the caller's like.

Responses include Supabase provenance and only report a successful write after the database confirms it.

## Current limitations

- Posts are text-first. The schema has `media_urls`, but upload, storage-bucket policies, image/video picker UI, moderation queue, report/block flows, notifications and creator-following are not implemented yet.
- The legacy `/api/collaboration/forum/*` endpoints remain separate and use in-memory demo data. The new mobile Community screen does not call them.
- The migration has been committed to GitHub but has **not** been applied to Supabase from this workflow.
- No Render deployment or production database change has been performed.
