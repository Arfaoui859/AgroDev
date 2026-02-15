import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Brain,
  Search,
  Filter,
  Eye,
  Zap,
  Target,
  Activity,
  BarChart3,
  Lightbulb,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SoilProblem {
  id: string;
  type: 'salinity' | 'acidity' | 'alkalinity' | 'nutrient_deficiency' | 'nutrient_excess' | 'contamination' | 'waterlogging' | 'drought_stress' | 'compaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedParameter: string;
  currentValue: number;
  optimalRange: {
    min: number;
    max: number;
  };
  description: string;
  causes: string[];
  impacts: string[];
  urgency: 'immediate' | 'within_week' | 'within_month' | 'monitoring';
  estimatedCost: number;
  timeToResolve: string;
}

interface SoilRecommendation {
  id: string;
  problemId: string;
  title: string;
  description: string;
  steps: string[];
  materials: {
    name: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }[];
  timeline: string;
  expectedImprovement: number;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'difficult';
  success_rate: number;
}

interface AnalysisResult {
  analysisDate: string;
  fieldId: string;
  location: string;
  problems: SoilProblem[];
  recommendations: SoilRecommendation[];
  overallHealthScore: number;
  riskLevel: string;
  summary: {
    totalProblems: number;
    criticalProblems: number;
    immediateActions: number;
    estimatedTotalCost: number;
  };
}

const problemTypeTranslation = {
  salinity: 'ملوحة التربة',
  acidity: 'حموضة التربة',
  alkalinity: 'قلوية التربة',
  nutrient_deficiency: 'نقص العناصر الغذائية',
  nutrient_excess: 'زيادة العناصر الغذائية',
  contamination: 'تلوث التربة',
  waterlogging: 'تشبع بالماء',
  drought_stress: 'إجهاد الجفاف',
  compaction: 'انضغاط التربة'
};

const severityColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const severityTextColors = {
  low: 'text-blue-700',
  medium: 'text-yellow-700',
  high: 'text-orange-700',
  critical: 'text-red-700'
};

const urgencyColors = {
  immediate: 'bg-red-100 border-red-300',
  within_week: 'bg-orange-100 border-orange-300',
  within_month: 'bg-yellow-100 border-yellow-300',
  monitoring: 'bg-blue-100 border-blue-300'
};

const urgencyTranslation = {
  immediate: 'فوري',
  within_week: 'خلال أسبوع',
  within_month: 'خلال شهر',
  monitoring: 'مراقبة'
};

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const difficultyTranslation = {
  easy: 'سهل',
  moderate: 'متوسط',
  difficult: 'صعب'
};

export default function SoilProblemDetection() {
  const navigate = useNavigate();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<SoilProblem | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('field_1');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    // Simulate loading analysis for a field
    if (selectedFieldId) {
      analyzeSampleSoil();
    }
  }, [selectedFieldId]);

  const analyzeSampleSoil = async () => {
    setLoading(true);
    try {
      // Simulate API call with sample data
      const sampleSoilData = {
        id: 'soil_sample_001',
        fieldId: selectedFieldId,
        location: 'الحقل الشمالي - المنطقة أ',
        samplingDate: new Date().toISOString().split('T')[0],
        ph: 8.2, // Slightly alkaline
        nitrogen: 25, // Low
        phosphorus: 18, // Normal
        potassium: 120, // Low
        organicMatter: 1.8, // Low
        electricalConductivity: 3.2, // High salinity
        moisture: 12, // Low
        temperature: 28,
        calcium: 800,
        magnesium: 150,
        sulfur: 20,
        iron: 45,
        zinc: 2.5,
        manganese: 8,
        copper: 1.2,
        boron: 0.8,
        soilTexture: 'clay' as const,
        cropType: 'wheat',
        season: 'winter' as const
      };

      const response = await fetch('/api/soil-ai-detector/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleSoilData)
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.data);
      }
    } catch (error) {
      console.error('Error analyzing soil:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = analysisResult?.problems.filter(problem => {
    const matchesSeverity = filterSeverity === 'all' || problem.severity === filterSeverity;
    const matchesType = filterType === 'all' || problem.type === filterType;
    return matchesSeverity && matchesType;
  }) || [];

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getProblemDistribution = () => {
    if (!analysisResult?.problems) return [];
    
    const distribution = analysisResult.problems.reduce((acc, problem) => {
      const type = problemTypeTranslation[problem.type];
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    
    return Object.entries(distribution).map(([type, count], index) => ({
      name: type,
      value: count,
      color: colors[index % colors.length]
    }));
  };

  const getSeverityDistribution = () => {
    if (!analysisResult?.problems) return [];
    
    return ['critical', 'high', 'medium', 'low'].map(severity => ({
      severity,
      count: analysisResult.problems.filter(p => p.severity === severity).length,
      color: {
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#ca8a04',
        low: '#2563eb'
      }[severity]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحليل التربة بالذكاء الاصطناعي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <Brain className="h-8 w-8" />
            كاشف مشاكل التربة الذكي
          </h1>
          <p className="text-muted-foreground">تحليل متقدم بالذكاء الاصطناعي لكشف مشاكل التربة وتقديم الحلول المناسبة</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={analyzeSampleSoil} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Zap className="w-4 h-4 ml-2" />
            تحليل جديد
          </Button>
          <Button
            onClick={() => navigate('/ai-intelligence-dashboard?tab=soil-analysis')}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Target className="w-4 h-4 ml-2" />
            التحليل المتقدم
          </Button>
        </div>
      </div>

      {/* AI Service Integration */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">تحليل التربة الذكي الشامل</h3>
              <p className="text-sm text-gray-600 font-normal">تحليل متقدم يشمل البيانات والصور ومطابقة المحاصيل</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تحليل بيانات المستشعرات</h4>
                  <p className="text-xs text-gray-600">تحليل ذكي لبيانات مستشعرات التربة</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-200">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تشخيص بالصور</h4>
                  <p className="text-xs text-gray-600">تحليل صور التربة بالتربة الذكي</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">مطابقة المحاصيل</h4>
                  <p className="text-xs text-gray-600">اقتراح أفضل المحاصيل للتربة</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                onClick={() => navigate('/ai-intelligence-dashboard?tab=soil-analysis')}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                جرب التحليل الشامل الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Overview */}
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`${getHealthScoreBackground(analysisResult.overallHealthScore)} border-2`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الصحة العامة للتربة</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getHealthScoreColor(analysisResult.overallHealthScore)}`}>
                {analysisResult.overallHealthScore}/100
              </div>
              <p className="text-xs text-muted-foreground">
                المستوى: {analysisResult.riskLevel}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المشاكل</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult.summary.totalProblems}</div>
              <p className="text-xs text-muted-foreground">
                {analysisResult.summary.criticalProblems} مشكلة حرجة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تدخل فوري</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analysisResult.summary.immediateActions}</div>
              <p className="text-xs text-muted-foreground">إجراء مطلوب حالاً</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التكلفة المقدرة</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult.summary.estimatedTotalCost.toLocaleString()} د.ت</div>
              <p className="text-xs text-muted-foreground">لحل جميع المشاكل</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Field Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="اختر الحقل للتحليل..."
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">جميع مستويات الخطورة</option>
              <option value="critical">حرج</option>
              <option value="high">عالي</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">جميع أنواع المشاكل</option>
              <option value="salinity">ملوحة</option>
              <option value="acidity">حموضة</option>
              <option value="alkalinity">قلوية</option>
              <option value="nutrient_deficiency">نقص عناصر</option>
              <option value="waterlogging">تشبع مائي</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <Tabs defaultValue="problems" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="problems">المشاكل المكتشفة</TabsTrigger>
            <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="space-y-6">
            {/* Critical Alerts */}
            {analysisResult.problems.filter(p => p.severity === 'critical').length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>تحذير:</strong> تم اكتشاف {analysisResult.problems.filter(p => p.severity === 'critical').length} مشكلة حرجة تتطلب تدخل فوري!
                </AlertDescription>
              </Alert>
            )}

            {/* Problems List */}
            <div className="space-y-4">
              {filteredProblems.map((problem) => (
                <Card key={problem.id} className={`${urgencyColors[problem.urgency]} border-l-4`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{problemTypeTranslation[problem.type]}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`${severityColors[problem.severity]} text-white border-0`}
                          >
                            {problem.severity === 'critical' ? 'حرج' :
                             problem.severity === 'high' ? 'عالي' :
                             problem.severity === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <Badge variant="outline">
                            {urgencyTranslation[problem.urgency]}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{problem.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProblem(selectedProblem?.id === problem.id ? null : problem)}
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        {selectedProblem?.id === problem.id ? 'إخفاء' : 'تفاصيل'}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {selectedProblem?.id === problem.id && (
                    <CardContent>
                      <div className="space-y-4">
                        {/* Current vs Optimal Values */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                          <div className="text-center">
                            <h4 className="font-medium text-sm text-muted-foreground">القيمة الحالية</h4>
                            <p className={`text-2xl font-bold ${severityTextColors[problem.severity]}`}>
                              {problem.currentValue}
                            </p>
                          </div>
                          <div className="text-center">
                            <h4 className="font-medium text-sm text-muted-foreground">النطاق المثالي</h4>
                            <p className="text-lg font-medium text-green-600">
                              {problem.optimalRange.min} - {problem.optimalRange.max}
                            </p>
                          </div>
                          <div className="text-center">
                            <h4 className="font-medium text-sm text-muted-foreground">المعامل</h4>
                            <p className="text-lg font-medium">{problem.affectedParameter}</p>
                          </div>
                        </div>

                        {/* Causes and Impacts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              الأسباب المحتملة:
                            </h4>
                            <ul className="text-sm space-y-1">
                              {problem.causes.map((cause, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-orange-500 mt-1">•</span>
                                  <span>{cause}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              التأثيرات المتوقعة:
                            </h4>
                            <ul className="text-sm space-y-1">
                              {problem.impacts.map((impact, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-1">•</span>
                                  <span>{impact}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Action Summary */}
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">التكلفة المقدرة</p>
                              <p className="font-bold text-blue-600">{problem.estimatedCost} د.ت</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">وقت الحل</p>
                              <p className="font-medium">{problem.timeToResolve}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Target className="w-4 h-4 ml-1" />
                            عرض الحلول
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}

              {filteredProblems.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">ممتاز! لا توجد مشاكل</h3>
                    <p className="text-muted-foreground">
                      التربة في حالة جيدة وفقاً للمعايير المحددة
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4">
              {analysisResult.recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          {rec.title}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${priorityColors[rec.priority]} text-white border-0`}
                        >
                          {rec.priority === 'high' ? 'عالي' : rec.priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        <Badge variant="outline">
                          {difficultyTranslation[rec.difficulty]}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Steps */}
                      <div>
                        <h4 className="font-medium mb-3">خطوات التنفيذ:</h4>
                        <ol className="space-y-2">
                          {rec.steps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <span className="text-sm">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Materials */}
                      <div>
                        <h4 className="font-medium mb-3">المواد المطلوبة:</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-right py-2">المادة</th>
                                <th className="text-right py-2">الكمية</th>
                                <th className="text-right py-2">التكلفة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rec.materials.map((material, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2">{material.name}</td>
                                  <td className="py-2">{material.quantity} {material.unit}</td>
                                  <td className="py-2 font-medium">{material.estimatedCost} د.ت</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">الجدول الزمني</p>
                          <p className="font-medium">{rec.timeline}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">التحسن المتوق��</p>
                          <p className="font-medium text-green-600">{rec.expectedImprovement}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">معدل النجاح</p>
                          <p className="font-medium text-blue-600">{rec.success_rate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">التكلفة الإجمالية</p>
                          <p className="font-bold text-primary">
                            {rec.materials.reduce((sum, m) => sum + m.estimatedCost, 0)} د.ت
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Problem Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المشاكل حسب النوع</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getProblemDistribution()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {getProblemDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Severity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المشاكل حسب الخطورة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getSeverityDistribution()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        {getSeverityDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  اتجاهات صحة التربة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  ستظهر الاتجاهات التاريخية لصحة التربة بعد جمع بيانات كافية...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
