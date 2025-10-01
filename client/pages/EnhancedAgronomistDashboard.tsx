import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageCircle,
  Calendar,
  MapPin,
  Leaf,
  Activity,
  Target,
  Zap,
  RefreshCw,
  Search,
  Plus,
  Settings,
  Bell,
  Sun,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Lightbulb,
  Smartphone,
  Wifi,
  WifiOff,
  Star,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Filter,
  Download,
  Share,
  MoreVertical,
  Home,
  Cpu,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
  Heart,
  Shield,
} from "lucide-react";

interface EnhancedAgronomistDashboardProps {
  expertId?: string;
  onFarmSelect?: (farmId: string) => void;
  onCreateRecommendation?: (farmId: string, recommendation: any) => void;
  onScheduleTraining?: (trainingData: any) => void;
}

interface SmartAlert {
  id: string;
  type: "urgent" | "warning" | "info" | "success";
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  action?: string;
  actionArabic?: string;
  timestamp: string;
  farmId?: string;
  dismissible: boolean;
}

interface QuickAction {
  id: string;
  icon: any;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  color: string;
  action: () => void;
}

interface WeatherInsight {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  uvIndex: number;
  recommendation: string;
  recommendationArabic: string;
  alert?: string;
  alertArabic?: string;
}

interface CropPerformanceMetric {
  cropType: string;
  cropTypeArabic: string;
  healthScore: number;
  yieldProjection: number;
  riskLevel: "low" | "medium" | "high";
  trend: "up" | "down" | "stable";
  area: number;
}

interface MarketInsight {
  cropName: string;
  cropNameArabic: string;
  currentPrice: number;
  priceChange: number;
  marketTrend: "bullish" | "bearish" | "stable";
  recommendation: string;
  recommendationArabic: string;
}

const EnhancedAgronomistDashboard: React.FC<
  EnhancedAgronomistDashboardProps
> = ({
  expertId = "expert_001",
  onFarmSelect,
  onCreateRecommendation,
  onScheduleTraining,
}) => {
  const { isArabic } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedView, setSelectedView] = useState("overview");
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [weatherInsights, setWeatherInsights] = useState<WeatherInsight | null>(
    null,
  );
  const [cropPerformance, setCropPerformance] = useState<
    CropPerformanceMetric[]
  >([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "online" | "offline"
  >("online");
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Mock data initialization
  useEffect(() => {
    initializeMockData();
    // Simulate network status
    const interval = setInterval(() => {
      setConnectionStatus(Math.random() > 0.1 ? "online" : "offline");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeMockData = () => {
    // Smart Alerts
    setSmartAlerts([
      {
        id: "1",
        type: "urgent",
        title: "Disease Detection Alert",
        titleArabic: "تنبيه اكتشاف مرض",
        message:
          "Wheat plantation in Farm A3 shows signs of rust disease. Immediate action required.",
        messageArabic:
          "زراعة القمح في المزرعة أ3 تظهر علامات مرض الصدأ. مطلوب إجراء فوري.",
        action: "Review & Treat",
        actionArabic: "مراجعة وعلاج",
        timestamp: new Date().toISOString(),
        farmId: "farm_a3",
        dismissible: false,
      },
      {
        id: "2",
        type: "warning",
        title: "Weather Warning",
        titleArabic: "تحذير جوي",
        message:
          "High temperature forecast (42°C) for next 3 days. Irrigation adjustments recommended.",
        messageArabic:
          "توقع درجة حرارة عالية (42°م) للأيام الثلاثة القادمة. يُنصح بتعديل الري.",
        action: "Adjust Irrigation",
        actionArabic: "تعديل الري",
        timestamp: new Date().toISOString(),
        dismissible: true,
      },
      {
        id: "3",
        type: "info",
        title: "Optimal Planting Window",
        titleArabic: "نافذة زراعة مثلى",
        message:
          "Conditions are optimal for tomato planting in the next 5 days.",
        messageArabic: "الظروف مثالية لزراعة الطماطم في الأيام الخمسة القادمة.",
        action: "Schedule Planting",
        actionArabic: "جدولة الزراعة",
        timestamp: new Date().toISOString(),
        dismissible: true,
      },
    ]);

    // Weather Insights
    setWeatherInsights({
      location: "تونس العاصمة",
      temperature: 28,
      humidity: 65,
      rainfall: 0,
      windSpeed: 12,
      uvIndex: 7,
      recommendation:
        "Good conditions for field work. Recommend early morning irrigation.",
      recommendationArabic:
        "ظروف جيدة للعمل الحقلي. يُنصح بالري في الصباح الباكر.",
      alert:
        "UV levels are high. Ensure protective measures for field workers.",
      alertArabic:
        "مستويات الأشعة فوق البنفسجية عالية. تأكد من اتخاذ تدابير الحماية للعمال.",
    });

    // Crop Performance
    setCropPerformance([
      {
        cropType: "wheat",
        cropTypeArabic: "القمح",
        healthScore: 85,
        yieldProjection: 4200,
        riskLevel: "low",
        trend: "up",
        area: 25.5,
      },
      {
        cropType: "tomato",
        cropTypeArabic: "الطماطم",
        healthScore: 92,
        yieldProjection: 45000,
        riskLevel: "low",
        trend: "stable",
        area: 12.3,
      },
      {
        cropType: "olive",
        cropTypeArabic: "الزيتون",
        healthScore: 78,
        yieldProjection: 3800,
        riskLevel: "medium",
        trend: "down",
        area: 18.7,
      },
    ]);

    // Market Insights
    setMarketInsights([
      {
        cropName: "Wheat",
        cropNameArabic: "القمح",
        currentPrice: 2.45,
        priceChange: 0.15,
        marketTrend: "bullish",
        recommendation: "Hold production, prices trending upward",
        recommendationArabic: "الاحتفاظ بالإنتاج، الأسعار في اتجاه صاعد",
      },
      {
        cropName: "Tomato",
        cropNameArabic: "الطماطم",
        currentPrice: 3.2,
        priceChange: -0.25,
        marketTrend: "bearish",
        recommendation: "Consider early harvest or value-added processing",
        recommendationArabic:
          "النظر في الحصاد المبكر أو المعالجة ذات القيمة المضافة",
      },
    ]);
  };

  const quickActions: QuickAction[] = [
    {
      id: "emergency_consultation",
      icon: AlertTriangle,
      title: "Emergency Consultation",
      titleArabic: "استشارة طارئة",
      description: "Urgent farmer assistance",
      descriptionArabic: "مساعدة الفلاح العاجلة",
      color: "bg-red-500 hover:bg-red-600",
      action: () => {},
    },
    {
      id: "new_recommendation",
      icon: Lightbulb,
      title: "Create Recommendation",
      titleArabic: "إنشاء توصية",
      description: "Personalized farming advice",
      descriptionArabic: "نصائح زراعية مخصصة",
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => {},
    },
    {
      id: "schedule_visit",
      icon: Calendar,
      title: "Schedule Field Visit",
      titleArabic: "جدولة زيارة حقلية",
      description: "Plan farm inspection",
      descriptionArabic: "التخطيط لتفقد المزرعة",
      color: "bg-green-500 hover:bg-green-600",
      action: () => {},
    },
    {
      id: "training_session",
      icon: Users,
      title: "Schedule Training",
      titleArabic: "جدولة تدريب",
      description: "Farmer education program",
      descriptionArabic: "برنامج تعليم الفلاحين",
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => {},
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
      case "warning":
        return "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20";
      case "success":
        return "border-l-green-500 bg-green-50 dark:bg-green-900/20";
      default:
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-green-600 bg-green-100";
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 ${isArabic ? "rtl" : "ltr"}`}
    >
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-green-200/50 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-xl font-bold text-gray-900"
                    style={{ fontFamily: "Cairo, sans-serif" }}
                  >
                    {isArabic ? "خبير زراعي" : "Agro Expert"}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {isArabic
                      ? "نظام إدارة المزارع الذكي"
                      : "Smart Farm Management System"}
                  </p>
                </div>
              </div>
            </div>

            {/* Center Section - Smart Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={
                    isArabic
                      ? "البحث الذكي في المزارع والمحاصيل..."
                      : "Smart search farms, crops, alerts..."
                  }
                  className="pl-10 bg-white/50 backdrop-blur-sm border-green-200 focus:border-green-400 rounded-xl"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {connectionStatus === "online" ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {isArabic ? "متصل" : "Online"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {isArabic ? "غير متصل" : "Offline"}
                    </span>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {smartAlerts.filter((alert) => !alert.dismissible).length >
                  0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-5 w-5" />
              </Button>

              {/* Profile */}
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-expert.jpg" />
                <AvatarFallback className="bg-green-100 text-green-800">
                  {isArabic ? "خ" : "E"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Enhanced Smart Assistant Sidebar */}
        <aside
          className={`${sidebarCollapsed ? "w-16" : "w-80"} bg-white/80 backdrop-blur-xl border-r border-green-200/50 transition-all duration-300 shadow-lg`}
        >
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="p-4 space-y-6">
              {/* Smart Alerts Section */}
              {!sidebarCollapsed && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>{isArabic ? "تنبيهات ذكية" : "Smart Alerts"}</span>
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {smartAlerts.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {smartAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border-l-4 ${getAlertBorderColor(alert.type)} transition-all hover:shadow-md cursor-pointer`}
                      >
                        <div className="flex items-start space-x-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {isArabic ? alert.titleArabic : alert.title}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {isArabic ? alert.messageArabic : alert.message}
                            </p>
                            {alert.action && (
                              <Button size="sm" className="mt-2 h-6 text-xs">
                                {isArabic ? alert.actionArabic : alert.action}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weather Insights */}
              {!sidebarCollapsed && weatherInsights && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-orange-500" />
                    <span>{isArabic ? "حالة الطقس" : "Weather Insights"}</span>
                  </h3>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {weatherInsights.location}
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {weatherInsights.temperature}°C
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span>{weatherInsights.humidity}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Wind className="h-3 w-3 text-gray-500" />
                        <span>{weatherInsights.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CloudRain className="h-3 w-3 text-indigo-500" />
                        <span>{weatherInsights.rainfall} mm</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Sun className="h-3 w-3 text-yellow-500" />
                        <span>
                          {isArabic ? "مؤشر" : "UV"} {weatherInsights.uvIndex}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-blue-700 bg-blue-100 rounded-lg p-2">
                      {isArabic
                        ? weatherInsights.recommendationArabic
                        : weatherInsights.recommendation}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  {!sidebarCollapsed && (
                    <span>{isArabic ? "إجراءات سريعة" : "Quick Actions"}</span>
                  )}
                </h3>

                <div
                  className={`grid ${sidebarCollapsed ? "grid-cols-1" : "grid-cols-2"} gap-2`}
                >
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      className={`${sidebarCollapsed ? "h-12 w-12 p-0" : "h-auto p-3"} ${action.color} text-white hover:opacity-90 transition-all`}
                      onClick={action.action}
                    >
                      {sidebarCollapsed ? (
                        <action.icon className="h-5 w-5" />
                      ) : (
                        <div className="flex flex-col items-center space-y-1">
                          <action.icon className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {isArabic ? action.titleArabic : action.title}
                          </span>
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Active Farms */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        {isArabic ? "المزارع النشطة" : "Active Farms"}
                      </p>
                      <p className="text-3xl font-bold mt-1">24</p>
                      <div className="flex items-center mt-2 text-sm">
                        <ArrowUp className="h-4 w-4 mr-1" />
                        <span>
                          +12% {isArabic ? "هذا الشهر" : "this month"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Home className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Critical Alerts */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">
                        {isArabic ? "تنبيهات حرجة" : "Critical Alerts"}
                      </p>
                      <p className="text-3xl font-bold mt-1">3</p>
                      <div className="flex items-center mt-2 text-sm">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span>
                          {isArabic
                            ? "تحتاج انتباه فوري"
                            : "Need immediate attention"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">
                        {isArabic ? "معدل النجاح" : "Success Rate"}
                      </p>
                      <p className="text-3xl font-bold mt-1">94.2%</p>
                      <div className="flex items-center mt-2 text-sm">
                        <Star className="h-4 w-4 mr-1" />
                        <span>
                          {isArabic ? "أداء ممتاز" : "Excellent performance"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        {isArabic ? "رؤى الذكاء الاصطناعي" : "AI Insights"}
                      </p>
                      <p className="text-3xl font-bold mt-1">127</p>
                      <div className="flex items-center mt-2 text-sm">
                        <Cpu className="h-4 w-4 mr-1" />
                        <span>
                          {isArabic ? "توصيات نشطة" : "Active recommendations"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Cpu className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Crop Performance Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Crop Performance Overview */}
              <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span>
                        {isArabic ? "أداء المحاصيل" : "Crop Performance"}
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {isArabic ? "تصدير" : "Export"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cropPerformance.map((crop, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-full">
                              <Leaf className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {isArabic ? crop.cropTypeArabic : crop.cropType}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {crop.area} {isArabic ? "هكتار" : "hectares"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(crop.trend)}
                            <Badge className={getRiskColor(crop.riskLevel)}>
                              {crop.riskLevel}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              {isArabic ? "صحة المحصول" : "Health Score"}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Progress
                                value={crop.healthScore}
                                className="flex-1 h-2"
                              />
                              <span className="text-sm font-medium">
                                {crop.healthScore}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {isArabic ? "توقع المردودية" : "Yield Projection"}
                            </p>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              {crop.yieldProjection.toLocaleString()}{" "}
                              {isArabic ? "كغ/هكتا��" : "kg/ha"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Insights */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>{isArabic ? "رؤى السوق" : "Market Insights"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketInsights.map((market, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">
                            {isArabic ? market.cropNameArabic : market.cropName}
                          </h4>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-lg">
                              {market.currentPrice} TND
                            </span>
                            <span
                              className={`text-sm ${market.priceChange >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {market.priceChange >= 0 ? "+" : ""}
                              {market.priceChange}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-700">
                          {isArabic
                            ? market.recommendationArabic
                            : market.recommendation}
                        </p>
                      </div>
                    ))}

                    <Button className="w-full mt-4" variant="outline">
                      <Globe className="h-4 w-4 mr-2" />
                      {isArabic
                        ? "عرض تحليل السوق الكامل"
                        : "View Full Market Analysis"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200/50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {isArabic ? "آخر تحديث" : "Last updated"}:{" "}
                      {lastSync.toLocaleTimeString()}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Smartphone className="h-4 w-4" />
                    <span>{isArabic ? "محسن للهاتف" : "Mobile optimized"}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>{isArabic ? "آمن" : "Secure"}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLastSync(new Date())}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {isArabic ? "تحديث" : "Refresh"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedAgronomistDashboard;
