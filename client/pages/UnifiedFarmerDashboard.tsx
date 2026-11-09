import React from "react";
import { ArrowUpRight, Bot, LayoutDashboard, Sprout, Tractor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FarmerDashboard from "./FarmerDashboard";
import ComprehensiveFarmManagement from "./ComprehensiveFarmManagement";
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
  return (
    <main className="min-h-screen space-y-6 bg-slate-50/60 p-3 sm:p-5 lg:p-7" dir="rtl">
      <header className="overflow-hidden rounded-2xl border bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-800 p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              <Sprout className="h-4 w-4" />
              AgroGrowth · مساحة العمل الزراعية
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              لوحة الفلاح الموحدة
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-base">
              إدارة المزرعة، متابعة المحاصيل والعمليات، الوصول إلى أدوات الذكاء الاصطناعي،
              والتحدث مع المساعد الزراعي من مساحة عمل واحدة.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
            <LayoutDashboard className="h-5 w-5" />
            <span>مركز التحكم AgroGrowth</span>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview" dir="rtl" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-white p-2 shadow-sm md:grid-cols-4">
          <TabsTrigger value="overview" className="min-h-11 gap-2 rounded-lg">
            <LayoutDashboard className="h-4 w-4" />
            <span>لوحة الفلاح</span>
          </TabsTrigger>
          <TabsTrigger value="farm" className="min-h-11 gap-2 rounded-lg">
            <Tractor className="h-4 w-4" />
            <span>إدارة المزرعة</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="min-h-11 gap-2 rounded-lg">
            <Sprout className="h-4 w-4" />
            <span>الذكاء الاصطناعي</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="min-h-11 gap-2 rounded-lg">
            <Bot className="h-4 w-4" />
            <span>المساعد الذكي</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <FarmerDashboard />
        </TabsContent>
        <TabsContent value="farm" className="mt-0">
          <ComprehensiveFarmManagement />
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
