import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import QuickActionPanel from "@/components/QuickActionPanel";
import CommunicationHub from "@/components/CommunicationHub";
import ComprehensiveOverviewCards from "@/components/ComprehensiveOverviewCards";
import ServiceStatusBanner from "@/components/ServiceStatusBanner";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Droplets,
  Thermometer,
  Activity,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Bell,
  MapPin,
  Leaf,
  Zap,
  DollarSign,
  Target,
  Calendar,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";

interface SoilData {
  ph: number;
  moisture: number;
  temperature: number;
  nutrients: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  lastUpdated: string;
}

interface CropData {
  id: string;
  name: string;
  nameArabic: string;
  variety: string;
  plantingDate: string;
  growthStage: string;
  growthStageArabic: string;
  progress: number;
  health: "excellent" | "good" | "fair" | "poor";
  alerts: Array<{
    type: "disease" | "watering" | "fertilizer" | "harvest";
    message: string;
    messageArabic: string;
    priority: "low" | "medium" | "high" | "critical";
    actionRequired: boolean;
  }>;
  expectedHarvest: string;
  area: number;
}

interface TaskData {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  type:
    | "watering"
    | "fertilizer"
    | "pruning"
    | "harvest"
    | "planting"
    | "pest_control";
  cropId?: string;
  status: "pending" | "in_progress" | "completed" | "delayed";
  estimatedDuration: number;
  requiredMaterials?: string[];
}

interface AlertData {
  id: string;
  type: "weather" | "disease" | "irrigation" | "pest" | "soil" | "market";
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  priority: "low" | "medium" | "high" | "critical";
  timestamp: string;
  actionable: boolean;
  actionText?: string;
  actionTextArabic?: string;
  resolved: boolean;
}

interface MarketPrice {
  crop: string;
  cropArabic: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  unit: string;
  lastUpdated: string;
  marketTrend: "rising" | "falling" | "stable";
}

interface IoTSensorData {
  sensorId: string;
  type: "soil_moisture" | "temperature" | "humidity" | "ph" | "light";
  value: number;
  unit: string;
  location: string;
  status: "online" | "offline" | "warning";
  lastReading: string;
}

interface ExpertCommunication {
  id: string;
  expertName: string;
  expertType: "agronomist" | "veterinarian" | "economist" | "technician";
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: "online" | "offline" | "busy";
}

interface FinancialSummary {
  totalInvestment: number;
  currentExpenses: number;
  expectedRevenue: number;
  profitMargin: number;
  seasonalROI: number;
}

interface DashboardData {
  soil: SoilData;
  crops: CropData[];
  tasks: TaskData[];
  alerts: AlertData[];
  marketPrices: MarketPrice[];
  iotSensors: IoTSensorData[];
  experts: ExpertCommunication[];
  financialSummary: FinancialSummary;
  lastUpdated: string;
}

const FarmerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const { isArabic, toggleLanguage } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/farmer-dashboard/overview");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const result = await response.json();
      setDashboardData(result.data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      const response = await fetch(
        `/api/farmer-dashboard/tasks/${taskId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: action }),
        },
      );

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleAlertResolve = async (alertId: string) => {
    try {
      const response = await fetch(
        `/api/farmer-dashboard/alerts/${alertId}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resolution_note: "Resolved by farmer" }),
        },
      );

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white";
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1)
      return isArabic ? "منذ أقل من ساعة" : "Less than an hour ago";
    if (diffInHours === 1) return isArabic ? "منذ ساعة واحدة" : "1 hour ago";
    if (diffInHours < 24)
      return isArabic ? `منذ ${diffInHours} ساعات` : `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return isArabic ? "منذ يوم واحد" : "1 day ago";
    return isArabic ? `��نذ ${diffInDays} أيام` : `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">
            {isArabic ? "جاري التحميل..." : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{isArabic ? "خطأ" : "Error"}</AlertTitle>
          <AlertDescription>
            {error ||
              (isArabic
                ? "فشل في تحميل البيانات"
                : "Failed to load dashboard data")}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          {isArabic ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    );
  }

  const {
    soil,
    crops,
    tasks,
    alerts,
    marketPrices,
    iotSensors,
    experts,
    financialSummary,
  } = dashboardData;

  return (
    <div
      className={`container mx-auto p-6 space-y-6 ${isArabic ? "rtl" : "ltr"}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-3xl font-bold text-green-800"
            style={{ fontFamily: "Cairo, sans-serif" }}
          >
            {isArabic ? "لوحة تحكم الفلاح" : "Farmer Dashboard"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic
              ? "عرض شامل لحالة المزرعة"
              : "Comprehensive farm status overview"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={toggleLanguage}
            className="text-sm"
          >
            {isArabic ? "English" : "العربية"}
          </Button>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {isArabic ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Service Status Banner */}
      <ServiceStatusBanner />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isArabic ? "المحاصيل النشطة" : "Active Crops"}
                </p>
                <p className="text-2xl font-bold">{crops.length}</p>
              </div>
              <Leaf className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isArabic ? "المهام المعلقة" : "Pending Tasks"}
                </p>
                <p className="text-2xl font-bold">
                  {tasks.filter((t) => t.status === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isArabic ? "التنبيهات النشطة" : "Active Alerts"}
                </p>
                <p className="text-2xl font-bold">
                  {alerts.filter((a) => !a.resolved).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isArabic ? "هامش الربح" : "Profit Margin"}
                </p>
                <p className="text-2xl font-bold">
                  {financialSummary.profitMargin.toFixed(1)}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            {isArabic ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="quick-actions">
            {isArabic ? "إجراءات سريعة" : "Quick Actions"}
          </TabsTrigger>
          <TabsTrigger value="crops">
            {isArabic ? "المحاصيل" : "Crops"}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            {isArabic ? "المهام" : "Tasks"}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            {isArabic ? "التنبيهات" : "Alerts"}
          </TabsTrigger>
          <TabsTrigger value="communication">
            {isArabic ? "التواصل" : "Communication"}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <ComprehensiveOverviewCards
            isArabic={isArabic}
            onCardClick={(cardType, action) => {
              console.log("Card clicked:", cardType, action);
              // Here you can implement navigation to specific sections
              // For example, switch to the corresponding tab
              switch (cardType) {
                case "crops":
                  // Could navigate to crops management page
                  break;
                case "livestock":
                  // Could navigate to livestock page
                  break;
                case "financial":
                  // Could navigate to financial dashboard
                  break;
                case "offline":
                  navigate("/offline-manager");
                  break;
                default:
                  break;
              }
            }}
          />
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" className="space-y-4">
          <QuickActionPanel
            isArabic={isArabic}
            onActionExecute={(actionId, data) => {
              console.log("Executing action:", actionId, data);
              // Here you can implement the actual action execution logic
              // For example, calling specific APIs based on the action type
            }}
          />
        </TabsContent>

        {/* Crops Tab */}
        <TabsContent value="crops" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop) => (
              <Card key={crop.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{isArabic ? crop.nameArabic : crop.name}</span>
                    <Badge className={getHealthColor(crop.health)}>
                      {crop.health}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {crop.variety} • {crop.area}{" "}
                    {isArabic ? "هكتار" : "hectares"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">
                        {isArabic ? crop.growthStageArabic : crop.growthStage}
                      </span>
                      <span className="text-sm">{crop.progress}%</span>
                    </div>
                    <Progress value={crop.progress} />
                  </div>
                  {crop.alerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {isArabic ? "التنبيهات" : "Alerts"}
                      </p>
                      {crop.alerts.map((alert, index) => (
                        <Alert key={index} className="py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {isArabic ? alert.messageArabic : alert.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-600">
                    <p>
                      {isArabic ? "تاريخ الزراعة" : "Planted"}:{" "}
                      {new Date(crop.plantingDate).toLocaleDateString()}
                    </p>
                    <p>
                      {isArabic ? "الحصاد المتوقع" : "Expected harvest"}:{" "}
                      {new Date(crop.expectedHarvest).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">
                          {isArabic ? task.titleArabic : task.title}
                        </h3>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {isArabic ? task.descriptionArabic : task.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {task.estimatedDuration}{" "}
                            {isArabic ? "دقيقة" : "min"}
                          </span>
                        </span>
                      </div>
                      {task.requiredMaterials && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">
                            {isArabic
                              ? "المواد المطلوبة"
                              : "Required materials"}
                            :
                          </p>
                          <p className="text-xs">
                            {task.requiredMaterials.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {task.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleTaskAction(task.id, "in_progress")
                          }
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {isArabic ? "بدء" : "Start"}
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTaskAction(task.id, "pending")}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            {isArabic ? "إيق��ف" : "Pause"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleTaskAction(task.id, "completed")
                            }
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {isArabic ? "إنهاء" : "Complete"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts
              .filter((alert) => !alert.resolved)
              .map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <h3 className="font-semibold">
                            {isArabic ? alert.titleArabic : alert.title}
                          </h3>
                          <Badge className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {isArabic ? alert.messageArabic : alert.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(alert.timestamp)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {alert.actionable && alert.actionText && (
                          <Button size="sm" variant="outline">
                            {isArabic
                              ? alert.actionTextArabic
                              : alert.actionText}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAlertResolve(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {isArabic ? "حل" : "Resolve"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          <CommunicationHub
            isArabic={isArabic}
            onStartConsultation={(expertId, consultationType) => {
              console.log(
                "Starting consultation with expert:",
                expertId,
                consultationType,
              );
              // Here you can implement the actual consultation logic
            }}
            onInitiateTrade={(traderId, tradeType) => {
              console.log("Initiating trade with trader:", traderId, tradeType);
              // Here you can implement the actual trade logic
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        {isArabic ? "آخر تحديث" : "Last updated"}:{" "}
        {new Date(dashboardData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default FarmerDashboard;
