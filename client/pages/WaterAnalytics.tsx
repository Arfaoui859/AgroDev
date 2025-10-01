import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { 
  Droplets, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  Waves,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Leaf,
  Factory,
  Home,
  Calculator
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WaterUsageData {
  totalWaterUsed: number;
  averageDailyUsage: number;
  costAnalysis: {
    totalCost: number;
    costPerLiter: number;
    savings: number;
  };
  efficiency: {
    score: number;
    benchmark: number;
    improvement: string;
  };
  breakdown: Array<{
    crop: string;
    waterUsed: number;
    efficiency: number;
    cost: number;
  }>;
  trends: Array<{
    date: string;
    usage: number;
    cost: number;
    efficiency: number;
  }>;
  recommendations: string[];
}

const cropTypes = [
  { id: 'olive', name: 'الزيتون', color: '#10b981' },
  { id: 'tomato', name: 'الطماطم', color: '#ef4444' },
  { id: 'wheat', name: 'القمح', color: '#f59e0b' },
  { id: 'citrus', name: 'الحمضيات', color: '#3b82f6' },
  { id: 'potato', name: 'البطاطا', color: '#8b5cf6' }
];

const periods = [
  { id: 'week', name: 'أسبوع' },
  { id: 'month', name: 'شهر' },
  { id: 'quarter', name: 'ربع سنة' },
  { id: 'year', name: 'سنة' }
];

export default function WaterAnalytics() {
  const [waterData, setWaterData] = useState<WaterUsageData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCrops, setSelectedCrops] = useState(['olive', 'tomato', 'wheat']);
  const [isLoading, setIsLoading] = useState(false);
  const [farmId] = useState('farm-001');

  const fetchWaterAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/weather-irrigation/analytics/water-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmId,
          period: selectedPeriod,
          cropTypes: selectedCrops
        }),
      });
      const data = await response.json();
      setWaterData(data);
    } catch (error) {
      console.error('Error fetching water analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaterAnalytics();
  }, [selectedPeriod, selectedCrops]);

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getEfficiencyText = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    return 'يحتاج تحسين';
  };

  const pieChartData = waterData?.breakdown.map((item, index) => ({
    name: item.crop,
    value: item.waterUsed,
    color: cropTypes[index % cropTypes.length]?.color || '#8b5cf6'
  })) || [];

  const efficiencyData = waterData?.breakdown.map(item => ({
    crop: item.crop,
    efficiency: item.efficiency,
    cost: item.cost,
    usage: item.waterUsed
  })) || [];

  const trendData = waterData?.trends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('ar-TN', { month: 'short', day: 'numeric' }),
    usage: trend.usage,
    cost: trend.cost,
    efficiency: trend.efficiency
  })) || [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تحليل استهلاك المياه</h1>
          <p className="text-muted-foreground">
            مراقبة وتحسين كفاءة استخدام المياه في الزراعة
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchWaterAnalytics} disabled={isLoading}>
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button onClick={fetchWaterAnalytics} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 ml-2", isLoading && "animate-spin")} />
            تحديث
          </Button>
        </div>
      </div>

      {waterData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Droplets className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{waterData.totalWaterUsed.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">لتر ماء</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">
                    متوسط يومي: {waterData.averageDailyUsage} لتر
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{waterData.costAnalysis.totalCost.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">د.ت</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-green-600">
                    وفر: {waterData.costAnalysis.savings.toFixed(2)} د.ت
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Target className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{waterData.efficiency.score}%</div>
                    <div className="text-xs text-muted-foreground">كفاءة الاستخدام</div>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge className={getEfficiencyBadge(waterData.efficiency.score)}>
                    {getEfficiencyText(waterData.efficiency.score)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{waterData.efficiency.improvement}</div>
                    <div className="text-xs text-muted-foreground">تحسن شهري</div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">
                    معيار: {waterData.efficiency.benchmark}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="crops">تحليل المحاصيل</TabsTrigger>
              <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
              <TabsTrigger value="optimization">التحسين</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 ml-2" />
                      توزيع استهلاك المياه حسب المحصول
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()} لتر`, 'الاستهلاك']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 ml-2" />
                      كفاءة الاستخدام حسب المحصول
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="crop" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${value}${name === 'efficiency' ? '%' : name === 'cost' ? ' د.ت' : ' لتر'}`,
                              name === 'efficiency' ? 'الكفاءة' : 
                              name === 'cost' ? 'التكلفة' : 'الاستهلاك'
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="efficiency" fill="#10b981" name="الكفاءة %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Waves className="h-5 w-5 ml-2" />
                    ملخص الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-600">نقاط القوة</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">كفاءة عالية في ري الزيتون</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">توفير في التكاليف بنسبة 12%</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">استخدام مستدام للمياه</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-yellow-600">فرص التحسين</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">تحسين ري الطماطم</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">استخدام أنظمة ري ذكية</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">مراقبة رطوبة التربة</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-blue-600">الأهداف القادمة</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">زيادة الكفاءة إلى 90%</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">توفير 20% إضافي من التكاليف</span>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">تطبيق الري الذكي</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crops" className="space-y-4">
              <div className="space-y-4">
                {waterData.breakdown.map((crop, index) => (
                  <Card key={crop.crop}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <Leaf className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{crop.crop}</h3>
                            <p className="text-muted-foreground">
                              {crop.waterUsed.toLocaleString()} لتر مستهلك
                            </p>
                          </div>
                        </div>
                        <div className="text-left rtl:text-right">
                          <div className={cn("text-2xl font-bold", getEfficiencyColor(crop.efficiency))}>
                            {crop.efficiency}%
                          </div>
                          <Badge className={getEfficiencyBadge(crop.efficiency)}>
                            {getEfficiencyText(crop.efficiency)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">الاستهلاك</Label>
                          <div className="text-lg font-semibold">{crop.waterUsed.toLocaleString()} لتر</div>
                          <Progress value={(crop.waterUsed / waterData.totalWaterUsed) * 100} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {((crop.waterUsed / waterData.totalWaterUsed) * 100).toFixed(1)}% من الإجمالي
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">الكفاءة</Label>
                          <div className="text-lg font-semibold">{crop.efficiency}%</div>
                          <Progress value={crop.efficiency} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {crop.efficiency >= 80 ? 'أداء ممتاز' : 
                             crop.efficiency >= 60 ? 'أداء جيد' : 'يحتاج تحسين'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">التكلفة</Label>
                          <div className="text-lg font-semibold">{crop.cost.toFixed(2)} د.ت</div>
                          <div className="text-xs text-muted-foreground">
                            {((crop.cost / waterData.costAnalysis.totalCost) * 100).toFixed(1)}% من إجمالي التكلفة
                          </div>
                          <div className="text-xs text-green-600">
                            {(crop.cost / crop.waterUsed * 1000).toFixed(3)} د.ت/م³
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 ml-2" />
                      اتجاهات الاستهلاك
                    </CardTitle>
                    <CardDescription>
                      تطور استهلاك المياه والكفاءة عبر الزمن
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="usage" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="الاستهلاك (لتر)" />
                          <Area type="monotone" dataKey="efficiency" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="الكفاءة %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 ml-2" />
                      تطور التكاليف
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value} د.ت`, 'التكلفة اليومية']}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="cost" stroke="#f59e0b" name="التكلفة اليومية (د.ت)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 ml-2" />
                      توصيات التحسين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {waterData.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse p-3 bg-blue-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="h-5 w-5 ml-2" />
                      إمكانيات التوفير
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">تحسين أنظمة الري</span>
                          <Badge variant="outline">30% توفير</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          استخدام أنظمة الري بالتنقيط يمكن أن يوفر حتى 30% من استهلاك المياه
                        </div>
                        <div className="text-sm font-medium text-green-600 mt-2">
                          توفير متوقع: {(waterData.costAnalysis.totalCost * 0.3).toFixed(2)} د.ت شهرياً
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">مراقبة رطوبة التربة</span>
                          <Badge variant="outline">15% توفير</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          أجهزة استشعار رطوبة التربة تمنع الري المفرط
                        </div>
                        <div className="text-sm font-medium text-green-600 mt-2">
                          توفير متوقع: {(waterData.costAnalysis.totalCost * 0.15).toFixed(2)} د.ت شهرياً
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">جمع مياه الأمطار</span>
                          <Badge variant="outline">25% توفير</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          تجميع وتخزين مياه الأمطار للاستخدام في الري
                        </div>
                        <div className="text-sm font-medium text-green-600 mt-2">
                          توفير متوقع: {(waterData.costAnalysis.totalCost * 0.25).toFixed(2)} د.ت شهرياً
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>خطة التحسين المق��رحة</CardTitle>
                  <CardDescription>
                    خطة تدريجية لتحسين كفاءة استخدام المياه
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">1</span>
                          </div>
                          <h4 className="font-semibold">المرحلة الأولى</h4>
                        </div>
                        <ul className="text-sm space-y-1">
                          <li>• تركيب أجهزة قياس رطوبة التربة</li>
                          <li>• تحسين جداول الري الحالية</li>
                          <li>• تدريب الفريق على التقنيات الجديدة</li>
                        </ul>
                        <div className="mt-3 text-xs text-muted-foreground">
                          المدة: 2-4 أسابيع
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-yellow-600">2</span>
                          </div>
                          <h4 className="font-semibold">المرحلة الثانية</h4>
                        </div>
                        <ul className="text-sm space-y-1">
                          <li>• ترقية نظام الري إلى التنقيط</li>
                          <li>• تركيب نظام جمع مياه الأمطار</li>
                          <li>• إضافة النشارة لتقليل التبخر</li>
                        </ul>
                        <div className="mt-3 text-xs text-muted-foreground">
                          المدة: 1-2 شهر
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">3</span>
                          </div>
                          <h4 className="font-semibold">المرحلة الثالثة</h4>
                        </div>
                        <ul className="text-sm space-y-1">
                          <li>• تطبيق نظام الري الذكي</li>
                          <li>• ربط الأنظمة بتطبيق المراقبة</li>
                          <li>• مراقبة مستمرة وتحسين</li>
                        </ul>
                        <div className="mt-3 text-xs text-muted-foreground">
                          المدة: مستمر
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">النتائج المتوقعة</h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">توفير المياه:</span>
                          <div className="text-green-600 font-bold">40-50%</div>
                        </div>
                        <div>
                          <span className="font-medium">توفير التكاليف:</span>
                          <div className="text-green-600 font-bold">35-45%</div>
                        </div>
                        <div>
                          <span className="font-medium">تحسين الكفاءة:</span>
                          <div className="text-green-600 font-bold">25-30%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function Label({ children, className, ...props }: any) {
  return <label className={cn("text-sm font-medium", className)} {...props}>{children}</label>;
}
