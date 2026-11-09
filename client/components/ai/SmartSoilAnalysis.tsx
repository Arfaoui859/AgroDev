import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, ShieldCheck } from "lucide-react";

/** The dashboard shortcut deliberately routes to the maintained evidence-based report flow. */
const SmartSoilAnalysis: React.FC = () => (
  <section dir="rtl" className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><FlaskConical size={26}/></div>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold text-slate-900">تحليل التربة بالتقرير المهني</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">افتح مساحة تحليل موحّدة لإدخال القياسات، مراجعة جودة البيانات، فهم النتائج، واستلام توصيات وخطة متابعة مرتبطة بما تم قياسه فعلياً.</p>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-6 text-emerald-900"><ShieldCheck size={16} className="mt-1 shrink-0"/>لا يتم إنشاء نتائج تجريبية عند تعذّر مزوّد AI. القياسات غير المتحقق منها مخبرياً تبقى معلّمة بوضوح.</div>
        <Link to="/enhanced-analysis" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800">فتح تحليل التربة الكامل <ArrowLeft size={17}/></Link>
      </div>
    </div>
  </section>
);
export default SmartSoilAnalysis;
