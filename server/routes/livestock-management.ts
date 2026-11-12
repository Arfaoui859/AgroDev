/**
 * Livestock management router (mounted at /api/livestock-management).
 *
 * Delegates to the real, tenant-scoped handlers in ./livestock. The previous
 * router generated a synthetic herd and feed stock at runtime; that demo
 * implementation is gone. Every response now comes from the caller's own
 * persisted records, or fails closed with an explicit migration/RLS code.
 */
export { default } from "./livestock";
