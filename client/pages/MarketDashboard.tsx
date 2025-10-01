import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketPrice {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  currency: string;
  change24h: number;
  volume: number;
  trend: 'up' | 'down';
  nextWeekForecast: number;
  confidence: number;
}

interface DashboardData {
  marketSummary: {
    totalCrops: number;
    activeAlerts: number;
    avgPriceChange: string;
    marketTrend: string;
    lastUpdated: string;
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

export default function MarketDashboard() {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Fetch current prices
      const pricesResponse = await fetch('/api/market-analysis/prices/current');
      const prices = await pricesResponse.json();
      setMarketPrices(prices);

      // Fetch dashboard data
      const dashboardResponse = await fetch('/api/market-analysis/dashboard');
      const dashboard = await dashboardResponse.json();
      setDashboardData(dashboard);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredPrices = selectedCategory === "all" 
    ? marketPrices 
    : marketPrices.filter(price => price.category === selectedCategory);

  const categories = ["all", ...Array.from(new Set(marketPrices.map(p => p.category)))];

  const formatPrice = (price: number) => `${price.toFixed(2)} د.ت`;
  const formatChange = (change: number) => `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">جاري تحميل بيانات السوق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">السوق الذكي</h1>
          <p className="text-muted-foreground">
            مراقبة مباشرة لأسعار المحاصيل والمنتجات الزراعية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            آخر تحديث: {lastUpdate.toLocaleTimeString('ar-TN')}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchMarketData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 ml-2", isLoading && "animate-spin")} />
            تحديث
          </Button>
        </div>
      </div>

      {/* Market Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المحاصيل</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.marketSummary.totalCrops}</div>
              <p className="text-xs text-muted-foreground">محصول متاح</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التنبيهات النشطة</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.marketSummary.activeAlerts}</div>
              <p className="text-xs text-muted-foreground">تنبيه مهم</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط التغيير</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.marketSummary.avgPriceChange}</div>
              <p className="text-xs text-muted-foreground">خلال 24 ساعة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اتجاه السوق</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={dashboardData.marketSummary.marketTrend === 'bullish' ? 'default' : 'secondary'}>
                  {dashboardData.marketSummary.marketTrend === 'bullish' ? 'صاعد' : 'هابط'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">الاتجاه العام</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prices">الأسعار المباشرة</TabsTrigger>
          <TabsTrigger value="performers">أداء المحاصيل</TabsTrigger>
          <TabsTrigger value="insights">رؤى السوق</TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">الأسعار المباشرة</h2>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
          </div>

          <div className="grid gap-4">
            {filteredPrices.map((price) => (
              <Card key={price.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div>
                        <h3 className="font-semibold text-lg">{price.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          الحجم: {price.volume} طن
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-left rtl:text-right space-y-1">
                      <div className="text-2xl font-bold">{formatPrice(price.currentPrice)}</div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Badge 
                          variant={price.change24h >= 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {price.trend === 'up' ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                          {formatChange(price.change24h)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        توقع الأسبوع القادم: {formatPrice(price.nextWeekForecast)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performers" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {dashboardData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 ml-2" />
                      أفضل أداء
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.topPerformers.map((performer, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">{performer.crop}</span>
                        <div className="text-left rtl:text-right">
                          <div className="font-bold text-green-600">{performer.change}</div>
                          <div className="text-sm text-muted-foreground">{formatPrice(performer.price)}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingDown className="h-5 w-5 text-red-600 ml-2" />
                      أكبر انخفاض
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.topDecliners.map((decliner, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium">{decliner.crop}</span>
                        <div className="text-left rtl:text-right">
                          <div className="font-bold text-red-600">{decliner.change}</div>
                          <div className="text-sm text-muted-foreground">{formatPrice(decliner.price)}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-6">
            {dashboardData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>رؤى موسمية</CardTitle>
                    <CardDescription>
                      تحليلات وتوقعات بناءً على البيانات الموسمية
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {dashboardData.seasonalInsights.map((insight, index) => (
                        <li key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                          <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>مؤشرات الأسعار</CardTitle>
                    <CardDescription>
                      مؤشرات الأسعار حسب فئات المحاصيل
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(dashboardData.priceIndices).map(([category, data]) => (
                        <div key={category} className="text-center p-4 bg-secondary/50 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">
                            {category === 'fruits' ? 'الفواكه' : 
                             category === 'vegetables' ? 'الخضروات' : 
                             category === 'grains' ? 'الحبوب' : 'العام'}
                          </div>
                          <div className="text-2xl font-bold">{data.value}</div>
                          <div className={cn("text-sm font-medium", 
                            data.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          )}>
                            {data.change}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
