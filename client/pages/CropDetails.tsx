import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Droplets,
  Thermometer,
  Sun,
  Cloud,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  BarChart3,
  Clock,
  MapPin,
  Leaf,
  Beaker,
  Truck,
  Users,
  BookOpen,
  Star
} from "lucide-react";

interface CropDetail {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  description: string;
  suitabilityScore: number;
  profitability: number;
  riskLevel: 'low' | 'medium' | 'high';
  plantingSeason: string;
  harvestTime: string;
  estimatedProfit: number;
  marketDemand: 'high' | 'medium' | 'low';
  waterRequirement: 'low' | 'medium' | 'high';
  advantages: string[];
  challenges: string[];
  marketPrice: number;
  estimatedYield: number;
  growthDuration: number;
  
  // Detailed information
  scientificName: string;
  soilRequirements: {
    ph: { min: number; max: number; optimal: string };
    type: string[];
    drainage: string;
  };
  climateRequirements: {
    temperature: { min: number; max: number; optimal: string };
    rainfall: string;
    humidity: string;
    sunlight: string;
  };
  cultivation: {
    seedRate: string;
    plantingDepth: string;
    spacing: string;
    fertilizers: string[];
  };
  timeline: {
    phase: string;
    duration: string;
    activities: string[];
  }[];
  marketAnalysis: {
    localDemand: number;
    exportPotential: number;
    priceVolatility: 'low' | 'medium' | 'high';
    competitors: string[];
    peakSeason: string;
  };
  economicAnalysis: {
    costPerFeddan: number;
    revenuePerFeddan: number;
    profitMargin: number;
    breakEvenPoint: number;
    riskFactors: string[];
  };
  bestPractices: string[];
  commonDiseases: { name: string; prevention: string; treatment: string }[];
  storageAndMarketing: {
    storageMethod: string;
    shelfLife: string;
    marketChannels: string[];
    qualityStandards: string[];
  };
}

export default function CropDetails() {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const [cropData, setCropData] = useState<CropDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock detailed crop data
    const mockCropDetails: { [key: string]: CropDetail } = {
      wheat: {
        id: "wheat",
        name: "القمح",
        nameEn: "Wheat",
        scientificName: "Triticum aestivum",
        category: "حبوب",
        description: "محصول حبوب استراتيجي مناسب للمناخ المصري مع طلب عالي في السوق المحلي والإقليمي",
        suitabilityScore: 95,
        profitability: 85,
        riskLevel: 'low',
        plantingSeason: "أكتوبر - ديسمبر",
        harvestTime: "أبريل - مايو",
        estimatedProfit: 8500,
        marketDemand: 'high',
        waterRequirement: 'medium',
        advantages: ["طلب عالي في السوق", "مقاوم للجفاف", "سعر مستقر", "دعم حكومي"],
        challenges: ["يحتاج رعاية في مرحلة الإنبات", "تقلبات أسعار الأسمدة", "منافسة الواردات"],
        marketPrice: 850,
        estimatedYield: 3.5,
        growthDuration: 180,
        
        soilRequirements: {
          ph: { min: 6.0, max: 7.5, optimal: "6.5 - 7.0" },
          type: ["طينية", "طينية رملية", "صفراء ثقيلة"],
          drainage: "جيد التصريف مع القدرة على الاحتفاظ بالرطوبة"
        },
        
        climateRequirements: {
          temperature: { min: 12, max: 25, optimal: "15-20°C أثناء النمو، 20-25°C أثناء النضج" },
          rainfall: "400-600 مم سنوياً أو الري التكميلي",
          humidity: "50-70% أثناء النمو",
          sunlight: "إضاءة كاملة 6-8 ساعات يومياً"
        },
        
        cultivation: {
          seedRate: "60-80 كيلو للفدان",
          plantingDepth: "3-5 سم",
          spacing: "15-20 سم بين الخطوط",
          fertilizers: ["سوبر فوسفات", "سلفات أمونيوم", "سلفات بوتاسيوم"]
        },
        
        timeline: [
          {
            phase: "التحضير وا��زراعة",
            duration: "أكتوبر - نوفمبر",
            activities: ["حرث الأرض", "إضافة السماد الأساسي", "الزراعة", "الري الأول"]
          },
          {
            phase: "النمو الخضري",
            duration: "ديسمبر - فبراير",
            activities: ["الري المنتظم", "التسميد الآزوتي", "مكافحة الحشائش", "الرش الوقائي"]
          },
          {
            phase: "طرد السنابل",
            duration: "فبراير - مارس",
            activities: ["الري المكثف", "التسميد البوتاسي", "مكافحة الآفات", "المتابعة المستمرة"]
          },
          {
            phase: "النضج والحصاد",
            duration: "أبريل - مايو",
            activities: ["وقف الري", "مراقبة النضج", "الحصاد", "التخزين"]
          }
        ],
        
        marketAnalysis: {
          localDemand: 95,
          exportPotential: 30,
          priceVolatility: 'low',
          competitors: ["القمح المستورد", "قمح المناطق الأخرى"],
          peakSeason: "يونيو - أغسطس"
        },
        
        economicAnalysis: {
          costPerFeddan: 6500,
          revenuePerFeddan: 15000,
          profitMargin: 56.7,
          breakEvenPoint: 2.2,
          riskFactors: ["تقلبات أسعار الأسمدة", "الظروف الجوية", "السياسات الحكومية"]
        },
        
        bestPractices: [
          "استخدام بذور معتمدة عالية الجودة",
          "التسميد المتوازن حسب تحليل التربة",
          "الري المنتظم وتجنب الإفراط",
          "المكافحة المتكاملة للآفات",
          "الحصاد في الوقت المناسب"
        ],
        
        commonDiseases: [
          {
            name: "صدأ الأوراق",
            prevention: "استخدام أصناف مقاومة والرش الوقائي",
            treatment: "مبيدات فطرية مثل البروبيكونازول"
          },
          {
            name: "التفحم المغطى",
            prevention: "معاملة البذور قبل الزراعة",
            treatment: "مبيدات فطرية جهازية"
          }
        ],
        
        storageAndMarketing: {
          storageMethod: "تخزين في مخازن جافة ومه��اة",
          shelfLife: "2-3 سنوات في ظروف مناسبة",
          marketChannels: ["التعاونيات الزراعية", "التجار المحليين", "الصوامع الحكومية"],
          qualityStandards: ["رطوبة أقل من 14%", "خالي من الشوائب", "وزن اللتر 78 كجم"]
        }
      },
      
      tomato: {
        id: "tomato",
        name: "الطماطم",
        nameEn: "Tomato",
        scientificName: "Solanum lycopersicum",
        category: "خضروات",
        description: "محصول خضر رئيسي مع إمكانيات ربحية عالية وفرص تصدير ممتازة",
        suitabilityScore: 88,
        profitability: 92,
        riskLevel: 'medium',
        plantingSeason: "سبتمبر - فبراير",
        harvestTime: "ديسمبر - يونيو",
        estimatedProfit: 15000,
        marketDemand: 'high',
        waterRequirement: 'high',
        advantages: ["ربحية عالية جداً", "سوق محلي وتصديري", "زراعة على مدار السنة", "استهلاك يومي"],
        challenges: ["استهلاك مياه عالي", "حساس للأمراض", "تقلبات سعرية", "تكاليف إنتاج عالية"],
        marketPrice: 4.5,
        estimatedYield: 25,
        growthDuration: 120,
        
        soilRequirements: {
          ph: { min: 6.0, max: 6.8, optimal: "6.2 - 6.5" },
          type: ["طينية رملية", "صفراء خفيفة", "رملية طينية"],
          drainage: "ممتاز التصريف وغني بالمواد العضوية"
        },
        
        climateRequirements: {
          temperature: { min: 18, max: 29, optimal: "20-25°C نهاراً، 15-18°C ليلاً" },
          rainfall: "تجنب الأمطار أثناء النضج",
          humidity: "60-80% مع تهوية جيدة",
          sunlight: "إضاءة كاملة 8-10 ساعات يومياً"
        },
        
        cultivation: {
          seedRate: "200-300 جرام للفدان (شتلات)",
          plantingDepth: "1-2 سم للبذور",
          spacing: "40-50 سم بين النباتات، 100-120 سم بين الخطوط",
          fertilizers: ["كومبوست", "سوبر فوسفات", "سلفات أمونيوم", "سلفات بوتاسيوم"]
        },
        
        timeline: [
          {
            phase: "إنتاج الشتلات",
            duration: "4-5 أسابيع",
            activities: ["زراعة البذور في المشتل", "الري المنتظم", "الرعاية والحماية"]
          },
          {
            phase: "الشتل والنمو",
            duration: "6-8 أسابيع",
            activities: ["نقل الشتلات", "الري بالتنقيط", "التسميد", "إزالة الخلفات"]
          },
          {
            phase: "الإزهار والعقد",
            duration: "4-6 أسابيع",
            activities: ["تنظيم الري", "التسميد البوتاسي", "مكافحة الآفات"]
          },
          {
            phase: "النضج والقطف",
            duration: "8-12 أسبوع",
            activities: ["القطف المتدرج", "الفرز والتعبئة", "التسويق"]
          }
        ],
        
        marketAnalysis: {
          localDemand: 98,
          exportPotential: 85,
          priceVolatility: 'high',
          competitors: ["واردات شتوية", "إنتاج الصوب"],
          peakSeason: "ديسمبر - مارس"
        },
        
        economicAnalysis: {
          costPerFeddan: 12000,
          revenuePerFeddan: 27000,
          profitMargin: 55.6,
          breakEvenPoint: 2.7,
          riskFactors: ["الأمراض النباتية", "تقلبات الأسعار", "ظروف التصدير"]
        },
        
        bestPractices: [
          "استخدام نظام الري بالتنقيط",
          "التسميد المتوازن عبر شبكة الري",
          "إزالة الخلفات والأوراق السفلية",
          "المكافحة المتكاملة للآفات والأمراض",
          "القطف في الوقت المناسب حسب السوق"
        ],
        
        commonDiseases: [
          {
            name: "الذبول الفيوزاريومي",
            prevention: "استخدام أصناف مقاومة وتطهير التربة",
            treatment: "مبيدات فطرية جهازية وتحسين الصرف"
          },
          {
            name: "اللفحة المتأخرة",
            prevention: "تجنب الري العلوي والرش الوقائي",
            treatment: "مبيدات فطرية وقائية وعلاجية"
          }
        ],
        
        storageAndMarketing: {
          storageMethod: "تبريد سريع وتخزين في 10-12°C",
          shelfLife: "2-3 أسابيع في التبريد",
          marketChannels: ["أسواق الجملة", "السوبر ماركت", "التصدير", "��لمصانع"],
          qualityStandards: ["لون موحد", "صلابة جيدة", "خالي من العيوب", "حجم مناسب"]
        }
      }
    };

    const crop = mockCropDetails[cropId!];
    if (crop) {
      setCropData(crop);
    }
    setIsLoading(false);
  }, [cropId]);

  if (isLoading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  if (!cropData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">المحصول غير موجود</h2>
        <Button onClick={() => navigate('/recommendations')}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة للتوصيات
        </Button>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    const colors = {
      low: "text-green-600 bg-green-100",
      medium: "text-yellow-600 bg-yellow-100", 
      high: "text-red-600 bg-red-100"
    };
    return colors[risk as keyof typeof colors];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/recommendations')} variant="outline">
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة للتوصيات
        </Button>
      </div>

      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Leaf className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">{cropData.name}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {cropData.description}
        </p>
      </div>

      {/* Key Metrics */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle>المؤشرات الرئيسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg bg-white">
              <div className="text-3xl font-bold text-primary">{cropData.suitabilityScore}%</div>
              <div className="text-sm text-muted-foreground">درجة الملاءمة</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-white">
              <div className="text-3xl font-bold text-green-600">{cropData.estimatedProfit.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">ر��ح متوقع (جنيه/فدان)</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-white">
              <div className="text-3xl font-bold text-blue-600">{cropData.growthDuration}</div>
              <div className="text-sm text-muted-foreground">يوم للحصاد</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-white">
              <Badge className={getRiskColor(cropData.riskLevel)}>
                مستوى المخاطر: {cropData.riskLevel === 'low' ? 'منخفض' : cropData.riskLevel === 'medium' ? 'متوسط' : 'عالي'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="requirements">متطلبات الزراعة</TabsTrigger>
          <TabsTrigger value="timeline">التوقيت الزراعي</TabsTrigger>
          <TabsTrigger value="economics">التحليل الاقتصادي</TabsTrigger>
          <TabsTrigger value="practices">الممارسات الجيدة</TabsTrigger>
          <TabsTrigger value="diseases">الأمراض والوقاية</TabsTrigger>
          <TabsTrigger value="marketing">التسويق والتخزين</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Soil Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Beaker className="w-5 h-5" />
                  <span>متطلبات التربة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">درجة الحموضة (pH)</h4>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-sm">المدى: {cropData.soilRequirements.ph.min} - {cropData.soilRequirements.ph.max}</span>
                    <Badge variant="outline">الأمثل: {cropData.soilRequirements.ph.optimal}</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">نوع التربة المناسب</h4>
                  <div className="flex flex-wrap gap-2">
                    {cropData.soilRequirements.type.map((type, i) => (
                      <Badge key={i} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">الصرف</h4>
                  <p className="text-sm text-muted-foreground">{cropData.soilRequirements.drainage}</p>
                </div>
              </CardContent>
            </Card>

            {/* Climate Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Sun className="w-5 h-5" />
                  <span>المتطلبات المناخية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <div>
                    <h4 className="font-medium">درجة الحرارة</h4>
                    <p className="text-sm text-muted-foreground">{cropData.climateRequirements.temperature.optimal}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <div>
                    <h4 className="font-medium">الأمطار</h4>
                    <p className="text-sm text-muted-foreground">{cropData.climateRequirements.rainfall}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Cloud className="w-4 h-4 text-gray-500" />
                  <div>
                    <h4 className="font-medium">الرطوبة</h4>
                    <p className="text-sm text-muted-foreground">{cropData.climateRequirements.humidity}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">ضوء الشمس</h4>
                    <p className="text-sm text-muted-foreground">{cropData.climateRequirements.sunlight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cultivation Details */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الزراعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <h4 className="font-medium mb-2">معدل التقاوي</h4>
                  <p className="text-sm text-muted-foreground">{cropData.cultivation.seedRate}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">عمق الزراعة</h4>
                  <p className="text-sm text-muted-foreground">{cropData.cultivation.plantingDepth}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">المسافات</h4>
                  <p className="text-sm text-muted-foreground">{cropData.cultivation.spacing}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">الأسمدة الموصى بها</h4>
                  <div className="flex flex-wrap gap-1">
                    {cropData.cultivation.fertilizers.map((fertilizer, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{fertilizer}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Calendar className="w-5 h-5" />
                <span>الجدول الزمني للزراعة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cropData.timeline.map((phase, index) => (
                  <div key={index} className="border-r-2 border-primary pr-6 relative">
                    <div className="absolute -right-2 w-4 h-4 bg-primary rounded-full"></div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{phase.phase}</h3>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{phase.duration}</span>
                      </div>
                      <ul className="space-y-1">
                        {phase.activities.map((activity, i) => (
                          <li key={i} className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Economic Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <BarChart3 className="w-5 h-5" />
                  <span>التحليل الاقتصادي</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">التكلفة/فدان</h4>
                    <p className="text-2xl font-bold text-red-600">{cropData.economicAnalysis.costPerFeddan.toLocaleString()} جنيه</p>
                  </div>
                  <div>
                    <h4 className="font-medium">الإيراد/فدان</h4>
                    <p className="text-2xl font-bold text-green-600">{cropData.economicAnalysis.revenuePerFeddan.toLocaleString()} جنيه</p>
                  </div>
                  <div>
                    <h4 className="font-medium">هامش الربح</h4>
                    <p className="text-2xl font-bold text-blue-600">{cropData.economicAnalysis.profitMargin.toFixed(1)}%</p>
                  </div>
                  <div>
                    <h4 className="font-medium">نقطة التعادل</h4>
                    <p className="text-2xl font-bold">{cropData.economicAnalysis.breakEvenPoint} طن/فدان</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">عوامل المخاطرة</h4>
                  {cropData.economicAnalysis.riskFactors.map((risk, i) => (
                    <div key={i} className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TrendingUp className="w-5 h-5" />
                  <span>تحليل السوق</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">الطلب المحلي</h4>
                  <Progress value={cropData.marketAnalysis.localDemand} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">{cropData.marketAnalysis.localDemand}%</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">إمكانيات التصدير</h4>
                  <Progress value={cropData.marketAnalysis.exportPotential} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">{cropData.marketAnalysis.exportPotential}%</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">موسم الذروة</h4>
                  <Badge variant="outline">{cropData.marketAnalysis.peakSeason}</Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">المنافسون الرئيسيون</h4>
                  <div className="flex flex-wrap gap-1">
                    {cropData.marketAnalysis.competitors.map((competitor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{competitor}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="practices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Star className="w-5 h-5" />
                <span>أفضل الممارسات الزراعية</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {cropData.bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse p-3 border rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{practice}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diseases" className="space-y-6">
          <div className="grid gap-6">
            {cropData.commonDiseases.map((disease, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>{disease.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">الوقاية</h4>
                    <p className="text-sm">{disease.prevention}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-blue-700">العلاج</h4>
                    <p className="text-sm">{disease.treatment}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Truck className="w-5 h-5" />
                  <span>التخزين والحفظ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">طريقة التخزين</h4>
                  <p className="text-sm text-muted-foreground">{cropData.storageAndMarketing.storageMethod}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">مدة الصلاحية</h4>
                  <Badge variant="outline">{cropData.storageAndMarketing.shelfLife}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Users className="w-5 h-5" />
                  <span>قنوات التسويق</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">منافذ البيع</h4>
                  <div className="space-y-2">
                    {cropData.storageAndMarketing.marketChannels.map((channel, i) => (
                      <div key={i} className="flex items-center space-x-2 rtl:space-x-reverse">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-sm">{channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">معايير الجودة</h4>
                  <div className="flex flex-wrap gap-1">
                    {cropData.storageAndMarketing.qualityStandards.map((standard, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{standard}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => navigate('/recommendations')} variant="outline">
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة للتوصيات
        </Button>
        <Button onClick={() => navigate('/crop-history')}>
          <BookOpen className="w-4 h-4 ml-2" />
          حفظ في المفضلة
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Target className="w-4 h-4 ml-2" />
          طباعة دليل الزراعة
        </Button>
      </div>
    </div>
  );
}
