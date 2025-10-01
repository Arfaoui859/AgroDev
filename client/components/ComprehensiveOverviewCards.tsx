import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Droplets,
  Thermometer,
  Activity,
  Leaf,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  PieChart,
  MapPin,
  Calendar,
  Zap,
  Shield,
  Heart,
  Database,
  Wifi,
  WifiOff,
  Wheat,
  Scale,
  Milk,
  Egg,
  TreePine,
  Sun,
  CloudRain,
  Wind,
  Eye,
  TrendingUp as Growth,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Award,
  RefreshCw,
} from "lucide-react";

interface OverviewData {
  land: {
    totalArea: number;
    cultivatedArea: number;
    soilHealth: number;
    irrigationEfficiency: number;
    weatherConditions: {
      temperature: number;
      humidity: number;
      rainfall: number;
      windSpeed: number;
    };
    soilMetrics: {
      ph: number;
      moisture: number;
      nutrients: {
        nitrogen: number;
        phosphorus: number;
        potassium: number;
      };
    };
  };
  crops: {
    activeCrops: number;
    totalYield: number;
    healthyPercentage: number;
    diseaseAlerts: number;
    harvestReadiness: number;
    topPerformers: Array<{
      name: string;
      nameArabic: string;
      yield: number;
      health: string;
      progress: number;
    }>;
    seasonalProgress: number;
  };
  livestock: {
    totalAnimals: number;
    healthyPercentage: number;
    productionEfficiency: number;
    feedOptimization: number;
    vaccinations: number;
    milkProduction?: number;
    eggProduction?: number;
    healthAlerts: number;
    breedingProgram: {
      activeBreeding: number;
      successRate: number;
      newBirths: number;
    };
  };
  financial: {
    totalRevenue: number;
    totalExpenses: number;
    profitMargin: number;
    roi: number;
    cashFlow: number;
    budgetUtilization: number;
    marketOpportunities: number;
    costOptimization: number;
    monthlyTrend: Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
  };
}

interface ComprehensiveOverviewCardsProps {
  isArabic?: boolean;
  data?: OverviewData;
  onCardClick?: (cardType: string, action?: string) => void;
}

const ComprehensiveOverviewCards: React.FC<ComprehensiveOverviewCardsProps> = ({
  isArabic = false,
  data,
  onCardClick,
}) => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (data) {
        setOverviewData(data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch farm overview data
        const farmResponse = await fetch("/api/farm-management/overview");
        let farmData = null;
        if (farmResponse.ok) {
          farmData = await farmResponse.json();
        }

        // Fetch weather data for Tunisia
        const weatherResponse = await fetch(
          "/api/weather/coordinates?lat=36.8065&lon=10.1815",
        );
        let weatherData = null;
        if (weatherResponse.ok) {
          weatherData = await weatherResponse.json();
        }

        // Fetch livestock data
        const livestockResponse = await fetch("/api/livestock-dashboard");
        let livestockData = null;
        if (livestockResponse.ok) {
          livestockData = await livestockResponse.json();
        }

        // Fetch financial data
        const financialResponse = await fetch("/api/financial-summary");
        let financialData = null;
        if (financialResponse.ok) {
          financialData = await financialResponse.json();
        }

        // Fetch crop data
        const cropsResponse = await fetch("/api/farm-management/crops");
        let cropsData = null;
        if (cropsResponse.ok) {
          cropsData = await cropsResponse.json();
        }

        // Fetch notifications for alerts
        const alertsResponse = await fetch(
          "/api/notifications?type=crop&status=unread",
        );
        let alertsData = null;
        if (alertsResponse.ok) {
          alertsData = await alertsResponse.json();
        }

        // Construct overview data from API responses
        const constructedData: OverviewData = {
          land: {
            totalArea: farmData?.total_area || 25.5,
            cultivatedArea: farmData?.cultivated_area || 22.3,
            soilHealth: farmData?.soil_health_avg || 87,
            irrigationEfficiency: farmData?.irrigation_efficiency || 91,
            weatherConditions: {
              temperature: weatherData?.current?.temperature || 24.5,
              humidity: weatherData?.current?.humidity || 62,
              rainfall: weatherData?.current?.precipitation || 15.2,
              windSpeed: weatherData?.current?.wind_speed || 12,
            },
            soilMetrics: {
              ph: farmData?.soil_metrics?.ph || 6.8,
              moisture: farmData?.soil_metrics?.moisture || 45,
              nutrients: {
                nitrogen: farmData?.soil_metrics?.nitrogen || 85,
                phosphorus: farmData?.soil_metrics?.phosphorus || 42,
                potassium: farmData?.soil_metrics?.potassium || 118,
              },
            },
          },
          crops: {
            activeCrops: cropsData?.active_crops_count || 8,
            totalYield: cropsData?.total_yield || 1247,
            healthyPercentage: cropsData?.healthy_percentage || 92,
            diseaseAlerts: alertsData?.count || 3,
            harvestReadiness: cropsData?.harvest_ready_percentage || 35,
            topPerformers: cropsData?.top_performers || [
              {
                name: "Wheat",
                nameArabic: "قمح",
                yield: 4.2,
                health: "excellent",
                progress: 78,
              },
              {
                name: "Olives",
                nameArabic: "زيتون",
                yield: 12.8,
                health: "good",
                progress: 65,
              },
              {
                name: "Tomatoes",
                nameArabic: "طماطم",
                yield: 28.5,
                health: "fair",
                progress: 45,
              },
            ],
            seasonalProgress: cropsData?.seasonal_progress || 68,
          },
          livestock: {
            totalAnimals: livestockData?.total_animals || 245,
            healthyPercentage: livestockData?.healthy_percentage || 96,
            productionEfficiency: livestockData?.production_efficiency || 88,
            feedOptimization: livestockData?.feed_optimization || 85,
            vaccinations: livestockData?.vaccination_rate || 98,
            milkProduction: livestockData?.milk_production_daily || 1850,
            eggProduction: livestockData?.egg_production_daily || 2400,
            healthAlerts: livestockData?.health_alerts_count || 2,
            breedingProgram: {
              activeBreeding: livestockData?.breeding_program?.active || 45,
              successRate: livestockData?.breeding_program?.success_rate || 89,
              newBirths:
                livestockData?.breeding_program?.new_births_month || 23,
            },
          },
          financial: {
            totalRevenue: financialData?.total_revenue || 156780,
            totalExpenses: financialData?.total_expenses || 98450,
            profitMargin: financialData?.profit_margin || 37.2,
            roi: financialData?.roi || 48.6,
            cashFlow: financialData?.cash_flow || 58330,
            budgetUtilization: financialData?.budget_utilization || 76,
            marketOpportunities:
              financialData?.market_opportunities_count || 12,
            costOptimization: financialData?.cost_optimization_percentage || 23,
            monthlyTrend: financialData?.monthly_trend || [
              { month: "Jan", revenue: 12500, expenses: 8200, profit: 4300 },
              { month: "Feb", revenue: 13200, expenses: 8800, profit: 4400 },
              { month: "Mar", revenue: 15800, expenses: 9500, profit: 6300 },
            ],
          },
        };

        setOverviewData(constructedData);
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
        setError(isArabic ? "تعذر تحميل البيانات" : "Failed to load data");
        toast({
          title: isArabic ? "خطأ في التحميل" : "Loading Error",
          description: isArabic
            ? "تعذر تحميل بيانات نظرة عامة"
            : "Failed to load overview data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [data, isArabic, toast]);

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBadgeColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (current < previous)
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">
          {isArabic ? "جاري التحميل..." : "Loading overview..."}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!overviewData) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {isArabic ? "لا توجد بيانات متاحة" : "No data available"}
        </AlertDescription>
      </Alert>
    );
  }

  const { land, crops, livestock, financial } = overviewData;

  return (
    <div className={`space-y-6 ${isArabic ? "rtl" : "ltr"}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Land Overview */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("land")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "الأراضي" : "Land"}
                </h3>
              </div>
              <Badge
                className={`${getHealthColor(land.soilHealth)} bg-transparent`}
              >
                {land.soilHealth}%
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "المساحة المز��وعة" : "Cultivated"}
                </span>
                <span className="font-medium">
                  {land.cultivatedArea} {isArabic ? "هكتار" : "ha"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "كفاءة الري" : "Irrigation Eff."}
                </span>
                <span className="font-medium">
                  {land.irrigationEfficiency}%
                </span>
              </div>
              <Progress value={land.soilHealth} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Crops Overview */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("crops")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Leaf className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "المحاصيل" : "Crops"}
                </h3>
              </div>
              <Badge
                className={`${getHealthColor(crops.healthyPercentage)} bg-transparent`}
              >
                {crops.activeCrops}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "صحية" : "Healthy"}
                </span>
                <span className="font-medium">{crops.healthyPercentage}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "الإنتاج" : "Yield"}
                </span>
                <span className="font-medium">
                  {crops.totalYield} {isArabic ? "طن" : "tons"}
                </span>
              </div>
              <Progress value={crops.seasonalProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Livestock Overview */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("livestock")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "الماشية" : "Livestock"}
                </h3>
              </div>
              <Badge
                className={`${getHealthColor(livestock.healthyPercentage)} bg-transparent`}
              >
                {livestock.totalAnimals}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "صحية" : "Healthy"}
                </span>
                <span className="font-medium">
                  {livestock.healthyPercentage}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "الإنتاجية" : "Production"}
                </span>
                <span className="font-medium">
                  {livestock.productionEfficiency}%
                </span>
              </div>
              <Progress value={livestock.healthyPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onCardClick?.("financial")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-sm">
                  {isArabic ? "المالية" : "Financial"}
                </h3>
              </div>
              <Badge
                className={`${getHealthColor(financial.profitMargin)} bg-transparent`}
              >
                {financial.profitMargin.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "الإيرادات" : "Revenue"}
                </span>
                <span className="font-medium">
                  {(financial.totalRevenue / 1000).toFixed(0)}K TND
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {isArabic ? "العائد" : "ROI"}
                </span>
                <span className="font-medium">{financial.roi.toFixed(1)}%</span>
              </div>
              <Progress value={financial.profitMargin} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Overview Tabs */}
      <Tabs defaultValue="land" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="land">
            {isArabic ? "الأراضي" : "Land"}
          </TabsTrigger>
          <TabsTrigger value="crops">
            {isArabic ? "المحاصيل" : "Crops"}
          </TabsTrigger>
          <TabsTrigger value="livestock">
            {isArabic ? "الماشية" : "Livestock"}
          </TabsTrigger>
          <TabsTrigger value="financial">
            {isArabic ? "المالية" : "Financial"}
          </TabsTrigger>
        </TabsList>

        {/* Land Details Tab */}
        <TabsContent value="land" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weather Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <span>
                    {isArabic ? "الظروف الجوية" : "Weather Conditions"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-xs text-gray-600">
                        {isArabic ? "الحرارة" : "Temperature"}
                      </p>
                      <p className="font-semibold">
                        {land.weatherConditions.temperature}°C
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-600">
                        {isArabic ? "الرطوبة" : "Humidity"}
                      </p>
                      <p className="font-semibold">
                        {land.weatherConditions.humidity}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CloudRain className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">
                        {isArabic ? "الأمطار" : "Rainfall"}
                      </p>
                      <p className="font-semibold">
                        {land.weatherConditions.rainfall}mm
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wind className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">
                        {isArabic ? "الرياح" : "Wind"}
                      </p>
                      <p className="font-semibold">
                        {land.weatherConditions.windSpeed} km/h
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Soil Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>{isArabic ? "صحة التربة" : "Soil Health"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {isArabic ? "الحموضة" : "pH Level"}
                    </span>
                    <span className="font-semibold">{land.soilMetrics.ph}</span>
                  </div>
                  <Progress
                    value={(land.soilMetrics.ph / 14) * 100}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {isArabic ? "الرطوبة" : "Moisture"}
                    </span>
                    <span className="font-semibold">
                      {land.soilMetrics.moisture}%
                    </span>
                  </div>
                  <Progress value={land.soilMetrics.moisture} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Soil Nutrients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>
                    {isArabic ? "العناصر الغذائية" : "Soil Nutrients"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {isArabic ? "نيتروجين" : "Nitrogen (N)"}
                    </span>
                    <span className="font-semibold">
                      {land.soilMetrics.nutrients.nitrogen} mg/kg
                    </span>
                  </div>
                  <Progress
                    value={(land.soilMetrics.nutrients.nitrogen / 150) * 100}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {isArabic ? "فوسفور" : "Phosphorus (P)"}
                    </span>
                    <span className="font-semibold">
                      {land.soilMetrics.nutrients.phosphorus} mg/kg
                    </span>
                  </div>
                  <Progress
                    value={(land.soilMetrics.nutrients.phosphorus / 100) * 100}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {isArabic ? "بوتاسيوم" : "Potassium (K)"}
                    </span>
                    <span className="font-semibold">
                      {land.soilMetrics.nutrients.potassium} mg/kg
                    </span>
                  </div>
                  <Progress
                    value={(land.soilMetrics.nutrients.potassium / 200) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Crops Details Tab */}
        <TabsContent value="crops" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Performing Crops */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>
                    {isArabic ? "أفضل المحاصيل أداءً" : "Top Performing Crops"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crops.topPerformers.map((crop, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Leaf className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {isArabic ? crop.nameArabic : crop.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {crop.yield} {isArabic ? "طن/هكتار" : "tons/ha"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getHealthBadgeColor(crop.health)}>
                          {crop.health}
                        </Badge>
                        <span className="text-sm font-medium">
                          {crop.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Crop Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>
                    {isArabic ? "ملخص صحة المحاصيل" : "Crop Health Summary"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {crops.healthyPercentage}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "صحية" : "Healthy"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {crops.diseaseAlerts}
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "تنبيهات أمراض" : "Disease Alerts"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {crops.harvestReadiness}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "جاهز للحصاد" : "Harvest Ready"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {crops.seasonalProgress}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "تقدم موسمي" : "Seasonal Progress"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Livestock Details Tab */}
        <TabsContent value="livestock" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Animal Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>{isArabic ? "صحة الحيوانات" : "Animal Health"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {livestock.healthyPercentage}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {isArabic ? "حيوانات صحية" : "Healthy Animals"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">
                      {isArabic ? "التطعيمات" : "Vaccinations"}
                    </span>
                    <span className="font-semibold">
                      {livestock.vaccinations}%
                    </span>
                  </div>
                  <Progress value={livestock.vaccinations} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">
                      {isArabic ? "تحسين الأعلاف" : "Feed Optimization"}
                    </span>
                    <span className="font-semibold">
                      {livestock.feedOptimization}%
                    </span>
                  </div>
                  <Progress
                    value={livestock.feedOptimization}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Production Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>
                    {isArabic ? "مقاييس الإنتاج" : "Production Metrics"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {livestock.milkProduction && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Milk className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">
                        {isArabic ? "إنتاج الحليب" : "Milk Production"}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {livestock.milkProduction}L
                    </span>
                  </div>
                )}
                {livestock.eggProduction && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Egg className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">
                        {isArabic ? "إنتاج البيض" : "Egg Production"}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {livestock.eggProduction}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {isArabic ? "كفاءة الإنتاج" : "Production Efficiency"}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {livestock.productionEfficiency}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Breeding Program */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <TreePine className="h-4 w-4" />
                  <span>
                    {isArabic ? "برنامج التناسل" : "Breeding Program"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-blue-600">
                      {livestock.breedingProgram.activeBreeding}
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "نشط" : "Active"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">
                      {livestock.breedingProgram.successRate}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "نجاح" : "Success"}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {livestock.breedingProgram.newBirths}
                  </p>
                  <p className="text-xs text-gray-600">
                    {isArabic
                      ? "مواليد جديدة هذا الشهر"
                      : "New births this month"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Details Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>
                    {isArabic ? "نظرة مالية عامة" : "Financial Overview"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-600">
                      {(financial.totalRevenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-green-700">
                      {isArabic ? "إجمالي الإيرادات" : "Total Revenue"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <p className="text-lg font-bold text-red-600">
                      {(financial.totalExpenses / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-red-700">
                      {isArabic ? "إجمالي المصروفات" : "Total Expenses"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-lg font-bold text-blue-600">
                      {financial.profitMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-blue-700">
                      {isArabic ? "هامش الربح" : "Profit Margin"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-lg font-bold text-purple-600">
                      {financial.roi.toFixed(1)}%
                    </p>
                    <p className="text-xs text-purple-700">
                      {isArabic ? "عائد الاستثمار" : "ROI"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>
                    {isArabic ? "مؤشرات الأداء" : "Performance Indicators"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {isArabic ? "التدفق النقدي" : "Cash Flow"}
                    </span>
                    <span className="font-semibold text-green-600">
                      +{(financial.cashFlow / 1000).toFixed(0)}K TND
                    </span>
                  </div>
                  <Progress
                    value={(financial.cashFlow / financial.totalRevenue) * 100}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {isArabic ? "استخدام الميزانية" : "Budget Utilization"}
                    </span>
                    <span className="font-semibold">
                      {financial.budgetUtilization}%
                    </span>
                  </div>
                  <Progress
                    value={financial.budgetUtilization}
                    className="h-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-orange-600">
                      {financial.marketOpportunities}
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "فرص السوق" : "Market Opportunities"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-teal-600">
                      {financial.costOptimization}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {isArabic ? "تحسين التكاليف" : "Cost Optimization"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("land", "view_details")}
        >
          <Eye className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "تفاصيل الأرض" : "Land Details"}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("crops", "manage")}
        >
          <Leaf className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "إدارة المحاصيل" : "Manage Crops"}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("livestock", "health_check")}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "فحص الماشية" : "Health Check"}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("financial", "reports")}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "تقارير مالية" : "Financial Reports"}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
          onClick={() => onCardClick?.("offline", "manage")}
        >
          <Database className="h-5 w-5" />
          <span className="text-xs">
            {isArabic ? "الوضع بدون إنترنت" : "Offline Mode"}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default ComprehensiveOverviewCards;
