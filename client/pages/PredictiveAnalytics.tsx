import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Database,
  Cpu,
  Zap,
  Target,
  Eye,
  Calendar,
  Clock,
  Users,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  Lightbulb,
  Globe,
  Map,
  Layers,
  BarChart,
  GitBranch,
  Network,
  Wifi,
  Radio,
  Satellite,
  CloudRain,
  Sun,
  Droplets,
  Thermometer,
  Wind,
  Sprout,
  TreePine,
  Leaf,
  Bug,
  Shield,
  DollarSign,
  TrendingUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Maximize,
  Minimize,
  RotateCw,
  Sliders
} from 'lucide-react';

interface PredictionModel {
  id: string;
  name: string;
  type: 'yield_prediction' | 'price_forecast' | 'weather_prediction' | 'disease_detection' | 'market_analysis';
  description: string;
  accuracy: number;
  confidence_interval: { lower: number; upper: number };
  data_sources: string[];
  training_period: string;
  last_trained: string;
  last_prediction: string;
  predictions_count: number;
  status: 'active' | 'training' | 'testing' | 'deprecated';
  model_version: string;
  parameters: Record<string, any>;
  performance_metrics: {
    mse: number;
    rmse: number;
    mae: number;
    r_squared: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  feature_importance: { feature: string; importance: number }[];
}

interface PredictionResult {
  id: string;
  model_id: string;
  model_name: string;
  prediction_type: string;
  target_variable: string;
  predicted_value: number;
  confidence_score: number;
  prediction_range: { min: number; max: number };
  input_features: Record<string, any>;
  prediction_date: string;
  valid_until: string;
  factors_analysis: { factor: string; impact: number; direction: 'positive' | 'negative' }[];
  recommendations: string[];
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high';
    risk_factors: string[];
    mitigation_suggestions: string[];
  };
}

interface DataAnalysis {
  id: string;
  analysis_name: string;
  analysis_type: 'trend_analysis' | 'correlation_analysis' | 'anomaly_detection' | 'pattern_recognition';
  data_source: string;
  time_period: string;
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  results: {
    summary: string;
    key_insights: string[];
    trends_detected: { trend: string; strength: number; direction: string }[];
    anomalies_found: number;
    correlations: { variable1: string; variable2: string; correlation: number }[];
    patterns: { pattern: string; frequency: number; significance: string }[];
  };
  visualizations: {
    chart_type: string;
    data_points: number;
    time_series: boolean;
  };
  created_at: string;
  completed_at?: string;
  execution_time: number;
}

interface ModelPerformance {
  model_id: string;
  model_name: string;
  performance_score: number;
  accuracy_trend: { date: string; accuracy: number }[];
  prediction_errors: { date: string; error: number }[];
  confidence_levels: { date: string; confidence: number }[];
  usage_statistics: {
    total_predictions: number;
    avg_predictions_per_day: number;
    success_rate: number;
    user_satisfaction: number;
  };
  recommendations: string[];
}

interface DataSource {
  id: string;
  name: string;
  type: 'sensor' | 'satellite' | 'weather_api' | 'market_data' | 'manual_input' | 'iot_device';
  description: string;
  connection_status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  data_quality: number; // 0-100%
  last_update: string;
  update_frequency: string;
  data_volume: string;
  coverage_area: string;
  variables_provided: string[];
  reliability_score: number;
  cost_per_month: number;
}

export default function PredictiveAnalytics() {
  const [models, setModels] = useState<PredictionModel[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [analyses, setAnalyses] = useState<DataAnalysis[]>([]);
  const [performance, setPerformance] = useState<ModelPerformance[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedModel, setSelectedModel] = useState<PredictionModel | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadModels();
    loadPredictions();
    loadAnalyses();
    loadPerformance();
    loadDataSources();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/predictive-analytics/models');
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadPredictions = async () => {
    try {
      const response = await fetch('/api/predictive-analytics/predictions');
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const loadAnalyses = async () => {
    try {
      const response = await fetch('/api/predictive-analytics/analyses');
      const data = await response.json();
      setAnalyses(data);
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const loadPerformance = async () => {
    try {
      const response = await fetch('/api/predictive-analytics/performance');
      const data = await response.json();
      setPerformance(data);
    } catch (error) {
      console.error('Error loading performance:', error);
    }
  };

  const loadDataSources = async () => {
    try {
      const response = await fetch('/api/predictive-analytics/data-sources');
      const data = await response.json();
      setDataSources(data);
    } catch (error) {
      console.error('Error loading data sources:', error);
    }
  };

  const trainModel = async (modelId: string) => {
    setIsTraining(true);
    try {
      const response = await fetch(`/api/predictive-analytics/models/${modelId}/train`, {
        method: 'POST'
      });
      if (response.ok) {
        loadModels();
        loadPerformance();
      }
    } catch (error) {
      console.error('Error training model:', error);
    } finally {
      setIsTraining(false);
    }
  };

  const runPrediction = async (modelId: string, inputData: Record<string, any>) => {
    try {
      const response = await fetch(`/api/predictive-analytics/models/${modelId}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: inputData })
      });
      if (response.ok) {
        loadPredictions();
      }
    } catch (error) {
      console.error('Error running prediction:', error);
    }
  };

  const runAnalysis = async (analysisType: string, parameters: Record<string, any>) => {
    try {
      const response = await fetch('/api/predictive-analytics/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysis_type: analysisType,
          parameters 
        })
      });
      if (response.ok) {
        loadAnalyses();
      }
    } catch (error) {
      console.error('Error running analysis:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'completed': return 'bg-green-100 text-green-800';
      case 'training':
      case 'running':
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'testing':
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'deprecated':
      case 'disconnected':
      case 'failed':
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'yield_prediction': return <Sprout className="h-5 w-5 text-green-500" />;
      case 'price_forecast': return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'weather_prediction': return <CloudRain className="h-5 w-5 text-blue-600" />;
      case 'disease_detection': return <Bug className="h-5 w-5 text-red-500" />;
      case 'market_analysis': return <BarChart3 className="h-5 w-5 text-purple-500" />;
      case 'sensor': return <Radio className="h-5 w-5 text-green-500" />;
      case 'satellite': return <Satellite className="h-5 w-5 text-blue-500" />;
      case 'weather_api': return <CloudRain className="h-5 w-5 text-blue-600" />;
      case 'market_data': return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'iot_device': return <Wifi className="h-5 w-5 text-orange-500" />;
      default: return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-blue-600';
    if (accuracy >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDashboardMetrics = () => {
    const activeModels = models.filter(m => m.status === 'active').length;
    const avgAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / Math.max(models.length, 1);
    const totalPredictions = models.reduce((sum, m) => sum + m.predictions_count, 0);
    const runningAnalyses = analyses.filter(a => a.status === 'running').length;
    const connectedSources = dataSources.filter(ds => ds.connection_status === 'connected').length;

    return {
      activeModels,
      avgAccuracy,
      totalPredictions,
      runningAnalyses,
      connectedSources
    };
  };

  const metrics = getDashboardMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Brain className="h-10 w-10 text-purple-600" />
            محرك التنبؤات والتحليل الذكي للبيانات الزراعية
          </h1>
          <p className="text-xl text-gray-600">
            نظام متطور للتنبؤات الذكية وتحليل البيانات الزراعية باستخدام الذكاء الاصطناعي
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              النماذج
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              التنبؤات
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="data-sources" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              مصادر البيانات
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              الأداء
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">النماذج النشطة</p>
                      <p className="text-3xl font-bold">{metrics.activeModels}</p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">متوسط الدقة</p>
                      <p className="text-3xl font-bold">{metrics.avgAccuracy.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">إجمالي التنبؤات</p>
                      <p className="text-3xl font-bold">{metrics.totalPredictions.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">تحليلات جارية</p>
                      <p className="text-3xl font-bold">{metrics.runningAnalyses}</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-teal-100">مصادر متصلة</p>
                      <p className="text-3xl font-bold">{metrics.connectedSources}</p>
                    </div>
                    <Database className="h-8 w-8 text-teal-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    أفضل النماذج أداءً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models
                      .sort((a, b) => b.accuracy - a.accuracy)
                      .slice(0, 5)
                      .map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(model.type)}
                            <div>
                              <p className="font-medium">{model.name}</p>
                              <p className="text-sm text-gray-500">{model.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getAccuracyColor(model.accuracy)}`}>
                              {model.accuracy}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {model.predictions_count} تنبؤ
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
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    أحدث التنبؤات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictions
                      .sort((a, b) => new Date(b.prediction_date).getTime() - new Date(a.prediction_date).getTime())
                      .slice(0, 5)
                      .map((prediction) => (
                        <div key={prediction.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium">{prediction.model_name}</p>
                            <p className="text-sm text-gray-500">{prediction.target_variable}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {prediction.predicted_value.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ثقة: {prediction.confidence_score}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-orange-500" />
                    التحليلات الأخيرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyses
                      .filter(a => a.status === 'completed')
                      .slice(0, 4)
                      .map((analysis) => (
                        <div key={analysis.id} className="p-2 bg-orange-50 rounded">
                          <p className="text-sm font-medium">{analysis.analysis_name}</p>
                          <p className="text-xs text-gray-500">{analysis.analysis_type}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            رؤى: {analysis.results.key_insights.length} | 
                            اتجاهات: {analysis.results.trends_detected.length}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-teal-500" />
                    حالة مصادر البيانات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dataSources.slice(0, 4).map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-2 bg-teal-50 rounded">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(source.type)}
                          <div>
                            <p className="text-sm font-medium">{source.name}</p>
                            <p className="text-xs text-gray-500">{source.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(source.connection_status)}>
                            {source.connection_status}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            جودة: {source.data_quality}%
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
                    <Activity className="h-5 w-5 text-red-500" />
                    تنبيهات النظام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {models
                      .filter(m => m.accuracy < 80 || m.status !== 'active')
                      .slice(0, 3)
                      .map((model) => (
                        <Alert key={model.id}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="text-sm">{model.name}</AlertTitle>
                          <AlertDescription className="text-xs">
                            {model.accuracy < 80 ? `دقة منخفضة: ${model.accuracy}%` : `حالة: ${model.status}`}
                          </AlertDescription>
                        </Alert>
                      ))}
                    
                    {dataSources
                      .filter(ds => ds.connection_status !== 'connected')
                      .slice(0, 2)
                      .map((source) => (
                        <Alert key={source.id}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="text-sm">{source.name}</AlertTitle>
                          <AlertDescription className="text-xs">
                            مشكلة في الاتصال: {source.connection_status}
                          </AlertDescription>
                        </Alert>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">نماذج التنبؤ والتحليل</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  رفع نموذج
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  نموذج جديد
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <Card key={model.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(model.type)}
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </div>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">الدقة:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={model.accuracy} className="flex-1 h-2" />
                            <span className={`font-medium ${getAccuracyColor(model.accuracy)}`}>
                              {model.accuracy}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">عدد التنبؤات:</span>
                          <p className="font-medium">{model.predictions_count.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">آخر تدريب:</span>
                          <p className="font-medium">{model.last_trained}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الإصدار:</span>
                          <p className="font-medium">{model.model_version}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 text-sm">مصادر البيانات:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {model.data_sources.slice(0, 3).map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 text-sm">مقاييس الأداء:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                          <div>RMSE: {model.performance_metrics.rmse?.toFixed(3)}</div>
                          <div>R²: {model.performance_metrics.r_squared?.toFixed(3)}</div>
                          <div>Precision: {model.performance_metrics.precision?.toFixed(3)}</div>
                          <div>F1: {model.performance_metrics.f1_score?.toFixed(3)}</div>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 text-sm">أهم المتغيرات:</span>
                        <div className="mt-1">
                          {model.feature_importance.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span>{feature.feature}</span>
                              <span className="font-medium">{(feature.importance * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => trainModel(model.id)}
                        disabled={isTraining || model.status === 'training'}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {model.status === 'training' ? 'جاري التدريب...' : 'إعادة تدريب'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedModel(model)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        تنبؤ
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        تفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">نتائج التنبؤات</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                تنبؤ جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['yield_prediction', 'price_forecast', 'weather_prediction', 'disease_detection'].map((type) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-center flex items-center justify-center gap-2">
                      {getTypeIcon(type)}
                      {type === 'yield_prediction' && 'تنبؤ الإنتاج'}
                      {type === 'price_forecast' && 'توقع الأسعار'}
                      {type === 'weather_prediction' && 'توقع الطقس'}
                      {type === 'disease_detection' && 'كشف الأمراض'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {predictions
                        .filter(p => p.prediction_type === type)
                        .slice(0, 4)
                        .map((prediction) => (
                          <Card key={prediction.id} className="p-3 bg-gray-50">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium">{prediction.target_variable}</p>
                                <Badge variant="outline" className="text-xs">
                                  {prediction.confidence_score}%
                                </Badge>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">
                                  {prediction.predicted_value.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  النطاق: {prediction.prediction_range.min.toFixed(1)} - {prediction.prediction_range.max.toFixed(1)}
                                </div>
                              </div>

                              <div className="text-xs text-gray-600">
                                <div>التاريخ: {prediction.prediction_date}</div>
                                <div>صالح حتى: {prediction.valid_until}</div>
                              </div>

                              {prediction.recommendations.length > 0 && (
                                <div className="border-t pt-2">
                                  <p className="text-xs font-medium mb-1">التوصيات:</p>
                                  <ul className="text-xs space-y-1">
                                    {prediction.recommendations.slice(0, 2).map((rec, idx) => (
                                      <li key={idx} className="flex items-center gap-1">
                                        <Lightbulb className="h-2 w-2 text-yellow-500" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">التحليلات الذكية</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                تحليل جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{analysis.analysis_name}</CardTitle>
                      <Badge className={getStatusColor(analysis.status)}>
                        {analysis.status}
                      </Badge>
                    </div>
                    <CardDescription>{analysis.analysis_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">مصدر البيانات:</span>
                          <p className="font-medium">{analysis.data_source}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الفترة الزمنية:</span>
                          <p className="font-medium">{analysis.time_period}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">وقت التنفيذ:</span>
                          <p className="font-medium">{analysis.execution_time} ثانية</p>
                        </div>
                        <div>
                          <span className="text-gray-500">تاريخ الإنشاء:</span>
                          <p className="font-medium">{analysis.created_at}</p>
                        </div>
                      </div>

                      {analysis.status === 'completed' && (
                        <>
                          <div>
                            <span className="text-gray-500 text-sm">الرؤى الرئيسية:</span>
                            <ul className="text-xs space-y-1 mt-1">
                              {analysis.results.key_insights.slice(0, 3).map((insight, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-gray-500 text-sm">الاتجاهات المكتشفة:</span>
                            <div className="mt-1 space-y-1">
                              {analysis.results.trends_detected.slice(0, 3).map((trend, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span>{trend.trend}</span>
                                  <div className="flex items-center gap-1">
                                    {trend.direction === 'up' ? 
                                      <ArrowUpRight className="h-3 w-3 text-green-500" /> :
                                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    }
                                    <span className="font-medium">{trend.strength}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>الشذوذ: {analysis.results.anomalies_found}</div>
                            <div>الارتباطات: {analysis.results.correlations.length}</div>
                            <div>الأنماط: {analysis.results.patterns.length}</div>
                            <div>نقاط البيانات: {analysis.visualizations.data_points}</div>
                          </div>
                        </>
                      )}

                      {analysis.status === 'running' && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm text-blue-600">جاري التحليل...</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        عرض النتائج
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        تصدير
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="data-sources" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">مصادر البيانات</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                مصدر جديد
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dataSources.map((source) => (
                <Card key={source.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(source.type)}
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(source.connection_status)}>
                        {source.connection_status}
                      </Badge>
                    </div>
                    <CardDescription>{source.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">جودة البيانات:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={source.data_quality} className="flex-1 h-2" />
                            <span className="font-medium">{source.data_quality}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">معدل الموثوقية:</span>
                          <p className="font-medium">{source.reliability_score}/10</p>
                        </div>
                        <div>
                          <span className="text-gray-500">تكرار التحديث:</span>
                          <p className="font-medium">{source.update_frequency}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">آخر تحديث:</span>
                          <p className="font-medium">{source.last_update}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 text-sm">نطاق التغطية:</span>
                        <p className="text-sm font-medium">{source.coverage_area}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 text-sm">حجم البيانات:</span>
                        <p className="text-sm font-medium">{source.data_volume}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 text-sm">المتغيرات المتوفرة:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {source.variables_provided.slice(0, 4).map((variable, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {source.variables_provided.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{source.variables_provided.length - 4} المزيد
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">التكلفة الشهرية:</span>
                        <span className="font-bold">${source.cost_per_month}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="sm">
                        <Wifi className="h-3 w-3 mr-1" />
                        اختبار الاتصال
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        إعدادات
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <h2 className="text-2xl font-bold">تقييم أداء النماذج</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {performance.map((perf) => (
                <Card key={perf.model_id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{perf.model_name}</CardTitle>
                    <CardDescription>تقرير الأداء والإحصائيات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{perf.performance_score}/100</div>
                        <div className="text-sm text-gray-500">نقاط الأداء الإجمالية</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">إجمالي التنبؤات:</span>
                          <p className="font-bold text-lg">{perf.usage_statistics.total_predictions.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">متوسط يومي:</span>
                          <p className="font-bold text-lg">{perf.usage_statistics.avg_predictions_per_day}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">معدل النجاح:</span>
                          <p className="font-bold text-lg text-green-600">{perf.usage_statistics.success_rate}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">رضا المستخدمين:</span>
                          <p className="font-bold text-lg text-blue-600">{perf.usage_statistics.user_satisfaction}%</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">توصيات التحسين:</h4>
                        <ul className="space-y-1">
                          {perf.recommendations.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <Lightbulb className="h-3 w-3 text-yellow-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t pt-4">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>اتجاه الدقة: {perf.accuracy_trend.length > 1 ? 
                            (perf.accuracy_trend[perf.accuracy_trend.length - 1].accuracy > 
                             perf.accuracy_trend[perf.accuracy_trend.length - 2].accuracy ? 
                             '📈 متزايد' : '📉 متناقص') : 'مستقر'}</div>
                          <div>آخر قياس أخطاء: {perf.prediction_errors[perf.prediction_errors.length - 1]?.error.toFixed(3)}</div>
                          <div>مستوى الثقة الحالي: {perf.confidence_levels[perf.confidence_levels.length - 1]?.confidence}%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
