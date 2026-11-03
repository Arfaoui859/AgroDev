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
