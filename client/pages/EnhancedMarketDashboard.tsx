import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Activity,
  Target,
  Globe,
  Bell,
  Download,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface MarketPrice {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  currency: string;
  change24h: number;
  volume: number;
  trend: "up" | "down";
  nextWeekForecast: number;
  confidence: number;
}

interface PriceHistory {
  date: string;
  price: number;
  volume: number;
  change: number;
}

interface MarketAlert {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  crop: { id: string; name: string };
  title: string;
  message: string;
  currentPrice: number;
  targetPrice: number;
  change: string;
  recommendation: string;
  timestamp: string;
  isActive: boolean;
}

interface DashboardData {
  marketSummary: {
    totalCrops: number;
    activeAlerts: number;
    avgPriceChange: string;
    marketTrend: string;
    lastUpdated: string;
    totalVolume: number;
    marketCap: number;
  };
  topPerformers: Array<{
    crop: string;
    change: string;
    price: number;
  }>;
  topDecliners: Array<{
    crop: string;
    change: string;
    price: number;
  }>;
  seasonalInsights: string[];
  priceIndices: {
    [key: string]: {
      value: number;
      change: string;
    };
  };
}

interface ChartData {
  date: string;
  price: number;
  volume: number;
  forecast?: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function EnhancedMarketDashboard() {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [marketAlerts, setMarketAlerts] = useState<MarketAlert[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [isRealTime, setIsRealTime] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Fetch all market data
      const [pricesRes, dashboardRes, alertsRes] = await Promise.all([
        fetch("/api/market-analysis/prices/current"),
        fetch("/api/market-analysis/dashboard"),
        fetch("/api/market-analysis/alerts"),
      ]);

      const prices = await pricesRes.json();
      const dashboard = await dashboardRes.json();
      const alerts = await alertsRes.json();

      setMarketPrices(prices);
      setDashboardData(dashboard);
      setMarketAlerts(alerts);
      setLastUpdate(new Date());

      // Set default selected crop if not set
      if (!selectedCrop && prices.length > 0) {
        setSelectedCrop(prices[0].id);
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartData = async (cropId: string, days: string) => {
    try {
      const daysNum = parseInt(days.replace("d", ""));
      const response = await fetch(
        `/api/market-analysis/prices/history/${cropId}?days=${daysNum}`,
      );
      const data = await response.json();

      // Generate forecast data
      const lastPrice = data.data[data.data.length - 1]?.price || 0;
      const forecastData = [];
      for (let i = 1; i <= 7; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i);
        forecastData.push({
          date: futureDate.toISOString().split("T")[0],
          forecast: lastPrice * (1 + (Math.random() - 0.5) * 0.1),
          volume: Math.floor(Math.random() * 500) + 100,
        });
      }

      const combinedData = [
        ...data.data.map((item: any) => ({
          date: item.date,
          price: item.price,
          volume: item.volume,
        })),
        ...forecastData,
      ];

      setChartData(combinedData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  useEffect(() => {
    if (selectedCrop) {
      fetchChartData(selectedCrop, timeRange);
    }
  }, [selectedCrop, timeRange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRealTime) {
      interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRealTime]);

  const filteredPrices =
    selectedCategory === "all"
      ? marketPrices
      : marketPrices.filter((price) => price.category === selectedCategory);

  const categories = [
    "all",
    ...Array.from(new Set(marketPrices.map((p) => p.category))),
  ];

  const formatPrice = (price: number) => `${price.toFixed(2)} د.ت`;
  const formatChange = (change: number) =>
    `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      fruits: "bg-green-100 text-green-800",
      vegetables: "bg-orange-100 text-orange-800",
      grains: "bg-yellow-100 text-yellow-800",
      nuts: "bg-purple-100 text-purple-800",
      forestry: "bg-brown-100 text-brown-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const getAlertSeverityColor = (severity: string) => {
    const colors = {
      low: "border-blue-200 bg-blue-50",
      medium: "border-yellow-200 bg-yellow-50",
      high: "border-orange-200 bg-orange-50",
      critical: "border-red-200 bg-red-50",
    };
    return (
      colors[severity as keyof typeof colors] || "border-gray-200 bg-gray-50"
    );
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">
            جاري تحميل بيانات السوق المحدثة...
          </p>
        </div>
      </div>
    );
  }

  // Prepare pie chart data for market distribution
  const marketDistribution = categories
    .filter((cat) => cat !== "all")
    .map((category) => ({
      name:
        category === "fruits"
          ? "الفواكه"
          : category === "vegetables"
            ? "الخضروات"
            : category === "grains"
              ? "الحبوب"
              : category === "nuts"
                ? "المكسرات"
                : "أخرى",
      value: marketPrices.filter((p) => p.category === category).length,
      fill: COLORS[categories.indexOf(category)] || "#8884d8",
    }));

  return (
    <div className="space-y-6" dir="rtl">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            السوق الذكي المتقدم
          </h1>
          <p className="text-muted-foreground">
            مراقبة مباشرة وتحليل متقدم لأسعار المحاصيل الزراعية التونسية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isRealTime ? "default" : "outline"} className="mr-2">
            {isRealTime ? "مباشر" : "ثابت"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            آخر تحديث: {lastUpdate.toLocaleTimeString("ar-TN")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
            className="ml-2"
          >
            <Activity
              className={cn("h-4 w-4 ml-2", isRealTime && "animate-pulse")}
            />
            {isRealTime ? "إيقاف المباشر" : "تشغيل المباشر"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketData}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 ml-2", isLoading && "animate-spin")}
            />
            تحديث
          </Button>
        </div>
      </div>

      {/* Enhanced Market Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي المحاصيل
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.marketSummary.totalCrops}
              </div>
              <p className="text-xs text-muted-foreground">محصول متاح</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                التنبيهات النشطة
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData.marketSummary.activeAlerts}
              </div>
              <p className="text-xs text-muted-foreground">تنبيه مهم</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                متوسط التغيير
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.marketSummary.avgPriceChange}
              </div>
              <p className="text-xs text-muted-foreground">خلال 24 ساعة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حجم التداول</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatVolume(
                  marketPrices.reduce((sum, p) => sum + p.volume, 0),
                )}
              </div>
              <p className="text-xs text-muted-foreground">طن اليوم</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اتجاه السوق</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge
                  variant={
                    dashboardData.marketSummary.marketTrend === "bullish"
                      ? "default"
                      : "secondary"
                  }
                  className="flex items-center gap-1"
                >
                  {dashboardData.marketSummary.marketTrend === "bullish" ? (
                    <>
                      <TrendingUp className="h-3 w-3" /> صاعد
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3" /> هابط
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">الاتجاه العام</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Alerts Section */}
      {marketAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              التنبيهات النشطة
            </CardTitle>
            <CardDescription>
              تنبيهات مهمة حول تحركات الأسعار والفرص الاستثمارية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketAlerts.slice(0, 3).map((alert) => (
                <Alert
                  key={alert.id}
                  className={cn(
                    "border-l-4",
                    getAlertSeverityColor(alert.severity),
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>
                          السعر الحالي: {formatPrice(alert.currentPrice)}
                        </span>
                        <Badge
                          variant={
                            alert.change.startsWith("+")
                              ? "default"
                              : "destructive"
                          }
                        >
                          {alert.change}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className="mr-2">
                      {alert.crop.name}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="prices">الأسعار المباشرة</TabsTrigger>
          <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
          <TabsTrigger value="analysis">التحليل المتقدم</TabsTrigger>
          <TabsTrigger value="alerts">إدارة التنبيهات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Market Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع السوق حسب الفئات</CardTitle>
                <CardDescription>
                  نسبة المحاصيل المختلفة في السوق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={marketDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {marketDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Price Indices Chart */}
            <Card>
              <CardHeader>
                <CardTitle>مؤشرات الأسعار</CardTitle>
                <CardDescription>مقارنة أداء الفئات المختلفة</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData && (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={Object.entries(dashboardData.priceIndices).map(
                        ([category, data]) => ({
                          category:
                            category === "fruits"
                              ? "الفواكه"
                              : category === "vegetables"
                                ? "الخضروات"
                                : category === "grains"
                                  ? "الحبوب"
                                  : "العام",
                          value: data.value,
                          change: parseFloat(data.change.replace("%", "")),
                        }),
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performers and Decliners */}
          <div className="grid md:grid-cols-2 gap-6">
            {dashboardData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ArrowUpRight className="h-5 w-5 text-green-600 ml-2" />
                      أفضل أداء اليوم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.topPerformers.map((performer, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-r-4 border-green-500"
                      >
                        <span className="font-medium">{performer.crop}</span>
                        <div className="text-left rtl:text-right">
                          <div className="font-bold text-green-600 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {performer.change}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(performer.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ArrowDownRight className="h-5 w-5 text-red-600 ml-2" />
                      أكبر انخفاض اليوم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.topDecliners.map((decliner, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-r-4 border-red-500"
                      >
                        <span className="font-medium">{decliner.crop}</span>
                        <div className="text-left rtl:text-right">
                          <div className="font-bold text-red-600 flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" />
                            {decliner.change}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(decliner.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Prices Tab */}
        <TabsContent value="prices" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">الأسعار المباشرة</h2>
            <div className="flex items-center gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="fruits">الفواكه</SelectItem>
                  <SelectItem value="vegetables">الخضروات</SelectItem>
                  <SelectItem value="grains">الحبوب</SelectItem>
                  <SelectItem value="nuts">المكسرات</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredPrices.map((price) => (
              <Card
                key={price.id}
                className="hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {price.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={getCategoryColor(price.category)}
                          >
                            {price.category === "fruits"
                              ? "فاكهة"
                              : price.category === "vegetables"
                                ? "خضروات"
                                : price.category === "grains"
                                  ? "حبوب"
                                  : price.category === "nuts"
                                    ? "مكسرات"
                                    : "أخرى"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          الحجم: {formatVolume(price.volume)} طن | الثقة:{" "}
                          {(price.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="text-left rtl:text-right space-y-1">
                      <div className="text-2xl font-bold">
                        {formatPrice(price.currentPrice)}
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Badge
                          variant={
                            price.change24h >= 0 ? "default" : "destructive"
                          }
                          className="text-xs flex items-center gap-1"
                        >
                          {price.trend === "up" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatChange(price.change24h)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        توقع الأسبوع: {formatPrice(price.nextWeekForecast)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">التحليل البياني</h2>
            <div className="flex items-center gap-2">
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="اختر المحصول" />
                </SelectTrigger>
                <SelectContent>
                  {marketPrices.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 أيام</SelectItem>
                  <SelectItem value="30d">30 يوم</SelectItem>
                  <SelectItem value="90d">90 يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تطور الأسعار والتوقعات</CardTitle>
              <CardDescription>
                الأسعار التاريخية مع توقعات الأسبوع القادم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("ar-TN")
                    }
                  />
                  <YAxis tickFormatter={(value) => `${value} د.ت`} />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("ar-TN")
                    }
                    formatter={(value: any, name: string) => [
                      `${value?.toFixed(2)} د.ت`,
                      name === "price"
                        ? "السعر"
                        : name === "forecast"
                          ? "التوقع"
                          : "الحجم",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="السعر الفعلي"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="التوقع"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>حجم التداول</CardTitle>
              <CardDescription>
                حجم التداول اليومي للمحصول المختار
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("ar-TN")
                    }
                  />
                  <YAxis tickFormatter={(value) => `${value} طن`} />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("ar-TN")
                    }
                    formatter={(value: any) => [`${value} طن`, "الحجم"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#ffc658"
                    fill="#ffc658"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-6">
            {dashboardData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      رؤى موسمية متقدمة
                    </CardTitle>
                    <CardDescription>
                      تحليلات مفصلة بناءً على البيانات التاريخية والموسمية
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.seasonalInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 rtl:space-x-reverse p-4 bg-blue-50 rounded-lg border-r-4 border-blue-500"
                        >
                          <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-900">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      مؤشرات الأسعار المتقدمة
                    </CardTitle>
                    <CardDescription>
                      مقارنة شاملة لأداء فئات المحاصيل المختلفة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(dashboardData.priceIndices).map(
                        ([category, data]) => (
                          <div
                            key={category}
                            className="text-center p-6 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-lg border"
                          >
                            <div className="text-sm text-muted-foreground mb-2 font-medium">
                              {category === "fruits"
                                ? "🍎 الفواكه"
                                : category === "vegetables"
                                  ? "🥕 الخضروات"
                                  : category === "grains"
                                    ? "🌾 الحبوب"
                                    : "📊 المؤشر العام"}
                            </div>
                            <div className="text-3xl font-bold mb-1">
                              {data.value}
                            </div>
                            <div
                              className={cn(
                                "text-sm font-medium flex items-center justify-center gap-1",
                                data.change.startsWith("+")
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {data.change.startsWith("+") ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {data.change}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Alerts Management Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">إدارة التنبيهات</h2>
            <Button>
              <Bell className="h-4 w-4 ml-2" />
              إنشاء تنبيه جديد
            </Button>
          </div>

          <div className="space-y-4">
            {marketAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={cn(
                  "border-r-4",
                  getAlertSeverityColor(alert.severity),
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{alert.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {alert.message}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{alert.crop.name}</Badge>
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "high"
                              ? "destructive"
                              : alert.severity === "medium"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {alert.severity === "critical"
                          ? "حرج"
                          : alert.severity === "high"
                            ? "عالي"
                            : alert.severity === "medium"
                              ? "متوسط"
                              : "منخفض"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          السعر الحالي:{" "}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(alert.currentPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          السعر المستهدف:{" "}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(alert.targetPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString("ar-TN")}
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                    <p className="text-sm">
                      <strong>التوصية:</strong> {alert.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
