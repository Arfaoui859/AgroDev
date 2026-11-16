import type { RequestHandler } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function callerDb(req: Parameters<RequestHandler>[0]) {
  if (req.identitySource !== "jwt" || !req.userId) return null;
  return scopedClientFromAuthHeader(req.header("authorization"));
}

function fail(res: Parameters<RequestHandler>[1], code: string, status = 503) {
  return res.status(status).json({
    success: false,
    code,
    message: status === 503
      ? "تعذّر الاتصال بقاعدة بيانات المجتمع. لم يتم حفظ أي تغيير."
      : "راجع محتوى الطلب وحاول مجدداً.",
  });
}

export const listCommunityPosts: RequestHandler = async (req, res) => {
  const db = callerDb(req);
  if (!db) return fail(res, "VERIFIED_SESSION_REQUIRED", 401);

  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  let query = db
    .from("community_posts")
    .select("id,author_id,content,category,media_urls,created_at,updated_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (typeof req.query.category === "string" && req.query.category !== "all") {
    query = query.eq("category", req.query.category);
  }

  const { data: posts, error } = await query;
  if (error) {
    console.error("[community] list posts failed:", error.code);
    return fail(res, "COMMUNITY_POSTS_UNAVAILABLE");
  }

  const postIds = (posts ?? []).map((post) => post.id);
  const authorIds = [...new Set((posts ?? []).map((post) => post.author_id))];
  if (!postIds.length) return res.json({ success: true, data: [], pagination: { limit, offset } });

  const [profiles, likes, comments, ownLikes] = await Promise.all([
    db.from("users").select("id,full_name,role,governorate").in("id", authorIds),
    db.from("community_post_likes").select("post_id,user_id").in("post_id", postIds),
    db.from("community_comments").select("post_id").in("post_id", postIds),
    db.from("community_post_likes").select("post_id").eq("user_id", req.userId).in("post_id", postIds),
  ]);

  if (profiles.error || likes.error || comments.error || ownLikes.error) {
    console.error("[community] enrich posts failed:", profiles.error?.code || likes.error?.code || comments.error?.code || ownLikes.error?.code);
    return fail(res, "COMMUNITY_POST_DETAILS_UNAVAILABLE");
  }

  const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));
  const likeCounts = new Map<string, number>();
  for (const like of likes.data ?? []) likeCounts.set(like.post_id, (likeCounts.get(like.post_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const comment of comments.data ?? []) commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) ?? 0) + 1);
  const likedByMe = new Set((ownLikes.data ?? []).map((like) => like.post_id));

  return res.json({
    success: true,
    data: (posts ?? []).map((post) => ({
      ...post,
      author: profileById.get(post.author_id) ?? null,
      likes_count: likeCounts.get(post.id) ?? 0,
      comments_count: commentCounts.get(post.id) ?? 0,
      liked_by_me: likedByMe.has(post.id),
    })),
    pagination: { limit, offset },
    provenance: { source: "supabase.community_posts", persisted: true },
  });
};

export const createCommunityPost: RequestHandler = async (req, res) => {
  const db = callerDb(req);
  if (!db) return fail(res, "VERIFIED_SESSION_REQUIRED", 401);

  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  const category = typeof req.body?.category === "string" ? req.body.category.trim().slice(0, 40) : "general";
  const mediaUrls = Array.isArray(req.body?.media_urls)
    ? req.body.media_urls.filter((url: unknown) => typeof url === "string" && /^https:\/\//i.test(url)).slice(0, 4)
    : [];

  if (!content || content.length > 5000) return fail(res, "INVALID_POST_CONTENT", 400);

  const { data, error } = await db
    .from("community_posts")
    .insert({ author_id: req.userId, content, category: category || "general", media_urls: mediaUrls })
    .select("id,author_id,content,category,media_urls,created_at,updated_at")
    .single();

  if (error || !data) {
    console.error("[community] create post failed:", error?.code);
    return fail(res, "COMMUNITY_POST_CREATE_FAILED");
  }

  const { data: author } = await db
    .from("users")
    .select("id,full_name,role,governorate")
    .eq("id", req.userId)
    .maybeSingle();

  return res.status(201).json({
    success: true,
    data: { ...data, author: author ?? null, likes_count: 0, comments_count: 0, liked_by_me: false },
    provenance: { source: "supabase.community_posts", persisted: true },
  });
};

export const listCommunityComments: RequestHandler = async (req, res) => {
  const db = callerDb(req);
  if (!db) return fail(res, "VERIFIED_SESSION_REQUIRED", 401);
  const postId = String(req.params.postId || "");
  if (!UUID.test(postId)) return fail(res, "INVALID_POST_ID", 400);

  const { data, error } = await db
    .from("community_comments")
    .select("id,post_id,author_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[community] list comments failed:", error.code);
    return fail(res, "COMMUNITY_COMMENTS_UNAVAILABLE");
  }

  const authorIds = [...new Set((data ?? []).map((comment) => comment.author_id))];
  const { data: profiles, error: profileError } = authorIds.length
    ? await db.from("users").select("id,full_name,role,governorate").in("id", authorIds)
    : { data: [], error: null };
  if (profileError) return fail(res, "COMMUNITY_COMMENT_AUTHORS_UNAVAILABLE");

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return res.json({
    success: true,
    data: (data ?? []).map((comment) => ({ ...comment, author: profileById.get(comment.author_id) ?? null })),
    provenance: { source: "supabase.community_comments", persisted: true },
  });
};

export const createCommunityComment: RequestHandler = async (req, res) => {
  const db = callerDb(req);
  if (!db) return fail(res, "VERIFIED_SESSION_REQUIRED", 401);
  const postId = String(req.params.postId || "");
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!UUID.test(postId) || !content || content.length > 2000) return fail(res, "INVALID_COMMENT", 400);

  const { data, error } = await db
    .from("community_comments")
    .insert({ post_id: postId, author_id: req.userId, content })
    .select("id,post_id,author_id,content,created_at")
    .single();

  if (error || !data) {
    console.error("[community] create comment failed:", error?.code);
    return fail(res, "COMMUNITY_COMMENT_CREATE_FAILED");
  }

  return res.status(201).json({
    success: true,
    data,
    provenance: { source: "supabase.community_comments", persisted: true },
  });
};

export const toggleCommunityLike: RequestHandler = async (req, res) => {
  const db = callerDb(req);
  if (!db) return fail(res, "VERIFIED_SESSION_REQUIRED", 401);
  const postId = String(req.params.postId || "");
  if (!UUID.test(postId)) return fail(res, "INVALID_POST_ID", 400);

  const { data: existing, error: lookupError } = await db
    .from("community_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", req.userId)
    .maybeSingle();

  if (lookupError) return fail(res, "COMMUNITY_LIKE_LOOKUP_FAILED");

  if (existing) {
    const { error } = await db
      .from("community_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", req.userId);
    if (error) return fail(res, "COMMUNITY_UNLIKE_FAILED");
    return res.json({ success: true, data: { liked: false }, provenance: { source: "supabase.community_post_likes", persisted: true } });
  }

  const { error } = await db
    .from("community_post_likes")
    .insert({ post_id: postId, user_id: req.userId });
  if (error) return fail(res, "COMMUNITY_LIKE_FAILED");

  return res.json({ success: true, data: { liked: true }, provenance: { source: "supabase.community_post_likes", persisted: true } });
};
