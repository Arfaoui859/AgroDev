import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Target,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  Activity,
  Calculator,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface CropProfitabilityData {
  cropType: string;
  seasonYear: number;
  totalInvestment: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  costBreakdown: {
    seeds: number;
    fertilizers: number;
    pesticides: number;
    labor: number;
    equipment: number;
    other: number;
  };
  revenueMetrics: {
    averagePricePerUnit: number;
    totalQuantityProduced: number;
    totalQuantitySold: number;
    qualityDistribution: Record<string, number>;
  };
}

interface AIAnalysis {
  mostProfitableCrops: {
    cropType: string;
    roi: number;
    profitMargin: number;
    netProfit: number;
  }[];
  seasonalTrends: {
    period: string;
    averageROI: number;
    averageMargin: number;
    totalProfit: number;
  }[];
  riskAssessment: {
    cropType: string;
    riskLevel: string;
    riskFactors: string[];
    recommendation: string;
  }[];
  optimizationSuggestions: string[];
}

interface ProfitabilityResponse {
  profitabilityData: CropProfitabilityData[];
  aiAnalysis: AIAnalysis;
  summary: {
    totalInvestment: number;
    totalRevenue: number;
    totalNetProfit: number;
    avgProfitMargin: number;
    avgROI: number;
  };
}

const ProfitabilityReports: React.FC = () => {
  const [data, setData] = useState<ProfitabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfitabilityData();
  }, [selectedCrop, selectedSeason]);

  const fetchProfitabilityData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCrop) params.append('cropType', selectedCrop);
      if (selectedSeason) params.append('seasonYear', selectedSeason);
      
      const response = await fetch(`/api/profitability-analysis?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching profitability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'منخفض': return 'bg-green-100 text-green-800';
      case 'متوسط': return 'bg-yellow-100 text-yellow-800';
      case 'عالي': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProfitabilityIcon = (margin: number) => {
    if (margin >= 20) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (margin >= 10) return <Activity className="h-5 w-5 text-yellow-600" />;
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  const getProfitabilityColor = (margin: number) => {
    if (margin >= 20) return 'text-green-600';
    if (margin >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getROIColor = (roi: number) => {
    if (roi >= 30) return 'text-green-600';
    if (roi >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const cropTypes = ['قمح', 'شعير', 'زيتون', 'حمضيات', 'طماطم', 'خضروات'];
  const seasons = ['2024', '2023', '2022'];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            لا توجد بيانات ربحية متاحة. يرجى إضافة المصروفات والإي��ادات أولاً.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تقارير الربحية</h1>
          <p className="text-gray-600">تحليل مفصل للأداء المالي والربحية حسب المحصول والموسم</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="جميع المحاصيل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع المحاصيل</SelectItem>
              {cropTypes.map(crop => (
                <SelectItem key={crop} value={crop}>{crop}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="جميع ا��مواسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع المواسم</SelectItem>
              {seasons.map(season => (
                <SelectItem key={season} value={season}>{season}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستثمار</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(data.summary.totalInvestment)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجم��لي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${getProfitabilityColor(data.summary.avgProfitMargin)}`}>
              {formatCurrency(data.summary.totalNetProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط هامش الربح</CardTitle>
            <PieChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${getProfitabilityColor(data.summary.avgProfitMargin)}`}>
              {data.summary.avgProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط العائد على الاستثمار</CardTitle>
            <BarChart3 className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${getROIColor(data.summary.avgROI)}`}>
              {data.summary.avgROI.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="crops">تحليل المحاصيل</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات الموسمية</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Performing Crops */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                أفضل المحاصيل أداءً
              </CardTitle>
              <CardDescription>
                ترتيب المحاصيل حسب العائد على الاستثمار (ROI)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.aiAnalysis.mostProfitableCrops.slice(0, 5).map((crop, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{crop.cropType}</h3>
                        <p className="text-sm text-gray-600">
                          صافي الربح: {formatCurrency(crop.netProfit)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">ROI:</span>
                        <span className={`font-bold ${getROIColor(crop.roi)}`}>
                          {crop.roi.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">هامش الربح:</span>
                        <span className={`font-bold ${getProfitabilityColor(crop.profitMargin)}`}>
                          {crop.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                تقييم المخاطر
              </CardTitle>
              <CardDescription>
                تحليل مستوى المخاطر لكل محصول مع التوصيات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.aiAnalysis.riskAssessment.map((assessment, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{assessment.cropType}</h3>
                        <Badge className={getRiskColor(assessment.riskLevel)}>
                          {assessment.riskLevel}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">عوامل المخاطر:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {assessment.riskFactors.map((factor, idx) => (
                              <li key={idx}>• {factor}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">التوصية:</p>
                          <p className="text-xs text-gray-600">{assessment.recommendation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crops Tab */}
        <TabsContent value="crops" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.profitabilityData.map((crop, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{crop.cropType} - {crop.seasonYear}</span>
                    {getProfitabilityIcon(crop.profitMargin)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">الاستثمار الإجمالي</p>
                      <p className="font-bold text-blue-600">{formatCurrency(crop.totalInvestment)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                      <p className="font-bold text-green-600">{formatCurrency(crop.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">صافي الربح</p>
                      <p className={`font-bold ${getProfitabilityColor(crop.profitMargin)}`}>
                        {formatCurrency(crop.netProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">هامش الربح</p>
                      <p className={`font-bold ${getProfitabilityColor(crop.profitMargin)}`}>
                        {crop.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* ROI Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">العائد على ��لاستثمار (ROI)</span>
                      <span className={`text-sm font-bold ${getROIColor(crop.roi)}`}>
                        {crop.roi.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={Math.min(crop.roi, 100)} className="h-2" />
                  </div>

                  {/* Cost Breakdown */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">توزيع التكاليف</h4>
                    <div className="space-y-2">
                      {Object.entries(crop.costBreakdown).map(([category, amount], idx) => {
                        const percentage = crop.totalInvestment > 0 ? (amount / crop.totalInvestment) * 100 : 0;
                        const categoryLabels = {
                          seeds: 'البذور',
                          fertilizers: 'الأسمدة',
                          pesticides: 'المبيدات',
                          labor: 'العمالة',
                          equipment: 'المعدات',
                          other: 'أخرى'
                        };
                        
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="w-16 text-left">{formatCurrency(amount)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Production Metrics */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">الكمية المنتجة</p>
                      <p className="font-semibold">{crop.revenueMetrics.totalQuantityProduced} كغ</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">متوسط السعر</p>
                      <p className="font-semibold">{crop.revenueMetrics.averagePricePerUnit.toFixed(2)} د.ت/كغ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                الاتجاهات الموسمية
              </CardTitle>
              <CardDescription>
                تحليل الأداء المالي عبر المواسم المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.aiAnalysis.seasonalTrends.map((trend, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{trend.period}</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">متوسط ROI</p>
                          <p className={`font-bold ${getROIColor(trend.averageROI)}`}>
                            {trend.averageROI.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">متوسط هامش الربح</p>
                          <p className={`font-bold ${getProfitabilityColor(trend.averageMargin)}`}>
                            {trend.averageMargin.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">إجمالي الربح</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(trend.totalProfit)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">مؤشر العائد على الاستثمار</p>
                        <Progress value={Math.min(trend.averageROI, 100)} className="h-3" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">مؤشر هامش الربح</p>
                        <Progress value={Math.min(trend.averageMargin, 100)} className="h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                توصيات الذكاء الاصطناعي
              </CardTitle>
              <CardDescription>
                اقتراحات لتحسين الربحية وتقليل المخاطر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.aiAnalysis.optimizationSuggestions.map((suggestion, index) => (
                  <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>{suggestion}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Benchmark */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                معايير الأداء المرجعية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800 mb-1">أداء ممتاز</h3>
                  <p className="text-sm text-green-700">هامش ربح &gt; 20%</p>
                  <p className="text-xs text-green-600">ROI &gt; 30%</p>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Activity className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-yellow-800 mb-1">أداء جيد</h3>
                  <p className="text-sm text-yellow-700">هامش ربح 10-20%</p>
                  <p className="text-xs text-yellow-600">ROI 15-30%</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-red-800 mb-1">يحتاج تحسين</h3>
                  <p className="text-sm text-red-700">هامش ربح &lt; 10%</p>
                  <p className="text-xs text-red-600">ROI &lt; 15%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-600" />
                خطة العمل المقترحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <ArrowUpRight className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">زيادة الإيرادات</h4>
                    <p className="text-sm text-blue-700">
                      ركز على المحاصيل عالية القيمة واستكشف أسواق جديدة
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <ArrowDownRight className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800">تقليل التكاليف</h4>
                    <p className="text-sm text-orange-700">
                      راجع أسعار المدخلات وابحث عن بدائل أكثر كفاءة
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <Star className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">تحسين الجودة</h4>
                    <p className="text-sm text-green-700">
                      استثمر في تحسين جودة المنتج للحصول على أسعار أفضل
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfitabilityReports;
