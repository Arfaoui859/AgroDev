import crypto from "crypto";
import multer from "multer";
import type { Request, Response, RequestHandler } from "express";
import { scopedClientFromAuthHeader, supabaseAdmin } from "../lib/supabase";

const diseaseEvidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) callback(null, true);
    else callback(new Error("Only JPEG, PNG and WebP images are accepted."));
  },
}).single("file");

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedSeverity = new Set(["low", "moderate", "medium", "high", "critical", "mild", "severe", "unknown"]);

export const createAssistantDiseaseDetection: RequestHandler[] = [
  diseaseEvidenceUpload,
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const db = req.identitySource === "jwt" ? scopedClientFromAuthHeader(req.header("authorization")) : null;
    if (!userId || !db) {
      return res.status(401).json({ success: false, code: "VERIFIED_SESSION_REQUIRED" });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !supabaseAdmin) {
      return res.status(503).json({ success: false, code: "EVIDENCE_STORAGE_NOT_CONFIGURED" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, code: "DISEASE_IMAGE_REQUIRED" });
    }

    const farmId = typeof req.body?.farm_id === "string" ? req.body.farm_id.trim() : "";
    const cultivationId = typeof req.body?.cultivation_id === "string" && req.body.cultivation_id.trim()
      ? req.body.cultivation_id.trim()
      : null;
    const plantType = typeof req.body?.plant_type === "string" ? req.body.plant_type.trim().slice(0, 100) : "";
    const primaryDisease = typeof req.body?.primary_disease === "string" ? req.body.primary_disease.trim().slice(0, 100) : "";
    const severityRaw = typeof req.body?.severity_level === "string" ? req.body.severity_level.trim().toLowerCase() : "unknown";
    const severity = allowedSeverity.has(severityRaw) ? severityRaw : "unknown";
    const confidenceRaw = req.body?.disease_confidence;
    const confidence = confidenceRaw === "" || confidenceRaw === undefined || confidenceRaw === null
      ? null
      : Number(confidenceRaw);
    if (!uuidPattern.test(farmId) || (cultivationId && !uuidPattern.test(cultivationId))) {
      return res.status(400).json({ success: false, code: "INVALID_FARM_OR_CULTIVATION_ID" });
    }
    if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) {
      return res.status(400).json({ success: false, code: "INVALID_DISEASE_CONFIDENCE" });
    }

    const { data: farm, error: farmError } = await db.from("farms")
      .select("id").eq("id", farmId).eq("owner_id", userId).maybeSingle();
    if (farmError) return res.status(503).json({ success: false, code: "FARM_OWNERSHIP_CHECK_FAILED" });
    if (!farm) return res.status(404).json({ success: false, code: "FARM_NOT_FOUND_OR_NOT_OWNED" });

    if (cultivationId) {
      const { data: cultivation, error: cultivationError } = await db.from("crop_cultivations")
        .select("id").eq("id", cultivationId).eq("farm_id", farmId).maybeSingle();
      if (cultivationError) return res.status(503).json({ success: false, code: "CULTIVATION_OWNERSHIP_CHECK_FAILED" });
      if (!cultivation) return res.status(404).json({ success: false, code: "CULTIVATION_NOT_FOUND_IN_FARM" });
    }

    let suppliedAnalysis: Record<string, unknown> = {};
    if (typeof req.body?.analysis_result === "string") {
      try {
        const parsed = JSON.parse(req.body.analysis_result);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) suppliedAnalysis = parsed;
      } catch {
        return res.status(400).json({ success: false, code: "INVALID_ANALYSIS_RESULT_JSON" });
      }
    }
    if (JSON.stringify(suppliedAnalysis).length > 24_000) {
      return res.status(413).json({ success: false, code: "ANALYSIS_RESULT_TOO_LARGE" });
    }

    const extension = req.file.mimetype === "image/png" ? "png" : req.file.mimetype === "image/webp" ? "webp" : "jpg";
    const storageBucket = "agrogrowth-disease-evidence";
    const storagePath = userId + "/" + farmId + "/" + crypto.randomUUID() + "." + extension;
    const upload = await supabaseAdmin.storage.from(storageBucket).upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (upload.error) {
      console.error("Assistant disease evidence upload failed:", upload.error.message);
      return res.status(503).json({ success: false, code: "DISEASE_IMAGE_STORAGE_FAILED" });
    }

    const record = {
      farm_id: farmId,
      cultivation_id: cultivationId,
      detection_method: "image_ai",
      plant_type: plantType || null,
      image_url: "storage://" + storageBucket + "/" + storagePath,
      analysis_result: {
        ...suppliedAnalysis,
        assistant_recorded: true,
        record_origin: "assistant_chat_user_confirmed",
        image_storage_bucket: storageBucket,
        image_storage_path: storagePath,
        diagnosis_requires_field_verification: true,
        submitted_model_result_is_not_independently_verified: true,
      },
      primary_disease: primaryDisease || null,
      disease_confidence: confidence,
      severity_level: severity,
      treatment_plan: suppliedAnalysis.treatment_plan ?? suppliedAnalysis.treatment ?? null,
      treatment_applied: false,
      recovery_status: "pending",
      detected_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("plant_disease_detections")
      .insert(record)
      .select("id,farm_id,cultivation_id,plant_type,primary_disease,severity_level,disease_confidence,recovery_status,detected_at,image_url")
      .single();
    if (error) {
      await supabaseAdmin.storage.from(storageBucket).remove([storagePath]);
      console.error("Assistant disease record insert failed:", error.message);
      return res.status(503).json({ success: false, code: "DISEASE_RECORD_SAVE_FAILED" });
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(storageBucket).createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    return res.status(201).json({
      success: true,
      data: { ...data, image_signed_url: signedError ? null : signed?.signedUrl ?? null },
      provenance: {
        record: "supabase.plant_disease_detections",
        image: "supabase.storage/" + storageBucket,
        persisted: true,
        diagnosisIndependentlyVerified: false,
      },
      message: "تم حفظ سجل المتابعة والصورة وربطهما بالمزرعة. النتيجة البصرية مازالت تتطلب تثبّتاً ميدانياً.",
    });
  },
];
