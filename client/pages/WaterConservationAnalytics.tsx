import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Droplets, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Leaf,
  DollarSign,
  Target,
  Award,
  Calendar,
  Download,
  Filter,
  Zap,
  Globe,
  ThermometerSun,
  Wind,
  CloudRain,
  Battery,
  Recycle,
  TreePine,
  Gauge,
  ChevronDown,
  Info,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Settings
} from 'lucide-react';
import { 
  LineChart, 
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
  PieChart as RechartsPieChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { toast } from 'sonner';

interface WaterUsageData {
  period: string;
  totalUsage: number;
  savedWater: number;
  efficiency: number;
  cost: number;
  co2Saved: number;
}

interface ConservationMetrics {
  totalWaterSaved: number;
  totalCostSaved: number;
  efficiencyImprovement: number;
  co2ReductionKg: number;
  treesEquivalent: number;
  waterBudgetUtilization: number;
  sustainabilityScore: number;
}

interface SustainabilityInsights {
  category: string;
  score: number;
  description: string;
  recommendations: string[];
  impact: 'High' | 'Medium' | 'Low';
}

const WaterConservationAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<ConservationMetrics | null>(null);
  const [usageData, setUsageData] = useState<WaterUsageData[]>([]);
  const [insights, setInsights] = useState<SustainabilityInsights[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [comparisonMode, setComparisonMode] = useState<'month' | 'year' | 'season'>('month');

  // Sample data - in production, this would come from API
  const sampleMetrics: ConservationMetrics = {
    totalWaterSaved: 15420, // liters
    totalCostSaved: 485.30, // TND
    efficiencyImprovement: 28.5, // percentage
    co2ReductionKg: 12.8,
    treesEquivalent: 2.1,
    waterBudgetUtilization: 76,
    sustainabilityScore: 8.2
  };

  const sampleUsageData: WaterUsageData[] = [
    { period: 'يناير', totalUsage: 4200, savedWater: 1250, efficiency: 85, cost: 210, co2Saved: 2.1 },
    { period: 'فبراير', totalUsage: 3800, savedWater: 1180, efficiency: 88, cost: 190, co2Saved: 1.9 },
    { period: 'مارس', totalUsage: 5200, savedWater: 1650, efficiency: 82, cost: 260, co2Saved: 2.6 },
    { period: 'أبريل', totalUsage: 6800, savedWater: 2150, efficiency: 89, cost: 340, co2Saved: 3.4 },
    { period: 'مايو', totalUsage: 8500, savedWater: 2680, efficiency: 91, cost: 425, co2Saved: 4.2 },
    { period: 'يونيو', totalUsage: 12200, savedWater: 3850, efficiency: 87, cost: 610, co2Saved: 6.1 },
  ];

  const sampleInsights: SustainabilityInsights[] = [
    {
      category: 'كفاءة استخدام المياه',
      score: 89,
      description: 'نظام الري يعمل بكفاءة عالية مع توفير ملحوظ في استهلاك المياه',
      recommendations: [
        'تطبيق الري بالتنقيط في المناطق المتبقية',
        'استخدام أجهزة استشعار إضافية لتحسين الدقة',
        'جدولة الري في الأوقات المثلى'
      ],
      impact: 'High'
    },
    {
      category: 'الاستدامة البيئية',
      score: 82,
      description: 'تخفيض كبير في البصمة المائية والكربونية للمزرعة',
      recommendations: [
        'تجميع مياه الأمطار لاستخدامها في الري',
        'استخدام الطاقة الشمسية لتشغيل نظام الري',
        'زراعة أصناف أقل استهلاكاً للمياه'
      ],
      impact: 'High'
    },
    {
      category: 'التوفير الاقتصادي',
      score: 76,
      description: 'توفير مالي جيد مع إمكانية لتحسين أكبر',
      recommendations: [
        'تحليل تكاليف الكهرباء وتحسين جدولة الري',
        'الاستثمار في تقنيات توفير المياه المتقدمة',
        'مراقبة أسعار المياه وتكييف الاستراتيجية'
      ],
      impact: 'Medium'
    },
    {
      category: 'إدارة الموارد',
      score: 85,
      description: 'إدارة فعالة للموارد المائية مع مراقبة دقيقة',
      recommendations: [
        'تطوير خطة طوارئ للجفاف',
        'تحسين صيانة نظام الري الدورية',
        'تدريب العمال على أفضل الممارسات'
      ],
      impact: 'Medium'
    }
  ];

  // Chart data preparation
  const getWaterSavingsChart = () => {
    return usageData.map(data => ({
      period: data.period,
      'استهلاك فعلي': data.totalUsage - data.savedWater,
      'مياه موفرة': data.savedWater,
      'إجمالي التوفير': data.savedWater
    }));
  };

  const getEfficiencyTrend = () => {
    return usageData.map(data => ({
      period: data.period,
      efficiency: data.efficiency,
      target: 85 // Target efficiency
    }));
  };

  const getSustainabilityRadar = () => {
    return insights.map(insight => ({
      category: insight.category.substring(0, 10) + '...',
      score: insight.score,
      fullMark: 100
    }));
  };

  const getCostAnalysis = () => {
    const savedCosts = usageData.map(data => data.savedWater * 0.0005); // TND per liter
    return usageData.map((data, index) => ({
      period: data.period,
      actualCost: data.cost,
      savedCost: savedCosts[index],
      totalSavings: savedCosts.slice(0, index + 1).reduce((sum, cost) => sum + cost, 0)
    }));
  };

  const getConservationBreakdown = () => {
    const categories = [
      { name: 'ري ذكي', value: 45, color: '#3b82f6' },
      { name: 'توقيت مثالي', value: 25, color: '#10b981' },
      { name: 'صيانة النظام', value: 15, color: '#f59e0b' },
      { name: 'تقنيات متقدمة', value: 15, color: '#8b5cf6' }
    ];
    return categories;
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // In production, this would be an API call
      // const response = await fetch(`/api/smart-irrigation/analytics/user-123?period=${selectedPeriod}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics(sampleMetrics);
      setUsageData(sampleUsageData);
      setInsights(sampleInsights);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('فشل في تحميل بيانات التحليل');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['الفترة', 'الاستهلاك الإجمالي', 'المياه الموفرة', 'الكفاءة', 'التكلفة', 'توفير CO2'];
      const csvData = usageData.map(data => [
        data.period,
        data.totalUsage,
        data.savedWater,
        data.efficiency,
        data.cost,
        data.co2Saved
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير_توفير_المياه_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      // PDF export would be implemented here
      toast.success('سيتم إضافة تصدير PDF قريباً');
    }
  };

  const getSustainabilityGrade = (score: number): { grade: string; color: string; description: string } => {
    if (score >= 90) return { grade: 'ممتاز', color: 'text-green-600', description: 'أداء استثنائي في الاستدامة' };
    if (score >= 80) return { grade: 'جيد جداً', color: 'text-blue-600', description: 'أداء جيد مع إمكانية للتحسين' };
    if (score >= 70) return { grade: 'جيد', color: 'text-yellow-600', description: 'أداء مقبول يحتاج تحسين' };
    if (score >= 60) return { grade: 'متوسط', color: 'text-orange-600', description: 'يحتاج تحسين كبير' };
    return { grade: 'ضعيف', color: 'text-red-600', description: 'يحتاج إعادة تقييم شاملة' };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const waterSavingsChart = getWaterSavingsChart();
  const efficiencyTrend = getEfficiencyTrend();
  const sustainabilityRadar = getSustainabilityRadar();
  const costAnalysis = getCostAnalysis();
  const conservationBreakdown = getConservationBreakdown();
  const sustainabilityGrade = metrics ? getSustainabilityGrade(metrics.sustainabilityScore * 10) : null;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 ml-2" />
                تصدير التقرير
                <ChevronDown className="h-4 w-4 mr-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportReport('csv')}>
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('pdf')}>
                تصدير PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 ml-2" />
                الفترة: {selectedPeriod} يوم
                <ChevronDown className="h-4 w-4 mr-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedPeriod('7')}>
                7 أي��م
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod('30')}>
                30 يوم
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod('90')}>
                90 يوم
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod('365')}>
                سنة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Recycle className="h-8 w-8 text-green-600" />
          تحليلات توفير المياه والاستدامة
        </h1>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalWaterSaved.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">لتر موفر</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 ml-1" />
                <span className="text-xs text-green-600">+{metrics.efficiencyImprovement}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.totalCostSaved.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">دينار موفر</div>
              <div className="text-xs text-muted-foreground mt-1">هذا الشهر</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.co2ReductionKg.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">كغ CO₂ موفر</div>
              <div className="flex items-center justify-center mt-2">
                <TreePine className="h-4 w-4 text-green-600 ml-1" />
                <span className="text-xs text-green-600">{metrics.treesEquivalent.toFixed(1)} شجرة</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.sustainabilityScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">نقاط الاستدامة</div>
              {sustainabilityGrade && (
                <div className={`text-xs ${sustainabilityGrade.color} mt-1 font-medium`}>
                  {sustainabilityGrade.grade}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics */}
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">استخدام المياه</TabsTrigger>
          <TabsTrigger value="efficiency">الكفاءة</TabsTrigger>
          <TabsTrigger value="sustainability">الاستدامة</TabsTrigger>
          <TabsTrigger value="insights">الرؤى</TabsTrigger>
        </TabsList>

        {/* Water Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Water Savings Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  توفير المياه الشهري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={waterSavingsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="استهلاك فعلي" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="مياه موفرة" stackId="a" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  تحليل التكاليف والتوفير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="actualCost" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="التكلفة ��لفعلية"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalSavings" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="إجمالي التوفير"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Conservation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                توزيع طرق توفير المياه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={conservationBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {conservationBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  <h4 className="font-semibold">طرق التوفير الرئيسية:</h4>
                  {conservationBreakdown.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: method.color }}
                        ></div>
                        <span className="text-sm font-medium">{method.name}</span>
                      </div>
                      <span className="text-sm font-bold">{method.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficiency Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  اتجاه كفاءة الري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={efficiencyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[60, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.6}
                      name="الكفاءة الفعلية %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#ef4444" 
                      strokeDasharray="5 5"
                      name="الهدف %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Efficiency Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  مؤشرات الكفاءة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">كفاءة استخدام المياه</span>
                      <span className="text-sm text-muted-foreground">87%</span>
                    </div>
                    <Progress value={87} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">توحيد التوزيع</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">كفاءة الطاقة</span>
                      <span className="text-sm text-muted-foreground">78%</span>
                    </div>
                    <Progress value={78} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">استغلال الميزانية المائية</span>
                      <span className="text-sm text-muted-foreground">{metrics?.waterBudgetUtilization}%</span>
                    </div>
                    <Progress value={metrics?.waterBudgetUtilization || 0} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                مقارنة الأداء (قبل وبعد النظام الذكي)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg bg-red-50">
                  <div className="text-lg font-bold text-red-600">-28%</div>
                  <div className="text-sm text-muted-foreground">استهلاك المياه</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="text-lg font-bold text-green-600">+32%</div>
                  <div className="text-sm text-muted-foreground">كفاءة الري</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <div className="text-lg font-bold text-blue-600">-35%</div>
                  <div className="text-sm text-muted-foreground">تكاليف التشغيل</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-purple-50">
                  <div className="text-lg font-bold text-purple-600">+18%</div>
                  <div className="text-sm text-muted-foreground">إنتاجية المحصول</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sustainability Tab */}
        <TabsContent value="sustainability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sustainability Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  مؤشر الاستدامة الشامل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={sustainabilityRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="النقاط"
                      dataKey="score"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  التأثير البيئي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {metrics?.co2ReductionKg.toFixed(1)} كغ
                    </div>
                    <div className="text-sm text-muted-foreground">تخفيض انبعاث CO₂</div>
                    <div className="text-xs text-green-600 mt-1">
                      يعادل {metrics?.treesEquivalent.toFixed(1)} شجرة مزروعة
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">المياه المحافظ عليها</span>
                      </div>
                      <span className="font-bold text-blue-600">
                        {((metrics?.totalWaterSaved || 0) / 1000).toFixed(1)} م³
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">الطاقة الموفرة</span>
                      </div>
                      <span className="font-bold text-yellow-600">125 كيلووات</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Recycle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">إعادة استخدام المياه</span>
                      </div>
                      <span className="font-bold text-green-600">240 لتر</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sustainability Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                أهداف الاستدامة لعام 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-600">توفير المياه</h4>
                  <div className="text-2xl font-bold">65%</div>
                  <Progress value={65} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    الهدف: 25,000 لتر | المنجز: 16,250 لتر
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-green-600">تخفيض الانبعاثات</h4>
                  <div className="text-2xl font-bold">72%</div>
                  <Progress value={72} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    الهدف: 50 كغ CO₂ | المنجز: 36 كغ CO₂
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-600">كفاءة الطاقة</h4>
                  <div className="text-2xl font-bold">58%</div>
                  <Progress value={58} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    الهدف: 500 كيلووات | المنجز: 290 كيلووات
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={insight.impact === 'High' ? 'default' : insight.impact === 'Medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      تأثير {insight.impact === 'High' ? 'عالي' : insight.impact === 'Medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                    <CardTitle className="text-lg">{insight.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-primary">{insight.score}</div>
                      <div className="flex-1">
                        <Progress value={insight.score} className="h-2" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>

                    <div>
                      <h5 className="font-medium mb-2 text-sm">التوصيات:</h5>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                ملخص الرؤى والتوصيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">نقاط القوة</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>كفاءة عالية في استخدام المياه (87%)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>توفير كبير في التكاليف التشغيلية</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>تحسن ملحوظ في إنتاجية المحاصيل</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-orange-600 mb-3">مجالات التحسين</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span>تحسين كفاءة استهلاك الطاقة</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span>زيادة استخدام مصادر الطاقة المتجددة</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span>تطبيق تقنيات تجميع مياه الأمطار</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WaterConservationAnalytics;
