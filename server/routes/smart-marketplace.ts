import type { RequestHandler } from "express";

/** Marketplace listings, inquiries and analytics require persisted seller and buyer records. */
const unavailable: RequestHandler = (_req,res) => {
  res.set("X-Data-Provenance","unavailable");
  res.set("X-Is-Real-Data","false");
  return res.status(503).json({
    success:false,
    code:"MARKETPLACE_STORE_NOT_CONNECTED",
    message:"السوق الزراعي غير متاح حتى ربط عروض ومخزون وبائعين ومشترين محفوظين في قاعدة البيانات.",
    data:null,
    dataAvailable:false,
    isRealData:false,
    productionReady:false
  });
};
export const getMarketplaceListings=unavailable;
export const getMarketplaceInquiries=unavailable;
export const getMarketplaceAnalytics=unavailable;
export const getSupplyChainNodes=unavailable;
export const createMarketplaceListing=unavailable;
export const createInquiry=unavailable;
