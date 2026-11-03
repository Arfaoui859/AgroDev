import { Request, Response, NextFunction } from "express";

/**
 * Shared upload helpers.
 *
 * Multer passes any Error raised by a `fileFilter` straight to the error
 * middleware. A plain Error has no status, so the global handler answered 500
 * for what is really a client mistake (e.g. uploading a .txt file). These
 * helpers tag such errors as safe, non-500 responses and translate Multer's own
 * limit errors into the right status codes.
 */

export interface UploadErrorOptions {
  /** HTTP status to answer with. Defaults to 400. */
  status?: number;
  /** Message returned to the client. Must not contain internal details. */
  message: string;
}

/** Build a client-safe error for use inside a Multer `fileFilter`. */
export function uploadError({
  status = 400,
  message,
}: UploadErrorOptions): Error {
  const error = new Error(message) as Error & {
    status: number;
    expose: true;
    isUploadError: true;
  };
  error.status = status;
  // `expose` follows the http-errors convention: the message is safe to return.
  error.expose = true;
  error.isUploadError = true;
  return error;
}

/** Image MIME types the platform accepts for plant/soil photo analysis. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const IMAGE_UNSUPPORTED_MESSAGE =
  "نوع الملف غير مدعوم. يرجى رفع صور بصيغة JPEG, PNG, أو WebP فقط";

/**
 * Sniff the real image format from the first bytes of a buffer.
 *
 * A client controls the `Content-Type` it sends, so a Multer `fileFilter` that
 * only checks `file.mimetype` accepts any file relabelled `image/png`. Passing
 * such bytes to a vision model (or to the heuristic fallback) produces a
 * confident-looking diagnosis from non-image data, which is exactly the kind of
 * fabricated success this platform must not emit. The signature check is the
 * authoritative test.
 *
 * Returns the detected MIME type, or null when the bytes are not a supported
 * image. Magic numbers: JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, and
 * WebP is `RIFF....WEBP`.
 */
export function detectImageMimeType(buffer: Buffer | undefined): string | null {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Verify every uploaded buffer is genuinely an image and return copies whose
 * `mimetype` reflects the sniffed format rather than the client's claim.
 * Throws an upload error (HTTP 400) when any file fails the check.
 */
export function assertRealImages(files: Express.Multer.File[]): void {
  for (const file of files) {
    const detected = detectImageMimeType(file.buffer);
    if (!detected) {
      throw uploadError({ message: IMAGE_UNSUPPORTED_MESSAGE });
    }
    file.mimetype = detected;
  }
}

/**
 * Express middleware: reject a request whose uploaded file(s) are not real
 * images, and normalise `mimetype` to the sniffed format. Must run after the
 * Multer middleware. Answers 400 with a client-safe message on failure.
 */
export function requireRealImages(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (req, res, next) => {
    const single = (req as Request & { file?: Express.Multer.File }).file;
    const multiple = (req as Request & { files?: Express.Multer.File[] }).files;
    const files = multiple ?? (single ? [single] : []);
    try {
      assertRealImages(files);
      next();
    } catch (err) {
      res.status((err as { status?: number }).status ?? 400).json({
        error: (err as Error).message,
      });
    }
  };
}

/**
 * Handle Multer upload errors. Returns true when the error was handled and a
 * response has been sent, false when the caller should continue to the next
 * error handler.
 */
export function handleUploadError(err: any, res: any): boolean {
  if (err?.name === "MulterError") {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "حجم الملف كبير جداً. الحد الأقصى المسموح به هو 10 ميغابايت"
        : `خطأ في رفع الملف: ${err.code}`;
    res.status(status).json({ error: message });
    return true;
  }

  if (err?.isUploadError) {
    res.status(err.status ?? 400).json({ error: err.message });
    return true;
  }

  return false;
}
