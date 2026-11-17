import express, { Request, Response } from "express";
import { createHash } from "node:crypto";
import { supabase, supabaseAdmin, scopedClientFromAuthHeader } from "../lib/supabase";
import { requireAdminAccess, requireAuth, requireVerifiedAuth } from "../middleware/auth";

const router = express.Router();
const LISTING_TYPES = new Set(["agricultural_input","equipment","agricultural_product","harvest","livestock","other"]);
const PRODUCT_TYPES = new Set(["pesticide","fertilizer","seed","seedling","soil_amendment","animal_input","other"]);
const text = (v: unknown, max = 500) => typeof v === "string" ? v.trim().slice(0,max) : "";
const positive = (v: unknown) => v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : NaN;
const hash = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
const positiveSigned = (v: unknown) => v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : NaN;
const REGULATED_PESTICIDE_TERMS = /pesticid|herbicid|fungicid|insecticid|acaricid|rodenticid|phytosanitaire|produit\s+phyto|مبيد|مبيدات|دواء\s+فلاحي|أدوية\s+فلاحية|ادوية\s+فلاحية/i;
const isRegulatedPesticideText = (...values: unknown[]) =>
  values.some(value => typeof value === "string" && REGULATED_PESTICIDE_TERMS.test(value));

const SOURCE_TYPES = new Set(["official_open_data","api","csv","rss","permitted_scrape","seller_feed","manual"]);
const VERIFICATION_STATES = new Set(["unverified","source-checked","official-source","rejected"]);
async function updateSourceStatus(db: NonNullable<typeof supabaseAdmin>, values: Record<string, unknown>) {
  const { error } = await db.from("market_data_sources").upsert(values, { onConflict: "source_key" });
  if (error) console.error("[agro-market] source registry update failed", error.message);
}

function publicDb(res: Response) {
  if (!supabase) { res.status(503).json({success:false,code:"DATABASE_NOT_CONFIGURED"}); return null; }
  return supabase;
}
function callerDb(req: Request, res: Response) {
  const db = scopedClientFromAuthHeader(req.header("authorization"));
  if (!db || !req.userId) { res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"}); return null; }
  return db;
}
function adminDb(res: Response) {
  if (!supabaseAdmin) { res.status(503).json({success:false,code:"SERVER_DATABASE_CREDENTIALS_NOT_CONFIGURED"}); return null; }
  return supabaseAdmin;
}


router.get("/sources/status", requireAdminAccess, async (_req,res) => {
  const db=adminDb(res); if(!db) return;
  const {data,error}=await db.from("market_data_sources").select("source_key,source_name,source_url,source_type,refresh_interval_minutes,enabled,last_attempt_at,last_success_at,last_status,last_error").order("source_name");
  if(error) return res.status(503).json({success:false,code:"SOURCE_STATUS_UNAVAILABLE"});
  res.json({success:true,data:data??[]});
});

router.get("/listings", async (req, res) => {
  const db = publicDb(res); if (!db) return;
  try {
    const q = text(req.query.q, 100).replace(/[,%()]/g, " ");
    const type = text(req.query.type, 40);
    const governorate = text(req.query.governorate, 80);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    let query = db.from("marketplace_listings").select("*").eq("status","published")
      .order("created_at",{ascending:false}).limit(limit);
    if (type && LISTING_TYPES.has(type)) query = query.eq("listing_type",type);
    if (governorate) query = query.ilike("governorate",governorate);
    if (q) query = query.ilike("title", `%${q}%`);
    const {data,error} = await query;
    if (error) throw error;
    const rows = (data ?? []).filter((r:any) => !(r.listing_type === "agricultural_input" && isRegulatedPesticideText(r.title,r.category)));
    let sellers: Record<string,string> = {};
    if (supabaseAdmin && rows.length) {
      const ids = [...new Set(rows.map((r:any)=>r.seller_id))];
      const {data:profiles} = await supabaseAdmin.from("users").select("id,full_name").in("id",ids);
      sellers = Object.fromEntries((profiles ?? []).map((p:any)=>[p.id,p.full_name]));
    }
    res.json({success:true,data:{listings:rows.map((r:any)=>({...r,seller_name:sellers[r.seller_id] ?? null}))},
      meta:{provenance:"database",isRealData:true,source:"seller-published-listings",updatedAt:new Date().toISOString()}});
  } catch (e:any) {
    console.error("[agro-market] listing read failed",e?.message);
    res.status(503).json({success:false,code:"MARKETPLACE_READ_FAILED"});
  }
});

router.post("/listings", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db = callerDb(req,res); if (!db) return;
  const sellerId = req.userId;
  if (!sellerId) return res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"});
  const b = req.body ?? {};
  const listingType = text(b.listing_type,40);
  const title = text(b.title,160);
  const category = text(b.category,80);
  const price = positive(b.price);
  const quantity = positive(b.quantity);
  if (isRegulatedPesticideText(title, category)) {
    return res.status(400).json({success:false,code:"USE_REGULATED_PESTICIDE_OFFER_FLOW",
      message:"عروض المبيدات والأدوية الفلاحية تتطلب مسار التثبت من ترخيص المنتج وترخيص البائع."});
  }
  if (!LISTING_TYPES.has(listingType) || title.length < 3 || !category ||
      Number.isNaN(price) || Number.isNaN(quantity) ||
      !Array.isArray(b.image_urls ?? []) || (b.image_urls ?? []).length > 8 ||
      !(b.image_urls ?? []).every((u:unknown)=>typeof u === "string" && /^https:\/\//i.test(u))) {
    return res.status(400).json({success:false,code:"INVALID_LISTING_INPUT"});
  }
  const harvestCrop = text(b.harvest_crop,100) || null;
  const expectedDate = text(b.expected_harvest_date,10) || null;
  if (listingType === "harvest" && (!harvestCrop || !expectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(expectedDate))) {
    return res.status(400).json({success:false,code:"HARVEST_CROP_AND_DATE_REQUIRED"});
  }
  try {
    const payload = {
      seller_id:sellerId, listing_type:listingType, title, description:text(b.description,3000) || null,
      category, price, currency:text(b.currency,3) || "TND", unit:text(b.unit,40) || null,
      quantity, location:text(b.location,160) || null, governorate:text(b.governorate,80) || null,
      image_urls:b.image_urls ?? [], status:"published", harvest_crop:harvestCrop,
      expected_harvest_date:expectedDate, harvest_window_end:text(b.harvest_window_end,10) || null,
      quality_notes:text(b.quality_notes,1000) || null,
    };
    const {data,error} = await db.from("marketplace_listings").insert(payload).select("*").single();
    if (error) throw error;
    res.status(201).json({success:true,data,meta:{provenance:"seller-submission",isRealData:true}});
  } catch(e:any) {
    console.error("[agro-market] listing create failed",e?.message);
    res.status(503).json({success:false,code:"LISTING_CREATE_FAILED"});
  }
});

router.patch("/listings/:id", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db = callerDb(req,res); if (!db) return;
  const sellerId = req.userId;
  if (!sellerId) return res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"});
  const allowed = ["title","description","category","price","currency","unit","quantity","location","governorate","image_urls","status","harvest_crop","expected_harvest_date","harvest_window_end","quality_notes"];
  const patch:Record<string,unknown> = {};
  const {data:currentListing,error:currentListingError}=await db.from("marketplace_listings")
    .select("listing_type,title,category").eq("id",req.params.id).eq("seller_id",sellerId).maybeSingle();
  if(currentListingError) return res.status(503).json({success:false,code:"LISTING_LOOKUP_FAILED"});
  if(!currentListing) return res.status(404).json({success:false,code:"LISTING_NOT_FOUND"});
  if(isRegulatedPesticideText(req.body?.title ?? currentListing.title,req.body?.category ?? currentListing.category)) {
    return res.status(400).json({success:false,code:"USE_REGULATED_PESTICIDE_OFFER_FLOW"});
  }
  for (const k of allowed) if (req.body?.[k] !== undefined) patch[k] = req.body[k];
  if (patch.price !== undefined && Number.isNaN(positive(patch.price))) return res.status(400).json({success:false,code:"INVALID_PRICE"});
  if (patch.quantity !== undefined && Number.isNaN(positive(patch.quantity))) return res.status(400).json({success:false,code:"INVALID_QUANTITY"});
  if (patch.status !== undefined && !["draft","published","reserved","sold","archived"].includes(String(patch.status))) return res.status(400).json({success:false,code:"INVALID_LISTING_STATUS"});
  if (patch.listing_type !== undefined) return res.status(400).json({success:false,code:"LISTING_TYPE_IMMUTABLE"});
  if (patch.image_urls !== undefined && (!Array.isArray(patch.image_urls) || patch.image_urls.length > 8 || !patch.image_urls.every((u:unknown)=>typeof u==="string" && /^https:\/\//i.test(u)))) return res.status(400).json({success:false,code:"INVALID_IMAGE_URLS"});
  if (!Object.keys(patch).length) return res.status(400).json({success:false,code:"NO_UPDATES"});
  patch.updated_at = new Date().toISOString();
  const {data,error} = await db.from("marketplace_listings").update(patch).eq("id",req.params.id).eq("seller_id",sellerId).select("*").maybeSingle();
  if (error) return res.status(503).json({success:false,code:"LISTING_UPDATE_FAILED"});
  if (!data) return res.status(404).json({success:false,code:"LISTING_NOT_FOUND"});
  res.json({success:true,data});
});

router.delete("/listings/:id", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db = callerDb(req,res); if (!db) return;
  const sellerId = req.userId;
  if (!sellerId) return res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"});
  const {data,error} = await db.from("marketplace_listings").delete().eq("id",req.params.id).eq("seller_id",sellerId).select("id").maybeSingle();
  if (error) return res.status(503).json({success:false,code:"LISTING_DELETE_FAILED"});
  if (!data) return res.status(404).json({success:false,code:"LISTING_NOT_FOUND"});
  res.json({success:true,data});
});

router.get("/my-listings", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db=callerDb(req,res); if(!db) return;
  const sellerId=req.userId;
  if(!sellerId) return res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"});
  const {data,error}=await db.from("marketplace_listings").select("*").eq("seller_id",sellerId).order("created_at",{ascending:false}).limit(100);
  if(error) return res.status(503).json({success:false,code:"SELLER_LISTINGS_UNAVAILABLE"});
  res.json({success:true,data:data??[]});
});

router.post("/listings/:id/inquiries", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db=callerDb(req,res); if(!db) return;
  const buyerId=req.userId;
  if(!buyerId) return res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"});
  const message=text(req.body?.message,2000), quantity=positive(req.body?.quantity);
  if(message.length<5 || Number.isNaN(quantity)) return res.status(400).json({success:false,code:"INVALID_INQUIRY"});
  const {data:listing,error:listingError}=await db.from("marketplace_listings").select("id,seller_id,status").eq("id",req.params.id).eq("status","published").maybeSingle();
  if(listingError) return res.status(503).json({success:false,code:"LISTING_LOOKUP_FAILED"});
  if(!listing) return res.status(404).json({success:false,code:"LISTING_NOT_FOUND"});
  if(listing.seller_id===buyerId) return res.status(400).json({success:false,code:"CANNOT_INQUIRE_OWN_LISTING"});
  const {data,error}=await db.from("marketplace_inquiries").insert({
    listing_id:listing.id,buyer_id:buyerId,seller_id:listing.seller_id,message,quantity
  }).select("*").single();
  if(error) return res.status(503).json({success:false,code:"INQUIRY_CREATE_FAILED"});
  res.status(201).json({success:true,data});
});

router.get("/inquiries", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db=callerDb(req,res); if(!db) return;
  const userId=req.userId;
  if(!userId) return res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"});
  const {data,error}=await db.from("marketplace_inquiries").select("*,listing:marketplace_listings(id,title,price,currency,unit,status)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order("created_at",{ascending:false}).limit(100);
  if(error) return res.status(503).json({success:false,code:"INQUIRIES_UNAVAILABLE"});
  res.json({success:true,data:data??[]});
});

router.patch("/inquiries/:id/status", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db=callerDb(req,res); if(!db) return;
  const sellerId=req.userId;
  if(!sellerId) return res.status(401).json({success:false,code:"VERIFIED_SESSION_REQUIRED"});
  const status=text(req.body?.status,20);
  if(!["replied","accepted","rejected","closed"].includes(status))
    return res.status(400).json({success:false,code:"INVALID_INQUIRY_STATUS"});
  const {data,error}=await db.from("marketplace_inquiries").update({status,updated_at:new Date().toISOString()})
    .eq("id",req.params.id).eq("seller_id",sellerId).select("*").maybeSingle();
  if(error) return res.status(503).json({success:false,code:"INQUIRY_UPDATE_FAILED"});
  if(!data) return res.status(404).json({success:false,code:"INQUIRY_NOT_FOUND"});
  res.json({success:true,data});
});

router.get("/products", async (req,res) => {
  const db = publicDb(res); if (!db) return;
  try {
    const type = text(req.query.type,40), q = text(req.query.q,100).replace(/[,%()]/g, " ");
    const limit = Math.min(100,Math.max(1,Number(req.query.limit)||50));
    let query = db.from("agricultural_product_catalog").select("*").eq("active",true).order("trade_name").limit(limit);
    if (type && PRODUCT_TYPES.has(type)) query = query.eq("product_type",type);
    if (q) query = query.ilike("trade_name", `%${q}%`);
    const {data,error} = await query; if(error) throw error;
    res.json({success:true,data:data??[],meta:{provenance:"catalog-source-records",isRealData:true,verifiedOnly:false},
      disclaimer:"وجود المنتج في الكتالوج لا يعني تلقائياً أنه مرخّص للاستعمال في تونس. راجع حالة التسجيل والملصق الرسمي."});
  } catch(e:any) { console.error("[agro-market] catalog read failed",e?.message); res.status(503).json({success:false,code:"CATALOG_READ_FAILED"}); }
});


/* Agricultural pesticide prices and regulated seller offers. */
router.get("/input-prices", async (req,res) => {
  const db=publicDb(res); if(!db) return;
  try {
    const q=text(req.query.q,120), limit=Math.min(200,Math.max(1,Number(req.query.limit)||100));
    let query=db.from("agricultural_input_price_observations")
      .select("id,product_name,product_type,active_ingredient,package_size,package_unit,price,currency,source_name,source_url,source_type,observed_on,verification_status")
      .order("observed_on",{ascending:false}).limit(limit);
    if(q) query=query.ilike("product_name","%"+q+"%");
    const {data,error}=await query;
    if(error) throw error;
    res.json({success:true,data:data??[],meta:{provenance:"sourced-input-price-observations",isRealData:(data??[]).length>0,
      disclaimer:"السعر مرجعي حسب المصدر والتاريخ، وليس عرض بيع مضموناً أو سعراً رسمياً موحّداً."}});
  } catch(e:any) {
    console.error("[agro-market] input price read failed",e?.message);
    res.status(503).json({success:false,code:"INPUT_PRICE_READ_FAILED"});
  }
});

router.post("/ingest/input-prices", requireAdminAccess, async (req,res) => {
  const db=adminDb(res); if(!db) return;
  const sourceKey=text(req.body?.source_key,80), sourceName=text(req.body?.source_name,160);
  const sourceUrl=text(req.body?.source_url,1000), rows=req.body?.prices;
  const sourceType=text(req.body?.source_type,40)||"official_open_data";
  const verificationStatus=text(req.body?.verification_status,30)||"unverified";
  if(!sourceKey||!sourceName||!/^https:\/\//i.test(sourceUrl)||!Array.isArray(rows)||rows.length>1000||
    !SOURCE_TYPES.has(sourceType)||!VERIFICATION_STATES.has(verificationStatus))
    return res.status(400).json({success:false,code:"INVALID_INGEST_PAYLOAD"});
  const records:any[]=[];
  for(const row of rows) {
    const productName=text(row?.product_name,180), price=positive(row?.price);
    const observedOn=text(row?.observed_on,10), packageSize=positive(row?.package_size);
    const rowSourceUrl=text(row?.source_url,1000);
    const externalId=text(row?.external_id,180)||hash({productName,packageSize,packageUnit:row?.package_unit,price,observedOn});
    if(!productName||price===null||Number.isNaN(price)||price<=0||
      (packageSize!==null&&(Number.isNaN(packageSize)||packageSize<=0))||
      !/^\d{4}-\d{2}-\d{2}$/.test(observedOn))
      return res.status(400).json({success:false,code:"INVALID_INPUT_PRICE_ROW",row:records.length});
    records.push({product_name:productName,product_type:PRODUCT_TYPES.has(text(row?.product_type,40))?text(row.product_type,40):"pesticide",
      active_ingredient:text(row?.active_ingredient,250)||null,package_size:packageSize,
      package_unit:text(row?.package_unit,30)||null,price,currency:text(row?.currency,3)||"TND",
      source_name:sourceName,source_url:/^https:\/\//i.test(rowSourceUrl)?rowSourceUrl:sourceUrl,
      source_type:sourceType,source_key:sourceKey,external_id:externalId,observed_on:observedOn,
      verification_status:verificationStatus,collected_at:new Date().toISOString()});
  }
  const {data,error}=await db.from("agricultural_input_price_observations")
    .upsert(records,{onConflict:"source_key,external_id"}).select("id");
  if(error) {
    console.error("[agro-market] input price ingest failed",error.message);
    return res.status(503).json({success:false,code:"INPUT_PRICE_INGEST_FAILED"});
  }
  res.json({success:true,insertedOrUpdated:data?.length??records.length,sourceKey});
});

router.get("/pesticide-offers", async (_req,res) => {
  const db=publicDb(res); if(!db) return;
  const {data,error}=await db.from("pesticide_seller_offers")
    .select("id,trade_name,active_ingredient,registration_number,package_size,package_unit,price,currency,quantity,quantity_unit,location,governorate,image_urls,created_at,seller_id")
    .eq("status","approved").order("created_at",{ascending:false}).limit(100);
  if(error) return res.status(503).json({success:false,code:"PESTICIDE_OFFERS_UNAVAILABLE"});
  res.json({success:true,data:data??[],meta:{provenance:"admin-approved-seller-offers",isRealData:true}});
});

router.get("/my-pesticide-offers", requireAuth, requireVerifiedAuth, async (req,res) => {
  const db=callerDb(req,res); if(!db) return;
  const {data,error}=await db.from("pesticide_seller_offers").select("*")
    .eq("seller_id",req.userId).order("created_at",{ascending:false}).limit(100);
  if(error) return res.status(503).json({success:false,code:"SELLER_PESTICIDE_OFFERS_UNAVAILABLE"});
  res.json({success:true,data:data??[]});
});

router.post("/pesticide-offers", requireAuth, requireVerifiedAuth, async (req:Request,res:Response) => {
  const db=callerDb(req,res); if(!db) return;
  const b=req.body??{};
  const tradeName=text(b.trade_name,180), registrationNumber=text(b.registration_number,100);
  const registrationEvidenceUrl=text(b.product_registration_evidence_url,1000);
  const authorizationNumber=text(b.seller_authorization_number,100);
  const authorizationDocumentUrl=text(b.seller_authorization_document_url,1000);
  const packageSize=positive(b.package_size), price=positive(b.price), quantity=positive(b.quantity);
  const imageUrls=b.image_urls??[];
  if(tradeName.length<2||!registrationNumber||!/^https:\/\//i.test(registrationEvidenceUrl)||
    !authorizationNumber||!/^https:\/\//i.test(authorizationDocumentUrl)||
    packageSize===null||Number.isNaN(packageSize)||packageSize<=0||
    price===null||Number.isNaN(price)||price<=0||quantity===null||Number.isNaN(quantity)||quantity<=0||
    !text(b.package_unit,30)||!Array.isArray(imageUrls)||imageUrls.length>8||
    !imageUrls.every((u:unknown)=>typeof u==="string"&&/^https:\/\//i.test(u)))
    return res.status(400).json({success:false,code:"PESTICIDE_OFFER_DOCUMENTS_AND_DETAILS_REQUIRED"});
  const payload={seller_id:req.userId,trade_name:tradeName,active_ingredient:text(b.active_ingredient,250)||null,
    registration_number:registrationNumber,product_registration_evidence_url:registrationEvidenceUrl,
    seller_authorization_number:authorizationNumber,seller_authorization_document_url:authorizationDocumentUrl,
    package_size:packageSize,package_unit:text(b.package_unit,30),price,currency:text(b.currency,3)||"TND",
    quantity,quantity_unit:text(b.quantity_unit,30)||"packages",location:text(b.location,160)||null,
    governorate:text(b.governorate,80)||null,image_urls:imageUrls,status:"pending_review"};
  const {data,error}=await db.from("pesticide_seller_offers").insert(payload).select("*").single();
  if(error) {
    console.error("[agro-market] pesticide offer create failed",error.message);
    return res.status(503).json({success:false,code:"PESTICIDE_OFFER_CREATE_FAILED"});
  }
  res.status(201).json({success:true,data,meta:{provenance:"seller-submission-pending-human-review",isRealData:true},
    message:"تم استلام العرض. لن يظهر للعموم قبل التثبت الإداري من وثائق المنتج والبائع."});
});

router.get("/admin/pesticide-offers", requireAdminAccess, async (_req,res) => {
  const db=adminDb(res); if(!db) return;
  const {data,error}=await db.from("pesticide_seller_offers").select("*")
    .eq("status","pending_review").order("created_at",{ascending:true}).limit(200);
  if(error) return res.status(503).json({success:false,code:"PENDING_PESTICIDE_OFFERS_UNAVAILABLE"});
  res.json({success:true,data:data??[]});
});

router.patch("/admin/pesticide-offers/:id/review", requireAdminAccess, async (req,res) => {
  const db=adminDb(res); if(!db) return;
  const status=text(req.body?.status,20), reviewNote=text(req.body?.review_note,1000)||null;
  if(!["approved","rejected"].includes(status))
    return res.status(400).json({success:false,code:"INVALID_REVIEW_STATUS"});
  const {data:existing,error:lookupError}=await db.from("pesticide_seller_offers").select("*")
    .eq("id",req.params.id).maybeSingle();
  if(lookupError) return res.status(503).json({success:false,code:"PESTICIDE_OFFER_LOOKUP_FAILED"});
  if(!existing) return res.status(404).json({success:false,code:"PESTICIDE_OFFER_NOT_FOUND"});
  if(status==="approved"&&(!existing.registration_number||!/^https:\/\//i.test(existing.product_registration_evidence_url??"")||
    !existing.seller_authorization_number||!/^https:\/\//i.test(existing.seller_authorization_document_url??"")))
    return res.status(400).json({success:false,code:"REGISTRATION_AND_SELLER_PERMIT_EVIDENCE_REQUIRED"});
  const {data,error}=await db.from("pesticide_seller_offers").update({status,review_note:reviewNote,
    reviewed_at:new Date().toISOString(),reviewed_by:req.userId??null,updated_at:new Date().toISOString()})
    .eq("id",req.params.id).select("*").single();
  if(error) return res.status(503).json({success:false,code:"PESTICIDE_OFFER_REVIEW_FAILED"});
  res.json({success:true,data});
});

router.get("/intelligence", async (req,res) => {
  const db = publicDb(res); if (!db) return;
  try {
    const period = Math.min(365, Math.max(7, Number(req.query.period) || 30));
    const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString().slice(0,10);
    const {data,error} = await db.from("market_price_observations")
      .select("commodity_name,market_location,price_average,observed_on,unit,currency,source_name,source_url,verification_status,price_kind")
      .gte("observed_on", since).order("observed_on",{ascending:true}).limit(1000);
    if (error) throw error;
    const rows = (data ?? []).filter((r:any) => Number.isFinite(Number(r.price_average)) && r.price_average !== null);
    if (!rows.length) return res.status(503).json({success:false,code:"MARKET_INTELLIGENCE_DATA_UNAVAILABLE",
      message:"لا توجد ملاحظات أسعار كافية للفترة المطلوبة.",dataAvailable:false});
    const grouped = new Map<string, any[]>();
    for (const row of rows) {
      const key = String(row.commodity_name || "غير محدد");
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    }
    const cropTrends = Array.from(grouped.entries()).map(([crop, observations]) => {
      const byDay = new Map<string, number[]>();
      for (const item of observations) {
        const day = String(item.observed_on).slice(0,10);
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push(Number(item.price_average));
      }
      const daily = Array.from(byDay.entries()).map(([date, values]) => ({
        date, averagePrice: values.reduce((sum,v)=>sum+v,0)/values.length
      })).sort((a,b)=>a.date.localeCompare(b.date));
      const windowSize = Math.max(1, Math.floor(daily.length / 2));
      const first = daily.slice(0, windowSize);
      const last = daily.slice(-windowSize);
      const firstAvg = first.reduce((sum,v)=>sum+v.averagePrice,0)/first.length;
      const lastAvg = last.reduce((sum,v)=>sum+v.averagePrice,0)/last.length;
      const changePercent = daily.length < 2 || firstAvg === 0 ? null : ((lastAvg-firstAvg)/firstAvg)*100;
      return {crop, observations:observations.length, days:daily.length,
        latestPrice:daily[daily.length-1]?.averagePrice ?? null,
        changePercent, trend:changePercent === null ? "unknown" : changePercent > 2 ? "rising" : changePercent < -2 ? "falling" : "stable",
        unit:observations[observations.length-1]?.unit ?? "kg",
        currency:observations[observations.length-1]?.currency ?? "TND"};
    });
    const measuredChanges = cropTrends.map(x=>x.changePercent).filter((x:any)=>typeof x==="number" && Number.isFinite(x));
    const overallChange = measuredChanges.length ? measuredChanges.reduce((sum:number,v:number)=>sum+v,0)/measuredChanges.length : null;
    const overallTrend = overallChange === null ? "unknown" : overallChange > 2 ? "rising" : overallChange < -2 ? "falling" : "stable";
    const insights = overallTrend === "rising"
      ? ["متوسط اتجاه الأسعار المسجّل يميل إلى الارتفاع.", "تختلف حركة الأسعار حسب المنتوج والسوق؛ راجع تفاصيل كل منتوج."]
      : overallTrend === "falling"
        ? ["متوسط اتجاه الأسعار المسجّل يميل إلى الانخفاض.", "قارن الأسعار حسب المنتوج والسوق قبل اتخاذ القرار."]
        : overallTrend === "stable"
          ? ["الأسعار المسجّلة مستقرة نسبياً خلال الفترة المحلّلة."]
          : ["البيانات الحالية لا تكفي لاستخلاص اتجاه زمني موثوق."];
    const recommendations = overallTrend === "unknown"
      ? ["اجمع ملاحظات أسعار مؤرخة إضافية قبل اعتماد أي قرار."]
      : ["قارن السعر حسب السوق والتاريخ ونوع السعر (جملة أو تفصيل).", "تحقق من المصدر وحالة التثبت قبل اتخاذ قرار تجاري."];
    const sources = Array.from(new Set(rows.map((r:any)=>r.source_name).filter(Boolean)));
    const allVerified = rows.every((r:any)=>r.verification_status === "official-source");
    res.json({success:true,data:{periodDays:period,sampleSize:rows.length,commodityCount:cropTrends.length,
      trends:{overallTrend,averageChangePercent:overallChange,crops:cropTrends},
      insights,recommendations,sources,sourceVerified:allVerified,isRealData:true,
      dataSource:"market_price_observations",lastUpdated:new Date().toISOString(),
      disclaimer:"التحليل محسوب من ملاحظات الأسعار المخزّنة في المنصة. لا يعني ذلك أن كل الأسعار متحقق منها رسمياً؛ راجع المصدر وحالة التثبت."}});
  } catch (e:any) {
    console.error("[agro-market] intelligence read failed",e?.message);
    res.status(503).json({success:false,code:"MARKET_INTELLIGENCE_READ_FAILED"});
  }
});

router.get("/prices", async (req,res) => {
  const db = publicDb(res); if (!db) return;
  try {
    const crop = text(req.query.crop,100), market = text(req.query.market,120);
    const limit = Math.min(200,Math.max(1,Number(req.query.limit)||100));
    let query = db.from("market_price_observations").select("id,commodity_name,variety,quality_grade,market_location,price_kind,price_average,price_min,price_max,previous_year_price,aggregation_period,period_start,period_end,supply_quantity_tons,supply_change_percent,price_change_percent,observation_days,unit,currency,observed_on,source_name,source_url,source_type,collected_at,verification_status")
      .order("observed_on",{ascending:false}).limit(limit);
    if (crop) query = query.ilike("commodity_name",`%${crop}%`);
    if (market) query = query.ilike("market_location",`%${market}%`);
    const {data,error} = await query; if(error) throw error;
    res.json({success:true,data:data??[],meta:{provenance:"market-price-observations",isRealData:(data??[]).length>0}});
  } catch(e:any) { console.error("[agro-market] price read failed",e?.message); res.status(503).json({success:false,code:"MARKET_PRICE_READ_FAILED"}); }
});

// n8n / scheduled collectors POST normalized records here. Only platform admins
// or a server-side admin token may ingest; mobile clients never receive this key.
router.post("/ingest/market-prices", requireAdminAccess, async (req,res) => {
  const db = adminDb(res); if(!db) return;
  const sourceKey = text(req.body?.source_key,80), sourceName = text(req.body?.source_name,160);
  const sourceUrl = text(req.body?.source_url,1000), rows = req.body?.prices;
  const sourceType = text(req.body?.source_type,40) || "official_open_data";
  const verificationStatus = text(req.body?.verification_status,30) || "unverified";
  if(!sourceKey || !sourceName || !/^https:\/\//i.test(sourceUrl) || !Array.isArray(rows) || rows.length>1000 ||
    !SOURCE_TYPES.has(sourceType) || !VERIFICATION_STATES.has(verificationStatus))
    return res.status(400).json({success:false,code:"INVALID_INGEST_PAYLOAD"});
  await updateSourceStatus(db,{source_key:sourceKey,source_name:sourceName,source_url:sourceUrl,source_type:sourceType,enabled:true,last_attempt_at:new Date().toISOString(),last_status:"running"});
  const records = [];
  for(const row of rows) {
    const crop = text(row?.crop_name,100), location = text(row?.market_location,160);
    const average = positive(row?.price_average ?? row?.price_per_kg);
    const min = positive(row?.price_min), max = positive(row?.price_max);
    const previousYearPrice = positive(row?.previous_year_price);
    const supplyQuantity = positive(row?.supply_quantity_tons);
    const supplyChange = positiveSigned(row?.supply_change_percent);
    const priceChange = positiveSigned(row?.price_change_percent);
    const observationDays = positive(row?.observation_days);
    const rowSourceUrl = text(row?.source_url,1000);
    const externalId = text(row?.external_id,180) || hash({crop,location,date:row?.price_date,average,min,max,kind:row?.price_kind});
    if(!crop || !location || [average,min,max,previousYearPrice,supplyQuantity,supplyChange,priceChange,observationDays].some(Number.isNaN) ||
      (observationDays !== null && !Number.isInteger(observationDays)) ||
      (average === null && min === null && max === null) ||
      (min !== null && max !== null && min > max) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(text(row?.price_date,10)))
      return res.status(400).json({success:false,code:"INVALID_PRICE_ROW",row:records.length});
    const priceKind = text(row?.price_kind,20) || "wholesale";
    if(!["wholesale","retail","seller","other"].includes(priceKind))
      return res.status(400).json({success:false,code:"INVALID_PRICE_KIND",row:records.length});
    records.push({commodity_name:crop,market_location:location,price_average:average,price_min:min,price_max:max,
      price_kind:priceKind,unit:text(row?.unit,30)||"kg",currency:text(row?.currency,3)||"TND",observed_on:row.price_date,
      aggregation_period:["daily","monthly","annual"].includes(text(row?.aggregation_period,20))?text(row.aggregation_period,20):"daily",
      period_start:text(row?.period_start,10)||null,period_end:text(row?.period_end,10)||null,
      previous_year_price:previousYearPrice,supply_quantity_tons:supplyQuantity,supply_change_percent:supplyChange,
      price_change_percent:priceChange,observation_days:observationDays,
      quality_grade:text(row?.quality_grade,30)||null,source_name:sourceName,
      source_url:/^https:\/\//i.test(rowSourceUrl)?rowSourceUrl:sourceUrl,source_key:sourceKey,
      external_id:externalId,source_type:sourceType,collected_at:new Date().toISOString(),
      verification_status:verificationStatus,raw_payload:row});
  }
  const {data,error}=await db.from("market_price_observations").upsert(records,{onConflict:"source_key,external_id,observed_on,market_location,commodity_name,price_kind"}).select("id");
  if(error){console.error("[agro-market] market ingest failed",error.message);await updateSourceStatus(db,{source_key:sourceKey,source_name:sourceName,source_url:sourceUrl,source_type:sourceType,enabled:true,last_attempt_at:new Date().toISOString(),last_status:"failed",last_error:error.message.slice(0,500)});return res.status(503).json({success:false,code:"MARKET_INGEST_FAILED"});}
  await updateSourceStatus(db,{source_key:sourceKey,source_name:sourceName,source_url:sourceUrl,source_type:sourceType,enabled:true,last_attempt_at:new Date().toISOString(),last_success_at:new Date().toISOString(),last_status:"success",last_error:null});
  res.json({success:true,insertedOrUpdated:data?.length??records.length,sourceKey});
});

router.post("/ingest/products", requireAdminAccess, async (req,res) => {
  const db=adminDb(res); if(!db) return;
  const sourceKey=text(req.body?.source_key,80), sourceName=text(req.body?.source_name,160);
  const sourceUrl=text(req.body?.source_url,1000), rows=req.body?.products;
  const sourceType=text(req.body?.source_type,40)||"official_open_data";
  if(!sourceKey||!sourceName||!/^https:\/\//i.test(sourceUrl)||!Array.isArray(rows)||rows.length>1000||!SOURCE_TYPES.has(sourceType))
    return res.status(400).json({success:false,code:"INVALID_INGEST_PAYLOAD"});
  await updateSourceStatus(db,{source_key:sourceKey,source_name:sourceName,source_url:sourceUrl,source_type:sourceType,enabled:true,last_attempt_at:new Date().toISOString(),last_status:"running"});
  const records=[];
  for(const p of rows){
    const productType=text(p?.product_type,40), tradeName=text(p?.trade_name,180), externalId=text(p?.external_id,180);
    if(!PRODUCT_TYPES.has(productType)||!tradeName||!externalId)
      return res.status(400).json({success:false,code:"INVALID_PRODUCT_ROW",row:records.length});
    const registration=text(p?.registration_status,40)||"unverified";
    const registrationNumber=text(p?.registration_number,100)||null;
    const registrationEvidenceUrl=text(p?.registration_evidence_url,1000)||null;
    if(!["unverified","registered_tunisia","expired","prohibited","not_applicable"].includes(registration))
      return res.status(400).json({success:false,code:"INVALID_REGISTRATION_STATUS",row:records.length});
    if(["registered_tunisia","expired","prohibited"].includes(registration) &&
      (!registrationNumber || !/^https:\/\//i.test(registrationEvidenceUrl || "")))
      return res.status(400).json({success:false,code:"REGISTRATION_EVIDENCE_REQUIRED",row:records.length});
    records.push({product_type:productType,trade_name:tradeName,active_ingredient:text(p?.active_ingredient,250)||null,
      composition:text(p?.composition,500)||null,manufacturer:text(p?.manufacturer,180)||null,
      registration_number:registrationNumber,registration_status:registration,
      registration_evidence_url:registrationEvidenceUrl,registration_verified_at:text(p?.registration_verified_at,50)||null,
      target_crops:Array.isArray(p?.target_crops)?p.target_crops.filter((v:unknown)=>typeof v==="string").slice(0,50):[],
      target_pests_diseases:Array.isArray(p?.target_pests_diseases)?p.target_pests_diseases.filter((v:unknown)=>typeof v==="string").slice(0,50):[],
      approved_uses:Array.isArray(p?.approved_uses)?p.approved_uses.slice(0,100):[],label_url:text(p?.label_url,1000)||null,
      source_name:sourceName,source_url:sourceUrl,source_key:sourceKey,external_id:externalId,
      source_updated_at:text(p?.source_updated_at,50)||null,collected_at:new Date().toISOString(),active:p?.active!==false});
  }
  const {data,error}=await db.from("agricultural_product_catalog").upsert(records,{onConflict:"source_key,external_id"}).select("id");
  if(error){console.error("[agro-market] catalog ingest failed",error.message);await updateSourceStatus(db,{source_key:sourceKey,source_name:sourceName,source_url:sourceUrl,source_type:sourceType,enabled:true,last_attempt_at:new Date().toISOString(),last_status:"failed",last_error:error.message.slice(0,500)});return res.status(503).json({success:false,code:"PRODUCT_INGEST_FAILED"});}
  await updateSourceStatus(db,{source_key:sourceKey,source_name:sourceName,source_url:sourceUrl,source_type:sourceType,enabled:true,last_attempt_at:new Date().toISOString(),last_success_at:new Date().toISOString(),last_status:"success",last_error:null});
  res.json({success:true,insertedOrUpdated:data?.length??records.length,sourceKey});
});

export default router;
