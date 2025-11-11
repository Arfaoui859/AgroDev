import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useServiceHealthChecker } from "@/hooks/useServiceHealthChecker";
import { useToast } from "@/hooks/use-toast";
import {
  Leaf,
  Brain,
  MapPin,
  Camera,
  DollarSign,
  Droplets,
  CloudRain,
  Users,
  Calculator,
  Trophy,
  Briefcase,
  BarChart3,
  Bell,
  TrendingUp,
  Activity,
  Target,
  Shield,
  Home,
  PlusCircle,
  BarChart2,
  LineChart,
  Calendar,
  Lightbulb,
  RefreshCw,
  ArrowRight,
  Play,
  Sparkles,
  Eye,
  Settings,
  Database,
  Thermometer,
  Wind,
  Sun,
  Umbrella,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

// ============ TYPES & INTERFACES ============

interface DashboardCard {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge?: string;
  isNew?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  icon: React.ElementType;
  href: string;
  color: string;
  category: string;
  categoryArabic: string;
}

interface SystemAlert {
  id: string;
  type: "weather" | "soil" | "crop" | "market" | "system";
  typeArabic: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  timestamp: string;
  actionRequired: boolean;
  href?: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  conditionArabic: string;
  forecast: Array<{
    day: string;
    dayArabic: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }>;
}

interface FarmOverview {
  totalFields: number;
  activeFields: number;
  totalArea: number;
  currentCrops: number;
  soilHealthAvg: number;
  yieldTrend: "up" | "down" | "stable";
  profitMargin: number;
  waterEfficiency: number;
}

// ============ DASHBOARD CARDS CONFIGURATION ============

const dashboardCards: DashboardCard[] = [
  {
    id: "field-management",
    title: "Field Management",
    titleArabic: "إدارة الحقول",
    description: "Complete farm and field management with AI insights",
    descriptionArabic: "إدارة شاملة للمزرعة والحقول مع رؤى الذكاء الاصطناعي",
    icon: Home,
    href: "/field-management",
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
    badge: "NEW 4.x",
    isNew: true,
  },
  {
    id: "soil-analysis",
    title: "Smart Soil Analysis",
    titleArabic: "تحليل التربة الذكي",
    description: "AI-powered soil analysis with instant recommendations",
    descriptionArabic: "تحلل التربة بالذكاء الاصطناعي مع توصيات فورية",
    icon: Activity,
    href: "/enhanced-analysis",
    color: "bg-gradient-to-br from-blue-500 to-cyan-600",
  },
  {
    id: "crop-management",
    title: "Crop Intelligence",
    titleArabic: "ذكاء المحاصيل",
    description: "Smart crop recommendations and rotation planning",
    descriptionArabic: "توصيا المحاصيل الذكية وتخطيط الدورة الزراعية",
    icon: Leaf,
    href: "/smart-crop-suggestions",
    color: "bg-gradient-to-br from-emerald-500 to-green-600",
  },
  {
    id: "disease-detection",
    title: "Disease Detection",
    titleArabic: "كشف الأمراض",
    description: "AI-powered plant disease detection and treatment",
    descriptionArabic: "كشف أمراض النباتات بالذكاء الاصطناعي والعلاج",
    icon: Camera,
    href: "/disease-upload",
    color: "bg-gradient-to-br from-red-500 to-pink-600",
  },
  {
    id: "market-intelligence",
    title: "Market Intelligence",
    titleArabic: "ذكاء السوق",
    description: "Real-time market prices and forecasting",
    descriptionArabic: "أسعار السوق الفوري والتنبؤات",
    icon: DollarSign,
    href: "/market-dashboard",
    color: "bg-gradient-to-br from-yellow-500 to-orange-600",
  },
  {
    id: "water-management",
    title: "Smart Irrigation",
    titleArabic: "الري الذكي",
    description: "Intelligent water management and conservation",
    descriptionArabic: "إدارة الميه الذكية والحفاظ عليه",
    icon: Droplets,
    href: "/smart-irrigation",
    color: "bg-gradient-to-br from-cyan-500 to-blue-600",
    badge: "AI",
  },
  {
    id: "weather-monitoring",
    title: "Weather Intelligence",
    titleArabic: "ذكاء الطقس",
    description: "Advanced weather monitoring and crop planning",
    descriptionArabic: "مراقبة الطقس المتقدمة وتخطيط المحصيل",
    icon: CloudRain,
    href: "/weather-crop-planner",
    color: "bg-gradient-to-br from-indigo-500 to-purple-600",
  },
  {
    id: "livestock-management",
    title: "Livestock Management",
    titleArabic: "إدارة الثروة الحيوانة",
    description: "Complete livestock health and breeding management",
    descriptionArabic: "إدارة شاملة لصحة وتربية الثروة الحيوانية",
    icon: Users,
    href: "/advanced-livestock",
    color: "bg-gradient-to-br from-amber-500 to-orange-600",
    badge: "Pro",
  },
  {
    id: "financial-management",
    title: "Financial Analytics",
    titleArabic: "التحليلات المالية",
    description: "Comprehensive financial tracking and analysis",
    descriptionArabic: "تتبع وتحليل مالي شامل",
    icon: Calculator,
    href: "/financial-dashboard",
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  {
    id: "gamification",
    title: "Achievements & Rewards",
    titleArabic: "الإنجازات والحوافز",
    description: "Track your progress, earn badges, and compete with others",
    descriptionArabic: "تتبع تقدمك، اكسب الشارات، وتنافس مع الآخرن",
    icon: Trophy,
    href: "/gamification",
    color: "bg-gradient-to-br from-purple-500 to-pink-600",
    badge: "🎮",
  },
  {
    id: "investor-dashboard",
    title: "Investment Opportunities",
    titleArabic: "الفرص الاستثمارية",
    description:
      "Discover smart agricultural investments and track your portfolio",
    descriptionArabic: "اكتشف الاستثمارات الزراعية الذكية وتتبع محفظتك",
    icon: Briefcase,
    href: "/investor-dashboard",
    color: "bg-gradient-to-br from-indigo-500 to-blue-600",
    badge: "💼",
  },
  {
    id: "public-data",
    title: "Public Agricultural Data",
    titleArabic: "البيانات الزراعية العامة",
    description:
      "Access real-time market prices, production data, and weather information",
    descriptionArabic: "الوصول إلى أسعار السوق المبشرة وبيانات الإنتاج والقس",
    icon: BarChart3,
    href: "/public-data",
    color: "bg-gradient-to-br from-cyan-500 to-teal-600",
    badge: "📊",
  },
  {
    id: "farmer-collaboration",
    title: "Farmer Collaboration Hub",
    titleArabic: "مركز التعاون الزراعي",
    description:
      "Connect with experts, share experiences, and get consultations",
    descriptionArabic: "تواصل مع الخباء، شارك التجارب، واحصل على الاستشارات",
    icon: Users,
    href: "/farmer-collaboration",
    color: "bg-gradient-to-br from-rose-500 to-pink-600",
    badge: "👥",
  },
  {
    id: "farmer-segmentation",
    title: "AI Farmer Segmentation",
    titleArabic: "تصنيف الفلاحين الذكي",
    description:
      "AI-powered farmer classification and insights for better targeting",
    descriptionArabic: "تصنيف المزارعين بالذكاء الاصطناعي ورى لاست����اف أفضل",
    icon: Brain,
    href: "/farmer-segmentation",
    color: "bg-gradient-to-br from-violet-500 to-purple-600",
    badge: "🧩",
  },
  {
    id: "enhanced-market",
    title: "Enhanced Market Dashboard",
    titleArabic: "لوحة السوق المتقدمة",
    description: "Advanced market analytics with real-time charts and insights",
    descriptionArabic:
      "تحليلات السوق المتقدمة مع الرسوم البيانية المباشرة والرؤى",
    icon: Activity,
    href: "/enhanced-market",
    color: "bg-gradient-to-br from-emerald-500 to-green-600",
    badge: "",
  },
  {
    id: "market-analysis-advanced",
    title: "Market Intelligence",
    titleArabic: "استخبارات السوق",
    description:
      "Deep market analysis, global trends, and investment opportunities",
    descriptionArabic:
      "تحلل عميق للسوق، الاتجاهات العالمية، والفرص الاستثمارية",
    icon: Target,
    href: "/market-intelligence",
    color: "bg-gradient-to-br from-amber-500 to-orange-600",
    badge: "🎯",
  },
  {
    id: "irrigation-optimization",
    title: "Smart Irrigation Optimizer",
    titleArabic: "محسن الري الذكي",
    description: "AI-powered irrigation scheduling and water management",
    descriptionArabic: "جدولة لري الذكي وإدارة المياه بالذكاء الاصناعي",
    icon: Activity,
    href: "/irrigation-optimization",
    color: "bg-gradient-to-br from-blue-500 to-cyan-600",
    badge: "💧",
  },
  {
    id: "pest-control",
    title: "Pest Control Advisor",
    titleArabic: "مستشار مكافحة الآفات",
    description: "Smart pest identification and treatment recommendations",
    descriptionArabic: "تحديد الآفات الذكي وتوصيات العلاج",
    icon: Activity,
    href: "/pest-control",
    color: "bg-gradient-to-br from-red-500 to-pink-600",
    badge: "🛡️",
  },
  {
    id: "weather-yield-planner",
    title: "Weather & Yield Planner",
    titleArabic: "مخطط الطقس والمرددية",
    description: "Climate-based crop planning and yield prediction",
    descriptionArabic: "تخطيط المحاصيل حسب المناخ وتوقع المردودية",
    icon: Activity,
    href: "/weather-yield-planner",
    color: "bg-gradient-to-br from-purple-500 to-indigo-600",
    badge: "⛅",
  },
  {
    id: "enhanced-agronomist",
    title: "Enhanced Expert Dashboard",
    titleArabic: "لوحة الخبير المطورة",
    description:
      "Ultra-modern agronomist dashboard with AI insights and smart recommendations",
    descriptionArabic:
      "لوحة تحكم لخبير الزراعي المطورة مع رؤى الذكاء الاصطناعي والتوصيات الذكية",
    icon: Activity,
    href: "/enhanced-agronomist",
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    badge: "🎯",
    isNew: true,
  },
];

const quickActions: QuickAction[] = [
  {
    id: "add-field",
    title: "Add New Field",
    titleArabic: "إضافة حقل جديد",
    description: "Set up a new field with GPS coordinates",
    descriptionArabic: "إعداد حقل جديد بإحداثيات GPS",
    icon: PlusCircle,
    href: "/field-management",
    color: "text-green-600",
    category: "Field Management",
    categoryArabic: "إدرة الحقول",
  },
  {
    id: "soil-test",
    title: "Quick Soil Test",
    titleArabic: "فحص سريع للتربة",
    description: "Upload soil data for instant analysis",
    descriptionArabic: "رفع بيانات التربة للتحليل الفوري",
    icon: Activity,
    href: "/enhanced-analysis",
    color: "text-blue-600",
    category: "Soil Analysis",
    categoryArabic: "تحليل التربة",
  },
  {
    id: "crop-recommendation",
    title: "Get Crop Suggestions",
    titleArabic: "احصل على اقتراحات المحاصيل",
    description: "AI recommendations for your field",
    descriptionArabic: "توصيات الذكاء الاصطناعي لحقلك",
    icon: Lightbulb,
    href: "/smart-crop-suggestions",
    color: "text-emerald-600",
    category: "Crop Management",
    categoryArabic: "إدارة المحاصيل",
  },
  {
    id: "disease-scan",
    title: "Scan for Diseases",
    titleArabic: "حص الأمراض",
    description: "Take a photo to detect plant diseases",
    descriptionArabic: "التقط صورة لاكتشاف أمراض النباتات",
    icon: Camera,
    href: "/disease-upload",
    color: "text-red-600",
    category: "Disease Detection",
    categoryArabic: "كشف الأمراض",
  },
  {
    id: "market-check",
    title: "Check Market Prices",
    titleArabic: "تحقق من أسعار السوق",
    description: "Latest market prices and trends",
    descriptionArabic: "أحدث أسعار السوق والاتجاهات",
    icon: DollarSign,
    href: "/market-dashboard",
    color: "text-yellow-600",
    category: "Market Intelligence",
    categoryArabic: "ذكاء السوق",
  },
  {
    id: "irrigation-schedule",
    title: "Schedule Irrigation",
    titleArabic: "جدولة الري",
    description: "Set up smart irrigation timers",
    descriptionArabic: "إعداد مؤقتات الري الذكية",
    icon: Droplets,
    href: "/irrigation-scheduler",
    color: "text-cyan-600",
    category: "Water Management",
    categoryArabic: "إدارة المياه",
  },
];

// ============ MAIN COMPONENT ============

export default function Index() {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { systemHealth, isServiceAvailable } = useServiceHealthChecker();

  // Robust fetch wrapper to handle external script interference
  const robustFetch = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    // Check if this is a relative URL and convert to absolute
    const resolvedUrl = url.startsWith("/")
      ? `${window.location.origin}${url}`
      : url;

    // Try native fetch first
    try {
      const controller = new AbortController();
      const timeoutMs = 15000; // shorter timeout to fail fast during development
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await window.fetch(resolvedUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response) {
        throw new Error(`Empty response for ${resolvedUrl}`);
      }

      return response;
    } catch (error) {
      console.warn(
        "Native fetch failed for",
        resolvedUrl,
        "attempting fallback:",
        error,
      );

      // If native fetch fails due to external script interference, try XMLHttpRequest
      if (error instanceof TypeError || error instanceof DOMException) {
        console.warn("Using XMLHttpRequest fallback due to fetch interference");

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const method = options.method || "GET";

          try {
            xhr.open(method, resolvedUrl);

            // Set headers
            if (options.headers) {
              try {
                const headersObj = options.headers as
                  | Record<string, string>
                  | Headers;
                if (headersObj instanceof Headers) {
                  headersObj.forEach((value, key) =>
                    xhr.setRequestHeader(key, value),
                  );
                } else {
                  Object.entries(headersObj).forEach(([key, value]) => {
                    xhr.setRequestHeader(key, value as string);
                  });
                }
              } catch (hdrErr) {
                console.warn("Failed to set XHR headers", hdrErr);
              }
            }

            xhr.onload = () => {
              try {
                const responseHeaders: Record<string, string> = {};
                const headerString = xhr.getAllResponseHeaders();
                headerString.split("\r\n").forEach((line) => {
                  const [key, value] = line.split(": ");
                  if (key && value) responseHeaders[key] = value;
                });

                const response = new Response(xhr.responseText, {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  headers: new Headers(responseHeaders),
                });
                resolve(response);
              } catch (responseError) {
                reject(
                  new Error(`Failed to create response: ${responseError}`),
                );
              }
            };

            xhr.onerror = () =>
              reject(new Error("XMLHttpRequest network error"));
            xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
            xhr.timeout = 30000;

            if (options.body) {
              xhr.send(options.body as BodyInit);
            } else {
              xhr.send();
            }
          } catch (xhrError) {
            reject(new Error(`Failed to setup XMLHttpRequest: ${xhrError}`));
          }
        });
      }

      // Re-throw the original error if it's not a fetch interference issue
      throw error;
    }
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [farmOverview, setFarmOverview] = useState<FarmOverview | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [aiServicesStatus, setAiServicesStatus] = useState<string>("checking");

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Check AI services health from system health
        try {
          if (systemHealth) {
            setAiServicesStatus(systemHealth.overall || "unavailable");
          } else {
            setAiServicesStatus("checking");
          }
        } catch (error) {
          console.error("Failed to check AI services health:", error);
          // Provide a more helpful error message
          if (
            error instanceof Error &&
            error.message.includes("Network connection failed")
          ) {
            console.warn("External scripts may be interfering with API calls");
          }
          setAiServicesStatus("unavailable");
        }

        // Fetch farm overview data
        const farmResponse = await robustFetch("/api/farm-management/overview");
        if (farmResponse.ok) {
          const farmData = await farmResponse.json();
          setFarmOverview(farmData);
        }

        // Fetch weather data
        const weatherResponse = await robustFetch(
          "/api/weather/coordinates?lat=36.8065&lon=10.1815",
        ); // Tunis coordinates
        if (weatherResponse.ok) {
          const weather = await weatherResponse.json();
          setWeatherData({
            temperature: weather.current?.temperature || 24,
            humidity: weather.current?.humidity || 65,
            windSpeed: weather.current?.wind_speed || 12,
            precipitation: weather.current?.precipitation || 0,
            condition: weather.current?.condition || "Partly Cloudy",
            conditionArabic: weather.current?.condition_ar || "غائم جزئياً",
            forecast:
              weather.forecast?.daily && Array.isArray(weather.forecast.daily)
                ? weather.forecast.daily
                    .slice(0, 5)
                    .map((day: any, index: number) => ({
                      day:
                        index === 0
                          ? "Today"
                          : index === 1
                            ? "Tomorrow"
                            : day.date,
                      dayArabic:
                        index === 0 ? "اليوم" : index === 1 ? "غداً" : day.date,
                      high: day.maxTemp || 25,
                      low: day.minTemp || 18,
                      condition: day.description || "Sunny",
                      precipitation: day.rainfall || 0,
                    }))
                : [],
          });
        }

        // Fetch notifications for alerts
        const alertsResponse = await robustFetch(
          "/api/notifications?status=unread&limit=3",
        );
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          const alerts: SystemAlert[] =
            alertsData.notifications?.map((notif: any) => ({
              id: notif.id,
              type: notif.type || "system",
              typeArabic: notif.type_ar || "نظام",
              severity: notif.severity || "medium",
              title: notif.title,
              titleArabic: notif.title_ar || notif.title,
              message: notif.message,
              messageArabic: notif.message_ar || notif.message,
              timestamp: notif.created_at,
              actionRequired: notif.action_required || false,
              href: notif.action_url,
            })) || [];
          setSystemAlerts(alerts);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);

        // Provide specific error handling for fetch interference
        let errorMessage = isArabic
          ? "تعذر تحميل بيانات لوحة التحكم"
          : "Could not load dashboard data";

        if (
          error instanceof Error &&
          error.message.includes("Failed to fetch")
        ) {
          errorMessage = isArabic
            ? "مشكلة في الاتصال بالشبكة. يرجى تحديث الصفحة أو المحاولة لاحقاً"
            : "Network connection issue. Please refresh the page or try again later";
        }

        toast({
          title: isArabic ? "خطأ في تحميل البيانات" : "Failed to load data",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [systemHealth, isArabic, toast]);

  // Get severity color for alerts
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart2 className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case "rainy":
        return <Umbrella className="h-6 w-6 text-blue-500" />;
      case "cloudy":
        return <CloudRain className="h-6 w-6 text-gray-500" />;
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="text-lg">
            {isArabic ? "جار تحميل لوحة التحكم..." : "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-6 pr-24 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="relative">
            <div className="flex flex-col items-center gap-3">
              <Logo size={140} className="mx-auto" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent mb-4">
                {isArabic ? "أجرو جروث" : "AgroGrowth"}
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {isArabic
                ? "منصة الزراعة الذكية المدعومة بالذكاء الاصطناعي لإدارة المزارع الحديثة"
                : "AI-Powered Smart Agriculture Platform for Modern Farm Management"}
            </p>
          </div>
        </div>

        {/* AI Services Status */}
        <div className="max-w-md mx-auto">
          <Alert
            className={`${aiServicesStatus === "available" ? "border-green-500 bg-green-50" : "border-yellow-500 bg-yellow-50"}`}
          >
            <Activity className="h-4 w-4" />
            <AlertDescription>
              {isArabic
                ? "حالة خدمات الذكاء لاصطناعي: "
                : "AI Services Status: "}
              <Badge
                variant={
                  aiServicesStatus === "available" ? "default" : "secondary"
                }
              >
                {aiServicesStatus === "available"
                  ? isArabic
                    ? "متاح"
                    : "Available"
                  : isArabic
                    ? "غير متاح"
                    : "Unavailable"}
              </Badge>
            </AlertDescription>
          </Alert>
        </div>

        {/* Live Stats Bar */}
        {farmOverview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-green-600">
                {farmOverview.totalFields}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? "إجمالي الحقول" : "Total Fields"}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-blue-600">
                {farmOverview.totalArea} {isArabic ? "هكتار" : "ha"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? "المساحة الكلية" : "Total Area"}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-emerald-600">
                {farmOverview.soilHealthAvg}%
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? "صحة التربة" : "Soil Health"}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-yellow-600">
                {farmOverview.profitMargin}%
              </p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? "هامش الربح" : "Profit Margin"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
              <Bell className="h-5 w-5 text-orange-500" />
              <span>{isArabic ? "التنبيهات النشطة" : "Active Alerts"}</span>
              <Badge variant="secondary">{systemAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.slice(0, 3).map((alert) => (
                <Alert
                  key={alert.id}
                  className={getSeverityColor(alert.severity)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                        <Badge
                          variant={
                            alert.severity === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {isArabic ? alert.typeArabic : alert.type}
                        </span>
                      </div>
                      <h4 className="font-medium">
                        {isArabic ? alert.titleArabic : alert.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isArabic ? alert.messageArabic : alert.message}
                      </p>
                    </div>
                    {alert.href && (
                      <Button size="sm" asChild>
                        <Link to={alert.href}>
                          <Eye className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
                          {isArabic ? "عرض" : "View"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            {isArabic ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="soil-input">
            {isArabic ? "إدخال بيانات التبة" : "Soil Data Entry"}
          </TabsTrigger>
          <TabsTrigger value="features">
            {isArabic ? "الميزات" : "Features"}
          </TabsTrigger>
          <TabsTrigger value="weather">
            {isArabic ? "الطقس" : "Weather"}
          </TabsTrigger>
          <TabsTrigger value="actions">
            {isArabic ? "إجراءات سريعة" : "Quick Actions"}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Farm Overview Card */}
            {farmOverview && (
              <Card className="lg:col-span-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2 rtl:space-x-reverse">
                    <Home className="h-6 w-6" />
                    <span>
                      {isArabic ? "نظرة عامة على المزرعة" : "Farm Overview"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {farmOverview.activeFields}
                      </p>
                      <p className="text-sm opacity-90">
                        {isArabic ? "حقول نشطة" : "Active Fields"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {farmOverview.currentCrops}
                      </p>
                      <p className="text-sm opacity-90">
                        {isArabic ? "ماصيل حالية" : "Current Crops"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {farmOverview.waterEfficiency}%
                      </p>
                      <p className="text-sm opacity-90">
                        {isArabic ? "كفاءة المياه" : "Water Efficiency"}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                        <p className="text-3xl font-bold">
                          {farmOverview.profitMargin}%
                        </p>
                        {getTrendIcon(farmOverview.yieldTrend)}
                      </div>
                      <p className="text-sm opacity-90">
                        {isArabic ? "اتجاه الربحية" : "Profitability"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm opacity-90">
                        {isArabic ? "صحة التربة العامة" : "Overall Soil Health"}
                      </span>
                      <span className="font-medium">
                        {farmOverview.soilHealthAvg}%
                      </span>
                    </div>
                    <Progress
                      value={farmOverview.soilHealthAvg}
                      className="mt-2 h-3 bg-white/20"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Card */}
            {weatherData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <CloudRain className="h-5 w-5" />
                    <span>{isArabic ? "الطقس الحلي" : "Current Weather"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse">
                      {getWeatherIcon(weatherData.condition)}
                      <div>
                        <p className="text-3xl font-bold">
                          {weatherData.temperature}°C
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isArabic
                            ? weatherData.conditionArabic
                            : weatherData.condition}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span>
                          {weatherData.humidity}%{" "}
                          {isArabic ? "رطوبة" : "Humidity"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Wind className="h-4 w-4 text-gray-500" />
                        <span>
                          {weatherData.windSpeed} {isArabic ? "كم/س" : "km/h"}
                        </span>
                      </div>
                    </div>

                    <Button asChild className="w-full">
                      <Link to="/weather-crop-planner">
                        <CloudRain className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {isArabic ? "تخطيط الطقس" : "Weather Planning"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((card) => (
              <Card
                key={card.id}
                className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
                onClick={() => navigate(card.href)}
              >
                <div className={`h-2 ${card.color}`}></div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div
                        className={`p-3 rounded-lg ${card.color} text-white`}
                      >
                        <card.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {isArabic ? card.titleArabic : card.title}
                        </CardTitle>
                        {card.badge && (
                          <Badge
                            variant={card.isNew ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {card.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    {isArabic ? card.descriptionArabic : card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-6">
          {weatherData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Weather */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Thermometer className="h-5 w-5" />
                    <span>
                      {isArabic ? "الطقس التفصيلي" : "Detailed Weather"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Thermometer className="h-8 w-8 mx-auto mb-2 text-red-500" />
                      <p className="text-2xl font-bold">
                        {weatherData.temperature}°C
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? "درج الحرارة" : "Temperature"}
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">
                        {weatherData.humidity}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? "الرطوبة" : "Humidity"}
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Wind className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-2xl font-bold">
                        {weatherData.windSpeed}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? "الرياح كم/س" : "Wind km/h"}
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Umbrella className="h-8 w-8 mx-auto mb-2 text-indigo-500" />
                      <p className="text-2xl font-bold">
                        {weatherData.precipitation}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? "احتمال المطر" : "Rain Chance"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 5-Day Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Calendar className="h-5 w-5" />
                    <span>{isArabic ? "توقعات 5 أيام" : "5-Day Forecast"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weatherData.forecast.map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          {getWeatherIcon(day.condition)}
                          <div>
                            <p className="font-medium">
                              {isArabic ? day.dayArabic : day.day}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {day.condition}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {day.high}°/{day.low}°
                          </p>
                          <p className="text-xs text-blue-500">
                            {day.precipitation}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => navigate(action.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 rtl:space-x-reverse">
                    <div
                      className={`p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors`}
                    >
                      <action.icon
                        className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        {isArabic ? action.titleArabic : action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {isArabic
                          ? action.descriptionArabic
                          : action.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {isArabic ? action.categoryArabic : action.category}
                      </Badge>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Featured Actions */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-white" />
              <h2 className="text-2xl font-bold mb-2">
                {isArabic
                  ? "ابدأ مع نظام إدارة الحقول لجديد"
                  : "Get Started with New Field Management"}
              </h2>
              <p className="mb-6 opacity-90">
                {isArabic
                  ? "نظام شامل لإدارة المزارع والحقول مع الذكاء الاصطاعي والخرائط الفاعلية"
                  : "Comprehensive farm and field management with AI insights and interactive maps"}
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/field-management">
                  <Play className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {isArabic ? "اسكشف الآن" : "Explore Now"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soil Data Input Tab */}
        <TabsContent value="soil-input" className="space-y-6">
          <SoilDataInputForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Soil Data Input Form Component
function SoilDataInputForm() {
  const { isArabic } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isServiceAvailable, getServiceError } = useServiceHealthChecker();

  const [formData, setFormData] = useState({
    location: "",
    area: "",
    cropType: "",
    ph: "",
    moisture: "",
    organicMatter: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    conductivity: "",
    temperature: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.location || !formData.cropType || !formData.ph) {
      toast({
        title: isArabic ? "حقول مطلوبة فرغة" : "Missing Required Fields",
        description: isArabic
          ? "يرجى ملء الحقول المطلوبة"
          : "Please fill required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare soil sensor data for AI analysis
      const sensorData = {
        ph: parseFloat(formData.ph) || 7.0,
        nitrogen: parseFloat(formData.nitrogen) || 0,
        phosphorus: parseFloat(formData.phosphorus) || 0,
        potassium: parseFloat(formData.potassium) || 0,
        organic_matter: parseFloat(formData.organicMatter) || 0,
        moisture: parseFloat(formData.moisture) || 0,
        salinity: parseFloat(formData.conductivity) || 0,
        temperature: parseFloat(formData.temperature) || 25,
      };

      // Check if soil analysis service is available
      if (!isServiceAvailable("soil-analysis")) {
        throw new Error(
          `خدمة تحليل التربة غير متاحة: ${getServiceError("soil-analysis") || "الخدمة غير متصلة"}`,
        );
      }

      // For now, just store the sensor data without AI analysis
      // Real AI analysis will be done in the enhanced analysis page
      const analysisResult = {
        message: "البيانات محفوظة، سيتم التحليل في الصفحة المتقدمة",
        sensorData: sensorData,
      };

      // Save to localStorage for the analysis page
      const soilAnalysisData = {
        id: `soil-${Date.now()}`,
        ...formData,
        sensorData,
        analysisResult,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("currentAnalysis", JSON.stringify(soilAnalysisData));

      toast({
        title: isArabic ? "تم التحليل بنجاح" : "Analysis Complete",
        description: isArabic
          ? "تم حفظ نتائج التحليل"
          : "Analysis results saved successfully",
      });

      // Navigate to enhanced analysis page
      navigate("/enhanced-analysis");
    } catch (error) {
      console.error("Soil analysis submission failed:", error);

      // Check if it's a service unavailability error
      const isServiceUnavailable =
        error instanceof Error &&
        (error.message.includes("Service temporarily unavailable") ||
          error.message.includes("503") ||
          error.message.includes("502"));

      // Still save form data even if AI analysis fails
      const soilData = {
        id: `soil-${Date.now()}`,
        ...formData,
        sensorData,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("currentAnalysis", JSON.stringify(soilData));

      if (isServiceUnavailable) {
        toast({
          title: isArabic ? "تم حفظ البيانات" : "Data Saved",
          description: isArabic
            ? "سيتم إنشاء تحليل تقديري - التحديث عند توفر الخدمة"
            : "Mock analysis will be generated - Updates when service available",
        });
      } else {
        toast({
          title: isArabic ? "تم حفظ البيانات" : "Data Saved",
          description: isArabic
            ? "تم حفظ البيانات، جاري الانتقال للتحليل"
            : "Data saved, proceeding to analysis",
        });
      }

      navigate("/enhanced-analysis");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
          <Database className="h-5 w-5" />
          <span>{isArabic ? "إدخال يانات التربة" : "Soil Data Entry"}</span>
        </CardTitle>
        <CardDescription>
          {isArabic
            ? "أدخل بيانات عينة التربة للحصول على تحليل مفصل"
            : "Enter soil sample data for detailed analysis"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "موقع الحقل *" : "Field Location *"}
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder={
                  isArabic
                    ? "مثال: حقل القمح الشمالي"
                    : "e.g., North Wheat Field"
                }
                className="w-full p-3 border rounded-md"
                dir={isArabic ? "rtl" : "ltr"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "المساحة" : "Area"}
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => handleInputChange("area", e.target.value)}
                placeholder={isArabic ? "ثال: 5 هكتار" : "e.g., 5 hectares"}
                className="w-full p-3 border rounded-md"
                dir={isArabic ? "rtl" : "ltr"}
              />
            </div>
          </div>

          {/* Crop Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isArabic ? "نوع المحصول *" : "Crop Type *"}
            </label>
            <select
              required
              value={formData.cropType}
              onChange={(e) => handleInputChange("cropType", e.target.value)}
              className="w-full p-3 border rounded-md"
            >
              <option value="">
                {isArabic ? "اختر نوع المحصول" : "Select Crop Type"}
              </option>
              <option value="wheat">{isArabic ? "قمح" : "Wheat"}</option>
              <option value="rice">{isArabic ? "أرز" : "Rice"}</option>
              <option value="tomato">{isArabic ? "طماطم" : "Tomato"}</option>
              <option value="vegetables">
                {isArabic ? "خضروات" : "Vegetables"}
              </option>
              <option value="fruits">{isArabic ? "فواكه" : "Fruits"}</option>
              <option value="olives">{isArabic ? "زيتون" : "Olives"}</option>
              <option value="citrus">{isArabic ? "حمضيات" : "Citrus"}</option>
            </select>
          </div>

          {/* Soil Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "درجة الحموضة (pH) *" : "pH Level *"}
              </label>
              <input
                type="number"
                required
                step="0.1"
                min="0"
                max="14"
                value={formData.ph}
                onChange={(e) => handleInputChange("ph", e.target.value)}
                placeholder="7.0"
                className="w-full p-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "الرطوبة (%)" : "Moisture (%)"}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.moisture}
                onChange={(e) => handleInputChange("moisture", e.target.value)}
                placeholder="45"
                className="w-full p-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "المادة العضوية (%)" : "Organic Matter (%)"}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.organicMatter}
                onChange={(e) =>
                  handleInputChange("organicMatter", e.target.value)
                }
                placeholder="3.5"
                className="w-full p-3 border rounded-md"
              />
            </div>
          </div>

          {/* Nutrients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "النتروجين (ppm)" : "Nitrogen (ppm)"}
              </label>
              <input
                type="number"
                min="0"
                value={formData.nitrogen}
                onChange={(e) => handleInputChange("nitrogen", e.target.value)}
                placeholder="120"
                className="w-full p-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "الفوسفور (ppm)" : "Phosphorus (ppm)"}
              </label>
              <input
                type="number"
                min="0"
                value={formData.phosphorus}
                onChange={(e) =>
                  handleInputChange("phosphorus", e.target.value)
                }
                placeholder="85"
                className="w-full p-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "البوتاسيوم (ppm)" : "Potassium (ppm)"}
              </label>
              <input
                type="number"
                min="0"
                value={formData.potassium}
                onChange={(e) => handleInputChange("potassium", e.target.value)}
                placeholder="200"
                className="w-full p-3 border rounded-md"
              />
            </div>
          </div>

          {/* Additional Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic
                  ? "التوصيل الكهربائي (dS/m)"
                  : "Electrical Conductivity (dS/m)"}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.conductivity}
                onChange={(e) =>
                  handleInputChange("conductivity", e.target.value)
                }
                placeholder="1.2"
                className="w-full p-3 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? "درجة الحرارة (°C)" : "Temperature (°C)"}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) =>
                  handleInputChange("temperature", e.target.value)
                }
                placeholder="22"
                className="w-full p-3 border rounded-md"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isArabic ? "م��احظات إضافية" : "Additional Notes"}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder={
                isArabic
                  ? "ي ملاحظات أو معلومات إضافية..."
                  : "Any additional notes or information..."
              }
              rows={3}
              className="w-full p-3 border rounded-md"
              dir={isArabic ? "rtl" : "ltr"}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {isArabic ? "جاري التحليل..." : "Analyzing..."}
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {isArabic ? "تحليل التربة" : "Analyze Soil"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
