import type { RequestHandler } from "express";
import { supabaseAdmin, scopedClientFromAuthHeader } from "../lib/supabase";

export const getCurrentUserRecord: RequestHandler = async (req, res) => {
  if (!req.userId) return res.status(401).json({ success: false, error: "Unauthorized" });
  const client = supabaseAdmin || scopedClientFromAuthHeader(req.header("authorization"));
  if (!client) return res.status(503).json({ success: false, error: "User database is not configured." });
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", req.userId)
    .maybeSingle();
  if (error) {
    console.error("[auth/me] user profile lookup failed:", error.message);
    return res.status(503).json({ success: false, error: "Unable to verify the user profile." });
  }
  if (!data) return res.status(404).json({ success: false, error: "No application user record exists for this account." });
  return res.json({ success: true, data });
};
