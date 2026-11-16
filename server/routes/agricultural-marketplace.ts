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
    if (q) query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%,harvest_crop.ilike.%${q}%`);
    const {data,error} = await query;
    if (error) throw error;
    const rows = data ?? [];
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
  const {data,error} = await db.from("marketplace_listings").delete().eq("id",req.params.id).eq("seller_id",sellerId).select("id").maybeSingle();
  if (error) return res.status(503).json({success:false,code:"LISTING_DELETE_FAILED"});
  if (!data) return res.status(404).json({success:false,code:"LISTING_NOT_FOUND"});
  res.json({success:true,data});
});

router.get("/products", async (req,res) => {
  const db = publicDb(res); if (!db) return;
  try {
    const type = text(req.query.type,40), q = text(req.query.q,100).replace(/[,%()]/g, " ");
    const limit = Math.min(100,Math.max(1,Number(req.query.limit)||50));
    let query = db.from("agricultural_product_catalog").select("*").eq("active",true).order("trade_name").limit(limit);
    if (type && PRODUCT_TYPES.has(type)) query = query.eq("product_type",type);
    if (q) query = query.or(`trade_name.ilike.%${q}%,active_ingredient.ilike.%${q}%,composition.ilike.%${q}%`);
    const {data,error} = await query; if(error) throw error;
    res.json({success:true,data:data??[],meta:{provenance:"catalog-source-records",isRealData:true,verifiedOnly:false},
      disclaimer:"وجود المنتج في الكتالوج لا يعني تلقائياً أنه مرخّص للاستعمال في تونس. راجع حالة التسجيل والملصق الرسمي."});
  } catch(e:any) { console.error("[agro-market] catalog read failed",e?.message); res.status(503).json({success:false,code:"CATALOG_READ_FAILED"}); }
});

router.get("/prices", async (req,res) => {
  const db = publicDb(res); if (!db) return;
  try {
    const crop = text(req.query.crop,100), market = text(req.query.market,120);
    const limit = Math.min(200,Math.max(1,Number(req.query.limit)||100));
    let query = db.from("market_prices").select("id,crop_name,variety,quality_grade,market_location,price_per_kg,price_min,price_max,unit,currency,price_date,source,source_url,source_type,collected_at,verification_status")
      .order("price_date",{ascending:false}).limit(limit);
    if (crop) query = query.ilike("crop_name",`%${crop}%`);
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
  if(!sourceKey || !sourceName || !/^https:\/\//i.test(sourceUrl) || !Array.isArray(rows) || rows.length>1000)
    return res.status(400).json({success:false,code:"INVALID_INGEST_PAYLOAD"});
  const records = [];
  for(const row of rows) {
    const crop = text(row?.crop_name,100), location = text(row?.market_location,160);
    const price = positive(row?.price_per_kg);
    const externalId = text(row?.external_id,180) || hash({crop,location,date:row?.price_date,price:row?.price_per_kg});
    if(!crop || !location || Number.isNaN(price) || price === null || !/^\d{4}-\d{2}-\d{2}$/.test(text(row?.price_date,10)))
      return res.status(400).json({success:false,code:"INVALID_PRICE_ROW",row:records.length});
    records.push({crop_name:crop,market_location:location,price_per_kg:price,price_min:positive(row?.price_min),price_max:positive(row?.price_max),
      unit:text(row?.unit,30)||"kg",currency:text(row?.currency,3)||"TND",price_date:row.price_date,
      quality_grade:text(row?.quality_grade,30)||null,source:sourceName,source_url:sourceUrl,source_key:sourceKey,
      external_id:externalId,source_type:text(req.body?.source_type,40)||"official_open_data",
      collected_at:new Date().toISOString(),verification_status:text(req.body?.verification_status,30)||"unverified",
      raw_payload:row});
  }
  const {data,error}=await db.from("market_prices").upsert(records,{onConflict:"source_key,external_id,price_date,market_location,crop_name"}).select("id");
  if(error){console.error("[agro-market] market ingest failed",error.message);return res.status(503).json({success:false,code:"MARKET_INGEST_FAILED"});}
  res.json({success:true,insertedOrUpdated:data?.length??records.length,sourceKey});
});

router.post("/ingest/products", requireAdminAccess, async (req,res) => {
  const db=adminDb(res); if(!db) return;
  const sourceKey=text(req.body?.source_key,80), sourceName=text(req.body?.source_name,160);
  const sourceUrl=text(req.body?.source_url,1000), rows=req.body?.products;
  if(!sourceKey||!sourceName||!/^https:\/\//i.test(sourceUrl)||!Array.isArray(rows)||rows.length>1000)
    return res.status(400).json({success:false,code:"INVALID_INGEST_PAYLOAD"});
  const records=[];
  for(const p of rows){
    const productType=text(p?.product_type,40), tradeName=text(p?.trade_name,180), externalId=text(p?.external_id,180);
    if(!PRODUCT_TYPES.has(productType)||!tradeName||!externalId)
      return res.status(400).json({success:false,code:"INVALID_PRODUCT_ROW",row:records.length});
    const registration=text(p?.registration_status,40)||"unverified";
    if(!["unverified","registered_tunisia","expired","prohibited","not_applicable"].includes(registration))
      return res.status(400).json({success:false,code:"INVALID_REGISTRATION_STATUS",row:records.length});
    records.push({product_type:productType,trade_name:tradeName,active_ingredient:text(p?.active_ingredient,250)||null,
      composition:text(p?.composition,500)||null,manufacturer:text(p?.manufacturer,180)||null,
      registration_number:text(p?.registration_number,100)||null,registration_status:registration,
      target_crops:Array.isArray(p?.target_crops)?p.target_crops.filter((v:unknown)=>typeof v==="string").slice(0,50):[],
      target_pests_diseases:Array.isArray(p?.target_pests_diseases)?p.target_pests_diseases.filter((v:unknown)=>typeof v==="string").slice(0,50):[],
      approved_uses:Array.isArray(p?.approved_uses)?p.approved_uses.slice(0,100):[],label_url:text(p?.label_url,1000)||null,
      source_name:sourceName,source_url:sourceUrl,source_key:sourceKey,external_id:externalId,
      source_updated_at:text(p?.source_updated_at,50)||null,collected_at:new Date().toISOString(),active:p?.active!==false});
  }
  const {data,error}=await db.from("agricultural_product_catalog").upsert(records,{onConflict:"source_key,external_id"}).select("id");
  if(error){console.error("[agro-market] catalog ingest failed",error.message);return res.status(503).json({success:false,code:"PRODUCT_INGEST_FAILED"});}
  res.json({success:true,insertedOrUpdated:data?.length??records.length,sourceKey});
});

export default router;
