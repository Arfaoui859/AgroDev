import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Lightbulb,
  Activity,
  Gauge,
  Leaf,
  Droplets,
  Beaker,
  DollarSign,
  Clock,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";

interface SoilParameter {
  name: string;
  label: string;
  current: number;
  ideal: {
    min: number;
    max: number;
    optimal: number;
  };
  unit: string;
  category: "chemical" | "physical" | "biological" | "nutritional";
  importance: "critical" | "high" | "medium" | "low";
  status: "optimal" | "acceptable" | "needs_attention" | "critical";
}

interface ComparisonResult {
  overallMatch: number;
  categoryScores: {
    chemical: number;
    physical: number;
    biological: number;
    nutritional: number;
  };
  parameters: SoilParameter[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  estimatedCost: number;
  timeToOptimal: string;
}

interface IdealProfile {
  cropType: string;
  season: string;
  soilType: string;
  idealValues: any;
  description: string;
  recommendations: string[];
}

const parameterCategories = {
  chemical: {
    name: "الخصائص الكيميائية",
    icon: Beaker,
    color: "#3b82f6",
  },
  physical: {
    name: "الخصائص الفيزيائية",
    icon: Activity,
    color: "#10b981",
  },
  biological: {
    name: "النشاط البيولوجي",
    icon: Leaf,
    color: "#f59e0b",
  },
  nutritional: {
    name: "العناصر الغذائية",
    icon: Droplets,
    color: "#ef4444",
  },
};

const statusColors = {
  optimal: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
  },
  acceptable: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  needs_attention: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
  },
  critical: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
  },
};

const statusTranslation = {
  optimal: "مثالي",
  acceptable: "مقبول",
  needs_attention: "يحتاج تحسين",
  critical: "حرج",
};

export default function IdealSoilComparison() {
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [idealProfile, setIdealProfile] = useState<IdealProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("wheat");
  const [selectedSeason, setSelectedSeason] = useState("winter");
  const [selectedSoilType, setSelectedSoilType] = useState("clay");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadIdealProfile();
    generateComparison();
  }, [selectedCrop, selectedSeason, selectedSoilType]);

  const loadIdealProfile = async () => {
    try {
      const response = await fetch(
        `/api/soil-ai-detector/ideal-profile?cropType=${selectedCrop}&season=${selectedSeason}&soilType=${selectedSoilType}`,
      );
      const data = await response.json();

      if (data.success) {
        setIdealProfile(data.data);
      }
    } catch (error) {
      console.error("Error loading ideal profile:", error);
    }
  };

  const generateComparison = async () => {
    setLoading(true);

    try {
      // Simulate current soil data
      const currentSoilData = {
        ph: 8.2,
        nitrogen: 25,
        phosphorus: 18,
        potassium: 120,
        organicMatter: 1.8,
        electricalConductivity: 3.2,
        moisture: 12,
        calcium: 800,
        magnesium: 150,
        sulfur: 20,
        iron: 45,
        zinc: 2.5,
        manganese: 8,
        copper: 1.2,
        boron: 0.8,
        bulkDensity: 1.45,
        porosity: 42,
        cationExchangeCapacity: 28,
        biologicalActivity: 65, // percentage
      };

      // Define ideal ranges based on crop, season, and soil type
      const idealRanges = {
        wheat: {
          winter: {
            clay: {
              ph: { min: 6.0, max: 7.5, optimal: 6.8 },
              nitrogen: { min: 40, max: 80, optimal: 60 },
              phosphorus: { min: 15, max: 30, optimal: 22 },
              potassium: { min: 150, max: 300, optimal: 225 },
              organicMatter: { min: 2.0, max: 4.0, optimal: 3.0 },
              electricalConductivity: { min: 0.0, max: 2.0, optimal: 1.0 },
              moisture: { min: 15, max: 25, optimal: 20 },
              calcium: { min: 600, max: 1200, optimal: 900 },
              magnesium: { min: 120, max: 200, optimal: 160 },
              sulfur: { min: 15, max: 35, optimal: 25 },
              iron: { min: 20, max: 60, optimal: 40 },
              zinc: { min: 1.5, max: 4.0, optimal: 2.8 },
              manganese: { min: 5, max: 15, optimal: 10 },
              copper: { min: 0.8, max: 2.0, optimal: 1.4 },
              boron: { min: 0.5, max: 1.5, optimal: 1.0 },
              bulkDensity: { min: 1.1, max: 1.3, optimal: 1.2 },
              porosity: { min: 45, max: 55, optimal: 50 },
              cationExchangeCapacity: { min: 20, max: 40, optimal: 30 },
              biologicalActivity: { min: 70, max: 90, optimal: 80 },
            },
          },
        },
      };

      const currentRanges = idealRanges.wheat.winter.clay;

      // Generate parameters comparison
      const parameters: SoilParameter[] = [
        {
          name: "ph",
          label: "درجة الحموضة (pH)",
          current: currentSoilData.ph,
          ideal: currentRanges.ph,
          unit: "",
          category: "chemical",
          importance: "critical",
          status:
            currentSoilData.ph >= currentRanges.ph.min &&
            currentSoilData.ph <= currentRanges.ph.max
              ? "optimal"
              : "needs_attention",
        },
        {
          name: "nitrogen",
          label: "النيتروجين",
          current: currentSoilData.nitrogen,
          ideal: currentRanges.nitrogen,
          unit: "mg/kg",
          category: "nutritional",
          importance: "critical",
          status:
            currentSoilData.nitrogen < currentRanges.nitrogen.min
              ? "critical"
              : "needs_attention",
        },
        {
          name: "phosphorus",
          label: "الفوسفور",
          current: currentSoilData.phosphorus,
          ideal: currentRanges.phosphorus,
          unit: "mg/kg",
          category: "nutritional",
          importance: "high",
          status:
            currentSoilData.phosphorus >= currentRanges.phosphorus.min &&
            currentSoilData.phosphorus <= currentRanges.phosphorus.max
              ? "optimal"
              : "acceptable",
        },
        {
          name: "potassium",
          label: "البوتاسيوم",
          current: currentSoilData.potassium,
          ideal: currentRanges.potassium,
          unit: "mg/kg",
          category: "nutritional",
          importance: "high",
          status:
            currentSoilData.potassium < currentRanges.potassium.min
              ? "needs_attention"
              : "acceptable",
        },
        {
          name: "organicMatter",
          label: "المادة العضوية",
          current: currentSoilData.organicMatter,
          ideal: currentRanges.organicMatter,
          unit: "%",
          category: "biological",
          importance: "high",
          status:
            currentSoilData.organicMatter < currentRanges.organicMatter.min
              ? "needs_attention"
              : "acceptable",
        },
        {
          name: "electricalConductivity",
          label: "التوصيل الكهربائي (الملوحة)",
          current: currentSoilData.electricalConductivity,
          ideal: currentRanges.electricalConductivity,
          unit: "dS/m",
          category: "chemical",
          importance: "critical",
          status:
            currentSoilData.electricalConductivity >
            currentRanges.electricalConductivity.max
              ? "critical"
              : "acceptable",
        },
        {
          name: "moisture",
          label: "الرطوبة",
          current: currentSoilData.moisture,
          ideal: currentRanges.moisture,
          unit: "%",
          category: "physical",
          importance: "high",
          status:
            currentSoilData.moisture < currentRanges.moisture.min
              ? "needs_attention"
              : "acceptable",
        },
        {
          name: "calcium",
          label: "الكالسيوم",
          current: currentSoilData.calcium,
          ideal: currentRanges.calcium,
          unit: "mg/kg",
          category: "nutritional",
          importance: "medium",
          status:
            currentSoilData.calcium >= currentRanges.calcium.min &&
            currentSoilData.calcium <= currentRanges.calcium.max
              ? "optimal"
              : "acceptable",
        },
        {
          name: "iron",
          label: "الحديد",
          current: currentSoilData.iron,
          ideal: currentRanges.iron,
          unit: "mg/kg",
          category: "nutritional",
          importance: "medium",
          status:
            currentSoilData.iron >= currentRanges.iron.min &&
            currentSoilData.iron <= currentRanges.iron.max
              ? "optimal"
              : "acceptable",
        },
        {
          name: "zinc",
          label: "الزنك",
          current: currentSoilData.zinc,
          ideal: currentRanges.zinc,
          unit: "mg/kg",
          category: "nutritional",
          importance: "medium",
          status:
            currentSoilData.zinc >= currentRanges.zinc.min &&
            currentSoilData.zinc <= currentRanges.zinc.max
              ? "acceptable"
              : "needs_attention",
        },
        {
          name: "bulkDensity",
          label: "الكثافة الظاهرية",
          current: currentSoilData.bulkDensity,
          ideal: currentRanges.bulkDensity,
          unit: "g/cm³",
          category: "physical",
          importance: "medium",
          status:
            currentSoilData.bulkDensity > currentRanges.bulkDensity.max
              ? "needs_attention"
              : "acceptable",
        },
        {
          name: "porosity",
          label: "المسامية",
          current: currentSoilData.porosity,
          ideal: currentRanges.porosity,
          unit: "%",
          category: "physical",
          importance: "high",
          status:
            currentSoilData.porosity < currentRanges.porosity.min
              ? "needs_attention"
              : "acceptable",
        },
        {
          name: "biologicalActivity",
          label: "النشاط البيولوجي",
          current: currentSoilData.biologicalActivity,
          ideal: currentRanges.biologicalActivity,
          unit: "%",
          category: "biological",
          importance: "high",
          status:
            currentSoilData.biologicalActivity <
            currentRanges.biologicalActivity.min
              ? "needs_attention"
              : "acceptable",
        },
      ];

      // Calculate category scores
      const categoryScores = {
        chemical: calculateCategoryScore(
          parameters.filter((p) => p.category === "chemical"),
        ),
        physical: calculateCategoryScore(
          parameters.filter((p) => p.category === "physical"),
        ),
        biological: calculateCategoryScore(
          parameters.filter((p) => p.category === "biological"),
        ),
        nutritional: calculateCategoryScore(
          parameters.filter((p) => p.category === "nutritional"),
        ),
      };

      // Calculate overall match
      const overallMatch = Math.round(
        (categoryScores.chemical +
          categoryScores.physical +
          categoryScores.biological +
          categoryScores.nutritional) /
          4,
      );

      // Generate recommendations
      const recommendations = generateRecommendations(parameters);

      setComparisonResult({
        overallMatch,
        categoryScores,
        parameters,
        recommendations,
        estimatedCost: 1250,
        timeToOptimal: "3-6 أشهر",
      });
    } catch (error) {
      console.error("Error generating comparison:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryScore = (params: SoilParameter[]): number => {
    if (params.length === 0) return 100;

    const scores = params.map((param) => {
      const current = param.current;
      const ideal = param.ideal;

      if (current >= ideal.min && current <= ideal.max) {
        return 100;
      } else if (current < ideal.min) {
        const deficit = ideal.min - current;
        const range = ideal.max - ideal.min;
        return Math.max(0, 100 - (deficit / range) * 100);
      } else {
        const excess = current - ideal.max;
        const range = ideal.max - ideal.min;
        return Math.max(0, 100 - (excess / range) * 100);
      }
    });

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  };

  const generateRecommendations = (params: SoilParameter[]) => {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];

    params.forEach((param) => {
      if (param.status === "critical") {
        if (param.name === "nitrogen" && param.current < param.ideal.min) {
          immediate.push("إضافة سماد نيتروجيني سريع المفعول (يوريا 46%)");
        }
        if (
          param.name === "electricalConductivity" &&
          param.current > param.ideal.max
        ) {
          immediate.push("تطبيق نظام غسيل للأملاح مع تحسين الصرف");
        }
        if (param.name === "ph" && param.current > param.ideal.max) {
          immediate.push("إضافة الكبريت الزراعي لخفض pH");
        }
      }

      if (param.status === "needs_attention") {
        if (param.name === "organicMatter" && param.current < param.ideal.min) {
          shortTerm.push("إضافة الكومبوست والمواد العضوية بانتظام");
        }
        if (param.name === "potassium" && param.current < param.ideal.min) {
          shortTerm.push("استخدام سماد البوتاسيوم (سلفات البوتاسيوم)");
        }
        if (param.name === "moisture" && param.current < param.ideal.min) {
          shortTerm.push("تحسين نظام الري وإضافة المهاد");
        }
      }
    });

    longTerm.push("تطوير برنامج متكامل لإدارة خصوبة التربة");
    longTerm.push("زراعة محاصيل تحسين التربة (البقوليات)");
    longTerm.push("تطبيق نظام الزراعة المحافظة على التربة");

    return { immediate, shortTerm, longTerm };
  };

  const getParameterStatus = (param: SoilParameter) => {
    const current = param.current;
    const ideal = param.ideal;

    if (current < ideal.min) {
      return {
        icon: ArrowUp,
        text: `نقص ${(((ideal.min - current) / ideal.min) * 100).toFixed(0)}%`,
        color: "text-red-600",
      };
    } else if (current > ideal.max) {
      return {
        icon: ArrowDown,
        text: `زيادة ${(((current - ideal.max) / ideal.max) * 100).toFixed(0)}%`,
        color: "text-orange-600",
      };
    } else {
      return {
        icon: CheckCircle,
        text: "مثالي",
        color: "text-green-600",
      };
    }
  };

  const getRadarData = () => {
    if (!comparisonResult) return [];

    return Object.entries(comparisonResult.categoryScores).map(
      ([category, score]) => ({
        category:
          parameterCategories[category as keyof typeof parameterCategories]
            .name,
        current: score,
        ideal: 100,
      }),
    );
  };

  const filteredParameters =
    comparisonResult?.parameters.filter(
      (param) =>
        selectedCategory === "all" || param.category === selectedCategory,
    ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            جاري تحليل ومقارنة التربة...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <Target className="h-8 w-8" />
            مقارنة مع التربة المثالية
          </h1>
          <p className="text-muted-foreground">
            تحليل تفاعلي لمقارنة تربتك مع المعايير المثالية للمحصول المختار
          </p>
        </div>
        <Button
          onClick={generateComparison}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Zap className="w-4 h-4 ml-2" />
          تحديث المقارنة
        </Button>
      </div>

      {/* Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختيار المعايير المرجعية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                نوع المحصول
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="wheat">قمح</option>
                <option value="olive">زيتون</option>
                <option value="tomato">طماطم</option>
                <option value="citrus">حمضيات</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الموسم</label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="winter">شتاء</option>
                <option value="spring">ربيع</option>
                <option value="summer">صيف</option>
                <option value="autumn">خريف</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                نوع التربة
              </label>
              <select
                value={selectedSoilType}
                onChange={(e) => setSelectedSoilType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="clay">طينية</option>
                <option value="sandy">رملية</option>
                <option value="loamy">طينية رملية</option>
                <option value="silty">غرينية</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      {comparisonResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className={`${
              comparisonResult.overallMatch >= 80
                ? "bg-green-50 border-green-200"
                : comparisonResult.overallMatch >= 60
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
            } border-2`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                التطابق العام
              </CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  comparisonResult.overallMatch >= 80
                    ? "text-green-600"
                    : comparisonResult.overallMatch >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {comparisonResult.overallMatch}%
              </div>
              <Progress
                value={comparisonResult.overallMatch}
                className={`mt-2 ${
                  comparisonResult.overallMatch >= 80
                    ? "[&>div]:bg-green-500"
                    : comparisonResult.overallMatch >= 60
                      ? "[&>div]:bg-yellow-500"
                      : "[&>div]:bg-red-500"
                }`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                معايير تحتاج تحسين
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  comparisonResult.parameters.filter(
                    (p) =>
                      p.status === "needs_attention" || p.status === "critical",
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                من أصل {comparisonResult.parameters.length} معيار
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                التكلفة المقدرة
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {comparisonResult.estimatedCost.toLocaleString()} د.ت
              </div>
              <p className="text-xs text-muted-foreground">للوصول للمثالية</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                الوقت المقدر
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {comparisonResult.timeToOptimal}
              </div>
              <p className="text-xs text-muted-foreground">
                للوصول للحالة المثالية
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {comparisonResult && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="parameters">المعايير التفصيلية</TabsTrigger>
            <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
            <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>التحليل المقارن بالفئات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={getRadarData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="الحالة الحالية"
                        dataKey="current"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="الحالة المثالية"
                        dataKey="ideal"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.1}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>نقاط الفئات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(comparisonResult.categoryScores).map(
                      ([category, score]) => {
                        const categoryInfo =
                          parameterCategories[
                            category as keyof typeof parameterCategories
                          ];
                        const Icon = categoryInfo.icon;

                        return (
                          <div
                            key={category}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor: `${categoryInfo.color}20`,
                                }}
                              >
                                <Icon
                                  className="w-5 h-5"
                                  style={{ color: categoryInfo.color }}
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {categoryInfo.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {
                                    comparisonResult.parameters.filter(
                                      (p) => p.category === category,
                                    ).length
                                  }{" "}
                                  معايير
                                </p>
                              </div>
                            </div>
                            <div className="text-left">
                              <div
                                className={`text-2xl font-bold ${score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"}`}
                              >
                                {score}%
                              </div>
                              <Progress
                                value={score}
                                className={`w-20 mt-1 ${score >= 80 ? "[&>div]:bg-green-500" : score >= 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"}`}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-6">
            {/* Category Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    جميع المعايير
                  </Button>
                  {Object.entries(parameterCategories).map(
                    ([category, info]) => (
                      <Button
                        key={category}
                        variant={
                          selectedCategory === category ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="flex items-center gap-2"
                      >
                        <info.icon className="w-4 h-4" />
                        {info.name}
                      </Button>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParameters.map((param) => {
                const status = getParameterStatus(param);
                const StatusIcon = status.icon;
                const colors = statusColors[param.status];

                return (
                  <Card
                    key={param.name}
                    className={`${colors.border} border-2`}
                  >
                    <CardHeader className={`${colors.bg} rounded-t-lg`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className={`text-lg ${colors.text}`}>
                            {param.label}
                          </CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {parameterCategories[param.category].name}
                          </Badge>
                        </div>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            القيمة الحالية:
                          </span>
                          <span className="font-bold text-lg">
                            {param.current} {param.unit}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            النطاق المثالي:
                          </span>
                          <span className="font-medium text-green-600">
                            {param.ideal.min} - {param.ideal.max} {param.unit}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            الحالة:
                          </span>
                          <span className={`font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{param.ideal.min}</span>
                            <span>مثالي: {param.ideal.optimal}</span>
                            <span>{param.ideal.max}</span>
                          </div>
                          <div className="relative h-2 bg-gray-200 rounded-full">
                            <div
                              className="absolute h-full bg-green-500 rounded-full"
                              style={{
                                left: `${((param.ideal.min - param.ideal.min) / (param.ideal.max - param.ideal.min)) * 100}%`,
                                width: `${((param.ideal.max - param.ideal.min) / (param.ideal.max - param.ideal.min)) * 100}%`,
                              }}
                            />
                            <div
                              className={`absolute w-3 h-3 ${param.current >= param.ideal.min && param.current <= param.ideal.max ? "bg-green-600" : "bg-red-600"} rounded-full transform -translate-y-0.5`}
                              style={{
                                left: `${Math.max(0, Math.min(100, ((param.current - param.ideal.min) / (param.ideal.max - param.ideal.min)) * 100))}%`,
                                transform: "translateX(-50%) translateY(-25%)",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {/* Immediate Actions */}
            {comparisonResult.recommendations.immediate.length > 0 && (
              <Card>
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    إجراءات فورية (خلال أسبوع)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {comparisonResult.recommendations.immediate.map(
                      (action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Short Term Actions */}
            {comparisonResult.recommendations.shortTerm.length > 0 && (
              <Card>
                <CardHeader className="bg-yellow-50">
                  <CardTitle className="text-yellow-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    إجراءات قصيرة المدى (خلال شهر)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {comparisonResult.recommendations.shortTerm.map(
                      (action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Long Term Actions */}
            {comparisonResult.recommendations.longTerm.length > 0 && (
              <Card>
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    إجراءات طويل�� المدى (3+ أشهر)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    {comparisonResult.recommendations.longTerm.map(
                      (action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  اتجاهات التحسن المتوقعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  ستظهر اتجاهات التحسن بعد تطبيق ��لتوصيات ومتابعة التحليلات
                  الدورية...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
