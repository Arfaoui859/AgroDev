import type { RequestHandler } from "express";
import multer from "multer";
import { uploadError, ALLOWED_IMAGE_MIME_TYPES } from "../middleware/upload";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) cb(null, true);
    else cb(uploadError({ message: "نوع الصورة غير مدعوم. استخدم JPEG أو PNG أو WebP." }));
  },
});

export const uploadMiddleware = upload.array("images", 10);

function unavailable(_req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) {
  res.setHeader("X-AgroGrowth-Data-Status", "unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance", "unverified");
  return res.status(503).json({
    success: false,
    code: "DISEASE_REFERENCE_NOT_VERIFIED",
    message: "تشخيص الصور وقاعدة الأمراض القديمة غير مفعّلين. استخدم خدمة تشخيص الصور فقط عندما يكون المصنّف المدرّب متاحاً.",
    data: null,
    provenance: { source: null, verified: false },
  });
}

/**
 * Legacy route disabled: its former local disease table contained unverified
 * confidence values, treatment doses and economic-loss estimates. The current
 * image microservice endpoint is /api/ai/images/detect-disease.
 */
export const analyzePlantImages: RequestHandler = (req, res) => unavailable(req, res);
export const getDiseaseHistory: RequestHandler = (req, res) => unavailable(req, res);
export const getDiseaseInfo: RequestHandler = (req, res) => unavailable(req, res);
export const getAllDiseases: RequestHandler = (req, res) => unavailable(req, res);
