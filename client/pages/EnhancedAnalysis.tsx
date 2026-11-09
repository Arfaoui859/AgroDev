import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertCircle, ArrowDownToLine, CheckCircle2, ClipboardList,
  FlaskConical, Leaf, Loader2, RefreshCw, ShieldCheck, Sprout,
} from "lucide-react";
import { soilAnalysisService, SoilAnalysisEnvelope } from "@/lib/services/soilAnalysisService";
import type { RawSoilData } from "@shared/api";

type FormState = Record<string, string>;
type ReportObject = Record<string, any>;

const fields: Array<{key: keyof RawSoilData; label: string; unit: string; required?: boolean; step?: string; max?: string}> = [
  { key: "ph", label: "درجة الحموضة pH", unit: "0–14", required: true, step: "0.1", max: "14" },
  { key: "moisture", label: "رطوبة التربة", unit: "%", required: true, step: "0.1", max: "100" },
  { key: "organicMatter", label: "المادة العضوية", unit: "%", step: "0.1", max: "100" },
  { key: "electricalConductivity", label: "التوصيل الكهربائي EC", unit: "أدخل الوحدة أدناه", step: "0.01" },
  { key: "nitrogen", label: "النيتروجين N", unit: "حسب وحدة التحليل", step: "0.1" },
  { key: "phosphorus", label: "الفوسفور P", unit: "حسب وحدة التحليل", step: "0.1" },
  { key: "potassium", label: "البوتاسيوم K", unit: "حسب وحدة التحليل", step: "0.1" },
  { key: "sandPercent", label: "الرمل", unit: "%", step: "0.1", max: "100" },
  { key: "siltPercent", label: "الغرين / السلت", unit: "%", step: "0.1", max: "100" },
  { key: "clayPercent", label: "الطين", unit: "%", step: "0.1", max: "100" },
  { key: "calciumCarbonateTotal", label: "كربونات الكالسيوم الكلية CaCO3", unit: "%", step: "0.1", max: "100" },
  { key: "calciumCarbonateActive", label: "الكِلس النشط", unit: "%", step: "0.1", max: "100" },
  { key: "cec", label: "السعة التبادلية CEC", unit: "حسب وحدة المخبر", step: "0.1" },
  { key: "sodium", label: "الصوديوم Na", unit: "حسب وحدة التحليل", step: "0.1" },
  { key: "sodiumAdsorptionRatio", label: "SAR", unit: "بدون وحدة", step: "0.1" },
  { key: "exchangeableSodiumPercentage", label: "ESP", unit: "%", step: "0.1", max: "100" },
  { key: "waterElectricalConductivity", label: "EC ماء الري", unit: "أدخل الوحدة أدناه", step: "0.01" },
  { key: "waterPh", label: "pH ماء الري", unit: "0–14", step: "0.1", max: "14" },
  { key: "slopePercent", label: "انحدار الأرض", unit: "%", step: "0.1", max: "100" },
  { key: "targetYield", label: "المردودية المستهدفة", unit: "أدخل الوحدة في الملاحظات", step: "0.1" },
  { key: "farmAreaHectares", label: "مساحة المزرعة", unit: "هكتار", step: "0.01" },
];

const text = (value: unknown, fallback: string = "غير متاح") =>
  value === null || value === undefined || value === "" ? fallback :
  Array.isArray(value) ? value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join("، ") :
  typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => typeof item === "string" ? item : text(item)) : [];

const Section: React.FC<{title: string; icon?: React.ReactNode; children: React.ReactNode}> = ({title, icon, children}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 print:break-inside-avoid">
    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">{icon}<span>{title}</span></h2>
    {children}
  </section>
);

const BulletList: React.FC<{items: string[]}> = ({items}) => items.length ? (
  <ul className="space-y-2">{items.map((item, index) => <li key={index} className="flex gap-2 text-sm leading-7 text-slate-700"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"/><span>{item}</span></li>)}</ul>
) : <p className="text-sm text-slate-500">لا توجد معطيات كافية في هذا القسم.</p>;

const waterLabels: Record<string, string> = {
  method: "طريقة الري", frequency: "التواتر", amount: "الكمية",
  waterQuality: "جودة ماء الري", salinityAndLeaching: "الملوحة والغسيل", drainage: "الصرف",
};

const EnhancedAnalysis: React.FC = () => {
  const [form, setForm] = useState<FormState>({ ph: "", moisture: "", organicMatter: "", electricalConductivity: "", electricalConductivityUnit: "", nitrogen: "", phosphorus: "", potassium: "", sandPercent: "", siltPercent: "", clayPercent: "", calciumCarbonateTotal: "", calciumCarbonateActive: "", cec: "", sodium: "", sodiumAdsorptionRatio: "", exchangeableSodiumPercentage: "", waterElectricalConductivity: "", waterElectricalConductivityUnit: "", waterPh: "", slopePercent: "", drainage: "", previousCrop: "", targetCrop: "", targetYield: "", farmAreaHectares: "", irrigationMethod: "", region: "", cropMode: "plant-now", fieldId: "", location: "", samplingDate: "", sampleDepth: "", currentCrop: "", season: "", nutrientUnit: "", nutrientMethod: "", electricalConductivityMethod: "", notes: "" });
  const [report, setReport] = useState<SoilAnalysisEnvelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [historyReports, setHistoryReports] = useState<Array<Record<string, unknown>>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [availableFields, setAvailableFields] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentAnalysis");
      if (!raw) return;
      const saved = JSON.parse(raw);
      const source = saved.sensorData ?? saved;
      setForm((previous) => {
        const next = { ...previous };
        const aliases: Record<string, string[]> = {
          ph: ["ph"], moisture: ["moisture"], organicMatter: ["organicMatter", "organic_matter"],
          electricalConductivity: ["electricalConductivity", "salinity", "conductivity"],
          nitrogen: ["nitrogen"], phosphorus: ["phosphorus"], potassium: ["potassium"],
        };
        for (const [target, keys] of Object.entries(aliases)) {
          const found = keys.map((key) => source[key]).find((value) => value !== undefined && value !== null && value !== "");
          if (found !== undefined) next[target] = String(found);
        }
        if (saved.location) next.location = saved.location;
        if (saved.area) next.notes = [next.notes, `المساحة المدخلة: ${saved.area}`].filter(Boolean).join("؛ ");
        return next;
      });
    } catch { /* Ignore malformed legacy local draft; never invent measurements. */ }
  }, []);

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    soilAnalysisService.listReports(10)
      .then((items) => { if (active) setHistoryReports(items); })
      .catch(() => { if (active) setHistoryReports([]); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    soilAnalysisService.listFields()
      .then((items) => { if (active) setAvailableFields(items); })
      .catch(() => { if (active) setAvailableFields([]); });
    return () => { active = false; };
  }, []);

  const openSavedReport = async (analysisId: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await soilAnalysisService.getReport(analysisId);
      const saved = result.data as Record<string, any>;
      setReport({
        success: true,
        data: saved.report,
        dataSource: "ai-advisory",
        isRealData: false,
        analysisId,
        persistence: { persisted: true },
        provenance: {
          measurements: "user-provided-unverified",
          advisory: "llm-generated",
          mlPrediction: "not-available",
          modelTraining: "not-claimed",
          note_ar: "القياسات مدخلة من المستخدم وغير متحقق منها مخبرياً؛ التقرير استشارة LLM وليس نتيجة نموذج ML مدرّب.",
        },
      });
      setSavedAt(String(saved.analyzedAt || saved.createdAt || ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر فتح التقرير المحفوظ.");
    } finally {
      setLoading(false);
    }
  };

  const numericPayload = useMemo(() => {
    const payload: Record<string, any> = {};
    for (const field of fields) {
      const raw = form[String(field.key)]?.trim();
      if (raw !== undefined && raw !== "") {
        const value = Number(raw);
        if (Number.isFinite(value)) payload[field.key] = value;
      }
    }
    for (const key of ["fieldId","location","samplingDate","currentCrop","season","notes","nutrientUnit","nutrientMethod","electricalConductivityUnit","electricalConductivityMethod","waterElectricalConductivityUnit","drainage","previousCrop","targetCrop","irrigationMethod","region","cropMode"] as const) {
      if (form[key]?.trim()) payload[key] = form[key].trim();
    }
    if (form.sampleDepth.trim()) payload.sampleDepth = Number(form.sampleDepth);
    return payload as Partial<RawSoilData>;
  }, [form]);

  const update = (key: string, value: string) => setForm((current) => ({...current, [key]: value}));

  const runAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const validation = soilAnalysisService.validateSoilData(numericPayload);
    if (!validation.valid) { setError(validation.errors.join("؛ ")); return; }
    const textureParts = [numericPayload.sandPercent, numericPayload.siltPercent, numericPayload.clayPercent];
    if (textureParts.some((v) => v !== undefined) && textureParts.some((v) => v === undefined)) {
      setError("لتحديد نسيج التربة مخبرياً، أدخل نسب الرمل والغرين والطين الثلاثة معاً.");
      return;
    }
    if (textureParts.every((v) => v !== undefined) && Math.abs((textureParts as number[]).reduce((a,b)=>a+b,0)-100) > 2) {
      setError("مجموع نسب الرمل والغرين والطين يجب أن يساوي 100% تقريباً.");
      return;
    }
    setLoading(true);
    try {
      const result = await soilAnalysisService.analyzeSoil(numericPayload as RawSoilData);
      setReport(result);
      const timestamp = new Date().toISOString();
      setSavedAt(timestamp);
      try {
        const stored = JSON.parse(localStorage.getItem("agrogrowth.soilReports") || "[]");
        const history = Array.isArray(stored) ? stored : [];
        const entry = { id: result.analysisId || `soil-${Date.now()}`, createdAt: timestamp, input: numericPayload, envelope: result };
        localStorage.setItem("agrogrowth.soilReports", JSON.stringify([entry, ...history].slice(0, 20)));
        localStorage.setItem("agrogrowth.latestSoilReport", JSON.stringify(entry));
        const legacyEntry = {
          id: entry.id,
          location: String(numericPayload.location || numericPayload.region || ""),
          area: numericPayload.farmAreaHectares === undefined ? "" : String(numericPayload.farmAreaHectares),
          cropType: String(numericPayload.targetCrop || numericPayload.currentCrop || "other"),
          ph: String(numericPayload.ph),
          timestamp,
          moisture: String(numericPayload.moisture),
          nitrogen: numericPayload.nitrogen === undefined ? "" : String(numericPayload.nitrogen),
          phosphorus: numericPayload.phosphorus === undefined ? "" : String(numericPayload.phosphorus),
          potassium: numericPayload.potassium === undefined ? "" : String(numericPayload.potassium),
          notes: String(numericPayload.notes || ""),
        };
        try {
          const previousHistory = JSON.parse(localStorage.getItem("soilHistory") || "[]");
          const safeHistory = Array.isArray(previousHistory) ? previousHistory : [];
          localStorage.setItem("soilHistory", JSON.stringify([legacyEntry, ...safeHistory.filter((item: any) => item?.id !== legacyEntry.id)].slice(0, 100)));
        } catch (historyStorageError) {
          console.warn("Analysis completed, but legacy history synchronization failed:", historyStorageError);
        }
      } catch (storageError) {
        console.warn("Soil report was generated but browser-local caching failed:", storageError);
      }
      if (result.persistence?.persisted) soilAnalysisService.listReports(10).then(setHistoryReports).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إكمال التحليل. حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  const data = (report?.data ?? {}) as ReportObject;
  const findings = Array.isArray(data.findings) ? data.findings : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
  const followUp = Array.isArray(data.followUpPlan) ? data.followUpPlan : [];
  const crop = data.cropSuitability ?? {};
  const quality = data.dataQuality ?? {};
  const discussReportWithAgent = () => {
    const groundedContext = {
      executiveSummary: String(data.executiveSummary || "").slice(0, 1200),
      soilTexture: data.soilCharacterization?.texture,
      soilProperties: {
        chemical: Array.isArray(data.soilCharacterization?.chemical) ? data.soilCharacterization.chemical.slice(0, 6) : [],
        physical: Array.isArray(data.soilCharacterization?.physical) ? data.soilCharacterization.physical.slice(0, 6) : [],
      },
      findings: findings.slice(0, 8),
      cropSuitability: {
        status: crop.status,
        candidates: Array.isArray(crop.candidates) ? crop.candidates.slice(0, 5) : [],
        caveats: Array.isArray(crop.caveats) ? crop.caveats.slice(0, 8) : [],
      },
      targetCropPlan: data.targetCropPlan ? {
        targetCrop: data.targetCropPlan.targetCrop,
        feasibility: data.targetCropPlan.feasibility,
        reasons: Array.isArray(data.targetCropPlan.reasons) ? data.targetCropPlan.reasons.slice(0, 6) : [],
        actions: Array.isArray(data.targetCropPlan.actions) ? data.targetCropPlan.actions.slice(0, 6) : [],
        firstAction: data.targetCropPlan.firstAction,
        retestWhen: data.targetCropPlan.retestWhen,
      } : null,
      waterAndIrrigation: data.waterAndIrrigation,
      missingMeasurements: Array.isArray(quality.missingMeasurements) ? quality.missingMeasurements.slice(0, 12) : [],
      recommendations: recommendations.slice(0, 8),
      followUpPlan: followUp.slice(0, 6),
    };
    const compactContext = JSON.stringify(groundedContext);
    navigate("/ai-assistant", {
      state: {
        initialPrompt: "أنت AgroGrowth Agent. أريد منك أن تبني قرار زراعة عملي اعتماداً على تقرير التربة التالي، لا تعطيني كلاماً عاماً. قارن المحاصيل المرشحة، اختر أفضل الخيارات الممكنة للموسم الحالي إذا كانت المعطيات كافية، وضّح شروط الزراعة والمخاطر والماء والتهيئة وخطة أول 30 يوماً. إذا نقصت معلومات حاسمة اسألني عنها ولا تخمّن. هذا التقرير هو المصدر: " + compactContext,
      },
    });
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-3 py-6 text-right sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white shadow-lg sm:p-8 print:bg-white print:text-slate-900 print:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs"><FlaskConical size={15}/> AgroGrowth Intelligence</div>
              <h1 className="text-2xl font-black sm:text-3xl">تحليل التربة والتقرير الزراعي المتقدم</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-emerald-50">أدخل قياسات العينة، واحصل على تفسير علمي واضح، حدود البيانات، توصيات عملية، وخطة متابعة خطوة بخطوة.</p>
            </div>
            <div className="hidden rounded-2xl border border-white/20 bg-white/10 p-4 sm:block"><Sprout size={38}/></div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] print:hidden">
          <form onSubmit={runAnalysis} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div><h2 className="text-lg font-bold text-slate-900">1. بيانات العينة</h2><p className="mt-1 text-xs leading-6 text-slate-500">الحقول بعلامة * مطلوبة. اترك أي قياس غير متوفر فارغاً؛ لا نضع قيماً افتراضية.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">الحقل المرتبط بالتقرير (للحفظ السحابي)<select value={form.fieldId} onChange={(e)=>update("fieldId",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">بدون حقل — حفظ محلي فقط</option>{availableFields.map((field:any)=><option key={String(field.id)} value={String(field.id)}>{String(field.name_ar || field.name || field.id)}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">{availableFields.length ? "اختر حقلاً تملكه لربط التقرير بسجلك السحابي." : "لم يتم تحميل الحقول أو لا توجد حقول مرتبطة بحسابك."}</span></label>
              {[["location","الموقع"],["samplingDate","تاريخ أخذ العينة"],["sampleDepth","عمق العينة (سم)"],["currentCrop","المحصول الحالي"],["season","الموسم"]].map(([key,label]) => <label key={key} className="block text-sm font-medium text-slate-700">{label}<input type={key==="samplingDate"?"date":key==="sampleDepth"?"number":"text"} step={key==="sampleDepth"?"1":"any"} min={key==="sampleDepth"?"1":undefined} max={key==="sampleDepth"?"300":undefined} value={form[key]||""} onChange={(e)=>update(key,e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"/></label>)}
            </div>
            <div><h3 className="mb-3 font-bold text-slate-800">2. القياسات الفيزيائية والكيميائية</h3><div className="grid gap-3 sm:grid-cols-2">{fields.map((field)=> <label key={String(field.key)} className="block text-sm font-medium text-slate-700">{field.label}{field.required?" *":""}<span className="mr-1 text-xs font-normal text-slate-400">({field.unit})</span><input type="number" step={field.step||"any"} min="0" max={field.max} value={form[String(field.key)]||""} onChange={(e)=>update(String(field.key),e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="اتركه فارغاً إذا غير متوفر"/></label>)}</div></div>
            <div><h3 className="mb-3 font-bold text-slate-800">3. منهجية التحليل والملاحظات</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-slate-700">وحدة NPK والعناصر (مثلاً mg/kg أو ppm)<input value={form.nutrientUnit} onChange={(e)=>update("nutrientUnit",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="text-sm text-slate-700">طريقة التحليل المخبري (إن عُرفت)<input value={form.nutrientMethod} onChange={(e)=>update("nutrientMethod",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="text-sm text-slate-700">وحدة EC (مثلاً dS/m أو mS/cm)<input value={form.electricalConductivityUnit} onChange={(e)=>update("electricalConductivityUnit",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="text-sm text-slate-700 sm:col-span-2">طريقة قياس EC (مثلاً ECe أو 1:5)<input value={form.electricalConductivityMethod} onChange={(e)=>update("electricalConductivityMethod",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label></div><textarea value={form.notes} onChange={(e)=>update("notes",e.target.value)} rows={3} placeholder="نوع الجهاز، ظروف الري، ملاحظات الحقل..." className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
              <h3 className="font-bold text-slate-800">4. سياق المحصول والماء والحقل</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-700">الجهة / المعتمدية<input value={form.region} onChange={e=>update("region",e.target.value)} placeholder="مثال: سليانة، القصرين..." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"/></label>
                <label className="text-sm text-slate-700">المحصول السابق<input value={form.previousCrop} onChange={e=>update("previousCrop",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"/></label>
                <label className="text-sm text-slate-700">المحصول المستهدف<input value={form.targetCrop} onChange={e=>update("targetCrop",e.target.value)} placeholder="قمح / زيتون / طماطم..." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"/></label>
                <label className="text-sm text-slate-700">وضعية القرار<select value={form.cropMode} onChange={e=>update("cropMode",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="plant-now">شنوّة نزرع توا؟</option><option value="target-crop">نحب نزرع محصول محدد</option></select></label>
                <label className="text-sm text-slate-700">طريقة الري<input value={form.irrigationMethod} onChange={e=>update("irrigationMethod",e.target.value)} placeholder="تنقيط / رش / غمر / مطر..." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"/></label>
                <label className="text-sm text-slate-700">الصرف<input value={form.drainage} onChange={e=>update("drainage",e.target.value)} placeholder="جيد / متوسط / ضعيف / غير معروف" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"/></label>
                <label className="text-sm text-slate-700">وحدة EC ماء الري<input value={form.waterElectricalConductivityUnit} onChange={e=>update("waterElectricalConductivityUnit",e.target.value)} placeholder="dS/m أو mS/cm" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"/></label>
              </div>
              <p className="text-xs leading-6 text-slate-600">المردودية المستهدفة يلزم تحديد وحدتها في الملاحظات (مثلاً طن/هكتار). ما نعطيوش جرعات سماد أو برنامج ري رقمي دون تحاليل ومعطيات كافية.</p>
            </div>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"><AlertCircle className="ml-2 inline" size={16}/>{error}</div>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{loading?<><Loader2 className="animate-spin" size={18}/>جاري إعداد التقرير العلمي...</>:<><Activity size={18}/>تحليل العينة وإنشاء التقرير الكامل</>}</button>
            <p className="text-center text-xs leading-5 text-slate-500">يتطلب الاتصال بمزوّد AI. إذا لم يكن متاحاً نظهر الخطأ ولا ننشئ تقريراً وهمياً.</p>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-slate-900">سجل تقاريرك السحابية</h3><span className="text-xs text-slate-500">{historyLoading ? "جاري التحميل..." : historyReports.length + " تقرير"}</span></div>
              {historyReports.length ? <ul className="mt-3 space-y-2">{historyReports.map((item:any) => <li key={String(item.analysisId)} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{String(item.executiveSummary || "تقرير تحليل تربة")}</p><p className="text-xs text-slate-500">{item.analyzedAt ? new Date(String(item.analyzedAt)).toLocaleString("ar-TN") : "تاريخ غير متاح"}</p></div><button type="button" onClick={()=>openSavedReport(String(item.analysisId))} className="shrink-0 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">فتح التقرير</button></li>)}</ul> : <p className="mt-3 text-sm leading-6 text-slate-500">لا توجد تقارير سحابية متاحة حالياً. يلزم تسجيل الدخول وربط العينة بحقل تملكه لحفظها.</p>}
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-bold text-emerald-950"><ShieldCheck size={19}/> الشفافية العلمية</div><ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-950"><li>• قياساتك تبقى مصنّفة كمدخلات مستخدم غير متحقق منها مخبرياً.</li><li>• تفسير التقرير استشارة LLM، وليس تنبؤاً من نموذج ML مدرّب.</li><li>• لا درجات صحة ولا نسب توافق ولا كميات أسمدة من غير أدلة كافية.</li><li>• الوحدات وطرق التحليل المجهولة تظهر كقيود، ولا نفترضها.</li></ul></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold text-slate-900">ماذا يحتوي التقرير؟</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{[[FlaskConical,"جودة البيانات والقياسات"],[Activity,"تفسير كل مؤشر"],[Leaf,"خصائص التربة والملاءمة"],[ClipboardList,"توصيات مبررة بالأدلة"],[RefreshCw,"خطة المتابعة والتحقق"],[ShieldCheck,"الحدود والمراجعة المختصة"]].map(([Icon,label]:any)=><div key={label} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><Icon size={17} className="text-emerald-700"/>{label}</div>)}</div></div>
          </div>
        </div>

        {report && <article className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><div><h2 className="text-2xl font-black text-slate-900">التقرير الزراعي</h2><p className="text-xs text-slate-500">أُنشئ: {savedAt ? new Date(savedAt).toLocaleString("ar-TN") : "—"}</p><p className={`mt-1 text-xs font-semibold ${report?.persistence?.persisted ? "text-emerald-700" : "text-amber-700"}`}>{report?.persistence?.persisted ? "✓ محفوظ في حسابك وقاعدة البيانات" : report?.persistence?.reason === "FIELD_NOT_SELECTED" ? "⚠ التقرير غير محفوظ سحابياً: اختر حقلاً تملكه قبل التحليل." : report?.persistence?.reason === "FIELD_NOT_FOUND_OR_NOT_OWNED" ? "⚠ تعذّر ربط التقرير: الحقل غير موجود أو لا تملك صلاحية الوصول إليه." : report?.persistence?.reason === "DATABASE_OR_SESSION_UNAVAILABLE" ? "⚠ يلزم تسجيل الدخول والاتصال بقاعدة البيانات للحفظ السحابي." : "⚠ تعذّر تأكيد الحفظ السحابي؛ التقرير متاح في هذه الجلسة فقط."}</p></div><div className="flex flex-wrap gap-2"><button onClick={discussReportWithAgent} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"><Sprout size={16}/>ناقش التقرير وابنِ خطة الزراعة مع Agent</button><button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"><ArrowDownToLine size={16}/>طباعة / PDF</button><button onClick={()=>{setReport(null);setError("");}} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">تحليل عينة أخرى</button></div></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950"><strong>مصدر التقرير:</strong> القياسات مدخلة من المستخدم وغير متحقق منها مخبرياً؛ التفسير والتوصيات مولّدة بواسطة AI. لا يوجد ادعاء بوجود نموذج ML مدرّب أو تنبؤ مخبري.</div>
          <Section title="الملخص التنفيذي" icon={<CheckCircle2 className="text-emerald-700"/>}><p className="text-sm leading-8 text-slate-700">{text(data.executiveSummary, "لم يقدّم مزود AI ملخصاً تنفيذياً.")}</p></Section>
          <Section title="جودة البيانات وحدود التحليل" icon={<ShieldCheck/>}><h3 className="font-semibold">القياسات المتوفرة</h3><BulletList items={(Array.isArray(quality.providedMeasurements) ? quality.providedMeasurements.map((item:any)=>typeof item==="string"?item:`${text(item.name)}: ${text(item.value)} ${text(item.unit,"")}`) : [])}/><h3 className="pt-2 font-semibold">القياسات الناقصة</h3><BulletList items={list(quality.missingMeasurements)}/><h3 className="pt-2 font-semibold">القيود</h3><BulletList items={list(quality.limitations)}/></Section>
          <Section title="خصائص التربة" icon={<Sprout/>}><p className="text-sm leading-7"><strong>النسيج:</strong> {text(data.soilCharacterization?.texture?.classification)} — {text(data.soilCharacterization?.texture?.basis)}</p><h3 className="font-semibold">الخصائص الكيميائية</h3><BulletList items={list(data.soilCharacterization?.chemical)}/><h3 className="font-semibold">الخصائص الفيزيائية</h3><BulletList items={list(data.soilCharacterization?.physical)}/></Section>
          <Section title="النتائج والتفسير" icon={<Activity/>}>{findings.length? <div className="space-y-3">{findings.map((item:any,index:number)=><div key={index} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{text(item.parameter)}</strong><span className="text-sm text-slate-500">{text(item.observedValue)} {text(item.unit,"")}</span></div><p className="mt-2 text-sm leading-7 text-slate-700">{text(item.interpretation)}</p><p className="mt-1 text-xs leading-6 text-slate-500">الأهمية: {text(item.importance)} · مستوى الخطورة: {text(item.severity)}</p><p className="mt-1 text-xs text-slate-500">الدليل: {text(item.evidence)}</p></div>)}</div>:<p className="text-sm text-slate-500">لم تتوفر نتائج كافية لتفسير المؤشرات.</p>}</Section>
          <Section title="نقاط القوة" icon={<CheckCircle2 className="text-emerald-700"/>}><BulletList items={list(data.strengths)}/></Section>
          <Section title="القيود والتحديات" icon={<AlertCircle className="text-amber-700"/>}><BulletList items={list(data.constraints)}/></Section>
          <Section title="ملاءمة المحاصيل" icon={<Leaf/>}><p className="text-sm leading-7">حالة التقييم: {text(crop.status,"غير مقيّم")}</p>{Array.isArray(crop.candidates)&&crop.candidates.length?crop.candidates.map((item:any,index:number)=><div key={index} className="border-t border-slate-100 py-3"><strong>{text(item.crop)}</strong><p className="text-sm leading-7">{text(item.why_it_may_fit)}</p><p className="text-xs text-slate-500">شروط يلزم التثبت منها: {text(item.conditions_to_check)}</p><p className="text-xs text-slate-500">الحدود: {text(item.limitations)}</p></div>):<p className="text-sm text-slate-500">لم يتم تقييم ملاءمة المحاصيل بسبب نقص معطيات المناخ والماء والصنف والسوق أو بيانات التربة اللازمة.</p>}<BulletList items={list(crop.caveats)}/><h3 className="pt-3 font-semibold">محاصيل يلزم تجنبها عند وجود دليل</h3>{Array.isArray(crop.avoid)&&crop.avoid.length?crop.avoid.map((item:any,index:number)=><p key={index} className="border-t py-2 text-sm"><strong>{text(item.crop)}:</strong> {text(item.reason)} <span className="text-xs text-slate-500">({text(item.evidence)})</span></p>):<p className="text-sm text-slate-500">لا يتم منع أي محصول دون دليل كافٍ.</p>}</Section>
          <Section title="مؤشرات التحليل وتصنيفها" icon={<Activity/>}>
            {Array.isArray(data.indicatorTable)&&data.indicatorTable.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-right text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-2">المؤشر</th><th className="p-2">القيمة</th><th className="p-2">التصنيف</th><th className="p-2">الأثر على المحصول</th><th className="p-2">الدليل / الحدود</th></tr></thead><tbody>{data.indicatorTable.map((item:any,index:number)=><tr key={index} className="border-b align-top"><td className="p-2 font-semibold">{text(item.parameter)}</td><td className="p-2">{text(item.value)} {text(item.unit,"")}</td><td className="p-2">{text(item.classification)}</td><td className="p-2">{text(item.cropEffect)}</td><td className="p-2">{text(item.evidence)}</td></tr>)}</tbody></table></div>:<p className="text-sm text-slate-500">جدول المؤشرات غير متاح لغياب بيانات كافية.</p>}
            <h3 className="pt-3 font-semibold">ترتيب القيود حسب الأولوية</h3>
            {Array.isArray(data.rankedConstraints)&&data.rankedConstraints.length ? data.rankedConstraints.map((item:any,index:number)=><div key={index} className="rounded-xl border p-3"><div className="flex justify-between gap-2"><strong>{text(item.rank,String(index+1))}. {text(item.constraint)}</strong><span className="text-xs text-slate-500">{text(item.severity)}</span></div><p className="mt-1 text-sm">{text(item.cropImpact)}</p><p className="text-xs text-slate-500">الدليل: {text(item.evidence)} · يلزم التثبت من: {text(item.whatToConfirm)}</p></div>):<p className="text-sm text-slate-500">لا توجد قيود مثبتة؛ القياسات الناقصة لا تُعتبر تشخيصاً.</p>}
            <p className="text-sm">مستوى الثقة: <strong>{text(data.confidence?.level,"غير مقيّم")}</strong></p><BulletList items={list(data.confidence?.reasons)}/>
          </Section>
          <Section title="خطة تهيئة التربة للمحصول المستهدف" icon={<Sprout/>}>
            <div className="flex flex-wrap gap-2 text-sm"><strong>{text(data.targetCropPlan?.targetCrop,"لم يُحدّد محصول")}</strong><span className="rounded-full bg-amber-50 px-3 py-1">{text(data.targetCropPlan?.feasibility,"not_assessed")}</span></div>
            <BulletList items={list(data.targetCropPlan?.reasons)}/>
            {Array.isArray(data.targetCropPlan?.gaps)&&data.targetCropPlan.gaps.map((item:any,index:number)=><div key={index} className="border-t py-2 text-sm"><strong>{text(item.parameter)}</strong><p>الحالي: {text(item.current)} · المطلوب: {text(item.required)}</p><p>الفجوة: {text(item.gap)} · الدليل: {text(item.evidence)}</p></div>)}
            {Array.isArray(data.targetCropPlan?.actions)&&data.targetCropPlan.actions.map((item:any,index:number)=><div key={index} className="border-t py-3"><strong>{index+1}. {text(item.action)}</strong><p className="text-sm">{text(item.why)}</p><p className="text-xs text-slate-500">{text(item.priority)} · {text(item.when)} · الكمية: {text(item.quantity,"غير محددة")} · الكلفة: {text(item.cost,"غير متوفرة")}</p><p className="text-xs text-slate-500">التحقق: {text(item.verification)}</p></div>)}
            <p className="rounded-lg bg-emerald-50 p-3 text-sm"><strong>أول خطوة:</strong> {text(data.targetCropPlan?.firstAction)}<br/><strong>إعادة التحليل:</strong> {text(data.targetCropPlan?.retestWhen)}</p>
          </Section>
          <Section title="برنامج التسميد حسب مراحل النمو" icon={<Leaf/>}>
            <p className="text-xs text-amber-800">{text(data.fertilizationPlan?.withheldDosesReason)}</p>
            {Array.isArray(data.fertilizationPlan?.stages)&&data.fertilizationPlan.stages.map((item:any,index:number)=><div key={index} className="border-t py-3"><strong>{text(item.stage)}</strong><p className="text-sm leading-7">{text(item.strategy)}</p><p className="text-xs text-slate-500">أمثلة: {text(item.productExamples)} · الجرعة: {text(item.rate,"غير محددة")}</p><p className="text-xs text-slate-500">التوقيت: {text(item.timing)} · الأساس: {text(item.basis)} · التثبت: {text(item.verification)}</p></div>)}
            <h3 className="font-semibold">البدائل العضوية</h3><BulletList items={list(data.fertilizationPlan?.organicOptions)}/>
          </Section>
          <Section title="الماء والري والصرف" icon={<Activity/>}>
            <p className="text-sm">حالة التقييم: {text(data.waterAndIrrigation?.status)}</p>
            {Object.entries(waterLabels).map(([key,label])=><p key={key} className="text-sm leading-7"><strong>{label}:</strong> {text(data.waterAndIrrigation?.[key])}</p>)}
            <BulletList items={list(data.waterAndIrrigation?.limitations)}/>
          </Section>
          <Section title="تقويم العمل خلال 12 أسبوعاً" icon={<ClipboardList/>}>
            <div className="grid gap-2 sm:grid-cols-2">{(Array.isArray(data.twelveWeekCalendar)?data.twelveWeekCalendar:[]).map((item:any)=><div key={item.week} className="rounded-xl border p-3"><strong>الأسبوع {item.week}</strong><BulletList items={list(item.actions)}/><p className="mt-2 text-xs text-slate-500">نقطة التثبت: {text(item.check)}</p></div>)}</div>
          </Section>
          <Section title="المخاطر والتنبيهات" icon={<AlertCircle/>}>
            {Array.isArray(data.riskAlerts)&&data.riskAlerts.length?data.riskAlerts.map((item:any,index:number)=><div key={index} className="border-b py-3"><div className="flex justify-between gap-2"><strong>{text(item.risk)}</strong><span className="text-xs">{text(item.severity)}</span></div><p className="text-sm">المؤشر: {text(item.trigger)}</p><p className="text-sm">الأعراض: {text(item.symptomsToMonitor)}</p><p className="text-sm">التصرف الآمن: {text(item.safeResponse)}</p></div>):<p className="text-sm text-slate-500">لا توجد تنبيهات مؤكدة من القياسات المتاحة.</p>}
          </Section>
          <Section title="التوصيات العملية المبررة" icon={<ClipboardList/>}>{recommendations.length?recommendations.map((item:any,index:number)=><div key={index} className="border-t border-slate-100 py-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{index+1}. {text(item.action)}</strong><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">{text(item.priority)}</span></div><p className="mt-2 text-sm leading-7"><strong>السبب:</strong> {text(item.reason)}</p><p className="text-sm leading-7"><strong>كيفية التنفيذ:</strong> {text(item.howTo)}</p><p className="text-sm leading-7"><strong>التوقيت:</strong> {text(item.when)} · <strong>التحقق:</strong> {text(item.verification)}</p><p className="text-xs text-slate-500">الكمية: {item.quantity===null||item.quantity===undefined?"لم تُحدّد لعدم كفاية الأدلة":text(item.quantity)}</p></div>):<p className="text-sm text-slate-500">لا توجد توصيات قابلة للدفاع عنها بناءً على البيانات الحالية.</p>}</Section>
          <Section title="خطة المتابعة خطوة بخطوة" icon={<RefreshCw/>}>{followUp.length?followUp.map((item:any,index:number)=><div key={index} className="flex gap-3 border-b border-slate-100 py-3 last:border-0"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">{text(item.step,String(index+1))}</div><div><strong>{text(item.when)}</strong><p className="text-sm leading-7">{text(item.whatToDo)}</p><p className="text-xs text-slate-500">شنوّة نقيسوا: {text(item.whatToMeasure)} · علاش: {text(item.why)}</p></div></div>):<p className="text-sm text-slate-500">لم يتم تحديد خطة متابعة.</p>}</Section>
          <Section title="المعلومات الإضافية المطلوبة والمراجعة المختصة" icon={<FlaskConical/>}><BulletList items={list(data.additionalInformationNeeded)}/><p className="text-sm leading-7">{text(data.professionalReview?.reason)}</p><BulletList items={list(data.professionalReview?.bringToAgronomist)}/></Section>
          <Section title="تنبيهات مهنية" icon={<ShieldCheck/>}><BulletList items={list(data.disclaimers)}/></Section>
          <p className="text-center text-xs text-slate-500 print:mt-8">AgroGrowth · تقرير استشاري مبني على البيانات المقدمة. يلزم التثبت المخبري والمراجعة الزراعية قبل القرارات الحساسة.</p>
        </article>}
      </div>
    </main>
  );
};

export default EnhancedAnalysis;
