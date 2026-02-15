import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  Sparkles, 
  TrendingUp,
  Target,
  Droplets,
  DollarSign,
  Calendar,
  Leaf,
  BarChart3,
  Zap,
  Settings,
  Smartphone,
  Edit,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sprout,
  Eye,
  Award,
  ArrowRight,
  Gauge
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface CropRecommendation {
  id: string;
  name: string;
  scientificName: string;
  variety: string;
  overallScore: number;
  compatibility: {
    soil: number;
    climate: number;
    market: number;
    farmer: number;
  };
  estimates: {
    yield: number;
    revenue: number;
    costs: number;
    profit: number;
    roi: number;
    paybackPeriod: number;
  };
  requirements: {
    plantingDate: string;
    harvestDate: string;
    waterNeed: number;
    fertilizer: string[];
    spacing: string;
    depth: number;
  };
  risks: string[];
  advantages: string[];
  marketTrends: {
    currentPrice: number;
    priceStability: string;
    demand: string;
    competitionLevel: string;
  };
  sustainability: {
    soilHealth: number;
    waterEfficiency: number;
    biodiversity: number;
    carbonFootprint: number;
  };
}

interface SoilProfile {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  electricalConductivity: number;
  moisture: number;
  texture: string;
  drainage: string;
  depth: number;
}

interface ClimateData {
  region: string;
  zone: string;
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  annualRainfall: number;
  humidity: number;
  windSpeed: number;
  frostDays: number;
  season: string;
}

interface FarmerGoals {
  primary: string;
  budget: number;
  experience: string;
  marketPreference: string;
  riskTolerance: string;
  waterAvailability: string;
}

const scoreColors = {
  90: 'text-green-600 bg-green-100',
  80: 'text-blue-600 bg-blue-100',
  70: 'text-yellow-600 bg-yellow-100',
  60: 'text-orange-600 bg-orange-100',
  0: 'text-red-600 bg-red-100'
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return scoreColors[90];
  if (score >= 80) return scoreColors[80];
  if (score >= 70) return scoreColors[70];
  if (score >= 60) return scoreColors[60];
  return scoreColors[0];
};

const marketTrendColors = {
  rising: 'text-green-600 bg-green-100',
  stable: 'text-blue-600 bg-blue-100',
  volatile: 'text-yellow-600 bg-yellow-100',
  declining: 'text-red-600 bg-red-100'
};

const demandColors = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600'
};

export default function SmartCropSuggestions() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);
  const [useIoTData, setUseIoTData] = useState(false);
  const [manualInputMode, setManualInputMode] = useState(true);
  
  // Form data states
  const [soilProfile, setSoilProfile] = useState<SoilProfile>({
    ph: 7.2,
    nitrogen: 65,
    phosphorus: 25,
    potassium: 180,
    organicMatter: 2.8,
    electricalConductivity: 1.5,
    moisture: 18,
    texture: 'loamy',
    drainage: 'good',
    depth: 50
  });

  const [climateData, setClimateData] = useState<ClimateData>({
    region: 'سليانة',
    zone: 'mediterranean',
    avgTemperature: 22,
    minTemperature: 8,
    maxTemperature: 35,
    annualRainfall: 450,
    humidity: 65,
    windSpeed: 12,
    frostDays: 15,
    season: 'winter'
  });

  const [farmerGoals, setFarmerGoals] = useState<FarmerGoals>({
    primary: 'profit',
    budget: 5000,
    experience: 'intermediate',
    marketPreference: 'local',
    riskTolerance: 'medium',
    waterAvailability: 'moderate'
  });

  useEffect(() => {
    if (!useIoTData) {
      generateRecommendations();
    }
  }, [useIoTData]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/smart-crop-suggestions/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soilProfile,
          climateData,
          farmerGoals,
          dataSource: useIoTData ? 'iot' : 'manual'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIoTData = async () => {
    setLoading(true);
    try {
      // Simulate IoT data loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update with simulated IoT data
      setSoilProfile({
        ...soilProfile,
        ph: 6.8 + Math.random() * 0.8,
        nitrogen: 50 + Math.random() * 40,
        phosphorus: 20 + Math.random() * 20,
        potassium: 150 + Math.random() * 100,
        moisture: 15 + Math.random() * 10
      });

      await generateRecommendations();
    } catch (error) {
      console.error('Error loading IoT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRadarData = (compatibility: CropRecommendation['compatibility']) => [
    { category: 'ملاءمة التربة', score: compatibility.soil },
    { category: 'ملاءمة المناخ', score: compatibility.climate },
    { category: 'الوضع السوقي', score: compatibility.market },
    { category: 'أهداف المزارع', score: compatibility.farmer }
  ];

  const getSustainabilityData = (sustainability: CropRecommendation['sustainability']) => [
    { category: 'صحة التربة', score: sustainability.soilHealth },
    { category: 'كفاءة المياه', score: sustainability.waterEfficiency },
    { category: 'التنوع البيولوجي', score: sustainability.biodiversity },
    { category: 'البصمة الكربونية', score: sustainability.carbonFootprint }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحليل البيانات وإنشاء التوصيات الذكية...</p>
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
            اقتراحات الزراعة الذكية
          </h1>
          <p className="text-muted-foreground">نظام AI متطور لاقتراح أفضل المحاصيل بناءً على تحليل التربة والمناخ والسوق</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={generateRecommendations} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles className="w-4 h-4 ml-2" />
            تحديث التوصيات
          </Button>
        </div>
      </div>

      {/* AI Service Integration */}
      <Card className="bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">توصيات المحاصيل الذكية المتقدمة</h3>
              <p className="text-sm text-gray-600 font-normal">خدمة شاملة تتضمن تحليل الأرباح والمخاطر والمقارنات التفصيلية</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-cyan-200">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تحليل الربحية الشامل</h4>
                  <p className="text-xs text-gray-600">تقديرات دقيقة للأرباح وتحليل مخاطر السوق</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-teal-200">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">مقارنة تفصيلية</h4>
                  <p className="text-xs text-gray-600">مقارنة شاملة بين المحاصيل المختلفة</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                onClick={() => navigate('/ai-intelligence-dashboard?tab=crop-recommendations')}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                جرب الخدمة المتقدمة الآن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            مصدر البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span>مستشعرات IoT</span>
                <Switch
                  checked={useIoTData}
                  onCheckedChange={(checked) => {
                    setUseIoTData(checked);
                    setManualInputMode(!checked);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-green-600" />
                <span>إدخال يدوي</span>
                <Switch
                  checked={manualInputMode}
                  onCheckedChange={(checked) => {
                    setManualInputMode(checked);
                    setUseIoTData(!checked);
                  }}
                />
              </div>
            </div>
            {useIoTData && (
              <Button onClick={loadIoTData} variant="outline">
                <Zap className="w-4 h-4 ml-2" />
                تحميل بيانات المستشعرات
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">التوصيات الذكية</TabsTrigger>
          <TabsTrigger value="input">إعدادات البيانات</TabsTrigger>
          <TabsTrigger value="analysis">التحليل المفصل</TabsTrigger>
          <TabsTrigger value="comparison">المقارنة</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Summary Cards */}
          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">أفضل توصية</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{recommendations[0]?.overallScore}/100</div>
                  <p className="text-xs text-muted-foreground">{recommendations[0]?.name}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">أعلى ربحية</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.max(...recommendations.map(r => r.estimates.profit)).toLocaleString()} د.ت
                  </div>
                  <p className="text-xs text-muted-foreground">للهكتار الواحد</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">أفضل عائد استثمار</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.max(...recommendations.map(r => r.estimates.roi)).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">ROI</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">توصيات عالية الجودة</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {recommendations.filter(r => r.overallScore >= 80).length}
                  </div>
                  <p className="text-xs text-muted-foreground">من أصل {recommendations.length}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Crop Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((crop, index) => (
              <Card key={crop.id} className={`transition-all hover:shadow-lg ${selectedCrop?.id === crop.id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{crop.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{crop.variety}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${getScoreColor(crop.overallScore)} border-0`}>
                          نقاط الملاءمة: {crop.overallScore}/100
                        </Badge>
                        <Badge variant="outline" className={marketTrendColors[crop.marketTrends.priceStability as keyof typeof marketTrendColors]}>
                          السوق: {crop.marketTrends.priceStability === 'rising' ? 'صاعد' : 
                                   crop.marketTrends.priceStability === 'stable' ? 'مستقر' :
                                   crop.marketTrends.priceStability === 'volatile' ? 'متقلب' : 'متراجع'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Compatibility Scores */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">ملاءمة التربة</p>
                        <p className="font-bold text-lg">{crop.compatibility.soil}%</p>
                        <Progress value={crop.compatibility.soil} className="h-2 mt-1" />
                      </div>
                      <div className="text-center p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">ملاءمة المناخ</p>
                        <p className="font-bold text-lg">{crop.compatibility.climate}%</p>
                        <Progress value={crop.compatibility.climate} className="h-2 mt-1" />
                      </div>
                    </div>

                    {/* Economic Estimates */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">الإنتاج المتوقع</p>
                        <p className="font-bold text-green-600">{crop.estimates.yield} طن/هكتار</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">الربح المتوقع</p>
                        <p className="font-bold text-blue-600">{crop.estimates.profit.toLocaleString()} د.ت</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">عائد الاستثمار</p>
                        <p className="font-bold text-purple-600">{crop.estimates.roi.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Requirements Summary */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span>{crop.requirements.waterNeed} مم</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span>{crop.requirements.plantingDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>{crop.estimates.paybackPeriod} شهر</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCrop(selectedCrop?.id === crop.id ? null : crop)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        {selectedCrop?.id === crop.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Sprout className="w-4 h-4 ml-1" />
                        ابدأ الزراعة
                      </Button>
                    </div>

                    {/* Detailed View */}
                    {selectedCrop?.id === crop.id && (
                      <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                        {/* Compatibility Radar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">تحليل الملاءمة</h4>
                            <ResponsiveContainer width="100%" height={200}>
                              <RadarChart data={getRadarData(crop.compatibility)}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="category" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="النقاط" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">الاستدامة البيئية</h4>
                            <ResponsiveContainer width="100%" height={200}>
                              <RadarChart data={getSustainabilityData(crop.sustainability)}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="category" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="النقاط" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Advantages and Risks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              المزايا
                            </h4>
                            <ul className="text-sm space-y-1">
                              {crop.advantages.map((advantage, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  <span>{advantage}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              المخاطر والتحديات
                            </h4>
                            <ul className="text-sm space-y-1">
                              {crop.risks.map((risk, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-orange-500 mt-1">•</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Requirements Details */}
                        <div>
                          <h4 className="font-medium mb-2">متطلبات الزراعة</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">تاريخ الزراعة</p>
                              <p className="font-medium">{crop.requirements.plantingDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">تاريخ الحص��د</p>
                              <p className="font-medium">{crop.requirements.harvestDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">المسافات</p>
                              <p className="font-medium">{crop.requirements.spacing}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">عمق الزراعة</p>
                              <p className="font-medium">{crop.requirements.depth} سم</p>
                            </div>
                          </div>
                        </div>

                        {/* Fertilizer Requirements */}
                        <div>
                          <h4 className="font-medium mb-2">الأسمدة المطلوبة</h4>
                          <div className="flex flex-wrap gap-2">
                            {crop.requirements.fertilizer.map((fertilizer, i) => (
                              <Badge key={i} variant="outline" className="bg-green-50 text-green-700">
                                {fertilizer}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Market Information */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">السعر الحالي</p>
                            <p className="font-bold text-green-600">{crop.marketTrends.currentPrice} د.ت/طن</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">الطلب</p>
                            <p className={`font-medium ${demandColors[crop.marketTrends.demand as keyof typeof demandColors]}`}>
                              {crop.marketTrends.demand === 'high' ? 'مرتفع' :
                               crop.marketTrends.demand === 'medium' ? 'متوسط' : 'منخفض'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">المنافسة</p>
                            <p className="font-medium">
                              {crop.marketTrends.competitionLevel === 'high' ? 'شديدة' :
                               crop.marketTrends.competitionLevel === 'medium' ? 'متوسطة' : 'منخفضة'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">استقرار السعر</p>
                            <p className="font-medium">
                              {crop.marketTrends.priceStability === 'stable' ? 'مستقر' :
                               crop.marketTrends.priceStability === 'rising' ? 'صاعد' :
                               crop.marketTrends.priceStability === 'volatile' ? 'متقلب' : 'متراجع'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {recommendations.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد توصيات بعد</h3>
                <p className="text-muted-foreground mb-4">
                  يرجى إدخال بيانات التربة والمناخ للحصول على توصيات ذكية
                </p>
                <Button onClick={generateRecommendations}>
                  <Sparkles className="w-4 h-4 ml-2" />
                  إنشاء التوصيات
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="input" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Soil Profile Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  خصائص التربة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">درجة الحموضة (pH)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={soilProfile.ph}
                      onChange={(e) => setSoilProfile({...soilProfile, ph: parseFloat(e.target.value)})}
                      disabled={useIoTData}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">النيتروجين (mg/kg)</label>
                    <Input
                      type="number"
                      value={soilProfile.nitrogen}
                      onChange={(e) => setSoilProfile({...soilProfile, nitrogen: parseInt(e.target.value)})}
                      disabled={useIoTData}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الفوسفور (mg/kg)</label>
                    <Input
                      type="number"
                      value={soilProfile.phosphorus}
                      onChange={(e) => setSoilProfile({...soilProfile, phosphorus: parseInt(e.target.value)})}
                      disabled={useIoTData}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">البوتاسيوم (mg/kg)</label>
                    <Input
                      type="number"
                      value={soilProfile.potassium}
                      onChange={(e) => setSoilProfile({...soilProfile, potassium: parseInt(e.target.value)})}
                      disabled={useIoTData}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">المادة العضوية (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={soilProfile.organicMatter}
                      onChange={(e) => setSoilProfile({...soilProfile, organicMatter: parseFloat(e.target.value)})}
                      disabled={useIoTData}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الرطوبة (%)</label>
                    <Input
                      type="number"
                      value={soilProfile.moisture}
                      onChange={(e) => setSoilProfile({...soilProfile, moisture: parseInt(e.target.value)})}
                      disabled={useIoTData}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">نوع التربة</label>
                  <select
                    value={soilProfile.texture}
                    onChange={(e) => setSoilProfile({...soilProfile, texture: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    disabled={useIoTData}
                  >
                    <option value="clay">طينية</option>
                    <option value="sandy">رملية</option>
                    <option value="loamy">طينية رملية</option>
                    <option value="silty">غرينية</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Climate Data Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  البيانات المناخية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">المنطقة</label>
                  <select
                    value={climateData.region}
                    onChange={(e) => setClimateData({...climateData, region: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="سليانة">سليانة</option>
                    <option value="القيروان">القيروان</option>
                    <option value="باجة">باجة</option>
                    <option value="الكاف">الكاف</option>
                    <option value="جندوبة">جندوبة</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">درجة الحرارة المتوسطة (°م)</label>
                    <Input
                      type="number"
                      value={climateData.avgTemperature}
                      onChange={(e) => setClimateData({...climateData, avgTemperature: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الأمطار السنوية (مم)</label>
                    <Input
                      type="number"
                      value={climateData.annualRainfall}
                      onChange={(e) => setClimateData({...climateData, annualRainfall: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">الرطوبة (%)</label>
                    <Input
                      type="number"
                      value={climateData.humidity}
                      onChange={(e) => setClimateData({...climateData, humidity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">أيام الصقيع</label>
                    <Input
                      type="number"
                      value={climateData.frostDays}
                      onChange={(e) => setClimateData({...climateData, frostDays: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">الموسم</label>
                  <select
                    value={climateData.season}
                    onChange={(e) => setClimateData({...climateData, season: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="winter">شتاء</option>
                    <option value="spring">ربيع</option>
                    <option value="summer">صيف</option>
                    <option value="autumn">خريف</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Farmer Goals Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  أهداف المزارع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الهدف الأساسي</label>
                  <select
                    value={farmerGoals.primary}
                    onChange={(e) => setFarmerGoals({...farmerGoals, primary: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="profit">أقصى ربح</option>
                    <option value="organic">زراعة عضوية</option>
                    <option value="sustainability">الاستدامة</option>
                    <option value="quick_turnover">دورة سريعة</option>
                    <option value="export">التصدير</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">الميزانية (دينار تونسي)</label>
                  <Input
                    type="number"
                    value={farmerGoals.budget}
                    onChange={(e) => setFarmerGoals({...farmerGoals, budget: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">مستوى الخبرة</label>
                  <select
                    value={farmerGoals.experience}
                    onChange={(e) => setFarmerGoals({...farmerGoals, experience: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="beginner">مبتد��</option>
                    <option value="intermediate">متوسط</option>
                    <option value="expert">خبير</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">تحمل المخاطر</label>
                  <select
                    value={farmerGoals.riskTolerance}
                    onChange={(e) => setFarmerGoals({...farmerGoals, riskTolerance: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">مرتفع</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">توفر المياه</label>
                  <select
                    value={farmerGoals.waterAvailability}
                    onChange={(e) => setFarmerGoals({...farmerGoals, waterAvailability: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="limited">محدود</option>
                    <option value="moderate">متوسط</option>
                    <option value="abundant">وفير</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={generateRecommendations} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Brain className="w-5 h-5 ml-2" />
              تحليل البيانات وإنشاء التوصيات
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>التحليل المفصل للتوصيات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                سيظهر التحليل التفصيلي هنا بعد إنشاء التوصيات...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة المحاصيل</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                ستظهر مقارنة شاملة بين المحاصيل المقترحة هنا...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
