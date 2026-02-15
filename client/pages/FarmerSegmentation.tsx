import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Brain,
  Users,
  TrendingUp,
  Target,
  Zap,
  Star,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
  RefreshCw,
  Filter,
  Search,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Gauge,
} from "lucide-react";

interface FarmerSegment {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  descriptionArabic: string;
  color: string;
  icon: string;
  characteristics: string[];
  characteristicsArabic: string[];
  recommendedServices: string[];
  recommendedServicesArabic: string[];
  marketingPriority: number;
  supportLevel: string;
  predictiveInsights: {
    growthPotential: number;
    churnRisk: number;
    upsellOpportunity: number;
    referralLikelihood: number;
  };
}

interface FarmerProfile {
  id: string;
  name: string;
  nameArabic: string;
  location: string;
  locationArabic: string;
  farmSize: number;
  primaryCrops: string[];
  primaryCropsArabic: string[];
  farmingType: string;
  experience: number;
  annualRevenue: number;
  technologyAdoption: number;
  sustainabilityPractices: number;
}

interface SegmentationResult {
  farmerId: string;
  segmentId: string;
  confidence: number;
  alternativeSegments: Array<{
    segmentId: string;
    confidence: number;
  }>;
  keyFactors: Array<{
    factor: string;
    factorArabic: string;
    impact: number;
    weight: number;
  }>;
  recommendations: Array<{
    type: string;
    typeArabic: string;
    priority: number;
    description: string;
    descriptionArabic: string;
    expectedImpact: number;
  }>;
}

interface SegmentationAnalytics {
  segmentStats: Array<{
    segment: FarmerSegment;
    farmerCount: number;
    percentage: number;
    totalRevenue: number;
    avgRevenue: number;
    avgFarmSize: number;
    avgTechAdoption: number;
    growthPotential: number;
    marketingPriority: number;
  }>;
  insights: {
    mostPopularSegment: any;
    highestRevenueSegment: any;
    highestGrowthPotential: any;
    recommendedFocus: any[];
  };
}

const FarmerSegmentation = () => {
  const [segments, setSegments] = useState<FarmerSegment[]>([]);
  const [analytics, setAnalytics] = useState<SegmentationAnalytics | null>(
    null,
  );
  const [allSegmentations, setAllSegmentations] = useState<any>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<string>("");
  const [farmerSegmentation, setFarmerSegmentation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSegmentationData();
  }, []);

  const fetchSegmentationData = async () => {
    setLoading(true);
    try {
      // Fetch segments
      const segmentsResponse = await fetch("/api/segmentation/segments");
      if (segmentsResponse.ok) {
        const segmentsData = await segmentsResponse.json();
        setSegments(segmentsData.data);
      }

      // Fetch analytics
      const analyticsResponse = await fetch("/api/segmentation/analytics");
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data);
      }

      // Fetch all segmentations
      const allSegmentationsResponse = await fetch("/api/segmentation/all");
      if (allSegmentationsResponse.ok) {
        const allSegmentationsData = await allSegmentationsResponse.json();
        setAllSegmentations(allSegmentationsData.data);
      }
    } catch (error) {
      console.error("Error fetching segmentation data:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات التصنيف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const segmentSpecificFarmer = async (farmerId: string) => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/segmentation/farmer/${farmerId}`);
      if (response.ok) {
        const data = await response.json();
        setFarmerSegmentation(data.data);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تصنيف المزارع",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await fetchSegmentationData();
    setRefreshing(false);
    toast({
      title: "تم التحديث!",
      description: "تم تحديث بيانات التصنيف بنجاح",
    });
  };

  // Chart data preparation
  const segmentDistributionData =
    analytics?.segmentStats.map((stat) => ({
      name: stat.segment.nameArabic,
      value: stat.farmerCount,
      percentage: stat.percentage,
      color: stat.segment.color,
      icon: stat.segment.icon,
    })) || [];

  const revenueBySegmentData =
    analytics?.segmentStats.map((stat) => ({
      name: stat.segment.nameArabic,
      avgRevenue: stat.avgRevenue,
      totalRevenue: stat.totalRevenue,
      color: stat.segment.color,
    })) || [];

  const growthPotentialData =
    analytics?.segmentStats.map((stat) => ({
      name: stat.segment.nameArabic,
      growth: stat.growthPotential,
      marketing: stat.marketingPriority,
      farmers: stat.farmerCount,
      color: stat.segment.color,
    })) || [];

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  const getSegmentIcon = (segmentId: string) => {
    const segment = segments.find((s) => s.id === segmentId);
    return segment?.icon || "👤";
  };

  const getSegmentColor = (segmentId: string) => {
    const segment = segments.find((s) => s.id === segmentId);
    return segment?.color || "#gray";
  };

  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case "basic":
        return "bg-gray-100 text-gray-800";
      case "standard":
        return "bg-blue-100 text-blue-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSupportLevelLabel = (level: string) => {
    switch (level) {
      case "basic":
        return "أساسي";
      case "standard":
        return "قياسي";
      case "premium":
        return "مميز";
      case "enterprise":
        return "مؤسسي";
      default:
        return level;
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
          🧩 محرك تصنيف الفلاحين الذكي
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          تصنيف تلقائي للمزارعين باستخدام الذكاء الاصطناعي لتحسين الخدمات وتخصيص
          التجربة
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={refreshAnalytics}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 ml-2 ${refreshing ? "animate-spin" : ""}`}
            />
            تحديث التحليل
          </Button>
          <Badge variant="secondary" className="text-sm">
            آخر تحديث: {analytics ? new Date().toLocaleString("ar-SA") : "--"}
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      {analytics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    إجمالي الفئات
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {analytics.segmentStats.length}
                  </p>
                </div>
                <PieChartIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">
                    أعلى فئة نمو
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    {
                      analytics.insights.highestGrowthPotential?.segment
                        ?.nameArabic
                    }
                  </p>
                  <p className="text-sm text-green-600">
                    {analytics.insights.highestGrowthPotential?.growthPotential}
                    /10
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    أعلى فئة إيرادات
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {
                      analytics.insights.highestRevenueSegment?.segment
                        ?.nameArabic
                    }
                  </p>
                  <p className="text-sm text-purple-600">
                    $
                    {Math.round(
                      analytics.insights.highestRevenueSegment?.avgRevenue || 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    أكبر فئة
                  </p>
                  <p className="text-lg font-bold text-orange-900">
                    {analytics.insights.mostPopularSegment?.segment?.nameArabic}
                  </p>
                  <p className="text-sm text-orange-600">
                    {analytics.insights.mostPopularSegment?.farmerCount} مزارع
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="segments">الفئات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="individual">تصنيف فردي</TabsTrigger>
          <TabsTrigger value="insights">الرؤى</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Segment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  توزيع المزارعين حسب الفئات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name} ${percentage.toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} مزارع`, "العدد"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Segment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  متوسط الإيرادات حسب الفئة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBySegmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "متوسط الإيرادات",
                      ]}
                    />
                    <Bar dataKey="avgRevenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            {analytics?.segmentStats.slice(0, 3).map((stat) => (
              <Card
                key={stat.segment.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl">{stat.segment.icon}</div>
                    <div>
                      <h3 className="font-semibold">
                        {stat.segment.nameArabic}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {stat.farmerCount} مزارع ({stat.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>متوسط الإيرادات</span>
                      <span className="font-medium">
                        ${stat.avgRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>متوسط حجم المزرعة</span>
                      <span className="font-medium">
                        {stat.avgFarmSize.toFixed(1)} هكتار
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>إمكانية النمو</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={stat.growthPotential * 10}
                          className="w-16 h-2"
                        />
                        <span className="font-medium">
                          {stat.growthPotential}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {segments.map((segment) => (
              <Card
                key={segment.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader
                  style={{
                    borderLeftColor: segment.color,
                    borderLeftWidth: "4px",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{segment.icon}</div>
                      <div>
                        <CardTitle className="text-lg">
                          {segment.nameArabic}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {segment.descriptionArabic}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        className={getSupportLevelColor(segment.supportLevel)}
                      >
                        {getSupportLevelLabel(segment.supportLevel)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {segment.marketingPriority}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">الخصائص الرئيسية:</h4>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristicsArabic
                        .slice(0, 3)
                        .map((char, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {char}
                          </Badge>
                        ))}
                      {segment.characteristicsArabic.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{segment.characteristicsArabic.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">الخدمات الموصى بها:</h4>
                    <div className="flex flex-wrap gap-1">
                      {segment.recommendedServicesArabic
                        .slice(0, 3)
                        .map((service, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>إمكانية النمو</span>
                        <span className="font-medium text-green-600">
                          {segment.predictiveInsights.growthPotential}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>مخاطر الفقدان</span>
                        <span className="font-medium text-red-600">
                          {segment.predictiveInsights.churnRisk}/10
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>فرص البيع</span>
                        <span className="font-medium text-blue-600">
                          {segment.predictiveInsights.upsellOpportunity}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>احتمالية الإحالة</span>
                        <span className="font-medium text-purple-600">
                          {segment.predictiveInsights.referralLikelihood}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                إمكانية النمو مقابل أولوية التسويق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={growthPotentialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="growth" fill="#10b981" name="إمكانية النمو" />
                  <Bar
                    dataKey="marketing"
                    fill="#3b82f6"
                    name="أولوية التسويق"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {analytics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>الفئات الموصى بالتركيز عليها</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics.insights.recommendedFocus.map(
                    (focus: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="text-2xl">{focus.segment.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {focus.segment.nameArabic}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {focus.farmerCount} مزارع • أولوية{" "}
                            {focus.marketingPriority}/10
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700"
                        >
                          موصى به
                        </Badge>
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ملخص الرؤى</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">
                        الفئة الأكثر شعبية
                      </h4>
                    </div>
                    <p className="text-sm text-blue-800">
                      {
                        analytics.insights.mostPopularSegment?.segment
                          ?.nameArabic
                      }
                      ({analytics.insights.mostPopularSegment?.farmerCount}{" "}
                      مزارع)
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-900">
                        أعلى إيرادات
                      </h4>
                    </div>
                    <p className="text-sm text-green-800">
                      {
                        analytics.insights.highestRevenueSegment?.segment
                          ?.nameArabic
                      }
                      ($
                      {Math.round(
                        analytics.insights.highestRevenueSegment?.avgRevenue ||
                          0,
                      ).toLocaleString()}
                      )
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <h4 className="font-medium text-purple-900">
                        أعلى إمكانية نمو
                      </h4>
                    </div>
                    <p className="text-sm text-purple-800">
                      {
                        analytics.insights.highestGrowthPotential?.segment
                          ?.nameArabic
                      }
                      (
                      {
                        analytics.insights.highestGrowthPotential
                          ?.growthPotential
                      }
                      /10)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Individual Segmentation Tab */}
        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                تصنيف مزارع محدد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select
                  value={selectedFarmer}
                  onValueChange={setSelectedFarmer}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر مزارع للتصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer_001">سامي العرفاوي</SelectItem>
                    <SelectItem value="farmer_002">فاطمة بن علي</SelectItem>
                    <SelectItem value="farmer_003">عمر خالد</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() =>
                    selectedFarmer && segmentSpecificFarmer(selectedFarmer)
                  }
                  disabled={!selectedFarmer || refreshing}
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Brain className="h-4 w-4 ml-2" />
                  )}
                  تصنيف
                </Button>
              </div>

              {farmerSegmentation && (
                <div className="space-y-6 mt-6">
                  {/* Farmer Profile */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {farmerSegmentation.farmer.nameArabic.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {farmerSegmentation.farmer.nameArabic}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {farmerSegmentation.farmer.locationArabic} •{" "}
                            {farmerSegmentation.farmer.farmSize} هكتار
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">الخبرة</p>
                          <p className="font-medium">
                            {farmerSegmentation.farmer.experience} سنة
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            تبني التكنولوجيا
                          </p>
                          <p className="font-medium">
                            {farmerSegmentation.farmer.technologyAdoption}/10
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            الإيرادات السنوية
                          </p>
                          <p className="font-medium">
                            $
                            {farmerSegmentation.farmer.annualRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            المحاصيل الأساسية
                          </p>
                          <p className="font-medium">
                            {farmerSegmentation.farmer.primaryCropsArabic.join(
                              ", ",
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Segmentation Result */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          نتيجة التصنيف
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                          <div className="text-3xl">
                            {getSegmentIcon(
                              farmerSegmentation.segmentation.segmentId,
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {
                                segments.find(
                                  (s) =>
                                    s.id ===
                                    farmerSegmentation.segmentation.segmentId,
                                )?.nameArabic
                              }
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              دقة التصنيف:{" "}
                              {(
                                farmerSegmentation.segmentation.confidence * 100
                              ).toFixed(1)}
                              %
                            </p>
                            <Progress
                              value={
                                farmerSegmentation.segmentation.confidence * 100
                              }
                              className="w-40 h-2 mt-2"
                            />
                          </div>
                        </div>

                        {farmerSegmentation.segmentation.alternativeSegments
                          .length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">فئات بديلة:</h5>
                            <div className="space-y-2">
                              {farmerSegmentation.segmentation.alternativeSegments
                                .slice(0, 2)
                                .map((alt: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span>
                                      {getSegmentIcon(alt.segmentId)}{" "}
                                      {
                                        segments.find(
                                          (s) => s.id === alt.segmentId,
                                        )?.nameArabic
                                      }
                                    </span>
                                    <span className="text-muted-foreground">
                                      {(alt.confidence * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gauge className="h-5 w-5" />
                          العوامل الرئيسية
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {farmerSegmentation.segmentation.keyFactors.map(
                            (factor: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between"
                              >
                                <span className="text-sm">
                                  {factor.factorArabic}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      factor.impact > 0.5
                                        ? "bg-green-500"
                                        : factor.impact > 0
                                          ? "bg-yellow-500"
                                          : factor.impact > -0.5
                                            ? "bg-orange-500"
                                            : "bg-red-500"
                                    }`}
                                  />
                                  <span className="text-xs font-medium w-8">
                                    {factor.impact > 0 ? "+" : ""}
                                    {(factor.impact * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  {farmerSegmentation.segmentation.recommendations.length >
                    0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-600" />
                          التوصيات الذكية
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {farmerSegmentation.segmentation.recommendations.map(
                            (rec: any, index: number) => (
                              <div
                                key={index}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">
                                    {rec.typeArabic}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm">
                                      {rec.priority}/10
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {rec.descriptionArabic}
                                </p>
                                <div className="flex items-center justify-between text-xs">
                                  <span>التأثير المتوقع</span>
                                  <span className="font-medium">
                                    {rec.expectedImpact}/10
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  رؤى الذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    تحسين التجزئة
                  </h4>
                  <p className="text-sm text-blue-800">
                    يمكن تحسين دقة التصنيف بـ 15% من خلال جمع بيانات إضافية حول
                    سلوك المستخدم في المنصة.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    فرصة النمو
                  </h4>
                  <p className="text-sm text-green-800">
                    67% من المزارعين في فئة "المتعلم التقليدي" يظهرون إمكانية
                    للانتقال إلى فئة "المطور المشارك".
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">
                    تحذير الانحدار
                  </h4>
                  <p className="text-sm text-yellow-800">
                    15% من فئة "رائد التكنولوجيا" يظهرون علامات انخفاض في النشاط
                    ويحتاجون لاهتمام خاص.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">
                    توصية التخصيص
                  </h4>
                  <p className="text-sm text-purple-800">
                    تخصيص المحتوى حسب الفئة يمكن أن يزيد معدل المشاركة بنسبة
                    40%.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  خطة العمل الموصى بها
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">تطوير رحلات مستخدم مخصصة</h4>
                      <p className="text-sm text-muted-foreground">
                        إنشاء مسارات تفاعل مختلفة لكل فئة لتحسين التجربة
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">برامج الاحتفاظ المتقدمة</h4>
                      <p className="text-sm text-muted-foreground">
                        تصميم برامج خاصة لمنع انحدار المزارعين من الفئات العليا
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">محتوى تعليمي مدرج</h4>
                      <p className="text-sm text-muted-foreground">
                        بناء مسارات تعليمية تدريجية لرفع مستوى المزارعين
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">نظام مكافآت متدرج</h4>
                      <p className="text-sm text-muted-foreground">
                        تطبيق حوافز مختلفة لتشجيع الانتقال بين الفئات
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmerSegmentation;
