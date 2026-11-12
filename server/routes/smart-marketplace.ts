import type { RequestHandler } from "express";

/**
 * Marketplace listings, inquiries and analytics require persisted seller and
 * buyer records; supply-chain tracking requires persisted batch/step records.
 * Both fail closed, but with a capability-specific code so a caller can tell
 * the two stores apart.
 */
function unavailableWith(code: string, message: string): RequestHandler {
  return (_req, res) => {
    res.set("X-Data-Provenance", "unavailable");
    res.set("X-Is-Real-Data", "false");
    return res.status(503).json({
      success: false,
      code,
      message,
      data: null,
      dataAvailable: false,
      isRealData: false,
      productionReady: false,
    });
  };
}

const unavailable = unavailableWith(
  "MARKETPLACE_STORE_NOT_CONNECTED",
  "السوق الزراعي غير متاح حتى ربط عروض ومخزون وبائعين ومشترين محفوظين في قاعدة البيانات.",
);
const supplyChainUnavailable = unavailableWith(
  "SUPPLY_CHAIN_STORE_NOT_CONNECTED",
  "تتبع سلسلة الإمداد غير متاح حتى ربط دفعات وتخزين ومراحل محفوظة في قاعدة البيانات.",
);

export const getMarketplaceListings = unavailable;
export const getMarketplaceInquiries = unavailable;
export const getMarketplaceAnalytics = unavailable;
export const getSupplyChainNodes = supplyChainUnavailable;
export const createMarketplaceListing = unavailable;
export const createInquiry = unavailable;
