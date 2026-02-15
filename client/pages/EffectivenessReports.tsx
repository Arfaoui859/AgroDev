import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown,
  Star,
  FileText,
  Calendar,
  Sprout,
  Droplets,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  Plus,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EffectivenessReport {
  id: string;
  applicationId: string;
  productName: string;
  productType: 'fertilizer' | 'pesticide';
  applicationDate: string;
  cropType: string;
  farmSize: number;
  beforeCondition: {
    healthScore: number;
    yieldEstimate: number;
    pestLevel: number;
    nutrientLevel: number;
  };
  afterCondition: {
    healthScore: number;
    yieldEstimate: number;
    pestLevel: number;
    nutrientLevel: number;
  };
  userRating: number;
  effectivenessScore: number;
  improvements: string[];
  futureRecommendations: string[];
  weatherConditions: {
    temperature: number;
    humidity: number;
    wind: number;
  };
  cost: number;
  notes?: string;
}

const mockReports: EffectivenessReport[] = [
  {
    id: '1',
    applicationId: 'app-001',
    productName: 'سماد NPK متوازن',
    productType: 'fertilizer',
    applicationDate: '2024-01-10',
    cropType: 'olive',
    farmSize: 2.5,
    beforeCondition: {
      healthScore: 65,
      yieldEstimate: 1200,
      pestLevel: 15,
      nutrientLevel: 40
    },
    afterCondition: {
      healthScore: 82,
      yieldEstimate: 1450,
      pestLevel: 12,
      nutrientLevel: 75
    },
    userRating: 4,
    effectivenessScore: 88,
    improvements: [
      'تحسن ملحوظ في صحة النبات',
      'زيادة في كثافة الأوراق',
      'تحسن في لون الأوراق'
    ],
    futureRecommendations: [
      'المتابعة مع نفس المنتج',
      'تقليل الجرعة بنسبة 10%',
      'إضافة عناصر صغرى'
    ],
    weatherConditions: {
      temperature: 22,
      humidity: 65,
      wind: 8
    },
    cost: 480.5,
    notes: 'استجابة ممتازة للتسميد، يُنصح بالاستمرار'
  },
  {
    id: '2',
    applicationId: 'app-002',
    productName: 'كبريتات النحاس',
    productType: 'pesticide',
    applicationDate: '2024-01-15',
    cropType: 'tomato',
    farmSize: 1.8,
    beforeCondition: {
      healthScore: 55,
      yieldEstimate: 800,
      pestLevel: 35,
      nutrientLevel: 60
    },
    afterCondition: {
      healthScore: 78,
      yieldEstimate: 980,
      pestLevel: 8,
      nutrientLevel: 62
    },
    userRating: 5,
    effectivenessScore: 92,
    improvements: [
      'انخفاض كبير في الإصابة بالفطريات',
      'تحسن في مظهر الأوراق',
      'زيادة في معدل النمو'
    ],
    futureRecommendations: [
      'إعادة التطبيق بعد 15 يوم',
      'مراقبة العودة للإصابة',
      'استخدام مبيد وقائي'
    ],
    weatherConditions: {
      temperature: 18,
      humidity: 70,
      wind: 12
    },
    cost: 125.0,
    notes: 'علاج فعال جداً ضد تبقع الأوراق'
  },
  {
    id: '3',
    applicationId: 'app-003',
    productName: 'زيت النيم الطبيعي',
    productType: 'pesticide',
    applicationDate: '2024-01-18',
    cropType: 'citrus',
    farmSize: 3.2,
    beforeCondition: {
      healthScore: 70,
      yieldEstimate: 2100,
      pestLevel: 25,
      nutrientLevel: 65
    },
    afterCondition: {
      healthScore: 75,
      yieldEstimate: 2200,
      pestLevel: 18,
      nutrientLevel: 67
    },
    userRating: 3,
    effectivenessScore: 68,
    improvements: [
      'انخفاض طفيف في الحشرات الماصة',
      'لا تأثير سلبي على النحل',
      'تحسن في نشاط الحشرات النافعة'
    ],
    futureRecommendations: [
      'زيادة تركيز المحلول',
      'تكرار التطبيق كل 7 أيام',
      'دمج مع مبيد آخر'
    ],
    weatherConditions: {
      temperature: 25,
      humidity: 80,
      wind: 15
    },
    cost: 195.8,
    notes: 'فعالية متوسطة، يحتاج تحسين'
  }
];

const effectivenessData = [
  { month: 'ديسمبر', fertilizer: 85, pesticide: 78, overall: 82 },
  { month: 'يناير', fertilizer: 88, pesticide: 82, overall: 85 },
  { month: 'فبراير', fertilizer: 92, pesticide: 85, overall: 89 },
  { month: 'مارس', fertilizer: 89, pesticide: 88, overall: 89 },
];

const costEffectivenessData = [
  { product: 'NPK متوازن', cost: 480, effectiveness: 88, roi: 2.4 },
  { product: 'كبريتات النحاس', cost: 125, effectiveness: 92, roi: 3.2 },
  { product: 'زيت النيم', cost: 196, effectiveness: 68, roi: 1.8 },
  { product: 'فوسفات عالي', cost: 340, effectiveness: 85, roi: 2.1 },
];

const productPerformanceData = [
  { name: 'ممتاز (85-100)', value: 35, color: '#10b981' },
  { name: 'جيد (70-84)', value: 45, color: '#3b82f6' },
  { name: 'متوسط (55-69)', value: 15, color: '#f59e0b' },
  { name: 'ضعيف (أقل من 55)', value: 5, color: '#ef4444' },
];

export default function EffectivenessReports() {
  const [reports, setReports] = useState<EffectivenessReport[]>(mockReports);
  const [filteredReports, setFilteredReports] = useState<EffectivenessReport[]>(mockReports);
  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EffectivenessReport | null>(null);
  const [newReport, setNewReport] = useState({
    productName: '',
    productType: 'fertilizer' as 'fertilizer' | 'pesticide',
    cropType: 'olive',
    userRating: 5,
    notes: '',
    beforeHealthScore: 50,
    afterHealthScore: 70
  });

  useEffect(() => {
    let filtered = reports;
    
    if (filterCrop !== 'all') {
      filtered = filtered.filter(report => report.cropType === filterCrop);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(report => report.productType === filterType);
    }
    
    // Filter by date period
    const daysAgo = parseInt(filterPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    filtered = filtered.filter(report => 
      new Date(report.applicationDate) >= cutoffDate
    );
    
    setFilteredReports(filtered);
  }, [reports, filterCrop, filterType, filterPeriod]);

  const addNewReport = async () => {
    const reportData = {
      ...newReport,
      applicationId: `app-${Date.now()}`,
      applicationDate: new Date().toISOString().split('T')[0],
      farmSize: 2.0,
      beforeCondition: {
        healthScore: newReport.beforeHealthScore,
        yieldEstimate: 1000,
        pestLevel: 20,
        nutrientLevel: 50
      },
      afterCondition: {
        healthScore: newReport.afterHealthScore,
        yieldEstimate: 1200,
        pestLevel: 10,
        nutrientLevel: 70
      },
      weatherConditions: {
        temperature: 20,
        humidity: 65,
        wind: 10
      },
      cost: 250
    };

    try {
      const response = await fetch('/api/fertilizer/track/effectiveness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });
      
      if (response.ok) {
        const result = await response.json();
        const newReportWithAnalysis: EffectivenessReport = {
          id: Date.now().toString(),
          ...reportData,
          effectivenessScore: result.effectivenessScore || 75,
          improvements: result.improvements || ['تحسن عام في حالة النبات'],
          futureRecommendations: result.recommendations || ['متابعة المراقبة'],
        };
        
        setReports(prev => [newReportWithAnalysis, ...prev]);
        setShowAddDialog(false);
        setNewReport({
          productName: '',
          productType: 'fertilizer',
          cropType: 'olive',
          userRating: 5,
          notes: '',
          beforeHealthScore: 50,
          afterHealthScore: 70
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 55) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 15) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (improvement > 5) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    if (improvement > 0) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const calculateAverageEffectiveness = () => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc, report) => acc + report.effectivenessScore, 0);
    return Math.round(sum / filteredReports.length);
  };

  const calculateAverageCost = () => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc, report) => acc + report.cost, 0);
    return Math.round(sum / filteredReports.length);
  };

  const calculateAverageImprovement = () => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc, report) => 
      acc + (report.afterCondition.healthScore - report.beforeCondition.healthScore), 0);
    return Math.round(sum / filteredReports.length);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقارير الفعالية</h1>
          <p className="text-muted-foreground">
            تحليل وتقييم فعالية الأسمدة والمبيدات المستخدمة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة تقرير
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة تقرير فعالية جديد</DialogTitle>
                <DialogDescription>
                  قيّم فعالية المنتج المستخدم وأضف ملاحظاتك
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">اسم المنتج</Label>
                    <Input
                      id="productName"
                      value={newReport.productName}
                      onChange={(e) => setNewReport(prev => ({...prev, productName: e.target.value}))}
                      placeholder="مثال: سماد NPK"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productType">نوع المنتج</Label>
                    <Select value={newReport.productType} onValueChange={(value: any) => setNewReport(prev => ({...prev, productType: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fertilizer">سماد</SelectItem>
                        <SelectItem value="pesticide">مبيد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cropType">نوع المحصول</Label>
                  <Select value={newReport.cropType} onValueChange={(value) => setNewReport(prev => ({...prev, cropType: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="olive">الزيتون</SelectItem>
                      <SelectItem value="tomato">الطماطم</SelectItem>
                      <SelectItem value="wheat">القمح</SelectItem>
                      <SelectItem value="citrus">الحمضيات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="beforeHealth">صحة النبات قبل التطبيق (%)</Label>
                    <Input
                      id="beforeHealth"
                      type="number"
                      min="0"
                      max="100"
                      value={newReport.beforeHealthScore}
                      onChange={(e) => setNewReport(prev => ({...prev, beforeHealthScore: parseInt(e.target.value) || 50}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="afterHealth">صحة النبات بعد التطبيق (%)</Label>
                    <Input
                      id="afterHealth"
                      type="number"
                      min="0"
                      max="100"
                      value={newReport.afterHealthScore}
                      onChange={(e) => setNewReport(prev => ({...prev, afterHealthScore: parseInt(e.target.value) || 70}))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="userRating">تقييمك للمنتج (1-5 نجوم)</Label>
                  <div className="flex items-center space-x-1 rtl:space-x-reverse mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReport(prev => ({...prev, userRating: star}))}
                        className={cn(
                          "p-1",
                          star <= newReport.userRating ? "text-yellow-400" : "text-gray-300"
                        )}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    value={newReport.notes}
                    onChange={(e) => setNewReport(prev => ({...prev, notes: e.target.value}))}
                    placeholder="اكتب ملاحظاتك حول فعالية المنتج..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={addNewReport}>
                  إضافة التقرير
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Filter className="h-4 w-4" />
              <Label>فلترة النتائج:</Label>
            </div>
            <Select value={filterCrop} onValueChange={setFilterCrop}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="نوع المحصول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحاصيل</SelectItem>
                <SelectItem value="olive">الزيتون</SelectItem>
                <SelectItem value="tomato">الطماطم</SelectItem>
                <SelectItem value="wheat">القمح</SelectItem>
                <SelectItem value="citrus">الحمضيات</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="نوع المنتج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنتجات</SelectItem>
                <SelectItem value="fertilizer">الأسمدة</SelectItem>
                <SelectItem value="pesticide">المبيدات</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">آخر 30 يوم</SelectItem>
                <SelectItem value="60">آخر 60 يوم</SelectItem>
                <SelectItem value="90">آخر 90 يوم</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-full">
                <BarChart2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{calculateAverageEffectiveness()}%</div>
                <div className="text-xs text-muted-foreground">متوسط الفعالية</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">+{calculateAverageImprovement()}%</div>
                <div className="text-xs text-muted-foreground">متوسط التحسن</div>
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
                <div className="text-2xl font-bold">{calculateAverageCost()}</div>
                <div className="text-xs text-muted-foreground">متوسط التكلفة (د.ت)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-2 bg-purple-100 rounded-full">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredReports.length}</div>
                <div className="text-xs text-muted-foreground">عدد التقارير</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">التقارير التفصيلية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات والرسوم</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={cn(
                        "p-3 rounded-full",
                        report.productType === 'fertilizer' ? "bg-green-100" : "bg-blue-100"
                      )}>
                        {report.productType === 'fertilizer' ? 
                          <Sprout className="h-6 w-6 text-green-600" /> : 
                          <Droplets className="h-6 w-6 text-blue-600" />
                        }
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{report.productName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {report.cropType === 'olive' ? 'الزيتون' : 
                           report.cropType === 'tomato' ? 'الطماطم' : 
                           report.cropType === 'wheat' ? 'القمح' : 'الحمضيات'} • 
                          {new Date(report.applicationDate).toLocaleDateString('ar-TN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left rtl:text-right">
                      <div className={cn("text-3xl font-bold", getScoreColor(report.effectivenessScore))}>
                        {report.effectivenessScore}%
                      </div>
                      <Badge className={getScoreBadgeColor(report.effectivenessScore)}>
                        {report.effectivenessScore >= 85 ? 'ممتاز' :
                         report.effectivenessScore >= 70 ? 'جيد' :
                         report.effectivenessScore >= 55 ? 'متوسط' : 'ضعيف'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">التحسن في الصحة</h4>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {getImprovementIcon(report.afterCondition.healthScore - report.beforeCondition.healthScore)}
                        <span className="text-lg font-semibold">
                          {report.beforeCondition.healthScore}% → {report.afterCondition.healthScore}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        +{report.afterCondition.healthScore - report.beforeCondition.healthScore}% تحسن
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">تقييم المستخدم</h4>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={cn(
                              "h-4 w-4",
                              star <= report.userRating ? "text-yellow-400 fill-current" : "text-gray-300"
                            )} 
                          />
                        ))}
                        <span className="text-sm text-muted-foreground mr-2">
                          ({report.userRating}/5)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">التكلفة</h4>
                      <div className="text-lg font-semibold text-green-600">
                        {report.cost.toFixed(2)} د.ت
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {(report.cost / report.farmSize).toFixed(2)} د.ت/هكتار
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium flex items-center mb-2">
                        <CheckCircle className="h-4 w-4 ml-1 text-green-600" />
                        التحسينات المُلاحظة
                      </h4>
                      <ul className="text-sm space-y-1">
                        {report.improvements.map((improvement, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-600 ml-2">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center mb-2">
                        <Target className="h-4 w-4 ml-1 text-blue-600" />
                        التوصيات المستقبلية
                      </h4>
                      <ul className="text-sm space-y-1">
                        {report.futureRecommendations.map((recommendation, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-600 ml-2">•</span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {report.notes && (
                    <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                      <h4 className="font-medium mb-1">ملاحظات إضافية:</h4>
                      <p className="text-sm">{report.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>اتجاه الفعالية الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={effectivenessData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="fertilizer" stroke="#10b981" name="الأسمدة" />
                      <Line type="monotone" dataKey="pesticide" stroke="#3b82f6" name="المبيدات" />
                      <Line type="monotone" dataKey="overall" stroke="#8b5cf6" name="العام" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع مستويات الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productPerformanceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {productPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تحليل التكلفة مقابل الفعالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cost" fill="#f59e0b" name="التكلفة (د.ت)" />
                    <Bar yAxisId="right" dataKey="effectiveness" fill="#10b981" name="الفعالية (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الاتجاهات والتحليلات المتقدمة</CardTitle>
                <CardDescription>
                  رؤى متعمقة حول أداء المنتجات والاتجاهات المستقبلية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center mb-2">
                      <Award className="h-4 w-4 ml-1 text-gold" />
                      أفضل منتج
                    </h4>
                    <p className="text-lg font-bold">كبريتات النحاس</p>
                    <p className="text-sm text-muted-foreground">92% فعالية متوسطة</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center mb-2">
                      <TrendingUp className="h-4 w-4 ml-1 text-green-600" />
                      الاتجاه العام
                    </h4>
                    <p className="text-lg font-bold text-green-600">تحسن مستمر</p>
                    <p className="text-sm text-muted-foreground">+5% عن الشهر الماضي</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center mb-2">
                      <Target className="h-4 w-4 ml-1 text-blue-600" />
                      التوصية
                    </h4>
                    <p className="text-lg font-bold">تحسين الجرعات</p>
                    <p className="text-sm text-muted-foreground">لزيادة الفعالية</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">الملاحظات الرئيسية:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 ml-2 flex-shrink-0" />
                      <span className="text-sm">المبيدات الطبيعية تظهر نتائج أفضل في الظروف الجوية المعتدلة</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 ml-2 flex-shrink-0" />
                      <span className="text-sm">الأسمدة المركبة تعطي عائد استثمار أعلى للمحاصيل الدائمة</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 ml-2 flex-shrink-0" />
                      <span className="text-sm">ضرورة مراعاة الظروف الجوية عند تطبيق المعاملات</span>
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 ml-2 flex-shrink-0" />
                      <span className="text-sm">زيادة الجرعة لا تعني بالضرورة زيادة الفعالية</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
