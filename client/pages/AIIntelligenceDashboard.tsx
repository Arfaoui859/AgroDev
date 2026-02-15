import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SmartSoilAnalysis from "@/components/ai/SmartSoilAnalysis";
import SmartCropRecommendations from "@/components/ai/SmartCropRecommendations";
import PlantDiseaseDetection from "@/components/ai/PlantDiseaseDetection";
import { useServiceHealthChecker } from "@/hooks/useServiceHealthChecker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Brain,
  Zap,
  Target,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Leaf,
  Droplets,
  DollarSign,
  Calendar,
  MapPin,
  Star,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Bot,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Share2,
  Bookmark,
  Filter,
  Search,
  Activity,
  Shield,
  Cpu,
  Database,
  LineChart,
  PieChart,
  BarChart2,
  Gauge,
  Layers,
  Network,
  GitBranch,
  Bug,
  Sprout,
  Workflow,
  MessageSquare,
  Bell,
  User,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Plus,
  Minus,
  X,
  Check,
} from "lucide-react";

// ============ TYPES & INTERFACES ============

interface AIRecommendation {
  id: string;
  type:
    | "crop_rotation"
    | "irrigation"
    | "fertilizer"
    | "pest_control"
    | "soil_improvement"
    | "market_timing"
    | "weather_action";
  typeArabic: string;
  priority: "low" | "medium" | "high" | "critical";
  priorityArabic: string;
  confidence: number; // 0-100
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  reasoning: string;
  reasoningArabic: string;
  expectedBenefits: {
    yieldIncrease?: number;
    costReduction?: number;
    waterSavings?: number;
    environmentalBenefit?: number;
    timeToImplement: number; // days
    difficulty: "easy" | "medium" | "hard";
  };
  implementation: {
    steps: Array<{
      step: number;
      action: string;
      actionArabic: string;
      timeframe: string;
      timeframeArabic: string;
      cost?: number;
      tools?: string[];
    }>;
    totalCost: number;
    duration: string;
    durationArabic: string;
  };
  relatedFields: string[];
  season: "spring" | "summer" | "autumn" | "winter" | "any";
  seasonArabic: string;
  aiModel: string;
  generatedAt: string;
  status: "new" | "reviewed" | "accepted" | "rejected" | "implemented";
  statusArabic: string;
  feedback?: {
    rating: number;
    comments: string;
    implementationResult?: "success" | "partial" | "failed";
  };
}

interface AIInsight {
  id: string;
  category:
    | "performance"
    | "risk"
    | "opportunity"
    | "efficiency"
    | "sustainability";
  categoryArabic: string;
  title: string;
  titleArabic: string;
  insight: string;
  insightArabic: string;
  dataPoints: Array<{
    label: string;
    labelArabic: string;
    value: string;
    trend: "up" | "down" | "stable";
  }>;
  confidence: number;
  impact: "low" | "medium" | "high";
  actionable: boolean;
  relatedRecommendations: string[];
  generatedAt: string;
}

interface PredictiveModel {
  id: string;
  name: string;
  nameArabic: string;
  type:
    | "yield_prediction"
    | "price_forecast"
    | "weather_impact"
    | "disease_risk"
    | "soil_degradation";
  typeArabic: string;
  accuracy: number;
  lastTrained: string;
  dataPoints: number;
  predictions: Array<{
    timeframe: string;
    timeframeArabic: string;
    value: number;
    confidence: number;
    factors: string[];
  }>;
  status: "active" | "training" | "inactive";
  statusArabic: string;
}

interface AIAgent {
  id: string;
  name: string;
  nameArabic: string;
  specialty: string;
  specialtyArabic: string;
  avatar: string;
  description: string;
  descriptionArabic: string;
  expertise: string[];
  confidence: number;
  recommendations: number;
  successRate: number;
  isActive: boolean;
  lastActive: string;
}

// ============ MOCK DATA ============

const mockRecommendations: AIRecommendation[] = [
  {
    id: "rec-001",
    type: "crop_rotation",
    typeArabic: "دورة المحاصيل",
    priority: "high",
    priorityArabic: "عالي",
    confidence: 92,
    title: "Implement Legume Rotation in North Field",
    titleArabic: "تطبيق دورة البقوليات في الحقل الشمالي",
    description:
      "Plant nitrogen-fixing legumes to naturally improve soil fertility and reduce fertilizer costs",
    descriptionArabic:
      "زراعة البقوليات المثبتة للنيتروجين لتحسين خصوبة التربة طبيعياً وتقليل تكاليف الأسمدة",
    reasoning:
      "Analysis of soil data shows nitrogen depletion. Historical data indicates 23% yield increase with legume rotation.",
    reasoningArabic:
      "تحليل بيانات التربة يظهر نقص النيتروجين. البيانات التاريخية تشير إلى زيادة 23% في الإنتاج مع دورة البقوليات.",
    expectedBenefits: {
      yieldIncrease: 23,
      costReduction: 35,
      environmentalBenefit: 45,
      timeToImplement: 14,
      difficulty: "easy",
    },
    implementation: {
      steps: [
        {
          step: 1,
          action: "Soil testing and preparation",
          actionArabic: "فحص وتحضير التربة",
          timeframe: "Week 1",
          timeframeArabic: "ال��سبوع الأول",
          cost: 150,
          tools: ["Soil tester", "Tiller"],
        },
        {
          step: 2,
          action: "Purchase legume seeds (alfalfa recommended)",
          actionArabic: "شراء بذور البقوليات (البرسيم موصى به)",
          timeframe: "Week 1",
          timeframeArabic: "الأسبوع الأول",
          cost: 280,
        },
        {
          step: 3,
          action: "Plant legumes with proper spacing",
          actionArabic: "زراعة البقوليات بالمسافات المناسبة",
          timeframe: "Week 2",
          timeframeArabic: "الأسبوع الثاني",
          cost: 120,
        },
      ],
      totalCost: 550,
      duration: "2 weeks",
      durationArabic: "أسبوعين",
    },
    relatedFields: ["field-001"],
    season: "autumn",
    seasonArabic: "خريف",
    aiModel: "AgroGrowth-CropOptimizer-v3.2",
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    status: "new",
    statusArabic: "جد��د",
  },
  {
    id: "rec-002",
    type: "irrigation",
    typeArabic: "الري",
    priority: "medium",
    priorityArabic: "متوسط",
    confidence: 87,
    title: "Optimize Irrigation Schedule for Water Conservation",
    titleArabic: "تحسين جدول الري لتوفير المياه",
    description:
      "Adjust irrigation timing based on soil moisture sensors and weather forecasts to save 30% water",
    descriptionArabic:
      "تعديل توقيت الري بناءً على حساسات رطوبة التربة وتوقعات الطقس لتوفير 30% من المياه",
    reasoning:
      "Current irrigation schedule shows inefficiencies. Moisture data indicates overwatering during morning hours.",
    reasoningArabic:
      "جدول الري الحالي يظهر عدم كفاءة. بيانات الرطوبة تشير إلى إفراط في الري خلال ساعات الصباح.",
    expectedBenefits: {
      waterSavings: 30,
      costReduction: 18,
      timeToImplement: 7,
      difficulty: "medium",
    },
    implementation: {
      steps: [
        {
          step: 1,
          action: "Install soil moisture sensors",
          actionArabic: "تركيب حساسات رطوبة التربة",
          timeframe: "Day 1-2",
          timeframeArabic: "اليوم 1-2",
          cost: 320,
        },
        {
          step: 2,
          action: "Program irrigation controller",
          actionArabic: "برمجة جهاز تحكم الري",
          timeframe: "Day 3",
          timeframeArabic: "اليوم 3",
          cost: 0,
        },
        {
          step: 3,
          action: "Monitor and adjust for one week",
          actionArabic: "مراقبة وتعديل لمدة أسبوع",
          timeframe: "Week 1",
          timeframeArabic: "الأسبوع الأول",
          cost: 0,
        },
      ],
      totalCost: 320,
      duration: "1 week",
      durationArabic: "أسبوع واحد",
    },
    relatedFields: ["field-001", "field-002"],
    season: "any",
    seasonArabic: "أي وقت",
    aiModel: "AgroGrowth-WaterAI-v2.1",
    generatedAt: new Date(Date.now() - 7200000).toISOString(),
    status: "reviewed",
    statusArabic: "تمت المراجعة",
  },
  {
    id: "rec-003",
    type: "market_timing",
    typeArabic: "توقيت السوق",
    priority: "critical",
    priorityArabic: "حرج",
    confidence: 95,
    title: "Harvest Tomatoes Within 5 Days for Maximum Profit",
    titleArabic: "حصاد ال��ماطم خلال 5 أيام لأقصى ربح",
    description:
      "Market analysis shows peak tomato prices this week. Delay may result in 25% price drop.",
    descriptionArabic:
      "تحليل السوق يظهر ذروة أسعار الطماطم هذا الأسبوع. التأخير قد يؤدي إلى انخفاض 25% في السعر.",
    reasoning:
      "Market demand is high due to festival season. Supply from other regions is limited. Weather forecast shows good harvesting conditions.",
    reasoningArabic:
      "الطلب في السوق عالي بسبب موسم الأعياد. الإمداد من المناطق الأخرى محدود. توقعات الطقس تظهر ظروف حصاد جيدة.",
    expectedBenefits: {
      yieldIncrease: 0,
      costReduction: 0,
      timeToImplement: 2,
      difficulty: "easy",
    },
    implementation: {
      steps: [
        {
          step: 1,
          action: "Organize harvesting crew",
          actionArabic: "تنظيم فريق الحصاد",
          timeframe: "Today",
          timeframeArabic: "اليوم",
          cost: 500,
        },
        {
          step: 2,
          action: "Harvest tomatoes at optimal ripeness",
          actionArabic: "حصاد الطماطم عند النضج الأمثل",
          timeframe: "Day 1-3",
          timeframeArabic: "اليوم 1-3",
          cost: 800,
        },
        {
          step: 3,
          action: "Transport to market immediately",
          actionArabic: "نقل إلى السوق فوراً",
          timeframe: "Day 3-5",
          timeframeArabic: "اليوم 3-5",
          cost: 200,
        },
      ],
      totalCost: 1500,
      duration: "5 days",
      durationArabic: "5 أيام",
    },
    relatedFields: ["field-001"],
    season: "any",
    seasonArabic: "أي وقت",
    aiModel: "AgroGrowth-MarketPredictor-v4.0",
    generatedAt: new Date(Date.now() - 1800000).toISOString(),
    status: "new",
    statusArabic: "جديد",
  },
];

const mockInsights: AIInsight[] = [
  {
    id: "insight-001",
    category: "performance",
    categoryArabic: "أداء",
    title: "Yield Performance Above Average",
    titleArabic: "أداء الإنتاج فوق المتوسط",
    insight:
      "Your farm is performing 18% better than regional average. Soil management practices are key success factor.",
    insightArabic:
      "مزرعتك تحقق أداءً أفضل من المتوسط الإقليمي بنسبة 18%. ممارسات إدارة التربة هي عامل النجاح الرئيسي.",
    dataPoints: [
      {
        label: "Current Yield",
        labelArabic: "الإنتاج الحالي",
        value: "3.8 ton/ha",
        trend: "up",
      },
      {
        label: "Regional Average",
        labelArabic: "المتوسط ��لإقليمي",
        value: "3.2 ton/ha",
        trend: "stable",
      },
      {
        label: "Improvement",
        labelArabic: "التحسن",
        value: "+18%",
        trend: "up",
      },
    ],
    confidence: 94,
    impact: "high",
    actionable: true,
    relatedRecommendations: ["rec-001"],
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "insight-002",
    category: "risk",
    categoryArabic: "خطر",
    title: "Potential Water Stress Risk",
    titleArabic: "خطر محتمل لضغط المياه",
    insight:
      "Weather patterns suggest 40% chance of drought in next 30 days. Consider drought-resistant crop varieties.",
    insightArabic:
      "أنماط الطقس تشير إلى احتمال 40% للجفاف في الـ30 يوماً القادمة. فكر في أصناف المحاصيل المقاومة للجفاف.",
    dataPoints: [
      {
        label: "Drought Probability",
        labelArabic: "احتمال الجفاف",
        value: "40%",
        trend: "up",
      },
      {
        label: "Current Water Reserves",
        labelArabic: "احتياطي المياه الحالي",
        value: "75%",
        trend: "down",
      },
      {
        label: "Risk Level",
        labelArabic: "مستوى الخطر",
        value: "Medium",
        trend: "stable",
      },
    ],
    confidence: 78,
    impact: "medium",
    actionable: true,
    relatedRecommendations: ["rec-002"],
    generatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

const mockPredictiveModels: PredictiveModel[] = [
  {
    id: "model-001",
    name: "Tomato Yield Predictor",
    nameArabic: "متنبئ إنتاج الطماطم",
    type: "yield_prediction",
    typeArabic: "التنبؤ بالإنتاج",
    accuracy: 94.2,
    lastTrained: new Date(Date.now() - 604800000).toISOString(),
    dataPoints: 15420,
    predictions: [
      {
        timeframe: "Next Week",
        timeframeArabic: "الأسبوع القادم",
        value: 2.1,
        confidence: 96,
        factors: ["weather", "soil", "growth_stage"],
      },
      {
        timeframe: "Next Month",
        timeframeArabic: "الشهر القادم",
        value: 8.5,
        confidence: 89,
        factors: ["weather", "market", "irrigation"],
      },
      {
        timeframe: "Season End",
        timeframeArabic: "نهاية الموسم",
        value: 18.2,
        confidence: 82,
        factors: ["weather", "diseases", "nutrients"],
      },
    ],
    status: "active",
    statusArabic: "نشط",
  },
  {
    id: "model-002",
    name: "Market Price Forecaster",
    nameArabic: "متنبئ أسعار السوق",
    type: "price_forecast",
    typeArabic: "توقع الأسعار",
    accuracy: 87.8,
    lastTrained: new Date(Date.now() - 259200000).toISOString(),
    dataPoints: 8765,
    predictions: [
      {
        timeframe: "Tomorrow",
        timeframeArabic: "غداً",
        value: 1.85,
        confidence: 91,
        factors: ["demand", "supply", "transport"],
      },
      {
        timeframe: "Next Week",
        timeframeArabic: "الأسبوع القادم",
        value: 2.12,
        confidence: 84,
        factors: ["seasonal", "festivals", "competition"],
      },
      {
        timeframe: "Next Month",
        timeframeArabic: "الشهر القادم",
        value: 1.76,
        confidence: 76,
        factors: ["harvest", "export", "policy"],
      },
    ],
    status: "active",
    statusArabic: "نشط",
  },
];

const mockAgents: AIAgent[] = [
  {
    id: "agent-001",
    name: "CropBot",
    nameArabic: "بوت المحاصيل",
    specialty: "Crop Management Specialist",
    specialtyArabic: "أخصائي إدارة المحاصيل",
    avatar: "CB",
    description:
      "Expert in crop rotation, fertilization, and yield optimization",
    descriptionArabic: "خبير في دورة المحاصيل والتسميد وتحسين الإنتاج",
    expertise: ["crop_rotation", "fertilizers", "soil_health", "pest_control"],
    confidence: 94,
    recommendations: 156,
    successRate: 87,
    isActive: true,
    lastActive: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "agent-002",
    name: "WeatherWise",
    nameArabic: "خبير الطقس",
    specialty: "Weather & Climate Advisor",
    specialtyArabic: "مستشار الطقس والمناخ",
    avatar: "WW",
    description: "Provides weather-based recommendations and risk assessments",
    descriptionArabic: "يقدم توصيات مبنية على الطقس وتقييما�� المخاطر",
    expertise: [
      "weather_analysis",
      "irrigation",
      "planting_timing",
      "risk_assessment",
    ],
    confidence: 91,
    recommendations: 89,
    successRate: 92,
    isActive: true,
    lastActive: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: "agent-003",
    name: "MarketMind",
    nameArabic: "عقل السوق",
    specialty: "Market Intelligence Analyst",
    specialtyArabic: "محلل ذكاء السوق",
    avatar: "MM",
    description:
      "Analyzes market trends and provides profit optimization strategies",
    descriptionArabic: "يحلل اتجاهات السوق ويقدم استراتيجيات تحسين الربح",
    expertise: [
      "market_analysis",
      "price_prediction",
      "demand_forecasting",
      "timing_optimization",
    ],
    confidence: 88,
    recommendations: 67,
    successRate: 89,
    isActive: true,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
  },
];

// ============ MAIN COMPONENT ============

export default function AIIntelligenceDashboard() {
  const { isArabic } = useLanguage();

  // Get tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab") || "recommendations";

  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<AIRecommendation | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const { systemHealth, isServiceAvailable, getServiceError } =
    useServiceHealthChecker();

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.pushState({}, "", url.toString());
  };

  // Filter recommendations
  const filteredRecommendations = mockRecommendations.filter((rec) => {
    const priorityMatch =
      filterPriority === "all" || rec.priority === filterPriority;
    const typeMatch = filterType === "all" || rec.type === filterType;
    return priorityMatch && typeMatch;
  });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50 text-red-700";
      case "high":
        return "border-orange-500 bg-orange-50 text-orange-700";
      case "medium":
        return "border-yellow-500 bg-yellow-50 text-yellow-700";
      case "low":
        return "border-blue-500 bg-blue-50 text-blue-700";
      default:
        return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "crop_rotation":
        return <RefreshCw className="h-4 w-4" />;
      case "irrigation":
        return <Droplets className="h-4 w-4" />;
      case "fertilizer":
        return <Leaf className="h-4 w-4" />;
      case "pest_control":
        return <Shield className="h-4 w-4" />;
      case "soil_improvement":
        return <Activity className="h-4 w-4" />;
      case "market_timing":
        return <DollarSign className="h-4 w-4" />;
      case "weather_action":
        return <CloudRain className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  // Handle recommendation feedback
  const handleFeedback = (
    recId: string,
    rating: number,
    action: "accept" | "reject",
  ) => {
    console.log(`Feedback for ${recId}: ${action}, rating: ${rating}`);
    // In a real app, send feedback to backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="relative">
            <Brain className="h-16 w-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {isArabic ? "لوحة الذكاء الاصطناعي" : "AI Intelligence Dashboard"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {isArabic
                ? "توصيات ذكية مدعومة بالذكاء ا��اصطناعي لتحسين أداء مزرعتك"
                : "AI-powered smart recommendations to optimize your farm performance"}
            </p>
          </div>
        </div>
      </div>

      {/* AI Agents Status Bar */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 rtl:space-x-reverse">
            <Bot className="h-5 w-5" />
            <span>
              {isArabic
                ? "عملاء الذكاء ال��صطناعي النشطون"
                : "Active AI Agents"}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white/20 backdrop-blur rounded-lg p-4"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                  <Avatar>
                    <AvatarFallback className="bg-white/30 text-white">
                      {agent.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {isArabic ? agent.nameArabic : agent.name}
                    </h4>
                    <p className="text-sm opacity-90">
                      {isArabic ? agent.specialtyArabic : agent.specialty}
                    </p>
                  </div>
                  {agent.isActive && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{agent.confidence}%</p>
                    <p className="opacity-80">
                      {isArabic ? "ثقة" : "Confidence"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{agent.recommendations}</p>
                    <p className="opacity-80">{isArabic ? "توصيات" : "Recs"}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{agent.successRate}%</p>
                    <p className="opacity-80">
                      {isArabic ? "نجاح" : "Success"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="recommendations">
            {isArabic ? "التوصيات" : "Recommendations"}
          </TabsTrigger>
          <TabsTrigger value="insights">
            {isArabic ? "الرؤى" : "Insights"}
          </TabsTrigger>
          <TabsTrigger value="predictions">
            {isArabic ? "التنبؤات" : "Predictions"}
          </TabsTrigger>
          <TabsTrigger value="models">
            {isArabic ? "النماذج" : "Models"}
          </TabsTrigger>
          <TabsTrigger value="soil-analysis">
            {isArabic ? "تحلي�� التربة" : "Soil Analysis"}
          </TabsTrigger>
          <TabsTrigger value="crop-recommendations">
            {isArabic ? "توصيات المحاصيل" : "Crop Recs"}
          </TabsTrigger>
          <TabsTrigger value="disease-detection">
            {isArabic ? "كشف الأمراض" : "Disease Detection"}
          </TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {isArabic ? "تصفية:" : "Filter:"}
                  </span>
                </div>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">
                    {isArabic ? "جميع الأولويات" : "All Priorities"}
                  </option>
                  <option value="critical">
                    {isArabic ? "حرج" : "Critical"}
                  </option>
                  <option value="high">{isArabic ? "عالي" : "High"}</option>
                  <option value="medium">
                    {isArabic ? "متوسط" : "Medium"}
                  </option>
                  <option value="low">{isArabic ? "منخفض" : "Low"}</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">
                    {isArabic ? "جميع الأنواع" : "All Types"}
                  </option>
                  <option value="crop_rotation">
                    {isArabic ? "دورة المحاصيل" : "Crop Rotation"}
                  </option>
                  <option value="irrigation">
                    {isArabic ? "الري" : "Irrigation"}
                  </option>
                  <option value="fertilizer">
                    {isArabic ? "الأسمدة" : "Fertilizer"}
                  </option>
                  <option value="market_timing">
                    {isArabic ? "توقيت السوق" : "Market Timing"}
                  </option>
                </select>

                <Badge variant="secondary">
                  {filteredRecommendations.length}{" "}
                  {isArabic ? "توصية" : "recommendations"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRecommendations.map((recommendation) => (
              <Card
                key={recommendation.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 ${getPriorityColor(recommendation.priority).split(" ")[0]}`}
                onClick={() => setSelectedRecommendation(recommendation)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                        {getTypeIcon(recommendation.type)}
                        <Badge
                          variant={
                            getPriorityBadgeVariant(
                              recommendation.priority,
                            ) as any
                          }
                        >
                          {isArabic
                            ? recommendation.priorityArabic
                            : recommendation.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.confidence}%{" "}
                          {isArabic ? "ثقة" : "confidence"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        {isArabic
                          ? recommendation.titleArabic
                          : recommendation.title}
                      </CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    {isArabic
                      ? recommendation.descriptionArabic
                      : recommendation.description}
                  </p>

                  {/* Benefits */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {recommendation.expectedBenefits.yieldIncrease && (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>
                          +{recommendation.expectedBenefits.yieldIncrease}%{" "}
                          {isArabic ? "إنتاج" : "yield"}
                        </span>
                      </div>
                    )}
                    {recommendation.expectedBenefits.costReduction && (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        <span>
                          -{recommendation.expectedBenefits.costReduction}%{" "}
                          {isArabic ? "تكلفة" : "cost"}
                        </span>
                      </div>
                    )}
                    {recommendation.expectedBenefits.waterSavings && (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                        <Droplets className="h-4 w-4 text-cyan-500" />
                        <span>
                          -{recommendation.expectedBenefits.waterSavings}%{" "}
                          {isArabic ? "مياه" : "water"}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        {recommendation.expectedBenefits.timeToImplement}{" "}
                        {isArabic ? "أيام" : "days"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(recommendation.id, 5, "accept");
                      }}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                      {isArabic ? "قبول" : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(recommendation.id, 1, "reject");
                      }}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                      {isArabic ? "رفض" : "Reject"}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockInsights.map((insight) => (
              <Card
                key={insight.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {isArabic ? insight.categoryArabic : insight.category}
                      </Badge>
                      <CardTitle className="text-lg">
                        {isArabic ? insight.titleArabic : insight.title}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? "ثقة" : "Confidence"}
                      </p>
                      <p className="text-lg font-bold text-purple-600">
                        {insight.confidence}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {isArabic ? insight.insightArabic : insight.insight}
                  </p>

                  <div className="space-y-3">
                    {insight.dataPoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">
                          {isArabic ? point.labelArabic : point.label}
                        </span>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="font-medium">{point.value}</span>
                          {point.trend === "up" && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {point.trend === "down" && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          {point.trend === "stable" && (
                            <BarChart2 className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {insight.actionable && (
                    <div className="mt-4 pt-4 border-t">
                      <Button size="sm" className="w-full">
                        <Target className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                        {isArabic
                          ? "عرض التوصيات المرتبطة"
                          : "View Related Recommendations"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockPredictiveModels.map((model) => (
              <Card
                key={model.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {isArabic ? model.nameArabic : model.name}
                      </CardTitle>
                      <CardDescription>
                        {isArabic ? model.typeArabic : model.type}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          model.status === "active" ? "default" : "secondary"
                        }
                      >
                        {isArabic ? model.statusArabic : model.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {model.accuracy}% {isArabic ? "��قة" : "accuracy"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          {isArabic ? "آخر تدريب" : "Last Trained"}
                        </p>
                        <p className="font-medium">
                          {new Date(model.lastTrained).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {isArabic ? "نقاط البيانات" : "Data Points"}
                        </p>
                        <p className="font-medium">
                          {model.dataPoints.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">
                        {isArabic ? "التنبؤات" : "Predictions"}
                      </h4>
                      {model.predictions.map((prediction, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {isArabic
                                ? prediction.timeframeArabic
                                : prediction.timeframe}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {prediction.confidence}%{" "}
                              {isArabic ? "ثقة" : "confidence"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">
                              {model.type === "yield_prediction"
                                ? `${prediction.value} ${isArabic ? "طن" : "tons"}`
                                : model.type === "price_forecast"
                                  ? `$${prediction.value}`
                                  : `${prediction.value}${isArabic ? "°م" : "°C"}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Progress value={model.accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {isArabic ? "دقة النمو��ج" : "Model Accuracy"}:{" "}
                      {model.accuracy}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Cpu className="h-5 w-5" />
                <span>
                  {isArabic ? "نماذج الذكاء الاصطناعي" : "AI Models Status"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "CropOptimizer v3.2",
                    nameArabic: "محسن المحاصيل ع3.2",
                    type: "Crop Management",
                    typeArabic: "إدارة المحاصيل",
                    status: "active",
                    accuracy: 94.2,
                    performance: 87,
                  },
                  {
                    name: "WeatherPredictor v2.1",
                    nameArabic: "متنبئ الطقس ع2.1",
                    type: "Weather Analysis",
                    typeArabic: "تحليل الطقس",
                    status: "active",
                    accuracy: 91.8,
                    performance: 92,
                  },
                  {
                    name: "MarketAnalyzer v4.0",
                    nameArabic: "محلل السوق ع4.0",
                    type: "Market Intelligence",
                    typeArabic: "ذكاء السوق",
                    status: "training",
                    accuracy: 88.5,
                    performance: 89,
                  },
                  {
                    name: "SoilHealthAI v1.5",
                    nameArabic: "ذكاء صحة التربة ع1.5",
                    type: "Soil Analysis",
                    typeArabic: "تحليل التربة",
                    status: "active",
                    accuracy: 96.1,
                    performance: 94,
                  },
                  {
                    name: "DiseaseDetector v2.3",
                    nameArabic: "كاشف الأمراض ع2.3",
                    type: "Disease Detection",
                    typeArabic: "كشف الأمراض",
                    status: "active",
                    accuracy: 95.7,
                    performance: 91,
                  },
                  {
                    name: "YieldPredictor v3.1",
                    nameArabic: "متنبئ ال��نتاج ع3.1",
                    type: "Yield Forecasting",
                    typeArabic: "توقع الإنتاج",
                    status: "active",
                    accuracy: 92.3,
                    performance: 88,
                  },
                ].map((model, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Cpu className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-sm">
                            {isArabic ? model.nameArabic : model.name}
                          </span>
                        </div>
                        <Badge
                          variant={
                            model.status === "active"
                              ? "default"
                              : model.status === "training"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {model.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">
                        {isArabic ? model.typeArabic : model.type}
                      </p>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{isArabic ? "الدقة" : "Accuracy"}</span>
                            <span>{model.accuracy}%</span>
                          </div>
                          <Progress value={model.accuracy} className="h-1.5" />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{isArabic ? "الأداء" : "Performance"}</span>
                            <span>{model.performance}%</span>
                          </div>
                          <Progress
                            value={model.performance}
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soil Analysis Tab */}
        <TabsContent value="soil-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Leaf className="h-5 w-5" />
                <span>
                  {isArabic ? "تحليل ا��تربة الذكي" : "Smart Soil Analysis"}
                </span>
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "تحليل شا��ل لخصائص التربة وتوصيات المحاصيل المناسبة"
                  : "Comprehensive soil analysis and suitable crop recommendations"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  {isArabic
                    ? "حالة خدمة تحليل التربة:"
                    : "Soil Analysis Service Status:"}{" "}
                  <Badge
                    variant={
                      isServiceAvailable("soil-analysis")
                        ? "default"
                        : "destructive"
                    }
                  >
                    {isServiceAvailable("soil-analysis")
                      ? isArabic
                        ? "متاح"
                        : "Available"
                      : isArabic
                        ? "غير متاح"
                        : "Unavailable"}
                  </Badge>
                  {!isServiceAvailable("soil-analysis") &&
                    getServiceError("soil-analysis") && (
                      <div className="text-xs text-red-600 mt-1">
                        {getServiceError("soil-analysis")}
                      </div>
                    )}
                </AlertDescription>
              </Alert>
              <SmartSoilAnalysis />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crop Recommendations Tab */}
        <TabsContent value="crop-recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Sprout className="h-5 w-5" />
                <span>
                  {isArabic
                    ? "التوصيات الذكية للمحاصيل"
                    : "Smart Crop Recommendations"}
                </span>
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "توصيات مخصصة للمحاصيل وتحليل الربحية بالذكاء الاصطناعي"
                  : "AI-powered personalized crop recommendations and profitability analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  {isArabic
                    ? "حالة خدمة توصيات المحاصيل:"
                    : "Crop Recommendation Service Status:"}{" "}
                  <Badge
                    variant={
                      isServiceAvailable("crop-recommendation")
                        ? "default"
                        : "destructive"
                    }
                  >
                    {isServiceAvailable("crop-recommendation")
                      ? isArabic
                        ? "متاح"
                        : "Available"
                      : isArabic
                        ? "غير متاح"
                        : "Unavailable"}
                  </Badge>
                  {!isServiceAvailable("crop-recommendation") &&
                    getServiceError("crop-recommendation") && (
                      <div className="text-xs text-red-600 mt-1">
                        {getServiceError("crop-recommendation")}
                      </div>
                    )}
                </AlertDescription>
              </Alert>
              <SmartCropRecommendations />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disease Detection Tab */}
        <TabsContent value="disease-detection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Bug className="h-5 w-5" />
                <span>
                  {isArabic
                    ? "تشخيص أمراض النباتات"
                    : "Plant Disease Detection"}
                </span>
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "تشخيص دقيق لأمراض النباتات وتحليل صحة الأوراق بالذكاء الاصطناعي"
                  : "AI-powered plant disease diagnosis and leaf health analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  {isArabic
                    ? "حالة خدمة تشخيص الأمراض:"
                    : "Disease Detection Service Status:"}{" "}
                  <Badge
                    variant={
                      isServiceAvailable("plant-disease-detection")
                        ? "default"
                        : "destructive"
                    }
                  >
                    {isServiceAvailable("plant-disease-detection")
                      ? isArabic
                        ? "متاح"
                        : "Available"
                      : isArabic
                        ? "غير متاح"
                        : "Unavailable"}
                  </Badge>
                  {!isServiceAvailable("plant-disease-detection") &&
                    getServiceError("plant-disease-detection") && (
                      <div className="text-xs text-red-600 mt-1">
                        {getServiceError("plant-disease-detection")}
                      </div>
                    )}
                </AlertDescription>
              </Alert>
              <PlantDiseaseDetection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Recommendation Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
                    {getTypeIcon(selectedRecommendation.type)}
                    <Badge
                      variant={
                        getPriorityBadgeVariant(
                          selectedRecommendation.priority,
                        ) as any
                      }
                    >
                      {isArabic
                        ? selectedRecommendation.priorityArabic
                        : selectedRecommendation.priority}
                    </Badge>
                    <Badge variant="outline">
                      {selectedRecommendation.confidence}%{" "}
                      {isArabic ? "ثقة" : "confidence"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">
                    {isArabic
                      ? selectedRecommendation.titleArabic
                      : selectedRecommendation.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {isArabic
                      ? selectedRecommendation.descriptionArabic
                      : selectedRecommendation.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecommendation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Reasoning */}
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2 rtl:space-x-reverse">
                  <Brain className="h-4 w-4" />
                  <span>
                    {isArabic ? "منطق الذكاء الاصطنا��ي" : "AI Reasoning"}
                  </span>
                </h4>
                <p className="text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  {isArabic
                    ? selectedRecommendation.reasoningArabic
                    : selectedRecommendation.reasoning}
                </p>
              </div>

              {/* Expected Benefits */}
              <div>
                <h4 className="font-medium mb-3">
                  {isArabic ? "الفوائد المتوقعة" : "Expected Benefits"}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedRecommendation.expectedBenefits.yieldIncrease && (
                    <div className="text-center p-3 border rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-lg font-bold text-green-600">
                        +{selectedRecommendation.expectedBenefits.yieldIncrease}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? "زيادة الإنتاج" : "Yield Increase"}
                      </p>
                    </div>
                  )}
                  {selectedRecommendation.expectedBenefits.costReduction && (
                    <div className="text-center p-3 border rounded-lg">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-lg font-bold text-blue-600">
                        -{selectedRecommendation.expectedBenefits.costReduction}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? "تقليل التكلفة" : "Cost Reduction"}
                      </p>
                    </div>
                  )}
                  {selectedRecommendation.expectedBenefits.waterSavings && (
                    <div className="text-center p-3 border rounded-lg">
                      <Droplets className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                      <p className="text-lg font-bold text-cyan-600">
                        -{selectedRecommendation.expectedBenefits.waterSavings}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isArabic ? "توفير المياه" : "Water Savings"}
                      </p>
                    </div>
                  )}
                  <div className="text-center p-3 border rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                    <p className="text-lg font-bold text-gray-600">
                      {selectedRecommendation.expectedBenefits.timeToImplement}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "أيام للتطبيق" : "Days to Implement"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Implementation Steps */}
              <div>
                <h4 className="font-medium mb-3">
                  {isArabic ? "خطوات التطبيق" : "Implementation Steps"}
                </h4>
                <div className="space-y-3">
                  {selectedRecommendation.implementation.steps.map(
                    (step, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 rtl:space-x-reverse p-3 border rounded-lg"
                      >
                        <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {isArabic ? step.actionArabic : step.action}
                          </p>
                          <div className="flex items-center space-x-4 rtl:space-x-reverse mt-1 text-sm text-muted-foreground">
                            <span>
                              ⏱️{" "}
                              {isArabic ? step.timeframeArabic : step.timeframe}
                            </span>
                            {step.cost && <span>💰 ${step.cost}</span>}
                          </div>
                          {step.tools && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {step.tools.map((tool, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {isArabic ? "التكلفة الإجمالية:" : "Total Cost:"}
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      ${selectedRecommendation.implementation.totalCost}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">
                      {isArabic ? "المدة الإجمالية:" : "Total Duration:"}
                    </span>
                    <span className="text-sm">
                      {isArabic
                        ? selectedRecommendation.implementation.durationArabic
                        : selectedRecommendation.implementation.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 rtl:space-x-reverse pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRecommendation(null)}
                >
                  {isArabic ? "إغلاق" : "Close"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleFeedback(selectedRecommendation.id, 1, "reject")
                  }
                >
                  <ThumbsDown className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? "رفض" : "Reject"}
                </Button>
                <Button
                  onClick={() =>
                    handleFeedback(selectedRecommendation.id, 5, "accept")
                  }
                >
                  <ThumbsUp className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? "قبول وتطبيق" : "Accept & Implement"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
