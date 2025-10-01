import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  suitabilityScore: number;
  profitability: number;
  riskLevel: 'low' | 'medium' | 'high';
  plantingSeason: string;
  harvestTime: string;
  estimatedProfit: number;
  marketDemand: 'high' | 'medium' | 'low';
  waterRequirement: 'low' | 'medium' | 'high';
  description: string;
  advantages: string[];
  challenges: string[];
  marketPrice: number;
  estimatedYield: number;
  growthDuration: number;
}

export default function Recommendations() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const location = localStorage.getItem('selectedLocation');
    if (location) {
      setLocationData(JSON.parse(location));
      generateRecommendations(JSON.parse(location));
    } else {
      navigate('/location');
    }
  }, [navigate]);

  const generateRecommendations = async (location: LocationData) => {
    setIsLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI recommendations based on Tunisian location and Mediterranean weather
    const mockRecommendations: CropRecommendation[] = [
      {
        id: "olive",
        name: "الزيتون",
        nameEn: "Olive",
        category: "أشجار مثمرة",
        suitabilityScore: 98,
        profitability: 92,
        riskLevel: 'low',
        plantingSeason: "مارس - أبريل، أكتوبر - نوفمبر",
        harvestTime: "أكتوبر - ديسمبر",
        estimatedProfit: 12000,
        marketDemand: 'high',
        waterRequirement: 'low',
        description: "محصول تقليدي تونسي ممتاز للمناخ المتوسطي مع جودة زيت عالمية",
        advantages: ["جودة زيت عالمية", "تصدير قوي", "مقاوم للجفاف", "عائد طو��ل المدى"],
        challenges: ["استثمار أولي عالي", "يحتاج سنوات لبداية الإنتاج"],
        marketPrice: 8.5,
        estimatedYield: 25,
        growthDuration: 2190 // 6 years to full production
      },
      {
        id: "citrus",
        name: "الحمضيات",
        nameEn: "Citrus",
        category: "أشجار مثمرة",
        suitabilityScore: 94,
        profitability: 88,
        riskLevel: 'low',
        plantingSeason: "مارس - أبريل",
        harvestTime: "نوفمبر - فبراير",
        estimatedProfit: 9500,
        marketDemand: 'high',
        waterRequirement: 'medium',
        description: "الحمضيات التونسية عالية الجودة مع إمكانيات تصدير ممتازة لأوروبا",
        advantages: ["جودة عالية معترف بها عالمياً", "تصدير لأوروبا", "طلب محلي قوي"],
        challenges: ["حساسية للصقيع", "يحتاج رعاية مستمرة"],
        marketPrice: 3.2,
        estimatedYield: 35,
        growthDuration: 1095 // 3 years to production
      },
      {
        id: "wheat",
        name: "القمح الصلب",
        nameEn: "Durum Wheat",
        category: "حبوب",
        suitabilityScore: 90,
        profitability: 82,
        riskLevel: 'low',
        plantingSeason: "نوفمبر - ديسمبر",
        harvestTime: "مايو - يونيو",
        estimatedProfit: 5500,
        marketDemand: 'high',
        waterRequirement: 'medium',
        description: "القمح الصلب التونسي عالي الجودة مناسب للمناخ المتوسطي",
        advantages: ["جودة عالية للمكرونة", "مقاوم للجفاف", "طلب محلي وتصديري"],
        challenges: ["تقلبات أسعار الأسمدة", "منافسة الواردات"],
        marketPrice: 1.2,
        estimatedYield: 35,
        growthDuration: 180
      },
      {
        id: "tomato",
        name: "الطماطم",
        nameEn: "Tomato",
        category: "خضروات",
        suitabilityScore: 88,
        profitability: 90,
        riskLevel: 'medium',
        plantingSeason: "سبتمبر - فبراير",
        harvestTime: "ديسمبر - يونيو",
        estimatedProfit: 8500,
        marketDemand: 'high',
        waterRequirement: 'high',
        description: "الطماطم التونسية عالية الجودة مع تصدير قوي لأوروبا وليبيا",
        advantages: ["تصدير لأوروبا", "جودة ممتازة", "سوق محلي قوي"],
        challenges: ["استهلاك مياه عالي", "حساس للأمراض", "تقلبات سعرية"],
        marketPrice: 2.8,
        estimatedYield: 45,
        growthDuration: 120
      },
      {
        id: "artichoke",
        name: "الخرشوف",
        nameEn: "Artichoke",
        category: "خضروات",
        suitabilityScore: 92,
        profitability: 88,
        riskLevel: 'medium',
        plantingSeason: "أغسطس - سبتمبر",
        harvestTime: "فبراير - أبريل",
        estimatedProfit: 11000,
        marketDemand: 'high',
        waterRequirement: 'medium',
        description: "الخرشوف التونسي مطلوب بقوة في الأسواق الأوروبية وا��محلية",
        advantages: ["تصدير لأوروبا", "سعر عالي", "مناخ مثالي", "طلب متزايد"],
        challenges: ["يحتاج خبرة زراعية", "حساس للحرارة العالية"],
        marketPrice: 6.5,
        estimatedYield: 12,
        growthDuration: 180
      }
    ];

    // Sort by suitability score
    mockRecommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    
    setRecommendations(mockRecommendations);
    setIsLoading(false);
    
    // Save to history
    const historyData = {
      locationData: location,
      recommendations: mockRecommendations,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    const history = JSON.parse(localStorage.getItem('cropRecommendationHistory') || '[]');
    history.unshift(historyData);
    localStorage.setItem('cropRecommendationHistory', JSON.stringify(history));
    
    toast.success("تم تحليل البيانات وإنتاج التوصيات بنجاح");
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      low: { label: "مخاطر منخفضة", color: "bg-green-500" },
      medium: { label: "مخاطر متوسطة", color: "bg-yellow-500" },
      high: { label: "مخاطر عالية", color: "bg-red-500" }
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
      high: "text-blue-500"
    };
    return <Droplets className={`w-4 h-4 ${colors[requirement as keyof typeof colors]}`} />;
  };

  const filteredRecommendations = recommendations.filter(crop => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "high-profit") return crop.profitability >= 85;
    if (selectedFilter === "low-risk") return crop.riskLevel === 'low';
    if (selectedFilter === "quick-harvest") return crop.growthDuration <= 120;
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
          <Progress value={75} className="h-2" />
          <p className="text-sm text-center mt-2">معالجة البيانات...</p>
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

      {/* AI Analysis Summary */}
      <Alert>
        <Star className="h-4 w-4" />
        <AlertDescription>
          <strong>تحليل الذكاء الاصطناعي:</strong> تم تحليل {recommendations.length} محصول محتمل بناءً على
          بيانات المناخ المحلي، أسعار السوق الحالية، وظروف التربة. أعلى توصية لك هي <strong>{recommendations[0]?.name}</strong>
          بدرجة ملاءمة {recommendations[0]?.suitabilityScore}%.
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
                onClick={() => navigate('/ai-intelligence-dashboard?tab=crop-recommendations')}
              >
                <ArrowRight className="w-5 h-5 ml-2" />
                جرب التوصيات المتقدمة الآن
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
                      <div className="text-2xl font-bold text-primary">{crop.suitabilityScore}%</div>
                      <div className="text-xs text-muted-foreground">درجة الملاءمة</div>
                    </div>
                    
                    <div className="text-center p-2 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{crop.estimatedProfit.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">ربح متوقع (جنيه/فدان)</div>
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
                      <div className="text-lg font-bold">{crop.growthDuration}</div>
                      <div className="text-xs text-muted-foreground">يوم للحصاد</div>
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
                      <span><strong>سعر السوق:</strong> {crop.marketPrice} جنيه/{crop.category === "خضروات" ? "كيلو" : "كيلة"}</span>
                    </div>
                  </div>

                  {/* Advantages */}
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">المزايا:</h4>
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
