import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen,
  Search,
  Leaf,
  AlertTriangle,
  Shield,
  Beaker,
  Camera,
  Play,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  Lightbulb,
  ArrowRight,
  Info,
  Target,
  Activity,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DiseaseInfo {
  id: string;
  name: string;
  nameEn: string;
  crops: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  identificationTips: string[];
  seasonality: string;
  spreadRate: string;
  economicImpact: string;
}

const diseaseDatabase: DiseaseInfo[] = [
  {
    id: "olive-peacock-spot",
    name: "عين الطاووس",
    nameEn: "Peacock Spot",
    crops: ["زيتون"],
    severity: "medium",
    description: "مرض فطري شائع في أشجار الزيتون يظهر على شكل بقع دائرية على الأوراق تشبه عين الطاووس",
    symptoms: [
      "بقع دائرية على الأوراق بألوان متدرجة",
      "اصفرار حول البقع",
      "تساقط الأوراق المصابة",
      "ضعف عام في الشجرة"
    ],
    causes: [
      "الرطوبة العالية",
      "قلة التهوية",
      "الري العلوي",
      "كثافة الأشجار العالية"
    ],
    treatment: [
      "رش بمبيد فطري نحاسي",
      "إزالة الأوراق المصابة",
      "تحسين التهوية بالتقليم",
      "تجنب الري العلوي"
    ],
    prevention: [
      "تقليم منتظم لت��سين التهوية",
      "زراعة بمسافات مناسبة",
      "رش وقائي في الخريف",
      "تصريف جيد للمياه"
    ],
    identificationTips: [
      "ابحث عن البقع الدائرية المميزة",
      "لاحظ الألوان المتدرجة في البقعة",
      "تحقق من تساقط الأوراق",
      "فحص الأوراق السفلية أولاً"
    ],
    seasonality: "أكثر انتشاراً في الخريف والشتاء",
    spreadRate: "متوسط",
    economicImpact: "متوسط - يؤثر على جودة الزيت"
  },
  {
    id: "tomato-late-blight",
    name: "اللفحة المتأخرة",
    nameEn: "Late Blight",
    crops: ["طماطم", "بطاطس"],
    severity: "high",
    description: "مرض فطري خطير جداً يمكن أن يدمر محصول الطماطم بالكامل في غضون أيام قليلة",
    symptoms: [
      "بقع بنية داكنة على الأوراق",
      "تعفن الثمار",
      "ذبول سريع للنبات",
      "رائحة كريهة من الأجزاء المصابة"
    ],
    causes: [
      "الرطوبة العالية جداً",
      "درجات حرارة معتدلة (15-25°C)",
      "ضعف التهوية",
      "الري العلوي"
    ],
    treatment: [
      "مبيد فطري جهازي فوري",
      "تحسين الصرف والتهوية",
      "إزالة الأجزاء المصابة",
      "تقليل الرطوبة"
    ],
    prevention: [
      "استخدام أصناف مقاومة",
      "تجنب الري العلوي نهائياً",
      "تهوية ممتازة",
      "رش وقائي في الظروف المناسبة"
    ],
    identificationTips: [
      "البقع تنتشر بسرعة كبيرة",
      "لون بني داكن مميز",
      "تعفن الثمار يبدأ من القمة",
      "رائحة مميزة للتعفن"
    ],
    seasonality: "الربيع والخريف مع الرطوبة العالية",
    spreadRate: "سريع جداً",
    economicImpact: "عالي جداً - خسارة كاملة للمحصول"
  },
  {
    id: "citrus-canker",
    name: "تقرح الحمضيات",
    nameEn: "Citrus Canker",
    crops: ["حمضيات"],
    severity: "high",
    description: "مرض بكتيري خطير يصيب جميع أنواع الحمضيات ويسبب تقرحات مميزة",
    symptoms: [
      "تقرحات بارزة على الأو��اق",
      "بقع على الثمار",
      "تساقط أوراق وثمار",
      "ضعف عام في الشجرة"
    ],
    causes: [
      "البكتيريا Xanthomonas",
      "الرياح والأمطار",
      "الجروح في النبات",
      "الحشرات الناقلة"
    ],
    treatment: [
      "مبيد بكتيري نحاسي",
      "إزالة الأجزاء المصابة",
      "تطهير الأدوات",
      "تحسين التهوية"
    ],
    prevention: [
      "فحص الشتلات قبل الزراعة",
      "تجنب الري العلوي",
      "تطهير الأدوات",
      "مكافحة الحشرات"
    ],
    identificationTips: [
      "التقرحات بارزة ومميزة",
      "محاطة بحلقة صفراء",
      "تظهر على الأوراق والثمار",
      "ملمس خشن للتقرحات"
    ],
    seasonality: "على مدار السنة مع ذروة في الربيع",
    spreadRate: "متوسط إلى سريع",
    economicImpact: "عالي - يؤثر على جودة الثمار والتصدير"
  },
  {
    id: "wheat-rust",
    name: "صدأ القمح",
    nameEn: "Wheat Rust",
    crops: ["قمح", "شعير"],
    severity: "high",
    description: "مرض فطري خطير يصيب القمح ويظهر على شكل بقع صدئية على الأوراق",
    symptoms: [
      "بقع صدئية على الأوراق",
      "مسحوق برتقالي أو بني",
      "اصفرار الأوراق",
      "ضعف امتلاء الحبوب"
    ],
    causes: [
      "الرطوبة العالية",
      "درجات حرارة معتدلة",
      "زراعة كثيفة",
      "أصناف حساسة"
    ],
    treatment: [
      "مبيدات فطرية متخصصة",
      "تحسين التهوية",
      "تقليل الكثافة",
      "إزالة المخلفات المصابة"
    ],
    prevention: [
      "زراعة أصناف مقاومة",
      "دورة زراعية مناسبة",
      "تجنب الزراعة الكثيفة",
      "رش وقائي"
    ],
    identificationTips: [
      "اللون الصدئي المميز",
      "المسحوق ينتشر بسهولة",
      "يبدأ على الأوراق السفلية",
      "ينتشر بسرعة في الظروف المناسبة"
    ],
    seasonality: "الربيع والأوائل الصيف",
    spreadRate: "سريع جداً",
    economicImpact: "عالي جداً - تقليل كبير في الإنتاج"
  }
];

const preventionTips = [
  {
    category: "الوقاية العامة",
    tips: [
      "فحص دوري للنباتات",
      "إزالة النباتات المصابة فوراً",
      "تطهير الأدوات الزراعية",
      "تحسين تصريف التربة",
      "تجنب الزراعة الكثيفة"
    ]
  },
  {
    category: "إدارة المياه",
    tips: [
      "تجنب الري العلوي",
      "الري في الصباح الباكر",
      "تجنب الرطوبة الزائدة",
      "تحسين نظام الصرف",
      "استخدام الري بالتنقيط"
    ]
  },
  {
    category: "التغذية والعناية",
    tips: [
      "تغذية متوازنة للنباتات",
      "تجنب الإفراط في النيتروجين",
      "تقوية النبات بالعناصر الصغرى",
      "تحسين بنية التربة",
      "استخدام المحسنات العضوية"
    ]
  }
];

export default function DiseaseGuide() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState("all");
  const navigate = useNavigate();

  const filteredDiseases = diseaseDatabase.filter(disease => {
    const matchesSearch = disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disease.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disease.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === "all" || disease.severity === selectedSeverity;
    const matchesCrop = selectedCrop === "all" || disease.crops.some(crop => crop.includes(selectedCrop));
    
    return matchesSearch && matchesSeverity && matchesCrop;
  });

  const getSeverityBadge = (severity: string) => {
    const config = {
      low: { label: "منخفض", color: "bg-green-500" },
      medium: { label: "متوسط", color: "bg-yellow-500" },
      high: { label: "عالي", color: "bg-red-500" }
    };
    const severityConfig = config[severity as keyof typeof config];
    return <Badge className={`${severityConfig.color} text-white`}>{severityConfig.label}</Badge>;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'high': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">دليل أمراض النباتات</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          دليل شامل للأمراض الشائعة في المحاصيل التونسية مع طرق التشخيص والعلاج والوقاية
        </p>
      </div>

      <Tabs defaultValue="diseases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diseases">دليل الأمراض</TabsTrigger>
          <TabsTrigger value="prevention">الوقاية</TabsTrigger>
          <TabsTrigger value="identification">التشخيص</TabsTrigger>
          <TabsTrigger value="resources">مصادر إضافية</TabsTrigger>
        </TabsList>

        <TabsContent value="diseases" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Search className="w-5 h-5" />
                <span>البحث في الأمراض</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في اسم المرض أو الأعراض..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['all', 'low', 'medium', 'high'].map((severity) => (
                    <Button
                      key={severity}
                      variant={selectedSeverity === severity ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSeverity(severity)}
                    >
                      {severity === 'all' ? 'الكل' : 
                       severity === 'low' ? 'منخفض' :
                       severity === 'medium' ? 'متوسط' : 'عالي'}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['all', 'زيتون', 'حمضيات', 'طماطم', 'قمح'].map((crop) => (
                    <Button
                      key={crop}
                      variant={selectedCrop === crop ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCrop(crop)}
                    >
                      {crop === 'all' ? 'الكل' : crop}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diseases List */}
          <div className="grid gap-6">
            {filteredDiseases.map((disease) => (
              <Card key={disease.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {getSeverityIcon(disease.severity)}
                      <div>
                        <CardTitle className="text-xl">{disease.name}</CardTitle>
                        <CardDescription>{disease.nameEn}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {getSeverityBadge(disease.severity)}
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        {disease.crops.map((crop, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{crop}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-muted-foreground">{disease.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Symptoms */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center space-x-2 rtl:space-x-reverse">
                          <Eye className="w-4 h-4 text-red-500" />
                          <span>الأعراض</span>
                        </h4>
                        <ul className="space-y-2">
                          {disease.symptoms.map((symptom, i) => (
                            <li key={i} className="flex items-start space-x-2 rtl:space-x-reverse text-sm">
                              <AlertTriangle className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                              <span>{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Treatment */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center space-x-2 rtl:space-x-reverse">
                          <Beaker className="w-4 h-4 text-blue-500" />
                          <span>العلاج</span>
                        </h4>
                        <ul className="space-y-2">
                          {disease.treatment.map((treatment, i) => (
                            <li key={i} className="flex items-start space-x-2 rtl:space-x-reverse text-sm">
                              <Target className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                              <span>{treatment}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">الموسمية: </span>
                        <span>{disease.seasonality}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">سرعة الانتشار: </span>
                        <span>{disease.spreadRate}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">التأثير الاقتصادي: </span>
                        <span>{disease.economicImpact}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDiseases.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground">جرب تغيير معايير البحث أو المرشحات</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prevention" className="space-y-6">
          <div className="grid gap-6">
            {preventionTips.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span>{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {category.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="flex items-start space-x-3 rtl:space-x-reverse p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>نصيحة:</strong> الوقاية أفضل وأرخص من العلاج. تطبيق ��ذه الممارسات بانتظام يقلل من احتمالية الإصابة بالأمراض بنسبة تصل إلى 80%.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="identification" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Activity className="w-5 h-5" />
                  <span>خطوات التشخيص الصحيح</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "فحص شامل للنبات",
                      description: "افحص جميع أجزاء النبات: الأوراق، الساق، الجذور، والثمار"
                    },
                    {
                      step: 2,
                      title: "توثيق الأعراض",
                      description: "سجل جميع الأعراض الملاحظة واكتب وقت ظهورها"
                    },
                    {
                      step: 3,
                      title: "التقاط صور واضحة",
                      description: "التقط صور عالية الجودة للأجزاء المصابة من زوايا مختلفة"
                    },
                    {
                      step: 4,
                      title: "فحص الظروف البيئية",
                      description: "راجع الظروف الجوية، الري، التسميد، والعوامل البيئية الأخرى"
                    },
                    {
                      step: 5,
                      title: "استخدام أدوات التشخيص",
                      description: "استخدم تطبيق التشخيص بالذكاء الاصطناعي أو استشر خبير"
                    }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-4 rtl:space-x-reverse p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نصائح التصوير للتشخيص</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "استخدم الضوء الطبيعي",
                    "اقترب من المنطقة المصابة",
                    "تأكد من وضوح الصورة",
                    "التقط من زوايا متعددة",
                    "اعرض حجم الإصابة",
                    "أدرج صور للنبات السليم للمقارنة"
                  ].map((tip, index) => (
                    <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Camera className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <ExternalLink className="w-5 h-5" />
                  <span>مصادر إضافية مفيدة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "وزارة الفلاحة التونسية",
                      description: "موقع رسمي للإرشادات الزراعية والتوصيات",
                      link: "https://www.agriculture.tn"
                    },
                    {
                      title: "المعهد الوطني للبحوث الزراعية",
                      description: "أبحاث ودراسات حول أمراض النباتات في تونس",
                      link: "https://www.inrat.tn"
                    },
                    {
                      title: "منظمة الفاو",
                      description: "دليل عالمي لأمراض النباتات وطرق مكافحتها",
                      link: "https://www.fao.org"
                    },
                    {
                      title: "PlantNet",
                      description: "تطبيق عالمي لتحديد النباتات والأمراض",
                      link: "https://plantnet.org"
                    }
                  ].map((resource, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium mb-1">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 ml-1" />
                        زيارة الموقع
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Play className="w-5 h-5" />
                  <span>فيديوهات تعليمية</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "كيفية تشخيص أمراض الزيتون",
                    "الوقاية من أمراض الطماطم",
                    "إدارة أمراض الحمضيات",
                    "التعرف على أمراض القمح"
                  ].map((video, index) => (
                    <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse p-3 border rounded">
                      <Play className="w-5 h-5 text-green-500" />
                      <span>{video}</span>
                      <Badge variant="outline" className="text-xs ml-auto">قريباً</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">هل تحتاج تشخيص فوري؟</h3>
          <p className="text-muted-foreground mb-4">
            استخدم نظام التشخيص بالذكاء الاصطناعي للحصول على تشخيص دقيق خلال دقائق
          </p>
          <Button onClick={() => navigate('/disease-upload')} size="lg">
            <Zap className="w-5 h-5 ml-2" />
            ابدأ التشخيص الآن
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
