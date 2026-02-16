import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        error: "Missing environment variables",
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      message: "Supabase connected successfully 🚀",
    });
  } catch (err: any) {
    console.error("CRASH ERROR:", err);
    return res.status(500).json({
      crash: true,
      message: err.message,
    });
  }
}
