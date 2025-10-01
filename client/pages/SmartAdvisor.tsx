import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Users,
  ArrowUpRight,
  Settings,
  Activity,
  Clock,
  ThumbsUp,
  Star,
  Globe,
  Shield,
  Building,
  Eye,
  Filter,
  Search,
  Plus,
  Download,
  Upload,
  Award,
  MessageCircle,
  Send,
  Cpu,
  Database,
  Zap,
  Sprout,
  CloudRain,
  Sun,
  Droplets,
  Banknote,
  TrendingDown,
  AlertCircle,
  ChevronRight,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'crop_selection' | 'irrigation' | 'selling' | 'investment' | 'planting' | 'harvesting';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  expectedOutcome: string;
  profitability: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  reasoning: string[];
  data_sources: string[];
  action_steps: string[];
  financial_impact: {
    cost: number;
    revenue: number;
    profit: number;
    roi: number;
  };
  environmental_factors: string[];
  market_factors: string[];
  created_at: string;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendation_id?: string;
  attachments?: string[];
}

interface DecisionContext {
  location: string;
  farm_size: number;
  current_crops: string[];
  soil_type: string;
  irrigation_system: string;
  budget: number;
  experience_level: string;
  goals: string[];
  constraints: string[];
}

interface MarketData {
  crop: string;
  current_price: number;
  price_trend: 'up' | 'down' | 'stable';
  demand_level: 'high' | 'medium' | 'low';
  seasonal_pattern: string;
  forecast_30_days: number;
  forecast_90_days: number;
  supply_status: string;
  export_potential: boolean;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast_7_days: any[];
  forecast_30_days: any[];
  weather_alerts: string[];
  optimal_conditions: boolean;
  irrigation_needed: boolean;
}

interface SoilAnalysis {
  ph_level: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  moisture: number;
  salinity: number;
  recommendations: string[];
  last_updated: string;
}

export default function SmartAdvisor() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [soilAnalysis, setSoilAnalysis] = useState<SoilAnalysis | null>(null);
  const [decisionContext, setDecisionContext] = useState<DecisionContext | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
    loadMarketData();
    loadWeatherData();
    loadSoilAnalysis();
    loadDecisionContext();
    initializeChatHistory();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/smart-advisor/recommendations');
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const response = await fetch('/api/smart-advisor/market-data');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const loadWeatherData = async () => {
    try {
      const response = await fetch('/api/smart-advisor/weather');
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    }
  };

  const loadSoilAnalysis = async () => {
    try {
      const response = await fetch('/api/smart-advisor/soil-analysis');
      const data = await response.json();
      setSoilAnalysis(data);
    } catch (error) {
      console.error('Error loading soil analysis:', error);
    }
  };

  const loadDecisionContext = async () => {
    try {
      const response = await fetch('/api/smart-advisor/context');
      const data = await response.json();
      setDecisionContext(data);
    } catch (error) {
      console.error('Error loading decision context:', error);
    }
  };

  const initializeChatHistory = async () => {
    try {
      const response = await fetch('/api/smart-advisor/chat-history');
      const data = await response.json();
      setChatMessages(data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/smart-advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, context: decisionContext })
      });
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        recommendation_id: data.recommendation_id
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptRecommendation = async (recommendationId: string) => {
    try {
      const response = await fetch(`/api/smart-advisor/recommendations/${recommendationId}/accept`, {
        method: 'POST'
      });
      if (response.ok) {
        loadRecommendations();
      }
    } catch (error) {
      console.error('Error accepting recommendation:', error);
    }
  };

  const rejectRecommendation = async (recommendationId: string) => {
    try {
      const response = await fetch(`/api/smart-advisor/recommendations/${recommendationId}/reject`, {
        method: 'POST'
      });
      if (response.ok) {
        loadRecommendations();
      }
    } catch (error) {
      console.error('Error rejecting recommendation:', error);
    }
  };

  const generateNewRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/smart-advisor/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: decisionContext })
      });
      if (response.ok) {
        loadRecommendations();
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crop_selection': return <Sprout className="h-5 w-5" />;
      case 'irrigation': return <Droplets className="h-5 w-5" />;
      case 'selling': return <Banknote className="h-5 w-5" />;
      case 'investment': return <DollarSign className="h-5 w-5" />;
      case 'planting': return <Calendar className="h-5 w-5" />;
      case 'harvesting': return <Award className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'crop_selection': return 'اختيار المحصول';
      case 'irrigation': return 'الري';
      case 'selling': return 'البيع';
      case 'investment': return 'الاستثمار';
      case 'planting': return 'الزراعة';
      case 'harvesting': return 'الحصاد';
      default: return 'عام';
    }
  };

  const getDashboardMetrics = () => {
    const totalRecommendations = recommendations.length;
    const highPriorityRecommendations = recommendations.filter(r => r.priority === 'high').length;
    const pendingRecommendations = recommendations.filter(r => r.status === 'pending').length;
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / Math.max(recommendations.length, 1);
    const avgProfitability = recommendations.reduce((sum, r) => sum + r.profitability, 0) / Math.max(recommendations.length, 1);

    return {
      totalRecommendations,
      highPriorityRecommendations,
      pendingRecommendations,
      avgConfidence,
      avgProfitability
    };
  };

  const metrics = getDashboardMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Brain className="h-10 w-10 text-blue-600" />
            المستشار الذكي للقرارات الزراعية والاستثمارية
          </h1>
          <p className="text-xl text-gray-600">
            نظام ذكي متطور يحلل البيانات ويقدم توصيات مخصصة لاتخاذ القرارات الزراعية المثلى
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              التوصيات
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              المستشار الذكي
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              بيانات السوق
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              التحليل الذكي
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">إجمالي التوصيات</p>
                      <p className="text-3xl font-bold">{metrics.totalRecommendations}</p>
                    </div>
                    <Lightbulb className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">عالية الأولوية</p>
                      <p className="text-3xl font-bold">{metrics.highPriorityRecommendations}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100">قيد الانتظار</p>
                      <p className="text-3xl font-bold">{metrics.pendingRecommendations}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">متوسط الثقة</p>
                      <p className="text-3xl font-bold">{metrics.avgConfidence.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">متوسط الربحية</p>
                      <p className="text-3xl font-bold">{metrics.avgProfitability.toFixed(1)}%</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    التوصيات عالية الأولوية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations
                      .filter(r => r.priority === 'high')
                      .slice(0, 4)
                      .map((recommendation) => (
                        <div key={recommendation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(recommendation.type)}
                            <div>
                              <p className="font-medium">{recommendation.title}</p>
                              <p className="text-sm text-gray-500">{getTypeLabel(recommendation.type)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {recommendation.profitability.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              ثقة: {recommendation.confidence}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    حالة المزرعة الحالية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-gray-500">درجة الحرارة</p>
                          <p className="font-bold">{weatherData?.temperature || 25}°C</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500">الرطوبة</p>
                          <p className="font-bold">{weatherData?.humidity || 65}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">الأمطار</p>
                          <p className="font-bold">{weatherData?.rainfall || 5}mm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-brown-500" />
                        <div>
                          <p className="text-sm text-gray-500">درجة حموضة التربة</p>
                          <p className="font-bold">{soilAnalysis?.ph_level || 6.8}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">المحاصيل الحالية:</h4>
                      <div className="flex flex-wrap gap-2">
                        {decisionContext?.current_crops?.map((crop, idx) => (
                          <Badge key={idx} variant="outline">
                            {crop}
                          </Badge>
                        )) || ['القمح', 'الذرة', 'الطماطم'].map((crop, idx) => (
                          <Badge key={idx} variant="outline">
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    أسعار السوق
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketData.slice(0, 4).map((market, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-medium">{market.crop}</span>
                        <div className="text-right">
                          <div className="font-bold">${market.current_price}</div>
                          <div className={`text-sm flex items-center gap-1 ${
                            market.price_trend === 'up' ? 'text-green-600' : 
                            market.price_trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {market.price_trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                             market.price_trend === 'down' ? <TrendingDown className="h-3 w-3" /> : 
                             <div className="w-3 h-3" />}
                            {market.price_trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    تنبيهات مهمة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weatherData?.weather_alerts?.map((alert, idx) => (
                      <Alert key={idx}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {alert}
                        </AlertDescription>
                      </Alert>
                    )) || [
                      'موجة حارة متوقعة الأسبوع القادم',
                      'أمطار خفيفة خلال 3 أيام',
                      'ارتفاع في أسعار الأسمدة'
                    ].map((alert, idx) => (
                      <Alert key={idx}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {alert}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    اقتراحات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-between">
                      ما هو أفضل محصول للزراعة الآن؟
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      هل يجب أن أزيد كمية الري؟
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      متى أفضل وقت للبيع؟
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      تحليل ربحية الاستثمار
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">التوصيات الذكية</h2>
              <Button onClick={generateNewRecommendations} disabled={isLoading}>
                <Brain className="h-4 w-4 mr-2" />
                {isLoading ? 'جاري التحليل...' : 'إنشاء توصيات جديدة'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(recommendation.type)}
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(recommendation.riskLevel)}`} />
                      </div>
                    </div>
                    <CardDescription>{getTypeLabel(recommendation.type)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{recommendation.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">الثقة:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={recommendation.confidence} className="flex-1 h-2" />
                            <span className="font-medium">{recommendation.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">الربحية المتوقعة:</span>
                          <p className="font-bold text-green-600">{recommendation.profitability.toFixed(1)}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الإطار الزمني:</span>
                          <p className="font-medium">{recommendation.timeframe}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">مستوى المخاطر:</span>
                          <p className="font-medium">{recommendation.riskLevel}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">التأثير المالي المتوقع:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>التكلفة: ${recommendation.financial_impact.cost.toLocaleString()}</div>
                          <div>الإيرادات: ${recommendation.financial_impact.revenue.toLocaleString()}</div>
                          <div>الربح: ${recommendation.financial_impact.profit.toLocaleString()}</div>
                          <div>العائد: {recommendation.financial_impact.roi}%</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">خطوات التنفيذ:</h4>
                        <ul className="text-xs space-y-1">
                          {recommendation.action_steps.slice(0, 3).map((step, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">الأسباب:</h4>
                        <ul className="text-xs space-y-1">
                          {recommendation.reasoning.slice(0, 2).map((reason, idx) => (
                            <li key={idx} className="text-gray-600">• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => acceptRecommendation(recommendation.id)}
                        disabled={recommendation.status !== 'pending'}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        قبول
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => rejectRecommendation(recommendation.id)}
                        disabled={recommendation.status !== 'pending'}
                      >
                        رفض
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        التفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  المستشار الذكي - محادثة تفاعلية
                </CardTitle>
                <CardDescription>
                  اسأل المستشار الذكي عن أي قرار زراعي أو استثماري
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white ml-4'
                            : 'bg-gray-100 text-gray-900 mr-4'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg mr-4">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm">المستشار يحلل...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="اسأل المستشار الذكي... مثل: ما هو أفضل محصول للزراعة الآن؟"
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    disabled={isLoading}
                  />
                  <Button onClick={sendChatMessage} disabled={isLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <h2 className="text-2xl font-bold">بيانات السوق والأسعار</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketData.map((market, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {market.crop}
                      <Badge className={
                        market.demand_level === 'high' ? 'bg-green-100 text-green-800' :
                        market.demand_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {market.demand_level}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">${market.current_price}</div>
                        <div className={`text-sm flex items-center justify-center gap-1 ${
                          market.price_trend === 'up' ? 'text-green-600' : 
                          market.price_trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {market.price_trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                           market.price_trend === 'down' ? <TrendingDown className="h-3 w-3" /> : 
                           <div className="w-3 h-3" />}
                          {market.price_trend}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">توقع 30 يوم:</span>
                          <p className="font-medium">${market.forecast_30_days}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">توقع 90 يوم:</span>
                          <p className="font-medium">${market.forecast_90_days}</p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <p>المعروض: {market.supply_status}</p>
                        <p>التصدير: {market.export_potential ? '✓ متاح' : '✗ غير متاح'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <h2 className="text-2xl font-bold">التحليل الذكي المتقدم</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    توزيع التوصيات حسب النوع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['crop_selection', 'irrigation', 'selling', 'investment'].map((type) => {
                      const count = recommendations.filter(r => r.type === type).length;
                      const percentage = (count / Math.max(recommendations.length, 1)) * 100;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type)}
                            <span>{getTypeLabel(type)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    أداء التوصيات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>التوصيات المقبولة</span>
                      <span className="font-bold text-green-600">
                        {recommendations.filter(r => r.status === 'accepted').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>التوصيات المنفذة</span>
                      <span className="font-bold text-blue-600">
                        {recommendations.filter(r => r.status === 'implemented').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>معدل النجاح</span>
                      <span className="font-bold text-purple-600">
                        {((recommendations.filter(r => r.status === 'implemented').length / 
                           Math.max(recommendations.filter(r => r.status !== 'pending').length, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>متوسط العائد</span>
                      <span className="font-bold text-orange-600">
                        {(recommendations.filter(r => r.status === 'implemented')
                          .reduce((sum, r) => sum + r.financial_impact.roi, 0) / 
                          Math.max(recommendations.filter(r => r.status === 'implemented').length, 1)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">إعدادات المستشار الذكي</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات المزرعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الموقع</Label>
                    <Input value={decisionContext?.location || 'الرياض'} />
                  </div>
                  <div>
                    <Label>مساحة المزرعة (هكتار)</Label>
                    <Input type="number" value={decisionContext?.farm_size || 100} />
                  </div>
                  <div>
                    <Label>نوع التربة</Label>
                    <Select value={decisionContext?.soil_type || 'sandy'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandy">رملية</SelectItem>
                        <SelectItem value="clay">طينية</SelectItem>
                        <SelectItem value="loamy">طينية رملية</SelectItem>
                        <SelectItem value="silty">طمية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نظام الري</Label>
                    <Select value={decisionContext?.irrigation_system || 'drip'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drip">تنقيط</SelectItem>
                        <SelectItem value="sprinkler">رش</SelectItem>
                        <SelectItem value="flood">غمر</SelectItem>
                        <SelectItem value="pivot">محوري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>تفضيلات التوصيات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>مستوى المخاطرة المقبول</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الهدف الأساسي</Label>
                    <Select defaultValue="profit">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profit">زيادة الربح</SelectItem>
                        <SelectItem value="sustainability">الاستدامة</SelectItem>
                        <SelectItem value="efficiency">الكفاءة</SelectItem>
                        <SelectItem value="quality">جودة المنتج</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>تكرار التوصيات</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">فوري</SelectItem>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الحد الأدنى لمستوى الثقة (%)</Label>
                    <Input type="number" defaultValue="70" min="0" max="100" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
