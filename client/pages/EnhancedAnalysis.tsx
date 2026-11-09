import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownToLine, CheckCircle2, ClipboardList,
  FlaskConical, Leaf, Loader2, RefreshCw, ShieldCheck, Sprout,
} from "lucide-react";
import { soilAnalysisService, SoilAnalysisEnvelope } from "@/lib/services/soilAnalysisService";
import type { RawSoilData } from "@shared/api";

type FormState = Record<string, string>;
type ReportObject = Record<string, any>;

const fields: Array<{key: keyof RawSoilData; label: string; unit: string; required?: boolean; step?: string}> = [
  { key: "ph", label: "درجة الحموضة pH", unit: "0–14", required: true, step: "0.1" },
  { key: "moisture", label: "رطوبة التربة", unit: "%", required: true, step: "0.1" },
  { key: "organicMatter", label: "المادة العضوية", unit: "%", step: "0.1" },
  { key: "electricalConductivity", label: "التوصيل الكهربائي EC", unit: "أدخل الوحدة أدناه", step: "0.01" },
  { key: "nitrogen", label: "النيتروجين N", unit: "حسب وحدة التحليل", step: "0.1" },
  { key: "phosphorus", label: "الفوسفور P", unit: "حسب وحدة التحليل", step: "0.1" },
  { key: "potassium", label: "البوتاسيوم K", unit: "حسب وحدة التحليل", step: "0.1" },
  { key: "sandPercent", label: "الرمل", unit: "%", step: "0.1" },
  { key: "siltPercent", label: "الغرين / السلت", unit: "%", step: "0.1" },
  { key: "clayPercent", label: "الطين", unit: "%", step: "0.1" },
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

const EnhancedAnalysis: React.FC = () => {
  const [form, setForm] = useState<FormState>({ ph: "", moisture: "", organicMatter: "", electricalConductivity: "", electricalConductivityUnit: "", nitrogen: "", phosphorus: "", potassium: "", sandPercent: "", siltPercent: "", clayPercent: "", fieldId: "", location: "", samplingDate: "", sampleDepth: "", currentCrop: "", season: "", nutrientUnit: "", nutrientMethod: "", electricalConductivityMethod: "", notes: "" });
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
    for (const key of ["fieldId","location","samplingDate","currentCrop","season","notes","nutrientUnit","nutrientMethod","electricalConductivityUnit","electricalConductivityMethod"] as const) {
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
              {[["location","الموقع"],["samplingDate","تاريخ أخذ العينة"],["sampleDepth","عمق العينة (سم)"],["currentCrop","المحصول الحالي"],["season","الموسم"]].map(([key,label]) => <label key={key} className="block text-sm font-medium text-slate-700">{label}<input type={key==="samplingDate"?"date":"text"} value={form[key]||""} onChange={(e)=>update(key,e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"/></label>)}
            </div>
            <div><h3 className="mb-3 font-bold text-slate-800">2. القياسات الفيزيائية والكيميائية</h3><div className="grid gap-3 sm:grid-cols-2">{fields.map((field)=> <label key={String(field.key)} className="block text-sm font-medium text-slate-700">{field.label}{field.required?" *":""}<span className="mr-1 text-xs font-normal text-slate-400">({field.unit})</span><input type="number" step={field.step||"any"} min="0" value={form[String(field.key)]||""} onChange={(e)=>update(String(field.key),e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="اتركه فارغاً إذا غير متوفر"/></label>)}</div></div>
            <div><h3 className="mb-3 font-bold text-slate-800">3. منهجية التحليل والملاحظات</h3><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm text-slate-700">وحدة NPK والعناصر (مثلاً mg/kg أو ppm)<input value={form.nutrientUnit} onChange={(e)=>update("nutrientUnit",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="text-sm text-slate-700">طريقة التحليل المخبري (إن عُرفت)<input value={form.nutrientMethod} onChange={(e)=>update("nutrientMethod",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="text-sm text-slate-700">وحدة EC (مثلاً dS/m أو mS/cm)<input value={form.electricalConductivityUnit} onChange={(e)=>update("electricalConductivityUnit",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="text-sm text-slate-700 sm:col-span-2">طريقة قياس EC (مثلاً ECe أو 1:5)<input value={form.electricalConductivityMethod} onChange={(e)=>update("electricalConductivityMethod",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label></div><textarea value={form.notes} onChange={(e)=>update("notes",e.target.value)} rows={3} placeholder="نوع الجهاز، ظروف الري، ملاحظات الحقل..." className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></div>
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
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><div><h2 className="text-2xl font-black text-slate-900">التقرير الزراعي</h2><p className="text-xs text-slate-500">أُنشئ: {savedAt ? new Date(savedAt).toLocaleString("ar-TN") : "—"}</p><p className={`mt-1 text-xs font-semibold ${report?.persistence?.persisted ? "text-emerald-700" : "text-amber-700"}`}>{report?.persistence?.persisted ? "✓ محفوظ في حسابك وقاعدة البيانات" : "⚠ محفوظ محلياً في هذا المتصفح فقط — لم يتم تأكيد الحفظ السحابي"}</p></div><div className="flex gap-2"><button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"><ArrowDownToLine size={16}/>طباعة / PDF</button><button onClick={()=>{setReport(null);setError("");}} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">تحليل عينة أخرى</button></div></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950"><strong>مصدر التقرير:</strong> القياسات مدخلة من المستخدم وغير متحقق منها مخبرياً؛ التفسير والتوصيات مولّدة بواسطة AI. لا يوجد ادعاء بوجود نموذج ML مدرّب أو تنبؤ مخبري.</div>
          <Section title="الملخص التنفيذي" icon={<CheckCircle2 className="text-emerald-700"/>}><p className="text-sm leading-8 text-slate-700">{text(data.executiveSummary, "لم يقدّم مزود AI ملخصاً تنفيذياً.")}</p></Section>
          <Section title="جودة البيانات وحدود التحليل" icon={<ShieldCheck/>}><h3 className="font-semibold">القياسات المتوفرة</h3><BulletList items={(Array.isArray(quality.providedMeasurements) ? quality.providedMeasurements.map((item:any)=>typeof item==="string"?item:`${text(item.name)}: ${text(item.value)} ${text(item.unit,"")}`) : [])}/><h3 className="pt-2 font-semibold">القياسات الناقصة</h3><BulletList items={list(quality.missingMeasurements)}/><h3 className="pt-2 font-semibold">القيود</h3><BulletList items={list(quality.limitations)}/></Section>
          <Section title="خصائص التربة" icon={<Sprout/>}><p className="text-sm leading-7"><strong>النسيج:</strong> {text(data.soilCharacterization?.texture?.classification)} — {text(data.soilCharacterization?.texture?.basis)}</p><h3 className="font-semibold">الخصائص الكيميائية</h3><BulletList items={list(data.soilCharacterization?.chemical)}/><h3 className="font-semibold">الخصائص الفيزيائية</h3><BulletList items={list(data.soilCharacterization?.physical)}/></Section>
          <Section title="النتائج والتفسير" icon={<Activity/>}>{findings.length? <div className="space-y-3">{findings.map((item:any,index:number)=><div key={index} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{text(item.parameter)}</strong><span className="text-sm text-slate-500">{text(item.observedValue)} {text(item.unit,"")}</span></div><p className="mt-2 text-sm leading-7 text-slate-700">{text(item.interpretation)}</p><p className="mt-1 text-xs leading-6 text-slate-500">الأهمية: {text(item.importance)} · مستوى الخطورة: {text(item.severity)}</p><p className="mt-1 text-xs text-slate-500">الدليل: {text(item.evidence)}</p></div>)}</div>:<p className="text-sm text-slate-500">لم تتوفر نتائج كافية لتفسير المؤشرات.</p>}</Section>
          <Section title="نقاط القوة" icon={<CheckCircle2 className="text-emerald-700"/>}><BulletList items={list(data.strengths)}/></Section>
          <Section title="القيود والتحديات" icon={<AlertCircle className="text-amber-700"/>}><BulletList items={list(data.constraints)}/></Section>
          <Section title="ملاءمة المحاصيل" icon={<Leaf/>}><p className="text-sm leading-7">حالة التقييم: {text(crop.status,"غير مقيّم")}</p>{Array.isArray(crop.candidates)&&crop.candidates.length?crop.candidates.map((item:any,index:number)=><div key={index} className="border-t border-slate-100 py-3"><strong>{text(item.crop)}</strong><p className="text-sm leading-7">{text(item.why_it_may_fit)}</p><p className="text-xs text-slate-500">شروط يلزم التثبت منها: {text(item.conditions_to_check)}</p><p className="text-xs text-slate-500">الحدود: {text(item.limitations)}</p></div>):<p className="text-sm text-slate-500">لم يتم تقييم ملاءمة المحاصيل بسبب نقص معطيات المناخ والماء والصنف والسوق أو بيانات التربة اللازمة.</p>}<BulletList items={list(crop.caveats)}/></Section>
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
