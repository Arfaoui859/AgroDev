import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Droplets,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  MapPin,
  Clock,
  Target,
  Star,
  Leaf,
  BarChart3,
  Activity,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface LocationData {
  method: string;
  governorate?: string;
  city?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  weatherData?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    description: string;
  };
  timestamp: string;
}

interface CropRecommendation {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  suitabilityScore: number | null;
  profitability: number | null;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  plantingSeason: string;
  harvestTime: string;
  estimatedProfit: number | null;
  marketDemand: 'high' | 'medium' | 'low' | 'unknown';
  waterRequirement: 'low' | 'medium' | 'high' | 'unknown';
  description: string;
  advantages: string[];
  challenges: string[];
  marketPrice: number;
  estimatedYield: number | null;
  growthDuration: number | null;
}

interface RecommendationResponse {
  dataSource?: string;
  isRealData?: boolean;
  disclaimer?: string;
  recommendations?: Array<Record<string, unknown>>;
}

export default function Recommendations() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [provenance, setProvenance] = useState<{
    dataSource: string;
    isRealData: boolean;
    disclaimer?: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedLocation = localStorage.getItem('selectedLocation');
    if (!storedLocation) {
      navigate('/location');
      return;
    }
    try {
      const parsed: unknown = JSON.parse(storedLocation);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("INVALID_SAVED_LOCATION");
      }
      const location = parsed as LocationData;
      setLocationData(location);
      void generateRecommendations(location);
    } catch {
      localStorage.removeItem('selectedLocation');
      toast.error('بيانات الموقع المحفوظة غير صالحة. أعد تحديد موقعك.');
      navigate('/location');
    }
  }, [navigate]);

  /**
   * Ask the crop-recommendation engine for this location's conditions. The
   * engine returns a suitability ranking with the reasoning behind each score;
   * this maps that response into the view model. The engine reports its own
   * dataSource, so a rule-based ranking is never presented as a trained model.
   */
  const generateRecommendations = async (location: LocationData) => {
    setIsLoading(true);

    try {
      const weather = location.weatherData;
      const payload: Record<string, unknown> = {
        location: {
          governorate: location.governorate,
          city: location.city,
          region: location.region,
        },
        temperature: weather?.temperature,
        humidity: weather?.humidity,
        rainfall: (location as { rainfall?: number }).rainfall,
      };

      const response = await fetch('/api/ai/crops/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Crop recommendation failed: ${response.status}`);
      }

      const data = (await response.json()) as RecommendationResponse;
      const items = data.recommendations ?? [];
      if (items.length === 0) {
        throw new Error('لم تُرجع خدمة التوصيات أي نتائج');
      }

      const mapped: CropRecommendation[] = items.map((raw, index) => {
        const r = raw as Record<string, any>;
        const profit = r.profit_analysis ?? {};
        const risk = r.risk_assessment ?? {};
        const optionalNumber = (value: unknown): number | null => {
          if (value === null || value === undefined || value === '') return null;
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        };
        const riskLabel = String(risk.overall_risk_level ?? '').toLowerCase();
        const riskLevel: CropRecommendation['riskLevel'] =
          ['منخفض', 'low'].includes(riskLabel) ? 'low' :
          ['عالٍ', 'مرتفع', 'high'].includes(riskLabel) ? 'high' :
          ['متوسط', 'medium'].includes(riskLabel) ? 'medium' : 'unknown';
        const waterLabel = String(r.water_need ?? '').toLowerCase();
        const water: CropRecommendation['waterRequirement'] =
          ['منخفض', 'low'].includes(waterLabel) ? 'low' :
          ['مرتفع', 'high'].includes(waterLabel) ? 'high' :
          ['متوسط', 'medium'].includes(waterLabel) ? 'medium' : 'unknown';
        const reasoning = Array.isArray(r.reasoning) ? r.reasoning.filter((item): item is string => typeof item === 'string') : [];
        return {
          id: String(r.crop ?? `crop-${index}`),
          name: String(r.name_ar ?? r.crop ?? ''),
          nameEn: String(r.crop ?? ''),
          category: String(r.category ?? ''),
          suitabilityScore: optionalNumber(r.suitability_score) === null ? null : Math.round((optionalNumber(r.suitability_score) as number) * 100),
          profitability: optionalNumber(profit.profit_margin_percent),
          riskLevel,
          plantingSeason: String(r.season ?? ''),
          harvestTime: String(r.harvest_season ?? r.harvest_time ?? ''),
          estimatedProfit: optionalNumber(profit.net_profit),
          marketDemand: ['high', 'medium', 'low'].includes(String(r.market_demand_level ?? '').toLowerCase()) ? String(r.market_demand_level).toLowerCase() as 'high' | 'medium' | 'low' : 'unknown',
          waterRequirement: water,
          description: reasoning.join(' '),
          advantages: reasoning,
          challenges: Array.isArray(r.challenges) ? r.challenges.filter((item: unknown): item is string => typeof item === 'string') : [],
          marketPrice: optionalNumber(r.market_price) ?? 0,
          estimatedYield: optionalNumber(r.predicted_yield_per_hectare),
          growthDuration: optionalNumber(r.growth_duration_days),
        };
      });

      mapped.sort((a, b) => (b.suitabilityScore ?? -1) - (a.suitabilityScore ?? -1));
      setRecommendations(mapped);
      setProvenance({
        dataSource: data.dataSource ?? 'rule-based',
        isRealData: Boolean(data.isRealData),
        disclaimer: data.disclaimer,
      });

      const historyData = {
        locationData: location,
        recommendations: mapped,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };
      try {
        const storedHistory: unknown = JSON.parse(localStorage.getItem('cropRecommendationHistory') || '[]');
        const history = Array.isArray(storedHistory) ? storedHistory : [];
        history.unshift(historyData);
        localStorage.setItem('cropRecommendationHistory', JSON.stringify(history.slice(0, 50)));
      } catch (storageError) {
        console.warn('Recommendations are ready, but local history could not be updated:', storageError);
      }

      toast.success('تم تحليل البيانات وإنتاج التوصيات بنجاح');
    } catch (error) {
      console.error('Crop recommendation error:', error);
      setRecommendations([]);
      toast.error('تعذّر الحصول على توصيات المحاصيل. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: "مخاطر منخفضة", color: "bg-green-500" },
      medium: { label: "مخاطر متوسطة", color: "bg-yellow-500" },
      high: { label: "مخاطر عالية", color: "bg-red-500" },
      unknown: { label: "المخاطر غير مقيّمة", color: "bg-slate-500" }
    };
    const riskConfig = config[risk as keyof typeof config];
    return <Badge className={`${riskConfig.color} text-white`}>{riskConfig.label}</Badge>;
  };

  const getDemandIcon = (demand: string) => {
    switch (demand) {
      case 'high': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'medium': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'low': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getWaterIcon = (requirement: string) => {
    const colors = {
      low: "text-green-500",
      medium: "text-yellow-500",
      high: "text-blue-500",
      unknown: "text-slate-400"
    };
    return <Droplets className={`w-4 h-4 ${colors[requirement as keyof typeof colors]}`} />;
  };

  const filteredRecommendations = recommendations.filter(crop => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "high-profit") return crop.profitability !== null && crop.profitability >= 85;
    if (selectedFilter === "low-risk") return crop.riskLevel === 'low';
    if (selectedFilter === "quick-harvest") return crop.growthDuration !== null && crop.growthDuration > 0 && crop.growthDuration <= 120;
    return crop.category === selectedFilter;
  });

  if (!locationData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-2xl font-bold">تحليل البيانات بالذكاء الاصطناعي</h2>
        <p className="text-muted-foreground text-center max-w-md">
          جاري تحليل بيانات الموقع والمناخ والسوق لإنتاج أفضل التوصيات لك...
        </p>
        <div className="w-64">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 animate-pulse rounded-full bg-primary" /></div>
          <p className="text-sm text-center mt-2">ننتظر استجابة خدمة التوصيات؛ لا نعرض نسبة تقدّم غير مقاسة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">توصيات المحاصيل الذكية</h1>
        <p className="text-muted-foreground">
          توصيات مخصصة بناءً على تحليل الذكاء الاصطناعي للموقع والمناخ والسوق
        </p>
      </div>

      {/* Location Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <MapPin className="w-5 h-5" />
            <span>ملخص الموقع والظروف</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">الموقع</p>
                <p className="text-sm text-muted-foreground">
                  {locationData.governorate ? `${locationData.city}, ${locationData.governorate}` : locationData.address}
                </p>
              </div>
            </div>
            
            {locationData.weatherData && (
              <>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Thermometer className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium">{Math.round(locationData.weatherData.temperature)}°C</p>
                    <p className="text-sm text-muted-foreground">درجة الحرارة</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{Math.round(locationData.weatherData.humidity)}%</p>
                    <p className="text-sm text-muted-foreground">الرطوبة</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Activity className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">{locationData.weatherData.description}</p>
                    <p className="text-sm text-muted-foreground">حالة الطقس</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Target className="w-5 h-5" />
            <span>تصفية التوصيات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "جميع التوصيات" },
              { value: "high-profit", label: "عالي الربحية" },
              { value: "low-risk", label: "مخاطر منخفضة" },
              { value: "quick-harvest", label: "حصاد سريع" },
              { value: "حبوب", label: "حبوب" },
              { value: "خضروات", label: "خضروات" },
              { value: "محاصيل نقدية", label: "محاصيل نقدية" }
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Alert>
        <Star className="h-4 w-4" />
        <AlertDescription>
          <strong>
            {provenance?.isRealData ? 'تحليل نموذج مدرّب:' : 'ترتيب بمحرك قواعد:'}
          </strong>{' '}
          تم ترتيب {recommendations.length} محصول محتمل حسب بيانات الموقع والمناخ المتاحة وجدول مرجعي للمحاصيل. أعلى نتيجة معروضة هي{' '}
          <strong>{recommendations[0]?.name}</strong>{recommendations[0]?.suitabilityScore !== null ? <> بدرجة ملاءمة {recommendations[0]?.suitabilityScore}%.</> : '، دون درجة ملاءمة موثقة من الخدمة.'}
        </AlertDescription>
      </Alert>

      {/* AI Service Integration */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">توصيات المحاصيل الذكية المتقدمة</h3>
              <p className="text-sm text-gray-600 font-normal">تحليل شامل بالذكاء الاصطناعي مع تقدير الربحية وتحليل المخاطر</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">توصيات ذكية مخصصة</h4>
                  <p className="text-xs text-gray-600">تحليل شامل لبيانات مزرعتك وظروفك</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-pink-200">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">تقدير الربحية</h4>
                  <p className="text-xs text-gray-600">حساب دقيق للأرباح وتحليل المخاطر</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={() => navigate('/ai-assistant')}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                ناقش التوصيات مع المستشار الزراعي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Grid */}
      <div className="grid gap-6">
        {filteredRecommendations.map((crop, index) => (
          <Card key={crop.id} className={`hover:shadow-lg transition-shadow ${index === 0 ? 'border-primary' : ''}`}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                {/* Main Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <h3 className="text-xl font-bold">{crop.name}</h3>
                        {index === 0 && (
                          <Badge className="bg-primary text-white">
                            <Star className="w-3 h-3 ml-1" />
                            الأفضل
                          </Badge>
                        )}
                        {getRiskBadge(crop.riskLevel)}
                      </div>
                      <p className="text-muted-foreground">{crop.description}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="text-center p-2 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">{crop.suitabilityScore === null ? 'غير متاح' : `${crop.suitabilityScore}%`}</div>
                      <div className="text-xs text-muted-foreground">درجة الملاءمة</div>
                    </div>
                    
                    <div className="text-center p-2 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{crop.estimatedProfit === null ? 'غير متاح' : crop.estimatedProfit.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">صافي الربح المتوقع (دينار/هكتار)</div>
                    </div>
                    
                    <div className="text-center p-2 border rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        {getDemandIcon(crop.marketDemand)}
                      </div>
                      <div className="text-xs text-muted-foreground">طلب السوق</div>
                    </div>
                    
                    <div className="text-center p-2 border rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        {getWaterIcon(crop.waterRequirement)}
                      </div>
                      <div className="text-xs text-muted-foreground">احتياج مائي</div>
                    </div>
                    
                    <div className="text-center p-2 border rounded-lg">
                      <div className="text-lg font-bold">{crop.estimatedYield === null ? 'غير متاح' : crop.estimatedYield}</div>
                      <div className="text-xs text-muted-foreground">المردود المتوقع (طن/هكتار)</div>
                    </div>
                  </div>

                  {/* Seasons and Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span><strong>موسم الزراعة:</strong> {crop.plantingSeason}</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span><strong>موسم الحصاد:</strong> {crop.harvestTime}</span>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span><strong>الفئة:</strong> {crop.category}</span>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">أسباب الترشيح:</h4>
                    <div className="flex flex-wrap gap-1">
                      {crop.advantages.map((advantage, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          {advantage}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Challenges */}
                  {crop.challenges.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-orange-700">التحديات:</h4>
                    <div className="flex flex-wrap gap-1">
                      {crop.challenges.map((challenge, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          {challenge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="lg:ml-6">
                  <Button 
                    onClick={() => navigate(`/crop/${crop.id}`)}
                    size="lg"
                    className={index === 0 ? "bg-primary" : ""}
                  >
                    <ArrowRight className="w-4 h-4 ml-2" />
                    عرض التفاصيل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">لا توجد توصيات تطابق الفلتر</h3>
            <p className="text-muted-foreground">جرب تغيير فلاتر البحث للعثور على مزيد من التوصيات</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => navigate('/location')} variant="outline">
          <MapPin className="w-4 h-4 ml-2" />
          تغيير الموقع
        </Button>
        <Button onClick={() => navigate('/crop-history')}>
          <BarChart3 className="w-4 h-4 ml-2" />
          عرض سجل التوصيات
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <ArrowRight className="w-4 h-4 ml-2" />
          طباعة التقرير
        </Button>
      </div>
    </div>
  );
}
