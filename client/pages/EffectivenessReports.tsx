import { useState, useEffect, useMemo } from "react";
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
  farmSize?: number;
  beforeCondition: {
    healthScore: number;
    yieldEstimate?: number;
    pestLevel?: number;
    nutrientLevel?: number;
  };
  afterCondition: {
    healthScore: number;
    yieldEstimate?: number;
    pestLevel?: number;
    nutrientLevel?: number;
  };
  userRating: number;
  effectivenessScore: number;
  improvements: string[];
  futureRecommendations: string[];
  weatherConditions?: {
    temperature?: number;
    humidity?: number;
    wind?: number;
  };
  cost?: number;
  notes?: string;
}

export default function EffectivenessReports() {
  const [reports, setReports] = useState<EffectivenessReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<EffectivenessReport[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<EffectivenessReport | null>(null);
  const effectivenessData = useMemo(() => {
    const byMonth = new Map<string, { month: string; fertilizer: number[]; pesticide: number[] }>();
    for (const report of filteredReports) {
      const date = new Date(report.applicationDate);
      if (Number.isNaN(date.getTime())) continue;
      const month = date.toLocaleDateString("ar-TN", { month: "short", year: "numeric" });
      const entry = byMonth.get(month) || { month, fertilizer: [], pesticide: [] };
      entry[report.productType].push(report.effectivenessScore);
      byMonth.set(month, entry);
    }
    return Array.from(byMonth.values()).map(entry => ({
      month: entry.month,
      fertilizer: entry.fertilizer.length ? Math.round(entry.fertilizer.reduce((a,b)=>a+b,0)/entry.fertilizer.length) : null,
      pesticide: entry.pesticide.length ? Math.round(entry.pesticide.reduce((a,b)=>a+b,0)/entry.pesticide.length) : null,
      overall: Math.round([...entry.fertilizer, ...entry.pesticide].reduce((a,b)=>a+b,0) / (entry.fertilizer.length + entry.pesticide.length)),
    }));
  }, [filteredReports]);
  const productPerformanceData = useMemo(() => {
    const buckets = [
      { name: "ممتاز (85-100)", min: 85, max: 101, color: "#10b981" },
      { name: "جيد (70-84)", min: 70, max: 85, color: "#3b82f6" },
      { name: "متوسط (55-69)", min: 55, max: 70, color: "#f59e0b" },
      { name: "ضعيف (أقل من 55)", min: 0, max: 55, color: "#ef4444" },
    ];
    return buckets.map(bucket => ({ ...bucket, value: filteredReports.filter(r => r.effectivenessScore >= bucket.min && r.effectivenessScore < bucket.max).length }));
  }, [filteredReports]);
  const costEffectivenessData = useMemo(() => filteredReports
    .filter(report => report.cost !== undefined)
    .map(report => ({ product: report.productName, cost: report.cost, effectiveness: report.effectivenessScore })), [filteredReports]);

  const [newReport, setNewReport] = useState({
    productName: '',
    productType: 'fertilizer' as 'fertilizer' | 'pesticide',
    cropType: 'olive',
    userRating: 5,
    notes: '',
    beforeHealthScore: "",
    afterHealthScore: "",
    farmSize: "",
    cost: "",
    applicationDate: new Date().toISOString().slice(0, 10)
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
    const beforeHealthScore = Number(newReport.beforeHealthScore);
    const afterHealthScore = Number(newReport.afterHealthScore);
    if (!newReport.productName.trim() || !newReport.applicationDate ||
        newReport.beforeHealthScore.trim() === "" || newReport.afterHealthScore.trim() === "" ||
        !Number.isFinite(beforeHealthScore) || !Number.isFinite(afterHealthScore) ||
        beforeHealthScore < 0 || beforeHealthScore > 100 ||
        afterHealthScore < 0 || afterHealthScore > 100) {
      setSubmitError("أدخل اسم المنتج والتاريخ وقياسَي صحة النبات بين 0 و100.");
      return;
    }

    const farmSize = newReport.farmSize.trim() ? Number(newReport.farmSize) : undefined;
    const cost = newReport.cost.trim() ? Number(newReport.cost) : undefined;
    if ((farmSize !== undefined && (!Number.isFinite(farmSize) || farmSize <= 0)) ||
        (cost !== undefined && (!Number.isFinite(cost) || cost < 0))) {
      setSubmitError("تحقق من مساحة المزرعة والتكلفة المدخلتين.");
      return;
    }

    const reportData = {
      productName: newReport.productName.trim(),
      productType: newReport.productType,
      cropType: newReport.cropType,
      userRating: newReport.userRating,
      notes: newReport.notes.trim(),
      applicationId: `app-${Date.now()}`,
      applicationDate: newReport.applicationDate,
      ...(farmSize !== undefined ? { farmSize } : {}),
      ...(cost !== undefined ? { cost } : {}),
      beforeCondition: { healthScore: beforeHealthScore },
      afterCondition: { healthScore: afterHealthScore },
    };

    setIsSubmitting(true);
    setSubmitError(null);
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
        const effectivenessScore = Number(result.effectivenessScore);
        if (!Number.isFinite(effectivenessScore)) {
          setSubmitError("استجابة الخادم لا تحتوي على نتيجة فعالية صالحة.");
          return;
        }
        const newReportWithAnalysis: EffectivenessReport = {
          id: Date.now().toString(),
          ...reportData,
          effectivenessScore,
          improvements: Array.isArray(result.improvements) ? result.improvements : [],
          futureRecommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        };
        
        setReports(prev => [newReportWithAnalysis, ...prev]);
        setShowAddDialog(false);
        setNewReport({
          productName: '', productType: 'fertilizer', cropType: 'olive',
          userRating: 5, notes: '', beforeHealthScore: '', afterHealthScore: '',
          farmSize: '', cost: '', applicationDate: new Date().toISOString().slice(0, 10)
        });
      } else {
        const payload = await response.json().catch(() => ({}));
        setSubmitError(payload.message || payload.error || `تعذر حفظ التقييم (HTTP ${response.status}).`);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitError("تعذر الاتصال بالخادم. لم تتم إضافة التقرير.");
    } finally {
      setIsSubmitting(false);
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
    const reportsWithCost = filteredReports.filter(report => report.cost !== undefined);
    if (reportsWithCost.length === 0) return 0;
    const sum = reportsWithCost.reduce((acc, report) => acc + (report.cost ?? 0), 0);
    return Math.round(sum / reportsWithCost.length);
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
                    <Label htmlFor="applicationDate">تاريخ التطبيق</Label>
                    <Input id="applicationDate" type="date" value={newReport.applicationDate} onChange={(e) => setNewReport(prev => ({...prev, applicationDate: e.target.value}))} />
                  </div>
                  <div>
                    <Label htmlFor="farmSize">مساحة المزرعة (هكتار، اختياري)</Label>
                    <Input id="farmSize" type="number" min="0.01" step="0.01" value={newReport.farmSize} onChange={(e) => setNewReport(prev => ({...prev, farmSize: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reportCost">التكلفة بالدينار التونسي (اختياري)</Label>
                  <Input id="reportCost" type="number" min="0" step="0.01" value={newReport.cost} onChange={(e) => setNewReport(prev => ({...prev, cost: e.target.value}))} />
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

              {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  إلغاء
                </Button>
                <Button onClick={addNewReport} disabled={isSubmitting}>{isSubmitting ? "جارٍ التقييم..." : "إضافة التقرير"}
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
                    {effectivenessData.length ? <LineChart data={effectivenessData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="fertilizer" stroke="#10b981" name="الأسمدة" />
                      <Line type="monotone" dataKey="pesticide" stroke="#3b82f6" name="المبيدات" />
                      <Line type="monotone" dataKey="overall" stroke="#8b5cf6" name="العام" />
                    </LineChart> : <p className="text-sm text-muted-foreground">لا توجد تقييمات فعلية كافية لعرض الاتجاهات.</p>}
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
                    {filteredReports.length ? <PieChart>
                      <Pie
                        data={productPerformanceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {productPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart> : <p className="text-sm text-muted-foreground">لا توجد تقييمات فعلية لعرض التوزيع.</p>}
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
                  {costEffectivenessData.length ? <BarChart data={costEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cost" fill="#f59e0b" name="التكلفة (د.ت)" />
                    <Bar yAxisId="right" dataKey="effectiveness" fill="#10b981" name="الفعالية (%)" />
                  </BarChart> : <p className="text-sm text-muted-foreground">أدخل تكلفة حقيقية عند تسجيل التقييم لعرض تحليل التكلفة.</p>}
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
