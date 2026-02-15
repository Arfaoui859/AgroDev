import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  PieChart,
  BarChart3,
  AlertTriangle,
  Star,
  MapPin,
  Calendar,
  Target,
  Briefcase,
  Globe,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  Info,
} from "lucide-react";

interface InvestmentOpportunity {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  region: string;
  regionArabic: string;
  area: number;
  expectedYield: number;
  investmentRequired: number;
  expectedReturn: number;
  riskLevel: "low" | "medium" | "high";
  duration: number;
  farmerId: string;
  farmerRating: number;
  description: string;
  descriptionArabic: string;
  tags: string[];
  availableFrom: string;
  images: string[];
}

interface ProfitabilityAnalysis {
  cropType: string;
  cropTypeArabic: string;
  region: string;
  averageYield: number;
  averagePrice: number;
  averageCost: number;
  averageProfit: number;
  profitMargin: number;
  riskScore: number;
  marketTrend: "increasing" | "stable" | "decreasing";
  seasonality: {
    bestMonths: number[];
    worstMonths: number[];
  };
}

interface MarketInsight {
  id: string;
  title: string;
  titleArabic: string;
  content: string;
  contentArabic: string;
  category: "market_trend" | "price_alert" | "opportunity" | "risk_warning";
  importance: "low" | "medium" | "high" | "critical";
  datePublished: string;
  relevantCrops: string[];
  relevantRegions: string[];
  source: string;
}

interface PortfolioItem {
  id: string;
  investmentId: string;
  cropType: string;
  cropTypeArabic: string;
  region: string;
  investmentAmount: number;
  currentValue: number;
  returns: number;
  status: "active" | "completed" | "failed";
  startDate: string;
  endDate?: string;
  progress: number;
}

interface InvestorMetrics {
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  completedInvestments: number;
  averageReturn: number;
  portfolioValue: number;
  monthlyGrowth: number;
  riskDiversification: {
    low: number;
    medium: number;
    high: number;
  };
  cropDiversification: Record<string, number>;
  regionDiversification: Record<string, number>;
}

const InvestorDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>(
    [],
  );
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [profitability, setProfitability] = useState<ProfitabilityAnalysis[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cropType: "",
    region: "",
    riskLevel: "",
    minReturn: "",
    maxInvestment: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch main dashboard data
      const dashboardResponse = await fetch(
        "/api/investor/dashboard?investorId=demo-investor",
      );
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult.data);
        setMetrics(dashboardResult.data.overview.metrics);
        setOpportunities(dashboardResult.data.topOpportunities);
        setInsights(dashboardResult.data.marketInsights);
        setProfitability(dashboardResult.data.profitabilityAnalysis);
      }

      // Fetch portfolio
      const portfolioResponse = await fetch(
        "/api/investor/portfolio?investorId=demo-investor",
      );
      if (portfolioResponse.ok) {
        const portfolioResult = await portfolioResponse.json();
        setPortfolio(portfolioResult.data.portfolio);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات لوحة المستثمرين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredOpportunities = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/investor/opportunities?${params}`);
      if (response.ok) {
        const result = await response.json();
        setOpportunities(result.data.opportunities);
      }
    } catch (error) {
      console.error("Error fetching filtered opportunities:", error);
    }
  };

  const handleInvest = async (opportunityId: string, amount: number) => {
    try {
      const response = await fetch("/api/investor/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          investorId: "demo-investor",
          opportunityId,
          amount,
          notes: "Investment via dashboard",
        }),
      });

      if (response.ok) {
        toast({
          title: "نجح الاستثمار!",
          description: "تم إرسال طلب الاستثمار بنجاح",
        });
        await fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      toast({
        title: "خطأ في الاستثمار",
        description: "فشل في إرسال طلب الاستثمار",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "منخفض";
      case "medium":
        return "متوسط";
      case "high":
        return "عالي";
      default:
        return "غير محدد";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critical":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          💼 لوحة تحكم المستثمرين
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          اكتشف الفرص الاستثمارية الذكية، تتبع محفظتك، واحصل على رؤى السوق
          للاستثمار الزراعي المربح
        </p>
      </div>

      {/* Overview Cards */}
      {metrics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    إجمالي المحفظة
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${metrics.portfolioValue.toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-600 ml-1" />
                <span className="text-green-600 font-medium">
                  +{metrics.monthlyGrowth.toFixed(1)}%
                </span>
                <span className="text-muted-foreground mr-2">هذا الشهر</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    إجمالي الأرباح
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    ${metrics.totalReturns.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {metrics.averageReturn.toFixed(1)}%
                </span>
                <span className="text-muted-foreground mr-2">متوسط العائد</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    الاستثمارات النشطة
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {metrics.activeInvestments}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-purple-600 font-medium">
                  {metrics.completedInvestments}
                </span>
                <span className="text-muted-foreground mr-2">مكتمل</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    إجمالي المستثمر
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    ${metrics.totalInvested.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-4">
                <Progress
                  value={(metrics.totalReturns / metrics.totalInvested) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="opportunities">الفرص</TabsTrigger>
          <TabsTrigger value="portfolio">المحفظة</TabsTrigger>
          <TabsTrigger value="analysis">التحليل</TabsTrigger>
          <TabsTrigger value="insights">رؤى السوق</TabsTrigger>
          <TabsTrigger value="diversification">التنويع</TabsTrigger>
        </TabsList>

        {/* Investment Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                تصفية الفرص
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <Select
                  value={filters.cropType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, cropType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نوع المحصول" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">كل المحاصيل</SelectItem>
                    <SelectItem value="wheat">القمح</SelectItem>
                    <SelectItem value="tomatoes">الطماطم</SelectItem>
                    <SelectItem value="olives">الزيتون</SelectItem>
                    <SelectItem value="corn">الذرة</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.riskLevel}
                  onValueChange={(value) =>
                    setFilters({ ...filters, riskLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="مستوى المخاطر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">كل المستويات</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="أقل عائد (%)"
                  value={filters.minReturn}
                  onChange={(e) =>
                    setFilters({ ...filters, minReturn: e.target.value })
                  }
                />

                <Input
                  placeholder="أقصى استثما�� ($)"
                  value={filters.maxInvestment}
                  onChange={(e) =>
                    setFilters({ ...filters, maxInvestment: e.target.value })
                  }
                />

                <Button onClick={fetchFilteredOpportunities} className="w-full">
                  <Search className="h-4 w-4 ml-2" />
                  بحث
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <Card
                key={opportunity.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {opportunity.cropTypeArabic}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {opportunity.regionArabic}
                      </p>
                    </div>
                    <Badge
                      className={`${getRiskColor(opportunity.riskLevel)} border`}
                    >
                      {getRiskLabel(opportunity.riskLevel)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">المساحة</p>
                      <p className="font-medium">{opportunity.area} هكتار</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">العائد المتوقع</p>
                      <p className="font-medium text-green-600">
                        {opportunity.expectedReturn}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">المدة</p>
                      <p className="font-medium">{opportunity.duration} شهر</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">تقييم المزارع</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {opportunity.farmerRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      المبلغ المطلوب
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      ${opportunity.investmentRequired.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        handleInvest(
                          opportunity.id,
                          opportunity.investmentRequired,
                        )
                      }
                    >
                      استثمر الآن
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid gap-4">
            {portfolio.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          item.status === "active"
                            ? "bg-green-500"
                            : item.status === "completed"
                              ? "bg-blue-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div>
                        <h3 className="font-medium">{item.cropTypeArabic}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.region}
                        </p>
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">العائد</p>
                      <p
                        className={`font-medium ${
                          item.returns >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.returns >= 0 ? "+" : ""}
                        {item.returns}%
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">
                        القيمة الحالية
                      </p>
                      <p className="font-medium">
                        ${item.currentValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">الحالة</p>
                      <Badge
                        variant={
                          item.status === "active"
                            ? "default"
                            : item.status === "completed"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {item.status === "active"
                          ? "نشط"
                          : item.status === "completed"
                            ? "مكتمل"
                            : "فاشل"}
                      </Badge>
                    </div>
                  </div>

                  {item.status === "active" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>التقدم</span>
                        <span>{item.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Profitability Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-4">
            {profitability.map((analysis, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">
                        {analysis.cropTypeArabic}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {analysis.region}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(analysis.marketTrend)}
                      <Badge
                        className={`${
                          analysis.profitMargin > 20
                            ? "bg-green-100 text-green-800"
                            : analysis.profitMargin > 10
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {analysis.profitMargin.toFixed(1)}% ربح
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">متوسط الإنتاج</p>
                      <p className="font-medium">
                        {analysis.averageYield} طن/هكتار
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">متوسط السعر</p>
                      <p className="font-medium">${analysis.averagePrice}/طن</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">التكلفة</p>
                      <p className="font-medium">
                        ${analysis.averageCost}/هكتار
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الربح</p>
                      <p className="font-medium text-green-600">
                        ${analysis.averageProfit}/هكتار
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Alert
                key={insight.id}
                className={`border-l-4 ${getImportanceColor(insight.importance)}`}
              >
                <Info className="h-4 w-4" />
                <div className="flex-1">
                  <h4 className="font-medium">{insight.titleArabic}</h4>
                  <p className="text-sm mt-1">{insight.contentArabic}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(insight.datePublished).toLocaleDateString(
                        "ar-SA",
                      )}
                    </span>
                    <span>{insight.source}</span>
                    <Badge variant="outline" size="sm">
                      {insight.category === "market_trend"
                        ? "اتجاه السوق"
                        : insight.category === "price_alert"
                          ? "تنبيه سعر"
                          : insight.category === "opportunity"
                            ? "فرصة"
                            : "تحذير"}
                    </Badge>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        {/* Diversification Tab */}
        <TabsContent value="diversification" className="space-y-6">
          {metrics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    توزيع المخاطر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">منخفض المخاطر</span>
                      <span className="font-medium">
                        {metrics.riskDiversification.low}
                      </span>
                    </div>
                    <Progress
                      value={
                        (metrics.riskDiversification.low /
                          (metrics.activeInvestments +
                            metrics.completedInvestments)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">متوسط المخاطر</span>
                      <span className="font-medium">
                        {metrics.riskDiversification.medium}
                      </span>
                    </div>
                    <Progress
                      value={
                        (metrics.riskDiversification.medium /
                          (metrics.activeInvestments +
                            metrics.completedInvestments)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">عالي المخاطر</span>
                      <span className="font-medium">
                        {metrics.riskDiversification.high}
                      </span>
                    </div>
                    <Progress
                      value={
                        (metrics.riskDiversification.high /
                          (metrics.activeInvestments +
                            metrics.completedInvestments)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    توزيع المحاصيل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(metrics.cropDiversification).map(
                    ([crop, amount]) => (
                      <div key={crop} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{crop}</span>
                          <span className="font-medium">
                            ${amount.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={(amount / metrics.totalInvested) * 100}
                          className="h-2"
                        />
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestorDashboard;
