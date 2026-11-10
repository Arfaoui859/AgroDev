import type { Request, Response } from "express";
import { scopedClientFromAuthHeader, supabaseAdmin } from "../lib/supabase";

function callerDb(req: Request) {
  return scopedClientFromAuthHeader(req.header("authorization"));
}

export interface TrustedAssistantTurn {
  authorization: string | undefined;
  userId: string;
  conversationId?: string | null;
  userContent: string;
  assistantContent: string;
  language: "ar" | "fr" | "en";
  dataSource: "llm" | "rule-based";
  modelSource: string;
  metadata?: Record<string, unknown>;
}

/**
 * Persist a model response generated inside the server process. The browser
 * cannot call this function or supply assistant provenance; it is invoked only
 * after chatWithAIAssistant has generated the response from the trusted advisor.
 * User messages use the caller-scoped JWT client; assistant messages use the
 * server-only service-role client after conversation ownership is verified.
 */
export async function persistTrustedAssistantTurn(turn: TrustedAssistantTurn): Promise<string> {
  const db = scopedClientFromAuthHeader(turn.authorization);
  if (!db || !turn.userId) throw new Error("VERIFIED_SESSION_REQUIRED");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !supabaseAdmin) {
    throw new Error("ASSISTANT_SERVICE_ROLE_NOT_CONFIGURED");
  }
  if (!turn.userContent.trim() || !turn.assistantContent.trim() ||
      turn.userContent.length > 20_000 || turn.assistantContent.length > 20_000 ||
      !["llm", "rule-based"].includes(turn.dataSource) ||
      !turn.modelSource || turn.modelSource.length > 200) {
    throw new Error("INVALID_TRUSTED_ASSISTANT_TURN");
  }

  let conversationId = turn.conversationId || null;
  let createdConversation = false;
  if (conversationId) {
    const { data, error } = await db.from("farm_agent_conversations")
      .select("id").eq("id", conversationId).eq("user_id", turn.userId).maybeSingle();
    if (error) throw new Error("CONVERSATION_OWNERSHIP_CHECK_FAILED");
    if (!data) throw new Error("CONVERSATION_NOT_FOUND");
  } else {
    const { data, error } = await db.from("farm_agent_conversations").insert({
      user_id: turn.userId,
      title: turn.userContent.trim().slice(0, 180) || "AgroGrowth Assistant",
      language: turn.language,
      category: "general",
    }).select("id").single();
    if (error || !data?.id) throw new Error("CONVERSATION_CREATE_FAILED");
    conversationId = data.id;
    createdConversation = true;
  }

  const { data: userMessage, error: userInsertError } = await db.from("farm_agent_messages").insert({
    conversation_id: conversationId,
    user_id: turn.userId,
    role: "user",
    content: turn.userContent.trim(),
    language: turn.language,
    data_source: null,
    model_source: null,
    metadata: {},
  }).select("id").single();
  if (userInsertError || !userMessage?.id) {
    if (createdConversation) {
      await db.from("farm_agent_conversations").delete().eq("id", conversationId).eq("user_id", turn.userId);
    }
    throw new Error("USER_MESSAGE_PERSIST_FAILED");
  }

  const { error: assistantInsertError } = await supabaseAdmin.from("farm_agent_messages").insert({
    conversation_id: conversationId,
    user_id: turn.userId,
    role: "assistant",
    content: turn.assistantContent.trim(),
    language: turn.language,
    data_source: turn.dataSource,
    model_source: turn.modelSource,
    metadata: turn.metadata ?? {},
  });
  if (assistantInsertError) {
    await db.from("farm_agent_messages").delete().eq("id", userMessage.id).eq("user_id", turn.userId);
    if (createdConversation) {
      await db.from("farm_agent_conversations").delete().eq("id", conversationId).eq("user_id", turn.userId);
    }
    throw new Error("ASSISTANT_MESSAGE_PERSIST_FAILED");
  }

  const { error: timestampError } = await db.from("farm_agent_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId).eq("user_id", turn.userId);
  if (timestampError) console.warn("Assistant conversation timestamp update failed:", timestampError.code);
  return conversationId;
}

function unavailable(res: Response) {
  return res.status(503).json({
    success: false,
    code: "ASSISTANT_MEMORY_DATABASE_UNAVAILABLE",
    message: "يلزم التثبت من اتصال قاعدة البيانات وتطبيق ترحيل ذاكرة المساعد.",
  });
}

function persistenceFailure(res: Response, operation: string, error: { code?: string; message?: string }) {
  const code = error.code || "UNKNOWN_DATABASE_ERROR";
  const missingTable = code === "PGRST205" || /Could not find the table/i.test(error.message || "");
  const permissionDenied = code === "42501";
  const details = missingTable
    ? "جداول ذاكرة المساعد غير موجودة في مخطط Supabase. طبّق database/autonomous-farm-agent.sql ثم أعد المحاولة."
    : permissionDenied
      ? "قاعدة البيانات رفضت العملية بسبب صلاحيات RLS. تحقق من JWT وسياسات المستخدم."
      : "تعذّر تنفيذ العملية في قاعدة البيانات. لم يتم اعتبارها محفوظة.";
  return res.status(503).json({
    success: false,
    code: missingTable ? "ASSISTANT_MIGRATION_REQUIRED" : permissionDenied ? "ASSISTANT_RLS_DENIED" : operation,
    databaseCode: code,
    message: details,
  });
}

export async function listAgentConversations(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const { data, error } = await db.from("farm_agent_conversations")
    .select("id,title,language,category,created_at,updated_at")
    .eq("user_id", req.userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return persistenceFailure(res, "CONVERSATION_LIST_FAILED", error);
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
  if (error) return persistenceFailure(res, "CONVERSATION_CREATE_FAILED", error);
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.farm_agent_conversations", persisted: true } });
}

export async function listAgentConversationMessages(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const { data: conversation, error: conversationError } = await db.from("farm_agent_conversations")
    .select("id").eq("id", req.params.conversationId).eq("user_id", req.userId).maybeSingle();
  if (conversationError) return persistenceFailure(res, "CONVERSATION_READ_FAILED", conversationError);
  if (!conversation) return res.status(404).json({ success: false, code: "CONVERSATION_NOT_FOUND" });
  const { data, error } = await db.from("farm_agent_messages")
    .select("id,conversation_id,role,content,language,data_source,model_source,metadata,created_at")
    .eq("conversation_id", req.params.conversationId).eq("user_id", req.userId)
    .order("created_at", { ascending: true }).limit(300);
  if (error) return persistenceFailure(res, "CONVERSATION_MESSAGES_READ_FAILED", error);
  return res.json({ success: true, data: data ?? [] });
}

export async function addAgentConversationMessage(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const role = req.body?.role;
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  const language = ["ar", "fr", "en"].includes(req.body?.language) ? req.body.language : "ar";
  // This public endpoint persists caller-authored input only. Assistant
  // messages and model provenance must be written by a trusted server workflow.
  if (role !== "user") {
    return res.status(403).json({
      success: false,
      code: "ASSISTANT_MESSAGE_SERVER_ONLY",
      message: "Assistant messages can only be persisted by the trusted AI service.",
    });
  }
  if (!content || content.length > 20_000) {
    return res.status(400).json({ success: false, code: "INVALID_CONVERSATION_MESSAGE" });
  }
  const { data: conversation, error: conversationError } = await db.from("farm_agent_conversations")
    .select("id").eq("id", req.params.conversationId).eq("user_id", req.userId).maybeSingle();
  if (conversationError) return persistenceFailure(res, "CONVERSATION_READ_FAILED", conversationError);
  if (!conversation) return res.status(404).json({ success: false, code: "CONVERSATION_NOT_FOUND" });
  const { data, error } = await db.from("farm_agent_messages").insert({
    conversation_id: req.params.conversationId,
    user_id: req.userId,
    role,
    content,
    language,
    data_source: null,
    model_source: null,
    metadata: {},
  }).select("id,conversation_id,role,content,language,data_source,model_source,metadata,created_at").single();
  if (error) return persistenceFailure(res, "CONVERSATION_MESSAGE_SAVE_FAILED", error);
  const { error: updateError } = await db.from("farm_agent_conversations").update({ updated_at: new Date().toISOString() })
    .eq("id", req.params.conversationId).eq("user_id", req.userId);
  if (updateError) {
    // The message itself is persisted. Report the metadata update separately;
    // never tell the client that the message was lost after a successful insert.
    console.warn("Assistant conversation timestamp update failed:", updateError.code);
  }
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.farm_agent_messages", persisted: true } });
}

export async function deleteAgentConversation(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res);
  const { data, error } = await db.from("farm_agent_conversations").delete()
    .eq("id", req.params.conversationId).eq("user_id", req.userId).select("id").maybeSingle();
  if (error) return persistenceFailure(res, "CONVERSATION_DELETE_FAILED", error);
  if (!data) return res.status(404).json({ success: false, code: "CONVERSATION_NOT_FOUND" });
  return res.json({ success: true, deletedId: data.id });
}
