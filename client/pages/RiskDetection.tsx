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
  AlertTriangle,
  Shield, 
  Zap, 
  TrendingDown,
  TrendingUp,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Droplets,
  Bug,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Eye,
  Bell,
  Settings,
  Map,
  Satellite,
  Database,
  Radio,
  Wifi,
  Smartphone,
  Mail,
  MessageSquare,
  PhoneCall,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Target,
  Brain,
  Cpu,
  LineChart,
  PieChart,
  Users,
  DollarSign,
  Leaf,
  TreePine,
  Waves
} from 'lucide-react';

interface RiskAlert {
  id: string;
  type: 'disease' | 'weather' | 'market' | 'pest' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  affected_area: number; // in hectares
  crop_impact: string[];
  probability: number; // 0-100%
  time_to_impact: string;
  detected_at: string;
  predicted_impact: {
    yield_loss: number;
    financial_loss: number;
    affected_plants: number;
  };
  mitigation_actions: string[];
  data_sources: string[];
  confidence_level: number;
  status: 'active' | 'monitoring' | 'resolved' | 'escalated';
  related_alerts: string[];
}

interface WeatherRisk {
  id: string;
  risk_type: 'heatwave' | 'frost' | 'drought' | 'flood' | 'hail' | 'strong_winds';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  probability: number;
  start_time: string;
  duration: string;
  affected_regions: string[];
  temperature_range: { min: number; max: number };
  rainfall_amount: number;
  wind_speed: number;
  humidity: number;
  uv_index: number;
  recommendations: string[];
  emergency_actions: string[];
}

interface DiseaseDetection {
  id: string;
  disease_name: string;
  crop_type: string;
  detection_method: 'visual' | 'sensor' | 'satellite' | 'laboratory';
  confidence: number;
  spread_rate: 'slow' | 'moderate' | 'fast' | 'rapid';
  infected_area: number;
  symptoms: string[];
  treatment_options: string[];
  prevention_measures: string[];
  economic_impact: number;
  detected_location: { lat: number; lng: number };
  detection_date: string;
  status: 'confirmed' | 'suspected' | 'contained' | 'spreading';
}

interface MarketRisk {
  id: string;
  risk_factor: 'price_drop' | 'oversupply' | 'demand_decrease' | 'export_ban' | 'currency_fluctuation';
  affected_crops: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  price_impact: number; // percentage change
  probability: number;
  timeframe: string;
  external_factors: string[];
  mitigation_strategies: string[];
  alternative_markets: string[];
  hedging_options: string[];
}

interface SensorData {
  sensor_id: string;
  sensor_type: 'soil_moisture' | 'temperature' | 'humidity' | 'ph' | 'light' | 'co2';
  location: string;
  current_value: number;
  normal_range: { min: number; max: number };
  alert_threshold: { min: number; max: number };
  status: 'normal' | 'warning' | 'critical';
  last_reading: string;
  trend: 'stable' | 'increasing' | 'decreasing';
  battery_level: number;
}

export default function RiskDetection() {
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [weatherRisks, setWeatherRisks] = useState<WeatherRisk[]>([]);
  const [diseaseDetections, setDiseaseDetections] = useState<DiseaseDetection[]>([]);
  const [marketRisks, setMarketRisks] = useState<MarketRisk[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [monitoringSettings, setMonitoringSettings] = useState({
    realTimeAlerts: true,
    emailNotifications: true,
    smsAlerts: true,
    pushNotifications: true,
    alertThreshold: 'medium'
  });

  useEffect(() => {
    loadRiskAlerts();
    loadWeatherRisks();
    loadDiseaseDetections();
    loadMarketRisks();
    loadSensorData();
    
    // Set up real-time monitoring
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadRiskAlerts = async () => {
    try {
      const response = await fetch('/api/risk-detection/alerts');
      const data = await response.json();
      setRiskAlerts(data);
    } catch (error) {
      console.error('Error loading risk alerts:', error);
    }
  };

  const loadWeatherRisks = async () => {
    try {
      const response = await fetch('/api/risk-detection/weather-risks');
      const data = await response.json();
      setWeatherRisks(data);
    } catch (error) {
      console.error('Error loading weather risks:', error);
    }
  };

  const loadDiseaseDetections = async () => {
    try {
      const response = await fetch('/api/risk-detection/diseases');
      const data = await response.json();
      setDiseaseDetections(data);
    } catch (error) {
      console.error('Error loading disease detections:', error);
    }
  };

  const loadMarketRisks = async () => {
    try {
      const response = await fetch('/api/risk-detection/market-risks');
      const data = await response.json();
      setMarketRisks(data);
    } catch (error) {
      console.error('Error loading market risks:', error);
    }
  };

  const loadSensorData = async () => {
    try {
      const response = await fetch('/api/risk-detection/sensors');
      const data = await response.json();
      setSensorData(data);
    } catch (error) {
      console.error('Error loading sensor data:', error);
    }
  };

  const refreshData = async () => {
    Promise.all([
      loadRiskAlerts(),
      loadWeatherRisks(),
      loadDiseaseDetections(),
      loadMarketRisks(),
      loadSensorData()
    ]);
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/risk-detection/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      if (response.ok) {
        loadRiskAlerts();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const escalateAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/risk-detection/alerts/${alertId}/escalate`, {
        method: 'POST'
      });
      if (response.ok) {
        loadRiskAlerts();
      }
    } catch (error) {
      console.error('Error escalating alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'disease': return <Bug className="h-5 w-5 text-red-500" />;
      case 'weather': return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'market': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'pest': return <Bug className="h-5 w-5 text-orange-500" />;
      case 'environmental': return <Leaf className="h-5 w-5 text-green-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDashboardMetrics = () => {
    const activeAlerts = riskAlerts.filter(alert => alert.status === 'active').length;
    const criticalAlerts = riskAlerts.filter(alert => alert.severity === 'critical').length;
    const totalFinancialRisk = riskAlerts.reduce((sum, alert) => sum + alert.predicted_impact.financial_loss, 0);
    const avgConfidence = riskAlerts.reduce((sum, alert) => sum + alert.confidence_level, 0) / Math.max(riskAlerts.length, 1);
    const sensorsCritical = sensorData.filter(sensor => sensor.status === 'critical').length;

    return {
      activeAlerts,
      criticalAlerts,
      totalFinancialRisk,
      avgConfidence,
      sensorsCritical
    };
  };

  const metrics = getDashboardMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Shield className="h-10 w-10 text-red-600" />
            نظام كشف المخاطر المبكر والمراقبة الذكية
          </h1>
          <p className="text-xl text-gray-600">
            مراقبة مستمرة للمخاطر الزراعية والبيئية والمالية مع تنبيهات فورية وحلول استباقية
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              لوحة المراقبة
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              التنبيهات النشطة
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              مخاطر الطقس
            </TabsTrigger>
            <TabsTrigger value="diseases" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              كشف الأمراض
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              مخاطر السوق
            </TabsTrigger>
            <TabsTrigger value="sensors" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              بيانات الاستشعار
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100">تنبيهات نشطة</p>
                      <p className="text-3xl font-bold">{metrics.activeAlerts}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">تنبيهات حرجة</p>
                      <p className="text-3xl font-bold">{metrics.criticalAlerts}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100">المخاطر المالية</p>
                      <p className="text-3xl font-bold">${(metrics.totalFinancialRisk / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">متوسط الثقة</p>
                      <p className="text-3xl font-bold">{metrics.avgConfidence.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">أجهزة حرجة</p>
                      <p className="text-3xl font-bold">{metrics.sensorsCritical}</p>
                    </div>
                    <Radio className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    التنبيهات عالية الخطورة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {riskAlerts
                      .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
                      .slice(0, 5)
                      .map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(alert.type)}
                            <div>
                              <p className="font-medium text-red-900">{alert.title}</p>
                              <p className="text-sm text-red-600">{alert.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <div className="text-xs text-red-600 mt-1">
                              {alert.probability}% احتمالية
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
                    <CloudRain className="h-5 w-5 text-blue-500" />
                    توقعات الطقس الخطيرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weatherRisks
                      .filter(risk => risk.severity === 'high' || risk.severity === 'extreme')
                      .slice(0, 4)
                      .map((risk) => (
                        <div key={risk.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CloudRain className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium text-blue-900">{risk.risk_type}</p>
                              <p className="text-sm text-blue-600">يبدأ: {risk.start_time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {risk.probability}%
                            </div>
                            <Badge className={getSeverityColor(risk.severity)}>
                              {risk.severity}
                            </Badge>
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
                    <Bug className="h-5 w-5 text-red-500" />
                    كشف الأمراض والآفات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diseaseDetections.slice(0, 4).map((detection) => (
                      <div key={detection.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{detection.disease_name}</p>
                          <p className="text-xs text-gray-500">{detection.crop_type}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{detection.confidence}%</div>
                          <div className="text-xs text-gray-500">{detection.infected_area} هكتار</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-green-500" />
                    حالة أجهزة الاستشعار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sensorData
                      .filter(sensor => sensor.status !== 'normal')
                      .slice(0, 4)
                      .map((sensor) => (
                        <div key={sensor.sensor_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{sensor.sensor_type}</p>
                            <p className="text-xs text-gray-500">{sensor.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={sensor.status === 'critical' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}>
                              {sensor.status}
                            </Badge>
                            <div className="text-xs text-gray-500">{sensor.current_value}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-500" />
                    مخاطر السوق
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketRisks.slice(0, 4).map((risk) => (
                      <div key={risk.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{risk.risk_factor}</p>
                          <p className="text-xs text-gray-500">{risk.affected_crops.join(', ')}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-600">{risk.price_impact}%</div>
                          <Badge className={getSeverityColor(risk.severity)}>
                            {risk.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">التنبيهات النشطة</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  عرض الكل
                </Button>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  إعدادات التنبيه
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {riskAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-orange-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(alert.type)}
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {getSeverityIcon(alert.severity)}
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{alert.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{alert.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">الاحتمالية:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={alert.probability} className="flex-1 h-2" />
                            <span className="font-medium">{alert.probability}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">مستوى الثقة:</span>
                          <p className="font-bold text-blue-600">{alert.confidence_level}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">وقت التأثير:</span>
                          <p className="font-medium">{alert.time_to_impact}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">المساحة المتأثرة:</span>
                          <p className="font-medium">{alert.affected_area} هكتار</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">التأثير المالي المتوقع:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>خسارة الإنتاج: {alert.predicted_impact.yield_loss}%</div>
                          <div>الخسارة المالية: ${alert.predicted_impact.financial_loss.toLocaleString()}</div>
                          <div>النباتات المتأثرة: {alert.predicted_impact.affected_plants.toLocaleString()}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">إجراءات التخفيف:</h4>
                        <ul className="text-xs space-y-1">
                          {alert.mitigation_actions.slice(0, 3).map((action, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">المحاصيل المتأثرة:</h4>
                        <div className="flex flex-wrap gap-1">
                          {alert.crop_impact.map((crop, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {crop}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => acknowledgeAlert(alert.id)}
                        disabled={alert.status === 'resolved'}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        تأكيد
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => escalateAlert(alert.id)}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        تصعيد
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

          <TabsContent value="weather" className="space-y-6">
            <h2 className="text-2xl font-bold">مراقبة مخاطر الطقس</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weatherRisks.map((risk) => (
                <Card key={risk.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CloudRain className="h-5 w-5" />
                        {risk.risk_type}
                      </CardTitle>
                      <Badge className={getSeverityColor(risk.severity)}>
                        {risk.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">الاحتمالية:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={risk.probability} className="flex-1 h-2" />
                            <span className="font-medium">{risk.probability}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">المدة:</span>
                          <p className="font-medium">{risk.duration}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">درجة الحرارة:</span>
                          <p className="font-medium">{risk.temperature_range.min}-{risk.temperature_range.max}°م</p>
                        </div>
                        <div>
                          <span className="text-gray-500">سرعة الرياح:</span>
                          <p className="font-medium">{risk.wind_speed} كم/س</p>
                        </div>
                        <div>
                          <span className="text-gray-500">كمية الأمطار:</span>
                          <p className="font-medium">{risk.rainfall_amount} مم</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الرطوبة:</span>
                          <p className="font-medium">{risk.humidity}%</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">المناطق المتأث��ة:</h4>
                        <div className="flex flex-wrap gap-1">
                          {risk.affected_regions.map((region, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">التوصيات:</h4>
                        <ul className="text-xs space-y-1">
                          {risk.recommendations.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-blue-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {risk.emergency_actions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-red-600">إجراءات طارئة:</h4>
                          <ul className="text-xs space-y-1">
                            {risk.emergency_actions.slice(0, 2).map((action, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="diseases" className="space-y-6">
            <h2 className="text-2xl font-bold">كشف الأمراض والآفات</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diseaseDetections.map((detection) => (
                <Card key={detection.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bug className="h-5 w-5" />
                        {detection.disease_name}
                      </CardTitle>
                      <Badge className={detection.status === 'confirmed' ? 'bg-red-500 text-white' : 
                                     detection.status === 'suspected' ? 'bg-yellow-500 text-white' :
                                     'bg-green-500 text-white'}>
                        {detection.status}
                      </Badge>
                    </div>
                    <CardDescription>{detection.crop_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">الثقة:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={detection.confidence} className="flex-1 h-2" />
                            <span className="font-medium">{detection.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">معدل الانتشار:</span>
                          <Badge className={detection.spread_rate === 'rapid' ? 'bg-red-500 text-white' : 
                                          detection.spread_rate === 'fast' ? 'bg-orange-500 text-white' :
                                          'bg-yellow-500 text-white'}>
                            {detection.spread_rate}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-500">المساحة المصابة:</span>
                          <p className="font-medium">{detection.infected_area} هكتار</p>
                        </div>
                        <div>
                          <span className="text-gray-500">التأثير الاقتصادي:</span>
                          <p className="font-medium text-red-600">${detection.economic_impact.toLocaleString()}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">الأعراض:</h4>
                        <ul className="text-xs space-y-1">
                          {detection.symptoms.slice(0, 3).map((symptom, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Eye className="h-3 w-3 text-red-500" />
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">خيارات العلاج:</h4>
                        <ul className="text-xs space-y-1">
                          {detection.treatment_options.slice(0, 2).map((treatment, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {treatment}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">إجراءات الوقاية:</h4>
                        <ul className="text-xs space-y-1">
                          {detection.prevention_measures.slice(0, 2).map((measure, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Shield className="h-3 w-3 text-blue-500" />
                              {measure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <h2 className="text-2xl font-bold">مراقبة مخاطر السوق</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketRisks.map((risk) => (
                <Card key={risk.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        {risk.risk_factor}
                      </CardTitle>
                      <Badge className={getSeverityColor(risk.severity)}>
                        {risk.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">تأثير السعر:</span>
                          <p className="font-bold text-red-600">{risk.price_impact}%</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الاحتمالية:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={risk.probability} className="flex-1 h-2" />
                            <span className="font-medium">{risk.probability}%</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">الإطار الزمني:</span>
                          <p className="font-medium">{risk.timeframe}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">المحاصيل المتأثرة:</h4>
                        <div className="flex flex-wrap gap-1">
                          {risk.affected_crops.map((crop, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {crop}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">العوامل الخارجية:</h4>
                        <ul className="text-xs space-y-1">
                          {risk.external_factors.slice(0, 3).map((factor, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Info className="h-3 w-3 text-blue-500" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">استراتيجيات التخفيف:</h4>
                        <ul className="text-xs space-y-1">
                          {risk.mitigation_strategies.slice(0, 2).map((strategy, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {strategy}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">أسواق بديلة:</h4>
                        <div className="flex flex-wrap gap-1">
                          {risk.alternative_markets.map((market, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {market}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sensors" className="space-y-6">
            <h2 className="text-2xl font-bold">مراقبة أجهزة الاستشعار</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sensorData.map((sensor) => (
                <Card key={sensor.sensor_id} className={`border-l-4 ${
                  sensor.status === 'critical' ? 'border-l-red-500' :
                  sensor.status === 'warning' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Radio className="h-5 w-5" />
                        {sensor.sensor_type}
                      </CardTitle>
                      <Badge className={sensor.status === 'critical' ? 'bg-red-500 text-white' : 
                                     sensor.status === 'warning' ? 'bg-yellow-500 text-white' :
                                     'bg-green-500 text-white'}>
                        {sensor.status}
                      </Badge>
                    </div>
                    <CardDescription>{sensor.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{sensor.current_value}</div>
                        <div className="text-sm text-gray-500">القراءة الحالية</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">المعدل الطبيعي:</span>
                          <p className="font-medium">{sensor.normal_range.min}-{sensor.normal_range.max}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">حد التنبيه:</span>
                          <p className="font-medium">{sensor.alert_threshold.min}-{sensor.alert_threshold.max}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">الاتجاه:</span>
                          <div className="flex items-center gap-1">
                            {sensor.trend === 'increasing' ? <TrendingUp className="h-3 w-3 text-green-500" /> :
                             sensor.trend === 'decreasing' ? <TrendingDown className="h-3 w-3 text-red-500" /> :
                             <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                            <span className="font-medium">{sensor.trend}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">البطارية:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={sensor.battery_level} className="flex-1 h-2" />
                            <span className="text-xs">{sensor.battery_level}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        آخر قراءة: {sensor.last_reading}
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
