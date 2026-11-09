import type { Request, Response } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

function callerDb(req: Request) {
  return scopedClientFromAuthHeader(req.header("authorization"));
}

function unavailable(res: Response) {
  return res.status(503).json({ success: false, code: "ASSISTANT_MEMORY_DATABASE_UNAVAILABLE" });
}

export async function listAgentConversations(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const { data, error } = await db.from("farm_agent_conversations")
    .select("id,title,language,category,created_at,updated_at")
    .eq("user_id", req.userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return res.status(503).json({ success: false, code: "CONVERSATION_LIST_FAILED", message: error.message });
  return res.json({ success: true, data: data ?? [] });
}

export async function createAgentConversation(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 200) : "";
  const language = ["ar", "fr", "en"].includes(req.body?.language) ? req.body.language : "ar";
  const category = typeof req.body?.category === "string" ? req.body.category.slice(0, 50) : "general";
  if (!title) return res.status(400).json({ success: false, code: "CONVERSATION_TITLE_REQUIRED" });
  const { data, error } = await db.from("farm_agent_conversations").insert({
    user_id: req.userId, title, language, category,
  }).select("id,title,language,category,created_at,updated_at").single();
  if (error) return res.status(503).json({ success: false, code: "CONVERSATION_CREATE_FAILED", message: error.message });
  return res.status(201).json({ success: true, data });
}

export async function listAgentConversationMessages(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const { data: conversation, error: conversationError } = await db.from("farm_agent_conversations")
    .select("id").eq("id", req.params.conversationId).eq("user_id", req.userId).maybeSingle();
  if (conversationError) return res.status(503).json({ success: false, code: "CONVERSATION_READ_FAILED", message: conversationError.message });
  if (!conversation) return res.status(404).json({ success: false, code: "CONVERSATION_NOT_FOUND" });
  const { data, error } = await db.from("farm_agent_messages")
    .select("id,conversation_id,role,content,language,data_source,model_source,metadata,created_at")
    .eq("conversation_id", req.params.conversationId).eq("user_id", req.userId)
    .order("created_at", { ascending: true }).limit(300);
  if (error) return res.status(503).json({ success: false, code: "CONVERSATION_MESSAGES_READ_FAILED", message: error.message });
  return res.json({ success: true, data: data ?? [] });
}

export async function addAgentConversationMessage(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const role = req.body?.role;
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  const language = ["ar", "fr", "en"].includes(req.body?.language) ? req.body.language : "ar";
  if (!["user", "assistant"].includes(role) || !content || content.length > 20_000) {
    return res.status(400).json({ success: false, code: "INVALID_CONVERSATION_MESSAGE" });
  }
  const { data: conversation, error: conversationError } = await db.from("farm_agent_conversations")
    .select("id").eq("id", req.params.conversationId).eq("user_id", req.userId).maybeSingle();
  if (conversationError) return res.status(503).json({ success: false, code: "CONVERSATION_READ_FAILED", message: conversationError.message });
  if (!conversation) return res.status(404).json({ success: false, code: "CONVERSATION_NOT_FOUND" });
  const metadata = req.body?.metadata && typeof req.body.metadata === "object" && !Array.isArray(req.body.metadata)
    ? req.body.metadata : {};
  const { data, error } = await db.from("farm_agent_messages").insert({
    conversation_id: req.params.conversationId,
    user_id: req.userId,
    role,
    content,
    language,
    data_source: typeof req.body?.dataSource === "string" ? req.body.dataSource.slice(0, 30) : null,
    model_source: typeof req.body?.modelSource === "string" ? req.body.modelSource.slice(0, 200) : null,
    metadata,
  }).select("id,conversation_id,role,content,language,data_source,model_source,metadata,created_at").single();
  if (error) return res.status(503).json({ success: false, code: "CONVERSATION_MESSAGE_SAVE_FAILED", message: error.message });
  await db.from("farm_agent_conversations").update({ updated_at: new Date().toISOString() })
    .eq("id", req.params.conversationId).eq("user_id", req.userId);
  return res.status(201).json({ success: true, data });
}

export async function deleteAgentConversation(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const { data, error } = await db.from("farm_agent_conversations").delete()
    .eq("id", req.params.conversationId).eq("user_id", req.userId).select("id").maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "CONVERSATION_DELETE_FAILED", message: error.message });
  if (!data) return res.status(404).json({ success: false, code: "CONVERSATION_NOT_FOUND" });
  return res.json({ success: true, deletedId: data.id });
}
