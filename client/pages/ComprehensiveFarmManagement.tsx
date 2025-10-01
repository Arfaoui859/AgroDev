import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Thermometer,
  Droplets,
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Package,
  Wrench,
  CloudRain,
  Sun,
  Wind,
  Eye,
  Calendar,
  Star,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Timer,
  Bell,
  Gauge,
  Truck,
  Fuel,
  Battery,
  Shield,
  Award,
  AlertCircle,
  CheckSquare,
  XCircle,
  Play,
  Pause,
  Phone,
  Mail,
  Navigation,
  Compass,
  Leaf,
  Sprout,
  TreePine,
  Camera,
  FileText,
  Calculator,
  Briefcase,
  Building,
  Home,
  Tractor,
  Wheat,
} from "lucide-react";

interface ComprehensiveFarmManagementProps {
  farmId?: string;
  onTaskUpdate?: (taskId: string, status: string) => void;
  onAlertResolve?: (alertId: string) => void;
  onEquipmentMaintenance?: (equipmentId: string) => void;
}

const ComprehensiveFarmManagement: React.FC<
  ComprehensiveFarmManagementProps
> = ({
  farmId = "farm_001",
  onTaskUpdate,
  onAlertResolve,
  onEquipmentMaintenance,
}) => {
  const { isArabic, toggleLanguage } = useLanguage();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 60000); // تحديث كل دقيقة
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/farm-management/overview");
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      // في التطبيق الحقيقي، سيتم إرسال طلب API
      setDashboardData((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((task: any) =>
          task.id === taskId ? { ...task, status: newStatus } : task,
        ),
      }));

      if (onTaskUpdate) {
        onTaskUpdate(taskId, newStatus);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleAlertResolve = async (alertId: string) => {
    try {
      setDashboardData((prev: any) => ({
        ...prev,
        alerts: prev.alerts.map((alert: any) =>
          alert.id === alertId ? { ...alert, resolved: true } : alert,
        ),
      }));

      if (onAlertResolve) {
        onAlertResolve(alertId);
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount);
  };

  const formatTemperature = (temp: number) => {
    return `${temp}°C`;
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case "cloudy":
        return <CloudRain className="h-6 w-6 text-gray-500" />;
      case "rainy":
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">
            {isArabic ? "جاري تحميل بيانات المزرعة..." : "Loading farm data..."}
          </span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{isArabic ? "خطأ" : "Error"}</AlertTitle>
          <AlertDescription>
            {isArabic
              ? "فشل في تحميل بيانات المزرعة"
              : "Failed to load farm data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div
      className={`container mx-auto p-4 space-y-6 ${isArabic ? "rtl" : "ltr"}`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-green-800"
            style={{ fontFamily: "Cairo, sans-serif" }}
          >
            {isArabic
              ? "لوحة إدارة المزر��ة الشاملة"
              : "Comprehensive Farm Management"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isArabic
              ? "نظرة شاملة على جميع عمليات المزرعة في الوقت الحقيقي"
              : "Real-time overview of all farm operations"}
          </p>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            variant="outline"
            onClick={toggleLanguage}
            className="text-sm"
          >
            {isArabic ? "English" : "العربية"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50" : ""}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isArabic
              ? autoRefresh
                ? "التحديث التلقائي"
                : "تحديث يدوي"
              : autoRefresh
                ? "Auto Refresh"
                : "Manual"}
          </Button>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {isArabic ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {(dashboardData.alerts || []).some(
        (alert: any) => alert.severity === "critical" && !alert.resolved,
      ) && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2 animate-pulse" />
              {isArabic
                ? "تنبيهات حرجة تتطلب انتباهاً فورياً"
                : "Critical Alerts Require Immediate Attention"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(dashboardData.alerts || [])
                .filter(
                  (alert: any) =>
                    alert.severity === "critical" && !alert.resolved,
                )
                .slice(0, 3)
                .map((alert: any) => (
                  <Alert key={alert.id} className="border-red-300 bg-red-100">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{isArabic ? alert.titleArabic : alert.title}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        {isArabic ? "عرض" : "View"}
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "الحقول" : "Fields"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.summary?.totalFields || 0}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "المحاصيل النشطة" : "Active Crops"}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.summary?.activeCrops || 0}
                </p>
              </div>
              <Sprout className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "المهام المعلقة" : "Pending Tasks"}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData.summary?.pendingTasks || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "تنبيهات حرجة" : "Critical Alerts"}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.summary?.criticalAlerts || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "المعدات التشغيلية" : "Equipment"}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.summary?.operationalEquipment || 0}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "العمال الحاضرون" : "Workers"}
                </p>
                <p className="text-2xl font-bold text-teal-600">
                  {dashboardData.summary?.workersPresent || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "إيرادات ال��وم" : "Today Revenue"}
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(dashboardData.summary?.todayRevenue || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">
                  {isArabic ? "الطقس" : "Weather"}
                </p>
                <p className="text-sm font-bold text-blue-600">
                  {formatTemperature(
                    dashboardData.weather?.current?.temperature || 0,
                  )}
                </p>
              </div>
              {getWeatherIcon(
                dashboardData.weather?.current?.condition || "sunny",
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">
            {isArabic ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            {isArabic ? "التنبيهات" : "Alerts"}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            {isArabic ? "المهام" : "Tasks"}
          </TabsTrigger>
          <TabsTrigger value="crops">
            {isArabic ? "المحاصيل" : "Crops"}
          </TabsTrigger>
          <TabsTrigger value="weather">
            {isArabic ? "الطقس" : "Weather"}
          </TabsTrigger>
          <TabsTrigger value="market">
            {isArabic ? "السوق" : "Market"}
          </TabsTrigger>
          <TabsTrigger value="equipment">
            {isArabic ? "المعدات" : "Equipment"}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {isArabic ? "التحليلات" : "Analytics"}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  {isArabic ? "التنبيهات الأخيرة" : "Recent Alerts"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {(dashboardData.alerts || [])
                      .slice(0, 5)
                      .map((alert: any) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {isArabic ? alert.typeArabic : alert.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">
                            {isArabic ? alert.titleArabic : alert.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {isArabic ? alert.locationArabic : alert.location}
                          </p>
                          {!alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => handleAlertResolve(alert.id)}
                            >
                              {isArabic ? "حل" : "Resolve"}
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Urgent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="h-5 w-5 mr-2" />
                  {isArabic ? "المهام العاجلة" : "Urgent Tasks"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {(dashboardData.tasks || [])
                      .filter(
                        (task: any) =>
                          task.priority === "urgent" ||
                          task.status === "overdue",
                      )
                      .slice(0, 5)
                      .map((task: any) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border bg-orange-50 border-orange-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            {getPriorityIcon(task.priority)}
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm">
                            {isArabic ? task.titleArabic : task.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {isArabic ? task.assignedToArabic : task.assignedTo}{" "}
                            • {isArabic ? task.locationArabic : task.location}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isArabic ? "موعد الانتهاء" : "Due"}:{" "}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            {task.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleTaskStatusUpdate(task.id, "in_progress")
                                }
                              >
                                <Play className="h-3 w-3 mr-1" />
                                {isArabic ? "بدء" : "Start"}
                              </Button>
                            )}
                            {task.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleTaskStatusUpdate(task.id, "completed")
                                }
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {isArabic ? "إنهاء" : "Complete"}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Weather & Market Summary */}
            <div className="space-y-6">
              {/* Weather Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getWeatherIcon(
                      dashboardData.weather?.current?.condition || "sunny",
                    )}
                    <span className="ml-2">
                      {isArabic ? "الطقس الحالي" : "Current Weather"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {isArabic ? "درجة الحرارة" : "Temperature"}
                      </span>
                      <span className="font-semibold">
                        {formatTemperature(
                          dashboardData.weather?.current?.temperature || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {isArabic ? "الرطوبة" : "Humidity"}
                      </span>
                      <span className="font-semibold">
                        {dashboardData.weather?.current?.humidity || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {isArabic ? "سرعة الرياح" : "Wind Speed"}
                      </span>
                      <span className="font-semibold">
                        {dashboardData.weather?.current?.windSpeed || 0} km/h
                      </span>
                    </div>
                    {dashboardData.weather?.alerts?.length > 0 && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {isArabic
                            ? dashboardData.weather.alerts[0].messageArabic
                            : dashboardData.weather.alerts[0].message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Market Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    {isArabic ? "ملخص السوق" : "Market Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(dashboardData.market || [])
                      .slice(0, 3)
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">
                            {isArabic ? item.cropNameArabic : item.cropName}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              {formatCurrency(item.currentPrice)}
                            </span>
                            {item.priceChange >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Crop Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sprout className="h-5 w-5 mr-2" />
                {isArabic ? "حالة المحاصيل" : "Crop Status Overview"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(dashboardData.crops || []).slice(0, 6).map((crop: any) => (
                  <div
                    key={crop.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        {isArabic ? crop.nameArabic : crop.name}
                      </h3>
                      <Badge
                        className={
                          crop.healthStatus === "excellent"
                            ? "bg-green-100 text-green-800"
                            : crop.healthStatus === "good"
                              ? "bg-blue-100 text-blue-800"
                              : crop.healthStatus === "fair"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }
                      >
                        {crop.healthStatus}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {isArabic ? "المساحة" : "Area"}
                        </span>
                        <span>
                          {crop.area} {isArabic ? "هكتار" : "hectares"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {isArabic ? "الصحة" : "Health Score"}
                        </span>
                        <span>{crop.healthScore}%</span>
                      </div>
                      <Progress value={crop.healthScore} className="w-full" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {isArabic ? "رطوبة التربة" : "Soil Moisture"}
                        </span>
                        <span>{crop.soilMoisture}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isArabic ? "جميع التنبيهات" : "All Alerts"}
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {(dashboardData.alerts || []).filter(
                  (alert: any) => !alert.resolved,
                ).length || 0}{" "}
                {isArabic ? "نشط" : "Active"}
              </Badge>
              <Badge variant="outline">
                {(dashboardData.alerts || []).filter(
                  (alert: any) => alert.severity === "critical",
                ).length || 0}{" "}
                {isArabic ? "حرج" : "Critical"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dashboardData.alerts || []).map((alert: any) => (
              <Card
                key={alert.id}
                className={`${alert.resolved ? "opacity-60" : ""} ${alert.severity === "critical" ? "border-red-500" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <CardTitle className="text-base">
                    {isArabic ? alert.titleArabic : alert.title}
                  </CardTitle>
                  <CardDescription>
                    {isArabic ? alert.typeArabic : alert.type} •{" "}
                    {isArabic ? alert.locationArabic : alert.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {isArabic ? alert.messageArabic : alert.message}
                  </p>
                  {alert.cropAffected && (
                    <p className="text-xs text-gray-500 mb-2">
                      {isArabic ? "المحصول المتأثر" : "Affected Crop"}:{" "}
                      {isArabic ? alert.cropAffectedArabic : alert.cropAffected}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    {alert.resolved ? (
                      <Badge className="bg-green-100 text-green-800">
                        {isArabic ? "تم الحل" : "Resolved"}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAlertResolve(alert.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {isArabic ? "حل" : "Resolve"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {isArabic ? "عرض" : "View"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isArabic ? "إدارة المهام" : "Task Management"}
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {(dashboardData.tasks || []).filter(
                  (task: any) => task.status === "pending",
                ).length || 0}{" "}
                {isArabic ? "معلق" : "Pending"}
              </Badge>
              <Badge variant="outline">
                {(dashboardData.tasks || []).filter(
                  (task: any) => task.status === "in_progress",
                ).length || 0}{" "}
                {isArabic ? "جاري" : "In Progress"}
              </Badge>
              <Badge variant="outline">
                {(dashboardData.tasks || []).filter(
                  (task: any) => task.status === "overdue",
                ).length || 0}{" "}
                {isArabic ? "متأخر" : "Overdue"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dashboardData.tasks || []).map((task: any) => (
              <Card
                key={task.id}
                className={task.status === "overdue" ? "border-red-300" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {getPriorityIcon(task.priority)}
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">
                    {isArabic ? task.titleArabic : task.title}
                  </CardTitle>
                  <CardDescription>
                    {isArabic ? task.categoryArabic : task.category} •{" "}
                    {isArabic ? task.locationArabic : task.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {isArabic ? task.descriptionArabic : task.description}
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        {isArabic ? "مُسند إلى" : "Assigned to"}
                      </span>
                      <span>
                        {isArabic ? task.assignedToArabic : task.assignedTo}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        {isArabic ? "موعد الانتهاء" : "Due Date"}
                      </span>
                      <span
                        className={
                          new Date(task.dueDate) < new Date()
                            ? "text-red-600"
                            : ""
                        }
                      >
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        {isArabic ? "المدة المقدرة" : "Duration"}
                      </span>
                      <span>
                        {task.estimatedDuration} {isArabic ? "دقيقة" : "min"}
                      </span>
                    </div>
                    {task.cost > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          {isArabic ? "التكلفة" : "Cost"}
                        </span>
                        <span>{formatCurrency(task.cost)}</span>
                      </div>
                    )}
                    <div className="flex space-x-2 mt-4">
                      {task.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleTaskStatusUpdate(task.id, "in_progress")
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
                            onClick={() =>
                              handleTaskStatusUpdate(task.id, "completed")
                            }
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {isArabic ? "إنهاء" : "Complete"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleTaskStatusUpdate(task.id, "pending")
                            }
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            {isArabic ? "إيقاف" : "Pause"}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTask(task)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {isArabic ? "عرض" : "View"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Crops Tab */}
        <TabsContent value="crops" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isArabic ? "إدارة المحاصيل" : "Crop Management"}
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {(dashboardData.crops || []).length}{" "}
                {isArabic ? "محصول" : "Crops"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(dashboardData.crops || []).map((crop: any) => (
              <Card key={crop.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {isArabic ? crop.nameArabic : crop.name}
                    </CardTitle>
                    <Badge
                      className={
                        crop.healthStatus === "excellent"
                          ? "bg-green-100 text-green-800"
                          : crop.healthStatus === "good"
                            ? "bg-blue-100 text-blue-800"
                            : crop.healthStatus === "fair"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }
                    >
                      {crop.healthStatus}
                    </Badge>
                  </div>
                  <CardDescription>
                    {isArabic ? crop.varietyArabic : crop.variety} •{" "}
                    {isArabic ? crop.fieldNameArabic : crop.fieldName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">
                          {isArabic ? "المساحة" : "Area"}
                        </p>
                        <p className="font-semibold">
                          {crop.area} {isArabic ? "هكتار" : "hectares"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">
                          {isArabic ? "تاريخ الزراعة" : "Planted"}
                        </p>
                        <p className="font-semibold">
                          {new Date(crop.plantedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{isArabic ? "نقاط الصحة" : "Health Score"}</span>
                        <span>{crop.healthScore}%</span>
                      </div>
                      <Progress value={crop.healthScore} className="w-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          {isArabic ? "رطوبة التربة" : "Soil Moisture"}
                        </p>
                        <p className="font-medium">{crop.soilMoisture}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {isArabic ? "النمو" : "Growth Stage"}
                        </p>
                        <p className="font-medium">
                          {isArabic ? crop.growthStageArabic : crop.growthStage}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          {isArabic ? "المتوقع للحصاد" : "Expected Harvest"}
                        </p>
                        <p className="font-medium">
                          {new Date(crop.expectedHarvest).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {isArabic ? "الإنتاج المتوقع" : "Expected Yield"}
                        </p>
                        <p className="font-medium">
                          {crop.expectedYield} {isArabic ? "طن" : "tons"}
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setSelectedCrop(crop)}
                    >
                      <Sprout className="h-4 w-4 mr-2" />
                      {isArabic ? "عرض التفاصيل" : "View Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isArabic ? "الطقس والتنبؤات" : "Weather & Forecasts"}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Weather */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getWeatherIcon(
                    dashboardData.weather?.current?.condition || "sunny",
                  )}
                  <span className="ml-2">
                    {isArabic ? "الطقس الحالي" : "Current Weather"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">
                      {formatTemperature(
                        dashboardData.weather?.current?.temperature || 27,
                      )}
                    </p>
                    <p className="text-gray-600">
                      {isArabic
                        ? dashboardData.weather?.current?.conditionArabic ||
                          "مشمس"
                        : dashboardData.weather?.current?.condition || "Sunny"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Droplets className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">
                        {isArabic ? "الرطوبة" : "Humidity"}
                      </p>
                      <p className="font-bold">
                        {dashboardData.weather?.current?.humidity || 65}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Wind className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">
                        {isArabic ? "الريا��" : "Wind"}
                      </p>
                      <p className="font-bold">
                        {dashboardData.weather?.current?.windSpeed || 12} km/h
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <Sun className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">
                        {isArabic ? "الأشعة فوق البنفسجية" : "UV Index"}
                      </p>
                      <p className="font-bold">
                        {dashboardData.weather?.current?.uvIndex || 6}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Gauge className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">
                        {isArabic ? "الضغط" : "Pressure"}
                      </p>
                      <p className="font-bold">
                        {dashboardData.weather?.current?.pressure || 1013} hPa
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7-Day Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {isArabic ? "توقعات الأسبوع" : "7-Day Forecast"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(
                    dashboardData.weather?.forecast || [
                      { day: "اليوم", high: 32, low: 18, condition: "sunny" },
                      { day: "غداً", high: 30, low: 16, condition: "cloudy" },
                      { day: "الخميس", high: 28, low: 15, condition: "rainy" },
                      { day: "الجمعة", high: 31, low: 17, condition: "sunny" },
                      { day: "السبت", high: 33, low: 19, condition: "sunny" },
                      { day: "الأحد", high: 29, low: 16, condition: "cloudy" },
                      { day: "الاثنين", high: 27, low: 14, condition: "rainy" },
                    ]
                  ).map((day: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-3">
                        {getWeatherIcon(day.condition)}
                        <span className="font-medium">
                          {isArabic ? day.dayArabic || day.day : day.day}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {formatTemperature(day.low)} /{" "}
                          {formatTemperature(day.high)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather Alerts */}
          {dashboardData.weather?.alerts?.length > 0 && (
            <Card className="border-yellow-500 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {isArabic ? "تحذيرات جوية" : "Weather Alerts"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.weather.alerts.map(
                    (alert: any, index: number) => (
                      <Alert
                        key={index}
                        className="border-yellow-300 bg-yellow-100"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {isArabic ? alert.messageArabic : alert.message}
                        </AlertDescription>
                      </Alert>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isArabic
                ? "أسعار السوق والتحليلات"
                : "Market Prices & Analytics"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(
              dashboardData.market || [
                {
                  id: 1,
                  cropName: "القمح",
                  cropNameArabic: "القمح",
                  currentPrice: 45.5,
                  priceChange: 2.3,
                  unit: "كغ",
                  demand: "high",
                },
                {
                  id: 2,
                  cropName: "الذرة",
                  cropNameArabic: "الذرة",
                  currentPrice: 38.2,
                  priceChange: -1.8,
                  unit: "كغ",
                  demand: "medium",
                },
                {
                  id: 3,
                  cropName: "الأرز",
                  cropNameArabic: "الأرز",
                  currentPrice: 52.1,
                  priceChange: 5.2,
                  unit: "كغ",
                  demand: "high",
                },
                {
                  id: 4,
                  cropName: "الشعير",
                  cropNameArabic: "الشعير",
                  currentPrice: 42.75,
                  priceChange: 0.8,
                  unit: "كغ",
                  demand: "low",
                },
                {
                  id: 5,
                  cropName: "الطماطم",
                  cropNameArabic: "الطماطم",
                  currentPrice: 12.3,
                  priceChange: -3.2,
                  unit: "كغ",
                  demand: "high",
                },
                {
                  id: 6,
                  cropName: "البطاطس",
                  cropNameArabic: "البطاطس",
                  currentPrice: 8.9,
                  priceChange: 1.5,
                  unit: "كغ",
                  demand: "medium",
                },
              ]
            ).map((item: any) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {isArabic ? item.cropNameArabic : item.cropName}
                    </CardTitle>
                    <Badge
                      className={
                        item.demand === "high"
                          ? "bg-green-100 text-green-800"
                          : item.demand === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {isArabic
                        ? item.demand === "high"
                          ? "طلب عالي"
                          : item.demand === "medium"
                            ? "طلب متوسط"
                            : "طلب منخفض"
                        : item.demand}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(item.currentPrice)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isArabic ? "لكل" : "per"} {isArabic ? item.unit : "kg"}
                      </p>
                    </div>

                    <div className="flex items-center justify-center space-x-2">
                      {item.priceChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`font-semibold ${
                          item.priceChange >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.priceChange >= 0 ? "+" : ""}
                        {item.priceChange}%
                      </span>
                      <span className="text-sm text-gray-600">
                        {isArabic ? "من الأمس" : "from yesterday"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">
                          {isArabic ? "أعلى سعر" : "High"}
                        </p>
                        <p className="font-medium">
                          {formatCurrency(item.currentPrice * 1.1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {isArabic ? "أقل سعر" : "Low"}
                        </p>
                        <p className="font-medium">
                          {formatCurrency(item.currentPrice * 0.9)}
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        // Navigate to detailed market analysis
                        console.log("View market details for", item.cropName);
                      }}
                    >
                      <LineChart className="h-4 w-4 mr-2" />
                      {isArabic
                        ? "عرض التحليل المفصل"
                        : "View Detailed Analysis"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isArabic
                ? "إدارة المعدات والآلات"
                : "Equipment & Machinery Management"}
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {(dashboardData.equipment || []).filter(
                  (eq: any) => eq.status === "operational",
                ).length || 0}{" "}
                {isArabic ? "تشغيلية" : "Operational"}
              </Badge>
              <Badge variant="outline" className="text-red-600">
                {(dashboardData.equipment || []).filter(
                  (eq: any) => eq.status === "maintenance",
                ).length || 0}{" "}
                {isArabic ? "صيانة" : "Maintenance"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(
              dashboardData.equipment || [
                {
                  id: 1,
                  name: "جرار كوبوتا",
                  nameArabic: "جرار كوبوتا",
                  type: "Tractor",
                  status: "operational",
                  usage: 85,
                  nextMaintenance: "2024-09-15",
                  fuel: 75,
                },
                {
                  id: 2,
                  name: "حصادة القمح",
                  nameArabic: "حصادة القمح",
                  type: "Harvester",
                  status: "operational",
                  usage: 92,
                  nextMaintenance: "2024-08-20",
                  fuel: 45,
                },
                {
                  id: 3,
                  name: "مضخة الري",
                  nameArabic: "مضخة الري",
                  type: "Irrigation",
                  status: "maintenance",
                  usage: 78,
                  nextMaintenance: "2024-08-10",
                  fuel: 0,
                },
                {
                  id: 4,
                  name: "رشاش المبيدات",
                  nameArabic: "رشاش المبيدات",
                  type: "Sprayer",
                  status: "operational",
                  usage: 65,
                  nextMaintenance: "2024-09-30",
                  fuel: 90,
                },
                {
                  id: 5,
                  name: "مولد الكهرباء",
                  nameArabic: "مولد الكهرباء",
                  type: "Generator",
                  status: "operational",
                  usage: 45,
                  nextMaintenance: "2024-10-05",
                  fuel: 60,
                },
                {
                  id: 6,
                  name: "آلة البذر",
                  nameArabic: "آلة البذر",
                  type: "Seeder",
                  status: "operational",
                  usage: 30,
                  nextMaintenance: "2024-11-15",
                  fuel: 80,
                },
              ]
            ).map((equipment: any) => (
              <Card
                key={equipment.id}
                className={`hover:shadow-lg transition-shadow ${equipment.status === "maintenance" ? "border-red-300" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {isArabic ? equipment.nameArabic : equipment.name}
                    </CardTitle>
                    <Badge
                      className={
                        equipment.status === "operational"
                          ? "bg-green-100 text-green-800"
                          : equipment.status === "maintenance"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {isArabic
                        ? equipment.status === "operational"
                          ? "تشغيلية"
                          : equipment.status === "maintenance"
                            ? "صيانة"
                            : "متوقفة"
                        : equipment.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {isArabic
                      ? equipment.typeArabic || equipment.type
                      : equipment.type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Usage Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{isArabic ? "الاستخدام" : "Usage"}</span>
                        <span>{equipment.usage}%</span>
                      </div>
                      <Progress
                        value={equipment.usage}
                        className={`w-full ${equipment.usage > 90 ? "text-red-600" : equipment.usage > 70 ? "text-yellow-600" : "text-green-600"}`}
                      />
                    </div>

                    {/* Fuel Level */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{isArabic ? "مستوى الوقود" : "Fuel Level"}</span>
                        <span>{equipment.fuel}%</span>
                      </div>
                      <Progress
                        value={equipment.fuel}
                        className={`w-full ${equipment.fuel < 20 ? "text-red-600" : equipment.fuel < 50 ? "text-yellow-600" : "text-green-600"}`}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {isArabic ? "الصيانة القادمة" : "Next Maintenance"}
                        </span>
                        <span className="font-medium">
                          {new Date(
                            equipment.nextMaintenance,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      {equipment.status === "operational" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            if (onEquipmentMaintenance) {
                              onEquipmentMaintenance(equipment.id);
                            }
                          }}
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          {isArabic ? "صيانة" : "Maintenance"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedEquipment(equipment)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {isArabic ? "عرض" : "View"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Overview */}
            {dashboardData.financial && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    {isArabic ? "النظرة المالية" : "Financial Overview"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(dashboardData.financial.totalRevenue)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {isArabic ? "إجمالي الإيرادات" : "Total Revenue"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(
                            dashboardData.financial.totalExpenses,
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {isArabic ? "إجمالي المصروفات" : "Total Expenses"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(dashboardData.financial.netProfit)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {isArabic ? "صافي الربح" : "Net Profit"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">
                          {isArabic ? "هامش الربح" : "Profit Margin"}
                        </span>
                        <span className="font-semibold">
                          {dashboardData.financial.profitMargin}%
                        </span>
                      </div>
                      <Progress
                        value={dashboardData.financial.profitMargin}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Labor Overview */}
            {dashboardData.labor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {isArabic ? "إدارة العمالة" : "Labor Management"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          {dashboardData.labor.presentToday}
                        </p>
                        <p className="text-xs text-gray-600">
                          {isArabic ? "حاضر اليوم" : "Present Today"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">
                          {dashboardData.labor.absentToday}
                        </p>
                        <p className="text-xs text-gray-600">
                          {isArabic ? "غائب اليوم" : "Absent Today"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">
                          {isArabic ? "الإنتاجية" : "Productivity"}
                        </span>
                        <span className="font-semibold">
                          {dashboardData.labor.productivity}%
                        </span>
                      </div>
                      <Progress
                        value={dashboardData.labor.productivity}
                        className="w-full"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(
                          dashboardData.labor.payroll.totalMonthlyCost,
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        {isArabic
                          ? "التكلفة الشهرية للرواتب"
                          : "Monthly Payroll Cost"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals/Dialogs */}
      {selectedAlert && (
        <Dialog
          open={!!selectedAlert}
          onOpenChange={() => setSelectedAlert(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isArabic ? selectedAlert.titleArabic : selectedAlert.title}
              </DialogTitle>
              <DialogDescription>
                {isArabic ? "تفاصيل التنبيه" : "Alert Details"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    {isArabic ? "النوع" : "Type"}
                  </label>
                  <p className="text-sm">
                    {isArabic ? selectedAlert.typeArabic : selectedAlert.type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {isArabic ? "الخطورة" : "Severity"}
                  </label>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {isArabic ? "الموقع" : "Location"}
                  </label>
                  <p className="text-sm">
                    {isArabic
                      ? selectedAlert.locationArabic
                      : selectedAlert.location}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {isArabic ? "الوقت" : "Time"}
                  </label>
                  <p className="text-sm">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {isArabic ? "الرسالة" : "Message"}
                </label>
                <p className="text-sm">
                  {isArabic
                    ? selectedAlert.messageArabic
                    : selectedAlert.message}
                </p>
              </div>
              {selectedAlert.actionRequired && (
                <div>
                  <label className="text-sm font-medium">
                    {isArabic ? "الإجراء المطل��ب" : "Required Action"}
                  </label>
                  <p className="text-sm">
                    {isArabic
                      ? selectedAlert.actionTextArabic
                      : selectedAlert.actionText}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-gray-500">
        {isArabic ? "آخر تحديث" : "Last updated"}:{" "}
        {new Date(dashboardData.lastUpdated).toLocaleString()}
        {autoRefresh && (
          <span className="ml-2">
            • {isArabic ? "التحديث التلقائي نشط" : "Auto-refresh active"}
          </span>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveFarmManagement;
