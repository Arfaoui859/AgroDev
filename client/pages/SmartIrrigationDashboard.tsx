import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Droplets,
  Thermometer,
  Wind,
  CloudRain,
  Sun,
  Battery,
  Zap,
  Play,
  Pause,
  Square,
  Settings,
  Timer,
  Gauge,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  Activity,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Leaf,
  DollarSign,
  Calendar,
  Target,
  Wifi,
  WifiOff,
  RotateCcw,
  Save,
  Eye,
  Edit,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SoilMoistureData {
  sensorId: string;
  fieldId: string;
  depth: number;
  moistureLevel: number;
  temperature: number;
  salinity: number;
  timestamp: Date;
  batteryLevel?: number;
}

interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  solarRadiation: number;
  evapotranspiration: number;
  timestamp: Date;
}

interface IrrigationSchedule {
  scheduleId: string;
  fieldId: string;
  cropType: string;
  userId: string;
  scheduleType: "Automatic" | "Manual" | "Smart" | "Timer";
  status: "Active" | "Paused" | "Completed" | "Cancelled";
  nextIrrigation: Date;
  duration: number;
  waterAmount: number;
  priority: "High" | "Medium" | "Low";
  conditions: {
    minMoisture: number;
    maxMoisture: number;
    weatherDependent: boolean;
    timeWindow: { start: string; end: string };
  };
  efficiency: {
    waterSaved: number;
    energySaved: number;
    yieldIncrease: number;
  };
  alertsEnabled: boolean;
}

interface IrrigationRecommendation {
  shouldIrrigate: boolean;
  urgency: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  recommendedAmount: number;
  optimalTime: Date;
}

const SmartIrrigationDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [soilData, setSoilData] = useState<SoilMoistureData[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [schedules, setSchedules] = useState<IrrigationSchedule[]>([]);
  const [recommendations, setRecommendations] = useState<{
    [fieldId: string]: IrrigationRecommendation;
  }>({});
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState("field-tomato-01");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Control states
  const [showManualControl, setShowManualControl] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [isIrrigating, setIsIrrigating] = useState(false);

  // Manual irrigation settings
  const [manualSettings, setManualSettings] = useState({
    duration: 30,
    waterAmount: 200,
    method: "Drip",
  });

  // New schedule settings
  const [newSchedule, setNewSchedule] = useState({
    cropType: "tomato",
    stage: "Vegetative",
    preferredTimes: ["06:00", "09:00"],
    maxDuration: 60,
    waterBudget: 500,
    conservationMode: false,
  });

  const fieldOptions = [
    { id: "field-tomato-01", name: "حقل الطماطم الرئيسي", crop: "طماطم" },
    { id: "field-olive-01", name: "بستان الزيتون الشمالي", crop: "زيتون" },
    { id: "field-citrus-01", name: "حقل الحمضيات", crop: "حمضيات" },
    { id: "field-wheat-01", name: "حقل القمح الجنوبي", crop: "قمح" },
  ];

  const statusColors = {
    Active: "bg-green-100 text-green-800",
    Paused: "bg-yellow-100 text-yellow-800",
    Completed: "bg-blue-100 text-blue-800",
    Cancelled: "bg-gray-100 text-gray-800",
  };

  const urgencyColors = {
    Low: "text-green-600",
    Medium: "text-yellow-600",
    High: "text-orange-600",
    Critical: "text-red-600",
  };

  const fetchSoilData = async (fieldId: string) => {
    try {
      const response = await fetch(
        `/api/smart-irrigation/soil-moisture/${fieldId}?hours=24`,
      );
      const data = await response.json();

      if (data.success) {
        setSoilData(data.data);
      }
    } catch (error) {
      console.error("Error fetching soil data:", error);
    }
  };

  const fetchWeather = async (location: string = "Tunis") => {
    try {
      const response = await fetch(`/api/smart-irrigation/weather/${location}`);
      const data = await response.json();

      if (data.success) {
        setWeather(data.data);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/smart-irrigation/schedules/user-123");
      const data = await response.json();

      if (data.success) {
        setSchedules(
          data.data.map((schedule) => ({
            ...schedule,
            nextIrrigation: new Date(schedule.nextIrrigation),
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchRecommendation = async (fieldId: string) => {
    try {
      const field = fieldOptions.find((f) => f.id === fieldId);
      const response = await fetch("/api/smart-irrigation/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldId,
          cropType:
            field?.crop === "طماطم"
              ? "tomato"
              : field?.crop === "زيتون"
                ? "olive"
                : field?.crop === "حمضيات"
                  ? "citrus"
                  : "wheat",
          stage: "Vegetative",
          location: "Tunis",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations((prev) => ({
          ...prev,
          [fieldId]: {
            ...data.data.recommendation,
            optimalTime: new Date(data.data.recommendation.optimalTime),
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching recommendation:", error);
    }
  };

  const startManualIrrigation = async () => {
    try {
      const activeSchedule = schedules.find(
        (s) => s.fieldId === selectedField && s.status === "Active",
      );

      const response = await fetch("/api/smart-irrigation/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId: activeSchedule?.scheduleId || "manual-" + Date.now(),
          duration: manualSettings.duration,
          waterAmount: manualSettings.waterAmount,
          method: manualSettings.method,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsIrrigating(true);
        setShowManualControl(false);
        toast.success("تم بدء الري بنجاح");

        // Simulate irrigation duration
        setTimeout(
          () => {
            setIsIrrigating(false);
            toast.success("تم انتهاء الري");
          },
          manualSettings.duration * 60 * 1000,
        );
      } else {
        toast.error(data.message || "فشل في بدء الري");
      }
    } catch (error) {
      console.error("Error starting irrigation:", error);
      toast.error("حدث خطأ في بدء الري");
    }
  };

  const createSchedule = async () => {
    try {
      const response = await fetch("/api/smart-irrigation/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldId: selectedField,
          cropType: newSchedule.cropType,
          stage: newSchedule.stage,
          userPreferences: {
            preferredTimes: newSchedule.preferredTimes,
            maxDuration: newSchedule.maxDuration,
            waterBudget: newSchedule.waterBudget,
            conservationMode: newSchedule.conservationMode,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowScheduleDialog(false);
        toast.success("تم إنشاء جدول الري الذكي بنجاح");
        fetchSchedules();
      } else {
        toast.error(data.message || "فشل في إنشاء جدول الري");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("حدث خطأ في إنشاء جدول الري");
    }
  };

  const updateScheduleStatus = async (scheduleId: string, status: string) => {
    try {
      const response = await fetch(
        `/api/smart-irrigation/schedules/${scheduleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        setSchedules((prev) =>
          prev.map((schedule) =>
            schedule.scheduleId === scheduleId
              ? { ...schedule, status: status as any }
              : schedule,
          ),
        );
        toast.success("تم تحديث حالة الجدول بنجاح");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("فشل في تحديث الجدول");
    }
  };

  const getLatestSoilData = (fieldId: string) => {
    return soilData
      .filter((data) => data.fieldId === fieldId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  };

  const getMoistureStatus = (moistureLevel: number, cropType: string) => {
    const thresholds = {
      tomato: { critical: 60, optimal: 75 },
      olive: { critical: 45, optimal: 60 },
      citrus: { critical: 65, optimal: 75 },
      wheat: { critical: 50, optimal: 65 },
    };

    const crop = cropType.toLowerCase() as keyof typeof thresholds;
    const threshold = thresholds[crop] || thresholds.tomato;

    if (moistureLevel < threshold.critical) {
      return { status: "low", color: "text-red-600", text: "منخفض" };
    } else if (moistureLevel < threshold.optimal) {
      return { status: "medium", color: "text-yellow-600", text: "متوسط" };
    } else {
      return { status: "good", color: "text-green-600", text: "جيد" };
    }
  };

  const generateMoistureChartData = (fieldId: string) => {
    return soilData
      .filter((data) => data.fieldId === fieldId)
      .slice(-24)
      .map((data) => ({
        time: new Date(data.timestamp).toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        moisture: data.moistureLevel,
        temperature: data.temperature,
      }));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSoilData(selectedField),
        fetchWeather(),
        fetchSchedules(),
        fetchRecommendation(selectedField),
      ]);
      setLoading(false);
    };

    loadData();
  }, [selectedField]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSoilData(selectedField);
        fetchWeather();
        fetchRecommendation(selectedField);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedField]);

  const latestSoilData = getLatestSoilData(selectedField);
  const selectedFieldInfo = fieldOptions.find((f) => f.id === selectedField);
  const selectedFieldSchedule = schedules.find(
    (s) => s.fieldId === selectedField && s.status === "Active",
  );
  const recommendation = recommendations[selectedField];
  const moistureChartData = generateMoistureChartData(selectedField);
  const moistureStatus = latestSoilData
    ? getMoistureStatus(
        latestSoilData.moistureLevel,
        selectedFieldInfo?.crop || "tomato",
      )
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchSoilData(selectedField)}
            disabled={loading}
          >
            <RotateCcw
              className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`}
            />
            تحديث
          </Button>

          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label>تحديث تلقائي</Label>
          </div>

          <Button onClick={() => setShowScheduleDialog(true)}>
            <Calendar className="h-4 w-4 ml-2" />
            جدول جديد
          </Button>
        </div>

        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Droplets className="h-8 w-8 text-blue-600" />
          نظام الري الذكي
        </h1>
      </div>

      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            اختيار الحقل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {fieldOptions.map((field) => (
              <Button
                key={field.id}
                variant={selectedField === field.id ? "default" : "outline"}
                onClick={() => setSelectedField(field.id)}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Leaf className="h-5 w-5" />
                <div className="text-center">
                  <div className="font-medium">{field.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {field.crop}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Soil Moisture */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">رطوبة التربة</span>
            </div>
            {latestSoilData ? (
              <>
                <div className="text-2xl font-bold mb-1">
                  {latestSoilData.moistureLevel}%
                </div>
                <div className={`text-sm ${moistureStatus?.color}`}>
                  {moistureStatus?.text}
                </div>
                <Progress
                  value={latestSoilData.moistureLevel}
                  className="mt-2 h-2"
                />
              </>
            ) : (
              <div className="text-muted-foreground">لا توجد بيانات</div>
            )}
          </CardContent>
        </Card>

        {/* Weather */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Sun className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium">الطقس</span>
            </div>
            {weather ? (
              <>
                <div className="text-2xl font-bold mb-1">
                  {Math.round(weather.temperature)}°م
                </div>
                <div className="text-sm text-muted-foreground">
                  رطوبة: {Math.round(weather.humidity)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  رياح: {Math.round(weather.windSpeed)} كم/س
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">جاري التحميل...</div>
            )}
          </CardContent>
        </Card>

        {/* Next Irrigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Timer className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">الري التالي</span>
            </div>
            {selectedFieldSchedule ? (
              <>
                <div className="text-lg font-bold mb-1">
                  {selectedFieldSchedule.nextIrrigation.toLocaleTimeString(
                    "ar-EG",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedFieldSchedule.duration} دقيقة
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedFieldSchedule.waterAmount} لتر
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">لا يوجد جدول نشط</div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">حالة النظام</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {latestSoilData?.batteryLevel ? (
                  <>
                    <Battery className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      البطارية: {latestSoilData.batteryLevel}%
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-sm">غير متصل</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isIrrigating ? (
                  <>
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">الري نشط</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">في الانتظار</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Alert */}
      {recommendation && (
        <Alert
          className={`${recommendation.urgency === "Critical" || recommendation.urgency === "High" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}
        >
          <AlertTriangle
            className={`h-4 w-4 ${urgencyColors[recommendation.urgency]}`}
          />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className={urgencyColors[recommendation.urgency]}>
                  توصية الري -{" "}
                  {recommendation.urgency === "Critical"
                    ? "حرجة"
                    : recommendation.urgency === "High"
                      ? "عالية"
                      : recommendation.urgency === "Medium"
                        ? "متوسطة"
                        : "منخفضة"}
                  :
                </strong>
                <p className="mt-1">{recommendation.reason}</p>
                {recommendation.shouldIrrigate && (
                  <p className="text-sm mt-1">
                    الكمية المقترحة:{" "}
                    {Math.round(recommendation.recommendedAmount)} لتر | الوقت
                    الأمثل:{" "}
                    {recommendation.optimalTime.toLocaleTimeString("ar-EG")}
                  </p>
                )}
              </div>
              {recommendation.shouldIrrigate && (
                <Button
                  onClick={() => setShowManualControl(true)}
                  size="sm"
                  className={
                    recommendation.urgency === "Critical"
                      ? "bg-red-600 hover:bg-red-700"
                      : ""
                  }
                >
                  <Play className="h-4 w-4 ml-2" />
                  بدء الري
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="schedules">الجداول</TabsTrigger>
          <TabsTrigger value="control">التحكم</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Moisture Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مراقبة رطوبة التربة (24 ساعة)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={moistureChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="رطوبة التربة %"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weather Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5" />
                  توقعات الطقس
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weather ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Thermometer className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <div className="text-lg font-bold">
                          {Math.round(weather.temperature)}°م
                        </div>
                        <div className="text-sm text-muted-foreground">
                          درجة الحرارة
                        </div>
                      </div>
                      <div className="text-center p-3 bg-cyan-50 rounded-lg">
                        <Droplets className="h-6 w-6 mx-auto mb-2 text-cyan-600" />
                        <div className="text-lg font-bold">
                          {Math.round(weather.humidity)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          الرطوبة
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Wind className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <div className="text-lg font-bold">
                          {Math.round(weather.windSpeed)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          سرعة الرياح (كم/س)
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                        <div className="text-lg font-bold">
                          {Math.round(weather.evapotranspiration)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          التبخر (مم/يوم)
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <CloudRain className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div className="text-lg font-bold">
                        {weather.rainfall.toFixed(1)} مم
                      </div>
                      <div className="text-sm text-muted-foreground">
                        الأمطار اليوم
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    جاري تحميل بيانات الطقس...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sensor Details */}
          {latestSoilData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  تفاصيل المستشعرات - {selectedFieldInfo?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {latestSoilData.moistureLevel}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      رطوبة التربة
                    </div>
                    <div className="text-xs text-muted-foreground">
                      العمق: {latestSoilData.depth} سم
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {latestSoilData.temperature}°م
                    </div>
                    <div className="text-sm text-muted-foreground">
                      حرارة التربة
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {latestSoilData.salinity}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      الملوحة (EC)
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {latestSoilData.batteryLevel || "--"}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      شحن البطارية
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  آخر تحديث: {latestSoilData.timestamp.toLocaleString("ar-EG")}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جداول الري النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    لا توجد جداول ري
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    ابدأ بإنشاء جدول ري ذكي
                  </p>
                  <Button onClick={() => setShowScheduleDialog(true)}>
                    <Calendar className="h-4 w-4 ml-2" />
                    إنشاء جدول جديد
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <Card key={schedule.scheduleId} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateScheduleStatus(
                                  schedule.scheduleId,
                                  schedule.status === "Active"
                                    ? "Paused"
                                    : "Active",
                                )
                              }
                            >
                              {schedule.status === "Active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                className={`${statusColors[schedule.status]} text-sm px-3 py-1`}
                              >
                                {schedule.status === "Active" && "نشط"}
                                {schedule.status === "Paused" && "متوقف"}
                                {schedule.status === "Completed" && "مكتمل"}
                                {schedule.status === "Cancelled" && "ملغي"}
                              </Badge>
                              <h4 className="font-semibold">
                                {
                                  fieldOptions.find(
                                    (f) => f.id === schedule.fieldId,
                                  )?.name
                                }
                              </h4>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-muted-foreground">
                                  الري التالي:{" "}
                                </span>
                                <span className="font-medium">
                                  {schedule.nextIrrigation.toLocaleString(
                                    "ar-EG",
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  المدة:{" "}
                                </span>
                                <span className="font-medium">
                                  {schedule.duration} دقيقة
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  الكمية:{" "}
                                </span>
                                <span className="font-medium">
                                  {schedule.waterAmount} لتر
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  النوع:{" "}
                                </span>
                                <span className="font-medium">
                                  {schedule.scheduleType}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div>
                                وفرت: {schedule.efficiency.waterSaved} لتر |
                                {schedule.efficiency.energySaved} كيلووات
                              </div>
                              <div>
                                نافذة الري:{" "}
                                {schedule.conditions.timeWindow.start} -{" "}
                                {schedule.conditions.timeWindow.end}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Control Tab */}
        <TabsContent value="control" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                التحكم اليدوي في الري
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>مدة الري (دقيقة)</Label>
                    <Slider
                      value={[manualSettings.duration]}
                      onValueChange={(value) =>
                        setManualSettings((prev) => ({
                          ...prev,
                          duration: value[0],
                        }))
                      }
                      max={120}
                      min={5}
                      step={5}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {manualSettings.duration} دقيقة
                    </div>
                  </div>

                  <div>
                    <Label>كمية المياه (لتر)</Label>
                    <Slider
                      value={[manualSettings.waterAmount]}
                      onValueChange={(value) =>
                        setManualSettings((prev) => ({
                          ...prev,
                          waterAmount: value[0],
                        }))
                      }
                      max={1000}
                      min={50}
                      step={25}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {manualSettings.waterAmount} لتر
                    </div>
                  </div>

                  <div>
                    <Label>طريقة الري</Label>
                    <select
                      value={manualSettings.method}
                      onChange={(e) =>
                        setManualSettings((prev) => ({
                          ...prev,
                          method: e.target.value,
                        }))
                      }
                      className="w-full border rounded px-3 py-2 mt-1"
                    >
                      <option value="Drip">بالتنقيط</option>
                      <option value="Sprinkler">بالرش</option>
                      <option value="Flood">بالغمر</option>
                      <option value="Micro">مايكرو سبرينكلر</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">معاينة الري</h4>
                    <div className="space-y-2 text-sm">
                      <div>المدة: {manualSettings.duration} دقيقة</div>
                      <div>الكمية: {manualSettings.waterAmount} لتر</div>
                      <div>الطريقة: {manualSettings.method}</div>
                      <div>
                        التكلفة المقدرة:{" "}
                        {(manualSettings.waterAmount * 0.0005).toFixed(2)} د.ت
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={startManualIrrigation}
                    disabled={isIrrigating}
                  >
                    {isIrrigating ? (
                      <>
                        <Pause className="h-5 w-5 ml-2" />
                        الري نشط...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 ml-2" />
                        بدء الري الآن
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {schedules
                    .reduce((sum, s) => sum + s.efficiency.waterSaved, 0)
                    .toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  لتر موفر هذا الشهر
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {schedules
                    .reduce((sum, s) => sum + s.efficiency.energySaved, 0)
                    .toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  كيلووات موفر
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {schedules.length > 0
                    ? (
                        schedules.reduce(
                          (sum, s) => sum + s.efficiency.yieldIncrease,
                          0,
                        ) / schedules.length
                      ).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  زيادة متوسط الإنتاج
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الاستخدام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>ستظهر التحليلات التفصيلية هنا</p>
                <p>بعد جمع المزيد من البيانات</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Creation Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إنشاء جدول ري ذكي</DialogTitle>
            <DialogDescription className="text-right">
              قم بإعداد جدول ري تلقائي مخصص للحقل المحدد
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>نوع المحصول</Label>
              <select
                value={newSchedule.cropType}
                onChange={(e) =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    cropType: e.target.value,
                  }))
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="tomato">طماطم</option>
                <option value="olive">زيتون</option>
                <option value="citrus">حمضيات</option>
                <option value="wheat">قمح</option>
              </select>
            </div>

            <div>
              <Label>مرحلة النمو</Label>
              <select
                value={newSchedule.stage}
                onChange={(e) =>
                  setNewSchedule((prev) => ({ ...prev, stage: e.target.value }))
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="Germination">إنبات</option>
                <option value="Vegetative">نمو خضري</option>
                <option value="Flowering">إزهار</option>
                <option value="Fruiting">إثمار</option>
                <option value="Maturity">نضج</option>
              </select>
            </div>

            <div>
              <Label>الحد الأقصى للمدة (دقيقة)</Label>
              <Input
                type="number"
                value={newSchedule.maxDuration}
                onChange={(e) =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    maxDuration: parseInt(e.target.value),
                  }))
                }
                min="15"
                max="180"
              />
            </div>

            <div>
              <Label>ميزانية المياه (لتر/يوم)</Label>
              <Input
                type="number"
                value={newSchedule.waterBudget}
                onChange={(e) =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    waterBudget: parseInt(e.target.value),
                  }))
                }
                min="100"
                max="2000"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>وض�� توفير المياه</Label>
              <Switch
                checked={newSchedule.conservationMode}
                onCheckedChange={(checked) =>
                  setNewSchedule((prev) => ({
                    ...prev,
                    conservationMode: checked,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleDialog(false)}
            >
              إلغاء
            </Button>
            <Button onClick={createSchedule}>إنشاء الجدول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartIrrigationDashboard;
