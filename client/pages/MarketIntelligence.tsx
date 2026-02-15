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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  MapPin,
  Coins,
  Zap,
  Brain,
  RefreshCw,
  Download,
  Share,
  Bookmark,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
  Bar,
} from "recharts";

interface MarketIntelligenceData {
  globalTrends: {
    commodity: string;
    price: number;
    change: number;
    volume: number;
    forecast: string;
  }[];
  regionalComparison: {
    country: string;
    price: number;
    competitiveness: number;
    marketShare: number;
  }[];
  seasonalAnalysis: {
    month: string;
    demand: number;
    supply: number;
    price: number;
    opportunity: number;
  }[];
  riskAssessment: {
    factor: string;
    impact: number;
    probability: number;
    mitigation: string;
  }[];
  opportunities: {
    id: string;
    title: string;
    category: string;
    potential: number;
    timeframe: string;
    description: string;
    requirements: string[];
  }[];
}

const MarketIntelligence: React.FC = () => {
  const [intelligenceData, setIntelligenceData] =
    useState<MarketIntelligenceData | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("olive");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("global");

  useEffect(() => {
    fetchIntelligenceData();
  }, [selectedCommodity]);

  const fetchIntelligenceData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - in production, this would fetch real market intelligence data
      const mockData: MarketIntelligenceData = {
        globalTrends: [
          {
            commodity: "الزيتون",
            price: 8.5,
            change: 12.3,
            volume: 1500,
            forecast: "ارتفاع",
          },
          {
            commodity: "القمح",
            price: 1.8,
            change: -2.1,
            volume: 3200,
            forecast: "مستقر",
          },
          {
            commodity: "الطماطم",
            price: 2.3,
            change: 8.7,
            volume: 950,
            forecast: "ارتفاع",
          },
          {
            commodity: "التمر",
            price: 15.0,
            change: 5.4,
            volume: 680,
            forecast: "ارتفاع",
          },
          {
            commodity: "الحمضيات",
            price: 3.2,
            change: -1.8,
            volume: 1200,
            forecast: "انخفاض",
          },
        ],
        regionalComparison: [
          { country: "تونس", price: 8.5, competitiveness: 85, marketShare: 15 },
          {
            country: "المغرب",
            price: 8.1,
            competitiveness: 88,
            marketShare: 25,
          },
          {
            country: "إسبانيا",
            price: 12.3,
            competitiveness: 75,
            marketShare: 35,
          },
          {
            country: "إيطاليا",
            price: 14.2,
            competitiveness: 70,
            marketShare: 20,
          },
          {
            country: "اليونان",
            price: 9.8,
            competitiveness: 80,
            marketShare: 12,
          },
        ],
        seasonalAnalysis: [
          {
            month: "يناير",
            demand: 70,
            supply: 60,
            price: 8.2,
            opportunity: 75,
          },
          {
            month: "فبراير",
            demand: 65,
            supply: 58,
            price: 8.5,
            opportunity: 72,
          },
          {
            month: "مارس",
            demand: 75,
            supply: 65,
            price: 8.8,
            opportunity: 78,
          },
          {
            month: "أبريل",
            demand: 80,
            supply: 70,
            price: 9.0,
            opportunity: 80,
          },
          {
            month: "مايو",
            demand: 85,
            supply: 75,
            price: 9.2,
            opportunity: 85,
          },
          {
            month: "يونيو",
            demand: 90,
            supply: 80,
            price: 9.5,
            opportunity: 88,
          },
          {
            month: "يوليو",
            demand: 95,
            supply: 85,
            price: 9.8,
            opportunity: 90,
          },
          {
            month: "أغسطس",
            demand: 92,
            supply: 88,
            price: 9.6,
            opportunity: 87,
          },
          {
            month: "سبتمبر",
            demand: 88,
            supply: 85,
            price: 9.3,
            opportunity: 85,
          },
          {
            month: "أكتوبر",
            demand: 82,
            supply: 90,
            price: 8.9,
            opportunity: 78,
          },
          {
            month: "نوفمبر",
            demand: 75,
            supply: 85,
            price: 8.6,
            opportunity: 70,
          },
          {
            month: "ديسمبر",
            demand: 70,
            supply: 80,
            price: 8.3,
            opportunity: 68,
          },
        ],
        riskAssessment: [
          {
            factor: "تقلبات المناخ",
            impact: 85,
            probability: 70,
            mitigation: "أنظمة ري ذكية",
          },
          {
            factor: "تذبذب أسعار الطاقة",
            impact: 65,
            probability: 80,
            mitigation: "طاقة متجددة",
          },
          {
            factor: "المنافسة الإقليمية",
            impact: 75,
            probability: 90,
            mitigation: "تحسين الجودة",
          },
          {
            factor: "تغيرات السياسة التجارية",
            impact: 60,
            probability: 60,
            mitigation: "تنويع الأسواق",
          },
          {
            factor: "آفات ومسببات الأمراض",
            impact: 90,
            probability: 50,
            mitigation: "مراقبة مستمرة",
          },
        ],
        opportunities: [
          {
            id: "opp1",
            title: "التصدير للأسواق الآسيوية",
            category: "تصدير",
            potential: 92,
            timeframe: "6-12 شهر",
            description: "فرصة كبيرة للتصدير لأسواق آسيا المتنامية",
            requirements: [
              "شهادات جودة دولية",
              "شراكات لوجستية",
              "تمويل إضافي",
            ],
          },
          {
            id: "opp2",
            title: "الزراعة العضوية المعتمدة",
            category: "زراعة",
            potential: 88,
            timeframe: "12-18 شهر",
            description: "التحول للزراعة العضوية لزيادة القيمة المضافة",
            requirements: ["اعتماد عضوي", "تدريب المزارعين", "أسمدة عضوية"],
          },
          {
            id: "opp3",
            title: "تقنيات الذكاء الاصطناعي",
            category: "تكنولوجيا",
            potential: 85,
            timeframe: "3-6 أشهر",
            description: "استخدام الذكاء الاصطناعي لتحسين الإنتاجية",
            requirements: ["أجهزة استشعار", "برمجيات تحليل", "تدريب تقني"],
          },
        ],
      };

      setIntelligenceData(mockData);
    } catch (error) {
      console.error("Error fetching intelligence data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">
            جاري تحميل البيانات الاستخبارية...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            استخبارات السوق المتقدمة
          </h1>
          <p className="text-muted-foreground">
            تحليلات عميقة واستراتيجية للأسواق الزراعية العالمية والإقليمية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 ml-2" />
            مشاركة
          </Button>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 ml-2" />
            حفظ
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="global">الاتجاهات العالمية</TabsTrigger>
          <TabsTrigger value="regional">المقارنة الإقليمية</TabsTrigger>
          <TabsTrigger value="seasonal">التحليل الموسمي</TabsTrigger>
          <TabsTrigger value="risks">تقييم المخاطر</TabsTrigger>
          <TabsTrigger value="opportunities">الفرص الاستثمارية</TabsTrigger>
        </TabsList>

        {/* Global Trends Tab */}
        <TabsContent value="global" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                الاتجاهات العالمية للمحاصيل الرئيسية
              </CardTitle>
              <CardDescription>
                تحليل شامل لحركة الأسعار والحجم عالمياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intelligenceData && (
                <div className="space-y-4">
                  {intelligenceData.globalTrends.map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold">
                          {trend.commodity}
                        </div>
                        <Badge
                          variant={
                            trend.forecast === "ارتفاع"
                              ? "default"
                              : trend.forecast === "انخفاض"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {trend.forecast}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold">
                            {trend.price.toFixed(2)} د.ت
                          </div>
                          <div className="text-muted-foreground">السعر</div>
                        </div>
                        <div className="text-center">
                          <div
                            className={cn(
                              "font-bold flex items-center gap-1",
                              trend.change >= 0
                                ? "text-green-600"
                                : "text-red-600",
                            )}
                          >
                            {trend.change >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {trend.change > 0 ? "+" : ""}
                            {trend.change.toFixed(1)}%
                          </div>
                          <div className="text-muted-foreground">التغيير</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{trend.volume}</div>
                          <div className="text-muted-foreground">
                            الحجم (طن)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مقارنة الأداء العالمي</CardTitle>
            </CardHeader>
            <CardContent>
              {intelligenceData && (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={intelligenceData.globalTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="commodity" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="volume"
                      fill="#8884d8"
                      name="الحجم (طن)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="price"
                      stroke="#82ca9d"
                      name="السعر (د.ت)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Comparison Tab */}
        <TabsContent value="regional" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  المقارنة الإقليمية للأسعار
                </CardTitle>
                <CardDescription>
                  مقارنة أسعار المحاصيل في دول المنطقة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {intelligenceData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={intelligenceData.regionalComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="price" fill="#8884d8" name="السعر (د.ت)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التنافسية وحصة السوق</CardTitle>
                <CardDescription>
                  تحليل القدرة التنافسية لكل دولة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {intelligenceData && (
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={intelligenceData.regionalComparison}>
                      <CartesianGrid />
                      <XAxis dataKey="competitiveness" name="التنافسية" />
                      <YAxis dataKey="marketShare" name="حصة السوق" />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          `${value}${name === "marketShare" ? "%" : ""}`,
                          name === "competitiveness"
                            ? "التنافسية"
                            : "حصة السوق",
                        ]}
                        labelFormatter={(label) => `الدولة: ${label}`}
                      />
                      <Scatter dataKey="marketShare" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تحليل ��فصيلي للمنافسة</CardTitle>
            </CardHeader>
            <CardContent>
              {intelligenceData && (
                <div className="space-y-4">
                  {intelligenceData.regionalComparison.map((country, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">
                          {country.country}
                        </h3>
                        <Badge
                          variant={
                            country.country === "تونس" ? "default" : "outline"
                          }
                        >
                          {country.marketShare}% حصة السوق
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">السعر</div>
                          <div className="font-bold">
                            {country.price.toFixed(2)} د.ت
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">التنافسية</div>
                          <div className="font-bold">
                            {country.competitiveness}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">المرتبة</div>
                          <div className="font-bold">#{index + 1}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonal Analysis Tab */}
        <TabsContent value="seasonal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                التحليل الموسمي المتقدم
              </CardTitle>
              <CardDescription>
                تحليل العرض والطلب والفرص عبر السنة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intelligenceData && (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={intelligenceData.seasonalAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="demand"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="الطلب"
                    />
                    <Area
                      type="monotone"
                      dataKey="supply"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="العرض"
                    />
                    <Line
                      type="monotone"
                      dataKey="opportunity"
                      stroke="#ffc658"
                      strokeWidth={3}
                      name="مؤشر الفرصة"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أفضل فترات البيع</CardTitle>
                <CardDescription>الأشهر الأكثر ربحية للبيع</CardDescription>
              </CardHeader>
              <CardContent>
                {intelligenceData && (
                  <div className="space-y-3">
                    {intelligenceData.seasonalAnalysis
                      .sort((a, b) => b.opportunity - a.opportunity)
                      .slice(0, 6)
                      .map((month, index) => (
                        <div
                          key={month.month}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{month.month}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-600 font-bold">
                              {month.opportunity}% فرصة
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {month.price.toFixed(2)} د.ت
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مؤشر العرض والطلب</CardTitle>
                <CardDescription>توازن السوق عبر الأشهر</CardDescription>
              </CardHeader>
              <CardContent>
                {intelligenceData && (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={intelligenceData.seasonalAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="demand"
                        stroke="#ff7300"
                        strokeWidth={2}
                        name="الطلب"
                      />
                      <Line
                        type="monotone"
                        dataKey="supply"
                        stroke="#387908"
                        strokeWidth={2}
                        name="العرض"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                مصفوفة تقييم المخاطر
              </CardTitle>
              <CardDescription>
                تحليل شامل للمخاطر المحتملة وتأثيرها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {intelligenceData && (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={intelligenceData.riskAssessment}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis />
                    <Radar
                      name="التأثير"
                      dataKey="impact"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="الاحتمالية"
                      dataKey="probability"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {intelligenceData &&
              intelligenceData.riskAssessment.map((risk, index) => (
                <Alert
                  key={index}
                  className={cn(
                    "border-l-4",
                    risk.impact > 80
                      ? "border-red-500 bg-red-50"
                      : risk.impact > 60
                        ? "border-orange-500 bg-orange-50"
                        : "border-yellow-500 bg-yellow-50",
                  )}
                >
                  <Target className="h-4 w-4" />
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{risk.factor}</h4>
                      <AlertDescription className="mt-1">
                        <strong>استراتيجية التخفيف:</strong> {risk.mitigation}
                      </AlertDescription>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">تأثير: {risk.impact}%</Badge>
                        <Badge variant="outline">
                          احتمالية: {risk.probability}%
                        </Badge>
                        <Badge
                          variant={
                            (risk.impact * risk.probability) / 100 > 60
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {(risk.impact * risk.probability) / 100 > 60
                            ? "مخاطرة عالية"
                            : "مخاطرة متوسطة"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
          </div>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid gap-6">
            {intelligenceData &&
              intelligenceData.opportunities.map((opportunity) => (
                <Card
                  key={opportunity.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          {opportunity.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {opportunity.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{opportunity.category}</Badge>
                        <Badge variant="outline">
                          {opportunity.potential}% إمكانية
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          الإطار الزمني:
                        </span>
                        <Badge variant="secondary">
                          {opportunity.timeframe}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">المتطلبات:</h4>
                        <div className="flex flex-wrap gap-2">
                          {opportunity.requirements.map((req, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          مؤشر الجاذبية:
                          <span className="font-bold text-green-600 ml-1">
                            {opportunity.potential}%
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 ml-1" />
                            تفاصيل
                          </Button>
                          <Button size="sm">
                            <Coins className="h-4 w-4 ml-1" />
                            استثمر الآن
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketIntelligence;
