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
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  ArrowRight,
  Zap,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MarketSummary {
  totalCrops: number;
  avgPriceChange: string;
  marketTrend: "bullish" | "bearish";
  activeAlerts: number;
  topPerformer: {
    name: string;
    change: string;
  };
  topDecliner: {
    name: string;
    change: string;
  };
  quickStats: {
    totalVolume: number;
    marketCap: number;
  };
}

interface PriceData {
  time: string;
  value: number;
}

interface MarketAnalyticsWidgetProps {
  className?: string;
  showCharts?: boolean;
  compact?: boolean;
}

const MarketAnalyticsWidget: React.FC<MarketAnalyticsWidgetProps> = ({
  className = "",
  showCharts = true,
  compact = false,
}) => {
  const [marketSummary, setMarketSummary] = useState<MarketSummary | null>(
    null,
  );
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarketSummary();
  }, []);

  const fetchMarketSummary = async () => {
    try {
      // Fetch market dashboard data
      const response = await fetch("/api/market-analysis/dashboard");
      const data = await response.json();

      // Transform the data for our widget
      const summary: MarketSummary = {
        totalCrops: data.marketSummary.totalCrops || 10,
        avgPriceChange: data.marketSummary.avgPriceChange || "+2.3%",
        marketTrend:
          data.marketSummary.marketTrend === "bullish" ? "bullish" : "bearish",
        activeAlerts: data.marketSummary.activeAlerts || 3,
        topPerformer: data.topPerformers?.[0] || {
          name: "الزيتون",
          change: "+15%",
        },
        topDecliner: data.topDecliners?.[0] || {
          name: "البطاطا",
          change: "-3%",
        },
        quickStats: {
          totalVolume: 12500,
          marketCap: 850000,
        },
      };

      setMarketSummary(summary);

      // Generate sample price data for mini chart
      const chartData: PriceData[] = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setHours(now.getHours() - i);
        chartData.push({
          time: date.toLocaleTimeString("ar-TN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          value: 100 + Math.random() * 20 - 10,
        });
      }
      setPriceData(chartData);
    } catch (error) {
      console.error("Error fetching market summary:", error);
      // Set fallback data
      setMarketSummary({
        totalCrops: 10,
        avgPriceChange: "+2.3%",
        marketTrend: "bullish",
        activeAlerts: 3,
        topPerformer: { name: "الزيتون", change: "+15%" },
        topDecliner: { name: "البطاطا", change: "-3%" },
        quickStats: {
          totalVolume: 12500,
          marketCap: 850000,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!marketSummary) {
    return null;
  }

  if (compact) {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              ملخص السوق
            </CardTitle>
            <Badge
              variant={
                marketSummary.marketTrend === "bullish"
                  ? "default"
                  : "secondary"
              }
            >
              {marketSummary.marketTrend === "bullish" ? "صاعد" : "هابط"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center p-2 bg-secondary/20 rounded">
              <div className="font-bold text-lg">
                {marketSummary.avgPriceChange}
              </div>
              <div className="text-muted-foreground">متوسط التغيير</div>
            </div>
            <div className="text-center p-2 bg-secondary/20 rounded">
              <div className="font-bold text-lg text-orange-600">
                {marketSummary.activeAlerts}
              </div>
              <div className="text-muted-foreground">تنبيهات</div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-muted-foreground">
              أفضل أداء: {marketSummary.topPerformer.name}
            </span>
            <Badge variant="default" className="text-xs">
              {marketSummary.topPerformer.change}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              تحليلات السوق المباشرة
            </CardTitle>
            <CardDescription>نظرة شاملة على أداء السوق الزراعي</CardDescription>
          </div>
          <Badge
            variant={
              marketSummary.marketTrend === "bullish" ? "default" : "secondary"
            }
            className="flex items-center gap-1"
          >
            {marketSummary.marketTrend === "bullish" ? (
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg flex flex-col items-center gap-3">
            <div className="kpi-icon bg-primary text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {marketSummary.totalCrops}
            </div>
            <div className="text-sm text-blue-700">محاصيل متتبعة</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg flex flex-col items-center gap-3">
            <div className="kpi-icon bg-primary text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {marketSummary.avgPriceChange}
            </div>
            <div className="text-sm text-green-700">متوسط التغيير</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg flex flex-col items-center gap-3">
            <div className="kpi-icon bg-primary text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {marketSummary.activeAlerts}
            </div>
            <div className="text-sm text-orange-700">تنبيهات نشطة</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(marketSummary.quickStats.totalVolume)}
            </div>
            <div className="text-sm text-purple-700">حجم التداول</div>
          </div>
        </div>

        {/* Performance Highlights */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700">أفضل أداء اليوم</div>
                <div className="font-bold text-green-800">
                  {marketSummary.topPerformer.name}
                </div>
              </div>
              <Badge variant="default" className="bg-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {marketSummary.topPerformer.change}
              </Badge>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-700">أكبر انخفاض</div>
                <div className="font-bold text-red-800">
                  {marketSummary.topDecliner.name}
                </div>
              </div>
              <Badge variant="destructive">
                <TrendingDown className="h-3 w-3 mr-1" />
                {marketSummary.topDecliner.change}
              </Badge>
            </div>
          </div>
        </div>

        {/* Mini Price Chart */}
        {showCharts && priceData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              مؤشر الأسعار العام (آخر 7 ساعات)
            </h4>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={priceData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="text-sm">{`الوقت: ${label}`}</p>
                          <p className="text-sm font-bold">{`القيمة: ${payload[0].value?.toFixed(1)}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Active Alerts Preview */}
        {marketSummary.activeAlerts > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {marketSummary.activeAlerts} تنبيهات نشطة
              </span>
            </div>
            <p className="text-xs text-orange-700">
              لديك تنبيهات مهمة حول تحركات الأسعار والفرص الاستثمارية
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button asChild variant="default" className="flex-1">
            <Link
              to="/enhanced-market"
              className="flex items-center justify-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              السوق المتقدم
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link
              to="/market-intelligence"
              className="flex items-center justify-center gap-2"
            >
              <Target className="h-4 w-4" />
              استخبارات السوق
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon">
            <Link to="/market-dashboard">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketAnalyticsWidget;
