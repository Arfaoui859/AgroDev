import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Globe,
  Factory,
  Cloud,
  Key,
  Copy,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Info,
  ExternalLink,
  Filter,
  Search,
} from "lucide-react";

interface MarketPrice {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  currentPrice: number;
  currency: string;
  priceChange24h: number;
  priceChangePercent: number;
  volume24h: number;
  lastUpdated: string;
  region: string;
  regionArabic: string;
  quality: string;
}

interface ProductionData {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  region: string;
  regionArabic: string;
  totalProduction: number;
  area: number;
  yield: number;
  season: string;
  year: number;
  growthRate: number;
  productionTrend: string;
}

interface ExportData {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  destinationCountry: string;
  destinationCountryArabic: string;
  quantity: number;
  value: number;
  averagePrice: number;
  exportDate: string;
  growthRate: number;
  marketShare: number;
}

interface WeatherData {
  id: string;
  region: string;
  regionArabic: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  soilMoisture: number;
  date: string;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    messageArabic: string;
  }>;
}

interface APIKeyData {
  apiKey: string;
  tier: string;
  expiresAt: string;
  documentation: string;
}

const PublicDataDashboard = () => {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [exportData, setExportData] = useState<ExportData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [apiKey, setApiKey] = useState<string>("public_demo_key_12345");
  const [newApiKeyData, setNewApiKeyData] = useState<APIKeyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    crop: "",
    region: "",
    country: "",
  });
  const [keyCreationForm, setKeyCreationForm] = useState({
    name: "",
    email: "",
    tier: "free",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWithAPIKey = async (endpoint: string) => {
    const response = await fetch(
      `${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${apiKey}`,
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API request failed");
    }
    return response.json();
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      // Fetch market prices
      const pricesResult = await fetchWithAPIKey(
        "/api/public/market-prices?limit=20",
      );
      setMarketPrices(pricesResult.data);

      // Fetch production data
      const productionResult = await fetchWithAPIKey(
        "/api/public/production?limit=15",
      );
      setProductionData(productionResult.data);

      // Fetch export data
      const exportResult = await fetchWithAPIKey(
        "/api/public/exports?limit=15",
      );
      setExportData(exportResult.data);

      // Fetch weather data
      const weatherResult = await fetchWithAPIKey("/api/public/weather");
      setWeatherData(weatherResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل في تحميل البيانات من API العام",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const createAPIKey = async () => {
    if (!keyCreationForm.name || !keyCreationForm.email) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/public/create-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(keyCreationForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      setNewApiKeyData(result.data);

      toast({
        title: "تم إنشاء API Key بنجاح!",
        description: "يمكنك الآن استخدام المفتاح للوصول إلى API العام",
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء API Key",
        description:
          error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAPIKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ API Key إلى الحافظة",
    });
  };

  const downloadData = (data: any[], filename: string) => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chart data preparation
  const priceChartData = marketPrices.slice(0, 10).map((price) => ({
    name: price.cropTypeArabic,
    price: price.currentPrice,
    change: price.priceChangePercent,
  }));

  const productionChartData = productionData.slice(0, 8).map((prod) => ({
    name: prod.cropTypeArabic,
    production: prod.totalProduction,
    area: prod.area,
    yield: prod.yield,
  }));

  const exportChartData = exportData.reduce(
    (acc, exp) => {
      const existing = acc.find(
        (item) => item.country === exp.destinationCountryArabic,
      );
      if (existing) {
        existing.value += exp.value;
      } else {
        acc.push({
          country: exp.destinationCountryArabic,
          value: exp.value,
        });
      }
      return acc;
    },
    [] as Array<{ country: string; value: number }>,
  );

  const COLORS = [
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          📊 البيانات العامة الزراعية
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          بيانات حية ومحدثة عن أسعار السوق، الإنتاج الزراعي، الصادرات، والطقس في
          تونس
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={fetchAllData}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 ml-2 ${refreshing ? "animate-spin" : ""}`}
            />
            تحديث البيانات
          </Button>
          <Badge variant="secondary" className="text-sm">
            آخر تحديث: {new Date().toLocaleString("ar-SA")}
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="prices">الأسعار</TabsTrigger>
          <TabsTrigger value="production">الإنتاج</TabsTrigger>
          <TabsTrigger value="exports">الصادرات</TabsTrigger>
          <TabsTrigger value="weather">الطقس</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      إجمالي المحاصيل
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {new Set(marketPrices.map((p) => p.cropType)).size}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      متوسط الأسعار
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      $
                      {Math.round(
                        marketPrices.reduce(
                          (sum, p) => sum + p.currentPrice,
                          0,
                        ) / marketPrices.length || 0,
                      )}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      إجمالي الإنتاج
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {Math.round(
                        productionData.reduce(
                          (sum, p) => sum + p.totalProduction,
                          0,
                        ) / 1000,
                      )}
                      K طن
                    </p>
                  </div>
                  <Factory className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">
                      قيمة الصادرات
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      $
                      {Math.round(
                        exportData.reduce((sum, e) => sum + e.value, 0) /
                          1000000,
                      )}
                      M
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overview Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>أسعار المحاصيل الرئيسية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="price" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع الصادرات حسب البلد</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={exportChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ country, percent }) =>
                        `${country} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {exportChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "القيمة",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Prices Tab */}
        <TabsContent value="prices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                أسعار السوق المباشرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketPrices.slice(0, 15).map((price) => (
                  <div
                    key={price.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium">{price.cropTypeArabic}</h3>
                        <p className="text-sm text-muted-foreground">
                          {price.regionArabic} • {price.quality}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-left">
                      <div>
                        <p className="text-2xl font-bold">
                          ${price.currentPrice}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          /{price.currency}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {getTrendIcon(price.priceChange24h)}
                        <span
                          className={`font-medium ${getTrendColor(price.priceChange24h)}`}
                        >
                          {price.priceChange24h >= 0 ? "+" : ""}
                          {price.priceChangePercent.toFixed(2)}%
                        </span>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">الحجم</p>
                        <p className="font-medium">
                          {price.volume24h.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button
                  onClick={() => downloadData(marketPrices, "market-prices")}
                  variant="outline"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تحميل بيانات الأسعار
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                بيانات الإنتاج الزراعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="production"
                    fill="#22c55e"
                    name="الإنتاج (طن)"
                  />
                  <Bar dataKey="area" fill="#3b82f6" name="المساحة (هكتار)" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 text-center">
                <Button
                  onClick={() =>
                    downloadData(productionData, "production-data")
                  }
                  variant="outline"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تحميل بيانات الإنتاج
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                بيانات الصادرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {exportData.slice(0, 8).map((exp) => (
                  <div key={exp.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{exp.cropTypeArabic}</h3>
                      <Badge variant="outline">
                        {exp.destinationCountryArabic}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">الكمية</p>
                        <p className="font-medium">
                          {exp.quantity.toLocaleString()} طن
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">القيمة</p>
                        <p className="font-medium">
                          ${exp.value.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">السعر المتوسط</p>
                        <p className="font-medium">${exp.averagePrice}/طن</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">النمو</p>
                        <p
                          className={`font-medium ${getTrendColor(exp.growthRate)}`}
                        >
                          {exp.growthRate >= 0 ? "+" : ""}
                          {exp.growthRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button
                  onClick={() => downloadData(exportData, "export-data")}
                  variant="outline"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تحميل بيانات الصادرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {weatherData.map((weather) => (
              <Card key={weather.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    {weather.regionArabic}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        درجة الحرارة
                      </p>
                      <p className="text-2xl font-bold">
                        {weather.temperature}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الرطوبة</p>
                      <p className="text-2xl font-bold">{weather.humidity}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الأمطار</p>
                      <p className="text-xl font-bold">{weather.rainfall}mm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        رطوبة التربة
                      </p>
                      <p className="text-xl font-bold">
                        {weather.soilMoisture}%
                      </p>
                    </div>
                  </div>

                  {weather.alerts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">تنبيهات الطقس</h4>
                      {weather.alerts.map((alert, index) => (
                        <Alert
                          key={index}
                          className={`border-l-4 ${
                            alert.severity === "critical"
                              ? "border-l-red-500"
                              : alert.severity === "high"
                                ? "border-l-orange-500"
                                : alert.severity === "medium"
                                  ? "border-l-yellow-500"
                                  : "border-l-blue-500"
                          }`}
                        >
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            {alert.messageArabic}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={() => downloadData(weatherData, "weather-data")}
              variant="outline"
            >
              <Download className="h-4 w-4 ml-2" />
              تحميل بيانات الطقس
            </Button>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Create API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  إنشاء API Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">الاسم</label>
                  <Input
                    value={keyCreationForm.name}
                    onChange={(e) =>
                      setKeyCreationForm({
                        ...keyCreationForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="اسمك الكامل"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    value={keyCreationForm.email}
                    onChange={(e) =>
                      setKeyCreationForm({
                        ...keyCreationForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">نوع الاشتراك</label>
                  <Select
                    value={keyCreationForm.tier}
                    onValueChange={(value) =>
                      setKeyCreationForm({ ...keyCreationForm, tier: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">مجاني (100 طلب/يوم)</SelectItem>
                      <SelectItem value="basic">
                        أساسي (1000 طلب/يوم)
                      </SelectItem>
                      <SelectItem value="premium">
                        مميز (10000 طلب/يوم)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={createAPIKey}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "جاري الإنشاء..." : "إنشاء API Key"}
                </Button>

                {newApiKeyData && (
                  <Alert className="border-green-200 bg-green-50">
                    <Key className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p className="font-medium">تم إنشاء API Key بنجاح!</p>
                      <div className="flex items-center gap-2 p-2 bg-white rounded border">
                        <code className="flex-1 text-sm">
                          {newApiKeyData.apiKey}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyAPIKey(newApiKeyData.apiKey)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        احفظ هذا المفتاح في مكان آمن. لن تتمكن من رؤيته مرة
                        أخرى.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* API Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  وثائق API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">نقاط النهاية المتاحة:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>
                        • <code>/api/public/market-prices</code> - أسعار السوق
                      </li>
                      <li>
                        • <code>/api/public/production</code> - بيانات الإنتاج
                      </li>
                      <li>
                        • <code>/api/public/exports</code> - بيانات الصادرات
                      </li>
                      <li>
                        • <code>/api/public/weather</code> - بيانات الطقس
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">مثال على الاستخدام:</h4>
                    <div className="p-3 bg-gray-100 rounded text-sm">
                      <code>
                        curl -H "X-API-Key: YOUR_KEY" <br />
                        https://api.agrogrowth.com/api/public/market-prices
                      </code>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">حدود الاستخدام:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• مجاني: 100 طلب/يوم</li>
                      <li>• أساسي: 1000 طلب/يوم</li>
                      <li>• مميز: 10000 طلب/يوم</li>
                    </ul>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 ml-2" />
                  وثائق API الكاملة
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicDataDashboard;
