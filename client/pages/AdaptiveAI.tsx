import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Activity, 
  Users, 
  Lightbulb,
  Eye,
  RefreshCw,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Stars,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Filter,
  Download,
  Upload,
  Database,
  Cpu,
  Network,
  Shield,
  Sparkles,
  Gauge,
  Calendar,
  MapPin
} from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  nameAr: string;
  type: 'crop_prediction' | 'disease_detection' | 'weather_forecast' | 'market_analysis' | 'recommendation';
  version: string;
  accuracy: number;
  trainingData: number;
  lastTrained: string;
  status: 'active' | 'training' | 'testing' | 'deprecated';
  isPersonalized: boolean;
  userAdaptations: number;
}

interface UserBehaviorData {
  userId: string;
  sessionDuration: number;
  pagesVisited: string[];
  featuresUsed: string[];
  interactionPattern: {
    timeOfDay: Record<string, number>;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    preferredLanguage: string;
    clickHeatmap: Record<string, number>;
  };
  feedbackGiven: FeedbackData[];
  conversionEvents: string[];
}

interface FeedbackData {
  id: string;
  type: 'rating' | 'suggestion' | 'complaint' | 'feature_request';
  content: string;
  rating?: number;
  feature: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  isProcessed: boolean;
  aiResponse?: string;
}

interface PersonalizedRecommendation {
  id: string;
  userId: string;
  type: 'crop' | 'treatment' | 'market' | 'optimization';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  basedOn: string[];
  expectedOutcome: string;
  implementationSteps: string[];
  createdAt: string;
  status: 'pending' | 'viewed' | 'implemented' | 'ignored';
  feedback?: {
    helpful: boolean;
    implemented: boolean;
    outcome: string;
  };
}

interface AIInsights {
  totalModels: number;
  averageAccuracy: number;
  personalizedUsers: number;
  dailyRecommendations: number;
  userSatisfaction: number;
  modelUpdates: number;
  dataPointsProcessed: number;
  improvementRate: number;
}

const AdaptiveAI: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [behaviorData, setBehaviorData] = useState<UserBehaviorData[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchAIData();
  }, [selectedModel, selectedPeriod]);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      const [modelsRes, insightsRes, behaviorRes, recommendationsRes, feedbackRes] = await Promise.all([
        fetch('/api/ai/models'),
        fetch(`/api/ai/insights?period=${selectedPeriod}`),
        fetch(`/api/ai/behavior-data?period=${selectedPeriod}`),
        fetch(`/api/ai/recommendations?model=${selectedModel}&period=${selectedPeriod}`),
        fetch(`/api/ai/feedback?period=${selectedPeriod}`)
      ]);

      const [modelsData, insightsData, behaviorData, recommendationsData, feedbackData] = await Promise.all([
        modelsRes.json(),
        insightsRes.json(),
        behaviorRes.json(),
        recommendationsRes.json(),
        feedbackRes.json()
      ]);

      if (modelsData.success) setModels(modelsData.data);
      if (insightsData.success) setInsights(insightsData.data);
      if (behaviorData.success) setBehaviorData(behaviorData.data);
      if (recommendationsData.success) setRecommendations(recommendationsData.data);
      if (feedbackData.success) setFeedback(feedbackData.data);
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModelTypeLabel = (type: string) => {
    const labels = {
      crop_prediction: 'تنبؤ المحاصيل',
      disease_detection: 'كشف الأمراض',
      weather_forecast: 'التنبؤ الجوي',
      market_analysis: 'تحليل السوق',
      recommendation: 'التوصيات الذكية'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      training: 'bg-blue-100 text-blue-800',
      testing: 'bg-yellow-100 text-yellow-800',
      deprecated: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'نشط',
      training: 'تدريب',
      testing: 'اختبار',
      deprecated: 'متوقف'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !insights) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الذكاء الاصطناعي التكيفي</h1>
          <p className="text-gray-600">إدارة ��لنماذج الذكية والتعلم الذاتي والتخصيص الفردي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="جميع النماذج" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع النماذج</SelectItem>
              <SelectItem value="crop_prediction">تنبؤ المحاصيل</SelectItem>
              <SelectItem value="disease_detection">كشف الأمراض</SelectItem>
              <SelectItem value="weather_forecast">التنبؤ الجوي</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 أيام</SelectItem>
              <SelectItem value="30d">30 يوم</SelectItem>
              <SelectItem value="90d">90 يوم</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchAIData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            تدريب نموذج جديد
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النماذج النشطة</CardTitle>
              <Brain className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {insights.totalModels}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                متوسط الدقة: {insights.averageAccuracy}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون المخصصون</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {insights.personalizedUsers.toLocaleString('ar-TN')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                رضا المستخدمين: {insights.userSatisfaction}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التوصيات اليومية</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {insights.dailyRecommendations.toLocaleString('ar-TN')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                معدل التحسن: +{insights.improvementRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نقاط ال��يانات</CardTitle>
              <Database className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(insights.dataPointsProcessed / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-gray-600 mt-1">
                تحديثات النماذج: {insights.modelUpdates}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="models">النماذج</TabsTrigger>
          <TabsTrigger value="behavior">سلوك المستخدمين</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          <TabsTrigger value="feedback">التغذية الراجعة</TabsTrigger>
          <TabsTrigger value="personalization">التخصيص</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  أداء النماذج بمرور الوقت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.slice(0, 5).map((model) => (
                    <div key={model.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Brain className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{model.nameAr}</p>
                          <p className="text-sm text-gray-600">الإصدار {model.version}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{model.accuracy}%</p>
                        <Progress value={model.accuracy} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  مشاركة المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {insights ? Math.round(insights.userSatisfaction) : 0}%
                    </div>
                    <p className="text-gray-600">معدل الرضا العام</p>
                    <Progress value={insights?.userSatisfaction || 0} className="mt-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {feedback.filter(f => f.sentiment === 'positive').length}
                      </div>
                      <p className="text-sm text-gray-600">تقييمات إيجابية</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {recommendations.filter(r => r.status === 'implemented').length}
                      </div>
                      <p className="text-sm text-gray-600">توصيات مطبقة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent AI Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                التحديثات الأخيرة للذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    تم تحديث نموذج كشف الأمراض بنجاح - تحسنت الدقة من 89% إلى 94%
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    إضافة 50,000 نقطة بيانات جديدة لتحسين توصيات المحاصيل
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    تفعيل التعلم الذاتي لـ 1,200 مستخدم جديد بناءً على سلوكهم
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {models.map((model) => (
              <Card key={model.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{model.nameAr}</CardTitle>
                        <p className="text-sm text-gray-600">{getModelTypeLabel(model.type)}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(model.status)}>
                      {getStatusLabel(model.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">الدقة</p>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{model.accuracy}%</span>
                        <Progress value={model.accuracy} className="flex-1 h-2" />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">الإصدار</p>
                      <p className="font-medium">{model.version}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">بيانات التدريب</p>
                      <p className="font-medium">{model.trainingData.toLocaleString('ar-TN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">التخصيصات</p>
                      <p className="font-medium">{model.userAdaptations}</p>
                    </div>
                  </div>

                  {model.isPersonalized && (
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-purple-800">نموذج مخصص</span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    آخر تدريب: {new Date(model.lastTrained).toLocaleDateString('ar-TN')}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      تفاصيل
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      إعادة تدريب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أنماط الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                {behaviorData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>متوسط مدة الجلسة</span>
                      <span className="font-bold">
                        {Math.round(behaviorData.reduce((acc, user) => acc + user.sessionDuration, 0) / behaviorData.length / 60)} دقيقة
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">أكثر الميزات استخداماً:</p>
                      <div className="space-y-2">
                        {/* This would be calculated from behaviorData in a real implementation */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm">تحليل التربة</span>
                          <span className="text-sm font-bold">34%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">مراقبة المحاصيل</span>
                          <span className="text-sm font-bold">28%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">التوصيات الذكية</span>
                          <span className="text-sm font-bold">23%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أوقات النشاط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-blue-100 rounded">
                      <div className="text-lg font-bold text-blue-600">الصباح</div>
                      <div className="text-sm text-gray-600">40%</div>
                    </div>
                    <div className="p-2 bg-green-100 rounded">
                      <div className="text-lg font-bold text-green-600">الظهر</div>
                      <div className="text-sm text-gray-600">30%</div>
                    </div>
                    <div className="p-2 bg-orange-100 rounded">
                      <div className="text-lg font-bold text-orange-600">المساء</div>
                      <div className="text-sm text-gray-600">25%</div>
                    </div>
                    <div className="p-2 bg-purple-100 rounded">
                      <div className="text-lg font-bold text-purple-600">الليل</div>
                      <div className="text-sm text-gray-600">5%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="border-r-4 border-r-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{rec.titleAr}</h3>
                        <Badge className={`${getPriorityColor(rec.priority)} bg-opacity-10`}>
                          {getPriorityLabel(rec.priority)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{rec.descriptionAr}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">مستوى الثقة</p>
                          <div className="flex items-center gap-2">
                            <Progress value={rec.confidence * 100} className="flex-1 h-2" />
                            <span className="text-sm font-bold">{Math.round(rec.confidence * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">النتيجة المتوقعة</p>
                          <p className="text-sm font-medium">{rec.expectedOutcome}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">بناءً على:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.basedOn.map((factor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {rec.feedback && (
                        <div className="p-2 bg-gray-50 rounded text-sm">
                          <p className="text-gray-600">
                            التقييم: {rec.feedback.helpful ? 'مفيد' : 'غير مفيد'} | 
                            التطبيق: {rec.feedback.implemented ? 'مطبق' : 'غير مطبق'}
                          </p>
                          {rec.feedback.outcome && (
                            <p className="text-gray-700 mt-1">{rec.feedback.outcome}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={rec.status === 'implemented' ? 'bg-green-100 text-green-800' : 
                        rec.status === 'viewed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                        {rec.status === 'implemented' ? 'مطبق' : 
                         rec.status === 'viewed' ? 'تم عرضه' : 
                         rec.status === 'ignored' ? 'تم تجاهله' : 'قيد الانتظار'}
                      </Badge>
                      
                      <div className="text-xs text-gray-500">
                        {new Date(rec.createdAt).toLocaleDateString('ar-TN')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="space-y-4">
            {feedback.map((fb) => (
              <Card key={fb.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSentimentIcon(fb.sentiment)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${
                            fb.type === 'rating' ? 'bg-blue-100 text-blue-800' :
                            fb.type === 'suggestion' ? 'bg-green-100 text-green-800' :
                            fb.type === 'complaint' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {fb.type === 'rating' ? 'تقييم' :
                             fb.type === 'suggestion' ? 'اقتراح' :
                             fb.type === 'complaint' ? 'شكوى' : 'طلب ميزة'}
                          </Badge>
                          
                          {fb.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Stars 
                                  key={i} 
                                  className={`h-3 w-3 ${i < fb.rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-2">{fb.content}</p>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          الميزة: {fb.feature} | {new Date(fb.timestamp).toLocaleDateString('ar-TN')}
                        </div>

                        {fb.aiResponse && (
                          <div className="p-2 bg-blue-50 rounded text-sm">
                            <p className="text-blue-800 font-medium">رد الذكاء الاصطناعي:</p>
                            <p className="text-blue-700">{fb.aiResponse}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge className={fb.isProcessed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {fb.isProcessed ? 'تم المعالجة' : 'قيد المعالجة'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Personalization Tab */}
        <TabsContent value="personalization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>مستويات التخصيص</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>التخصيص الأساسي</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <Progress value={85} />
                  
                  <div className="flex items-center justify-between">
                    <span>التخصيص المتقدم</span>
                    <span className="font-bold">62%</span>
                  </div>
                  <Progress value={62} />
                  
                  <div className="flex items-center justify-between">
                    <span>التخصيص الذكي</span>
                    <span className="font-bold">41%</span>
                  </div>
                  <Progress value={41} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نجاح التخصيص</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">94%</div>
                  <p className="text-gray-600">نسبة نجاح التوصيات المخصصة</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {insights ? insights.personalizedUsers : 0}
                      </div>
                      <p className="text-sm text-gray-600">مستخدم مخصص</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {insights ? insights.dailyRecommendations : 0}
                      </div>
                      <p className="text-sm text-gray-600">توصية يومية</p>
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

export default AdaptiveAI;
