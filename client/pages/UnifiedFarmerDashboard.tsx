import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bot, LayoutDashboard, Sprout, Tractor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FarmOverviewPanel from "./FarmOverviewPanel";
import FarmOperationsWorkspace from "./FarmOperationsWorkspace";
import AIIntelligenceDashboard from "./AIIntelligenceDashboard";
import AIAssistantChatbot from "./AIAssistantChatbot";

/**
 * AgroGrowth's single farmer workspace.
 *
 * The three former entry dashboards are composed here instead of forcing
 * farmers to navigate between separate top-level dashboards. The assistant
 * is available as a first-class workspace tab.
 */
export default function UnifiedFarmerDashboard() {
  const { language, dir } = useLanguage();
  const copy = {
    ar: {
      eyebrow: "مساحة العمل الزراعية",
      title: "لوحة AgroGrowth الموحدة",
      description: "إدارة المزرعة، متابعة المحاصيل والعمليات، الوصول إلى أدوات الذكاء الاصطناعي، والتحدث مع المساعد الزراعي من مساحة عمل واحدة.",
      center: "مركز التحكم AgroGrowth",
      overview: "نظرة عامة",
      farm: "إدارة المزرعة",
      ai: "الذكاء الاصطناعي",
      assistant: "المساعد الذكي",
    },
    fr: {
      eyebrow: "Espace de travail agricole",
      title: "Tableau de bord AgroGrowth",
      description: "Gérez vos exploitations, cultures et opérations, consultez les outils d’IA et échangez avec l’assistant agricole depuis un espace unique.",
      center: "Centre de contrôle AgroGrowth",
      overview: "Vue d’ensemble",
      farm: "Gestion agricole",
      ai: "Intelligence artificielle",
      assistant: "Assistant intelligent",
    },
    en: {
      eyebrow: "Agricultural workspace",
      title: "AgroGrowth unified dashboard",
      description: "Manage farms, crops and operations, access AI tools, and talk to the agricultural assistant from one workspace.",
      center: "AgroGrowth control center",
      overview: "Overview",
      farm: "Farm operations",
      ai: "AI intelligence",
      assistant: "AI assistant",
    },
  }[language];

  return (
    <main className="min-h-screen space-y-6 bg-slate-50/60 p-3 sm:p-5 lg:p-7" dir={dir}>
      <header className="overflow-hidden rounded-2xl border bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-800 p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <Sprout className="h-4 w-4" />
              AgroGrowth · {copy.eyebrow}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              {copy.description}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
            <LayoutDashboard className="h-5 w-5" />
            <span>{copy.center}</span>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview" dir={dir} className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-white p-2 shadow-sm md:grid-cols-4">
          <TabsTrigger value="overview" className="min-h-11 gap-2 rounded-lg">
            <LayoutDashboard className="h-4 w-4" />
            <span>{copy.overview}</span>
          </TabsTrigger>
          <TabsTrigger value="farm" className="min-h-11 gap-2 rounded-lg">
            <Tractor className="h-4 w-4" />
            <span>{copy.farm}</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="min-h-11 gap-2 rounded-lg">
            <Sprout className="h-4 w-4" />
            <span>{copy.ai}</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="min-h-11 gap-2 rounded-lg">
            <Bot className="h-4 w-4" />
            <span>{copy.assistant}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <FarmOverviewPanel />
        </TabsContent>
        <TabsContent value="farm" className="mt-0">
          <FarmOperationsWorkspace />
        </TabsContent>
        <TabsContent value="ai" className="mt-0">
          <AIIntelligenceDashboard />
        </TabsContent>
        <TabsContent value="assistant" className="mt-0">
          <AIAssistantChatbot />
        </TabsContent>
      </Tabs>
    </main>
  );
}
