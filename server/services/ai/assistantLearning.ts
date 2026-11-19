/**
 * Extract only explicit, agriculture-related user corrections for the
 * per-user learning ledger. This is memory/feedback, not model training.
 * Arbitrary chat text is never promoted into durable knowledge.
 */
const CORRECTION_MARKERS = [
  /(?:لا\s*[،,]?\s*(?:الصحيح|موش|مش)|غلط|موش صحيح|مش صحيح|قصدي|نقصد|تصحيح|المعلومة الصحيحة)/i,
  /(?:no\\s*[,:]|that is wrong|correction:|i meant|not correct|the correct (?:answer|value|name) is)/i,
  /(?:non\\s*[,:]|je voulais dire|la bonne (?:réponse|valeur) est|correction\\s*:)/i,
];
const AGRICULTURE_MARKERS = /(?:فلاحة|فلاح|ضيعة|مزرعة|حقل|محصول|زيتون|زيت|طماطم|مطيشة|قمح|تربة|ري|سقي|سماد|مرض|آفة|طقس|مطر|سعر|سوق|غراسة|زراعة|agri|farm|field|crop|olive|tomato|soil|irrigat|fertili[sz]|pest|disease|market price|harvest|plantation|sol|culture|irrigation|prix|récolte)/i;

export function extractExplicitAgriculturalCorrection(message: string): string | null {
  const value = typeof message === "string" ? message.replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim() : "";
  if (!value || value.length > 1200) return null;
  if (!CORRECTION_MARKERS.some((marker) => marker.test(value))) return null;
  if (!AGRICULTURE_MARKERS.test(value)) return null;
  // Avoid persisting likely contact/credential strings from accidental pastes.
  if (/(?:\b\d{8,}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/i.test(value)) return null;
  return value.slice(0, 700);
}

export function formatLearningCorrection(record: {
  correction_text?: string | null;
  created_at?: string | null;
}): string {
  const correction = String(record.correction_text ?? "").slice(0, 700);
  const date = String(record.created_at ?? "date unavailable").slice(0, 40);
  return "USER CORRECTION (user-provided feedback; verify against current evidence, not a universal fact) [date=" + date + "]: " + correction;
}
