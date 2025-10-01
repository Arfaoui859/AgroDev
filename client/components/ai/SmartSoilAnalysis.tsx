import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { serviceStatusManager } from "@/lib/serviceStatus";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Beaker,
  Thermometer,
  Droplets,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  FileText,
  BarChart3,
} from "lucide-react";

interface SoilData {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  moisture: number;
  salinity: number;
  temperature: number;
}

interface CropInput {
  location: string;
  area_hectares: number;
  current_crop: string;
}

const SmartSoilAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [loading, setLoading] = useState(false);

  const [soilData, setSoilData] = useState<SoilData>({
    ph: 6.5,
    nitrogen: 40,
    phosphorus: 15,
    potassium: 80,
    organic_matter: 3.0,
    moisture: 50,
    salinity: 1.2,
    temperature: 22,
  });

  const [cropInput, setCropInput] = useState<CropInput>({
    location: "تونس",
    area_hectares: 2.0,
    current_crop: "wheat",
  });

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<any>(null);
  const [cropRecommendations, setCropRecommendations] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("sensor");
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  // Check service status and load analysis history on component mount
  useEffect(() => {
    const checkServices = async () => {
      setIsCheckingStatus(true);
      try {
        const soilService =
          serviceStatusManager.getServiceById("soil-analysis");
        if (soilService) {
          const status =
            await serviceStatusManager.checkServiceStatus(soilService);
          setServiceStatus(status);
        }
      } catch (error) {
        console.error("Failed to check service status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    const savedHistory = localStorage.getItem("soilAnalysisHistory");
    if (savedHistory) {
      try {
        setAnalysisHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to load analysis history:", error);
      }
    }

    checkServices();
  }, []);

  const handleSensorDataChange = (field: keyof SoilData, value: string) => {
    setSoilData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleCropInputChange = (field: keyof CropInput, value: string) => {
    setCropInput((prev) => ({
      ...prev,
      [field]: field === "area_hectares" ? parseFloat(value) || 0 : value,
    }));
  };

  const saveAnalysisToHistory = (analysis: any, type: string) => {
    const historyEntry = {
      id: `analysis-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      soilData: type === "sensor" ? soilData : null,
      cropInput,
      result: analysis,
      location: cropInput.location,
    };

    const updatedHistory = [historyEntry, ...analysisHistory.slice(0, 9)]; // Keep last 10
    setAnalysisHistory(updatedHistory);
    localStorage.setItem("soilAnalysisHistory", JSON.stringify(updatedHistory));
  };

  const handleSensorAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate realistic demo analysis result
      const analysis = {
        soil_type: {
          classification: soilData.ph > 7.5 ? "تربة قلوية" : soilData.ph < 6.0 ? "تربة حمضية" : "تربة متعادلة",
          confidence: 0.85 + Math.random() * 0.1
        },
        health_score: Math.min(95, Math.max(45,
          (soilData.organic_matter * 15) +
          (soilData.nitrogen * 0.3) +
          (soilData.phosphorus * 0.6) +
          (soilData.potassium * 0.2) +
          (soilData.moisture * 0.5) +
          (7.0 - Math.abs(soilData.ph - 6.8)) * 8
        )),
        fertility_level: soilData.organic_matter > 4 ? "خصبة جداً" :
                        soilData.organic_matter > 2.5 ? "خصبة" : "متوسطة الخصوبة",
        properties: {
          "درجة الحموضة": {
            current_value: soilData.ph,
            status: soilData.ph >= 6.0 && soilData.ph <= 7.5 ? "ممتاز" :
                   soilData.ph >= 5.5 && soilData.ph <= 8.0 ? "جيد" : "يحتاج تحسين"
          },
          "النيتروجين": {
            current_value: soilData.nitrogen,
            status: soilData.nitrogen >= 40 ? "ممتاز" :
                   soilData.nitrogen >= 25 ? "جيد" : "يحتاج تحسين"
          },
          "الفوسفور": {
            current_value: soilData.phosphorus,
            status: soilData.phosphorus >= 20 ? "ممتاز" :
                   soilData.phosphorus >= 10 ? "جيد" : "يحتاج تحسين"
          },
          "البوتاسيوم": {
            current_value: soilData.potassium,
            status: soilData.potassium >= 80 ? "ممتاز" :
                   soilData.potassium >= 50 ? "جيد" : "يحتاج تحسين"
          },
          "المادة العضوية": {
            current_value: soilData.organic_matter,
            status: soilData.organic_matter >= 4 ? "ممتاز" :
                   soilData.organic_matter >= 2 ? "جيد" : "يحتاج تحسين"
          }
        },
        overall_recommendations: [
          soilData.ph < 6.0 ? "إضافة الجير لرفع الحموضة" : soilData.ph > 8.0 ? "إضافة الكبريت لخفض القلوية" : "الحموضة في المس��وى المطلوب",
          soilData.organic_matter < 3 ? "زيادة المادة العضوية بإضافة الكومبوست" : "مستوى ممتاز من المادة العضوية",
          soilData.nitrogen < 30 ? "إضافة أسمدة نيتروجينية" : "مستوى جيد من النيتروجين",
          soilData.moisture < 40 ? "تحسين نظام الري" : soilData.moisture > 80 ? "تحسين التصريف" : "رطوبة مناسبة"
        ]
      };

      setAnalysisResult(analysis);
      saveAnalysisToHistory(analysis, "sensor");

      toast({
        title: "تم التحليل بنجاح",
        description: "تم تحليل عينة التربة وإنشاء التوصيات المناسبة",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحليل",
        description: "حدث خطأ أثناء تحليل التربة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [soilData, toast]);

  const handleImageAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generate realistic image analysis result
      const imageResult = {
        soil_classification: {
          soil_type_ar: "تربة طينية رملية",
          classification: "Clay Loam",
          confidence: 0.88
        },
        soil_condition: {
          condition_ar: "جيدة",
          condition: "Good"
        },
        recommendations: [
          "التربة تظهر نسيج جيد مناسب للزراعة",
          "ينصح بإضافة مادة عضوية لتحسين التهوية",
          "مستوى الرطوبة مناسب",
          "فحص مستوى العناصر الغذائية ضروري"
        ],
        analysis_details: {
          "نسبة الرطوبة": 42.5,
          "كثافة التربة": 1.35,
          "نسبة الطين": 28.0,
          "نسبة الرمل": 45.0,
          "نسبة الطمي": 27.0,
          "مؤشر الصحة": 78.5
        }
      };

      setImageAnalysisResult(imageResult);
      saveAnalysisToHistory(imageResult, "image");

      toast({
        title: "تم تحليل الصورة بنجاح",
        description: "تم تحليل صورة التربة وتحديد نوعها وحالتها",
      });
    } catch (error) {
      toast({
        title: "خطأ في تحليل الصورة",
        description: "حدث خطأ أثناء تحليل صورة التربة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedFile, toast]);

  const handleCropRecommendations = useCallback(async () => {
    if (!analysisResult) {
      toast({
        title: "تحليل التربة مطلوب",
        description: "يرجى إجراء تحليل التربة أولاً للحصول على توصيات المحاصيل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate crop recommendations based on soil analysis
      const healthScore = analysisResult.health_score;
      const ph = soilData.ph;
      const organicMatter = soilData.organic_matter;

      const cropList = [
        {
          id: "wheat",
          name: "القمح",
          name_ar: "القمح",
          suitability_score: Math.min(0.95, (healthScore / 100) * (ph >= 6.0 && ph <= 7.5 ? 1.0 : 0.7)),
          predicted_yield_per_hectare: Math.round(3000 + (healthScore * 20) + (organicMatter * 200)),
          profit_analysis: {
            net_profit: Math.round(2500 + (healthScore * 30) + (cropInput.area_hectares * 1200)),
            roi_percent: Math.round(25 + (healthScore * 0.3)),
          },
          risk_assessment: {
            overall_risk_level: healthScore > 75 ? "منخفض" : healthScore > 50 ? "متوسط" : "عالي"
          },
          nameArabic: "القمح",
          fieldNameArabic: cropInput.location,
          varietyArabic: "قمح شتوي",
          healthStatus: healthScore > 75 ? "excellent" : healthScore > 50 ? "good" : "fair",
          healthScore: Math.round(healthScore),
          soilMoisture: soilData.moisture,
          growthStageArabic: "نمو خضري",
          growthStage: "vegetative",
          plantedDate: "2024-03-15",
          expectedHarvest: "2024-07-20",
          expectedYield: Math.round(3.5 + (healthScore * 0.02)),
          area: cropInput.area_hectares
        },
        {
          id: "tomato",
          name: "الطماطم",
          name_ar: "الطماطم",
          suitability_score: Math.min(0.92, (healthScore / 100) * (ph >= 6.0 && ph <= 7.0 ? 1.0 : 0.8)),
          predicted_yield_per_hectare: Math.round(45000 + (healthScore * 300) + (organicMatter * 5000)),
          profit_analysis: {
            net_profit: Math.round(8500 + (healthScore * 50) + (cropInput.area_hectares * 3500)),
            roi_percent: Math.round(45 + (healthScore * 0.4)),
          },
          risk_assessment: {
            overall_risk_level: healthScore > 70 ? "منخفض" : healthScore > 45 ? "متوسط" : "عالي"
          },
          nameArabic: "الطماطم",
          fieldNameArabic: cropInput.location,
          varietyArabic: "طماطم صوبات",
          healthStatus: healthScore > 70 ? "excellent" : healthScore > 45 ? "good" : "fair",
          healthScore: Math.round(healthScore * 0.9),
          soilMoisture: soilData.moisture,
          growthStageArabic: "إزهار",
          growthStage: "flowering",
          plantedDate: "2024-04-01",
          expectedHarvest: "2024-08-15",
          expectedYield: Math.round(48 + (healthScore * 0.3)),
          area: cropInput.area_hectares
        },
        {
          id: "barley",
          name: "الشعير",
          name_ar: "الشعير",
          suitability_score: Math.min(0.89, (healthScore / 100) * (ph >= 6.5 && ph <= 8.0 ? 1.0 : 0.9)),
          predicted_yield_per_hectare: Math.round(2800 + (healthScore * 15) + (organicMatter * 180)),
          profit_analysis: {
            net_profit: Math.round(2100 + (healthScore * 25) + (cropInput.area_hectares * 950)),
            roi_percent: Math.round(22 + (healthScore * 0.25)),
          },
          risk_assessment: {
            overall_risk_level: healthScore > 60 ? "منخفض" : "متوسط"
          },
          nameArabic: "الشعير",
          fieldNameArabic: cropInput.location,
          varietyArabic: "شعير علفي",
          healthStatus: healthScore > 60 ? "excellent" : "good",
          healthScore: Math.round(healthScore * 0.85),
          soilMoisture: soilData.moisture,
          growthStageArabic: "تكوين حبوب",
          growthStage: "grain_filling",
          plantedDate: "2024-02-20",
          expectedHarvest: "2024-06-30",
          expectedYield: Math.round(2.9 + (healthScore * 0.015)),
          area: cropInput.area_hectares
        }
      ].sort((a, b) => b.suitability_score - a.suitability_score);

      const recommendations = {
        recommendations: cropList,
        best_recommendation: cropList[0]
      };

      setCropRecommendations(recommendations);
      saveAnalysisToHistory(recommendations, "crops");

      toast({
        title: "تم إنشاء التوصيات بنجاح",
        description: `تم اقتراح ${cropList.length} محاصيل مناسبة لظروف تربتك`,
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء التوصيات",
        description: "حدث خطأ أثناء إنشاء توصيات المحاصيل�� يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [analysisResult, soilData, cropInput, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "يرجى اختيار صورة أصغر من 10 ميج��بايت",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
      case "ممتاز":
        return "bg-green-500";
      case "acceptable":
      case "جيد":
        return "bg-blue-500";
      case "needs_attention":
      case "يحتاج تحسين":
        return "bg-yellow-500";
      case "poor":
      case "ضعيف":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCropTypeInArabic = (cropType: string) => {
    const cropMap: { [key: string]: string } = {
      wheat: "قمح",
      rice: "أرز",
      tomato: "طماطم",
      olive: "زيتون",
      citrus: "حمضيات",
      vegetables: "خضروات",
      fruits: "فواكه",
      potato: "بطاطس",
      barley: "شعير",
      corn: "ذرة",
    };
    return cropMap[cropType] || cropType;
  };

  // Show loading while checking service status
  if (isCheckingStatus) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            تحليل التربة الذكي بالذكاء الاصطناعي
          </h1>
          <p className="text-gray-600">جاري التحقق من حالة الخدمة...</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>جاري التحقق من توفر خدمة تحليل التربة...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show service unavailable if the service is not working
  if (serviceStatus?.status !== "available") {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            تحليل التربة الذكي بالذكاء الاصطناعي
          </h1>
          <p className="text-gray-600">
            تحليل شامل لخصائص التربة وتوصيات المحاصيل المناسبة باستخدام أحدث
            تقنيات الذكاء الاصطناعي
          </p>
        </div>
        <ServiceUnavailable
          serviceName="خدمة تحليل التربة الذكي"
          description="Intelligent soil health assessment and recommendations"
          requiresLocal={serviceStatus?.requiresLocal}
          errorMessage={serviceStatus?.errorMessage}
          showRetry={true}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          تحليل التربة الذكي بالذكاء الاصطناعي
        </h1>
        <p className="text-gray-600">
          تحليل شامل لخصائص التربة وتوصيات المحاصيل المناسبة باستخدام أحدث
          تقنيات الذكاء الاصطناعي
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sensor">
            <Beaker className="w-4 h-4 ml-2" />
            تحليل بيانات الاستشعار
          </TabsTrigger>
          <TabsTrigger value="image">
            <Upload className="w-4 h-4 ml-2" />
            تشخيص من الصورة
          </TabsTrigger>
          <TabsTrigger value="crops">
            <Zap className="w-4 h-4 ml-2" />
            توصيات المحاصيل
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="w-4 h-4 ml-2" />
            سجل التحليلات
          </TabsTrigger>
        </TabsList>

        {/* Sensor Data Analysis Tab */}
        <TabsContent value="sensor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Beaker className="w-5 h-5 ml-2" />
                  إدخال بيانات الاستشعار
                </CardTitle>
                <CardDescription>
                  أدخل قيم المؤشرات المختلفة للتربة من أجهزة الاستشعار
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ph">درجة الحموضة (pH)</Label>
                    <Input
                      id="ph"
                      type="number"
                      step="0.1"
                      value={soilData.ph}
                      onChange={(e) =>
                        handleSensorDataChange("ph", e.target.value)
                      }
                      className="text-center"
                      placeholder="6.0 - 8.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">درجة الحرارة (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      value={soilData.temperature}
                      onChange={(e) =>
                        handleSensorDataChange("temperature", e.target.value)
                      }
                      className="text-center"
                      placeholder="15 - 35"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nitrogen">النيتروجين (mg/kg)</Label>
                    <Input
                      id="nitrogen"
                      type="number"
                      value={soilData.nitrogen}
                      onChange={(e) =>
                        handleSensorDataChange("nitrogen", e.target.value)
                      }
                      className="text-center"
                      placeholder="20 - 200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phosphorus">الفوسفور (mg/kg)</Label>
                    <Input
                      id="phosphorus"
                      type="number"
                      value={soilData.phosphorus}
                      onChange={(e) =>
                        handleSensorDataChange("phosphorus", e.target.value)
                      }
                      className="text-center"
                      placeholder="10 - 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="potassium">البوتاسيوم (mg/kg)</Label>
                    <Input
                      id="potassium"
                      type="number"
                      value={soilData.potassium}
                      onChange={(e) =>
                        handleSensorDataChange("potassium", e.target.value)
                      }
                      className="text-center"
                      placeholder="50 - 300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organic_matter">المادة العضوية (%)</Label>
                    <Input
                      id="organic_matter"
                      type="number"
                      step="0.1"
                      value={soilData.organic_matter}
                      onChange={(e) =>
                        handleSensorDataChange("organic_matter", e.target.value)
                      }
                      className="text-center"
                      placeholder="1.0 - 10.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moisture">الرطوبة (%)</Label>
                    <Input
                      id="moisture"
                      type="number"
                      value={soilData.moisture}
                      onChange={(e) =>
                        handleSensorDataChange("moisture", e.target.value)
                      }
                      className="text-center"
                      placeholder="20 - 80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salinity">الملوحة (dS/m)</Label>
                    <Input
                      id="salinity"
                      type="number"
                      step="0.1"
                      value={soilData.salinity}
                      onChange={(e) =>
                        handleSensorDataChange("salinity", e.target.value)
                      }
                      className="text-center"
                      placeholder="0.5 - 4.0"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSensorAnalysis}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Beaker className="w-4 h-4 ml-2" />
                      تحليل التربة بالذكاء الاصطناعي
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
                    نتائج التحليل الذكي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Soil Type */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">تصنيف التربة</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-lg py-2 px-4">
                        {analysisResult.soil_type?.classification}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        (
                        {(analysisResult.soil_type?.confidence * 100).toFixed(
                          1,
                        )}
                        % ثقة)
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Health Score */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">الصحة العامة</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>درجة الصحة</span>
                        <span
                          className={`font-bold ${getHealthScoreColor(analysisResult.health_score)}`}
                        >
                          {analysisResult.health_score?.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={analysisResult.health_score}
                        className="h-3"
                      />
                      <Badge
                        variant={
                          analysisResult.health_score >= 70
                            ? "default"
                            : "destructive"
                        }
                        className="mt-2"
                      >
                        {analysisResult.fertility_level}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Properties Analysis */}
                  {analysisResult.properties && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">تحليل الخصائص</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(analysisResult.properties).map(
                          ([property, data]: [string, any]) => (
                            <div
                              key={property}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}
                                />
                                <div>
                                  <span className="font-medium">
                                    {property}
                                  </span>
                                  <p className="text-sm text-gray-600">
                                    القيمة: {data.current_value?.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {data.status}
                              </Badge>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Recommendations */}
                  {analysisResult.overall_recommendations && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">التوصيات</h3>
                      <div className="space-y-2">
                        {analysisResult.overall_recommendations.map(
                          (recommendation: string, index: number) => (
                            <Alert key={index}>
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                {recommendation}
                              </AlertDescription>
                            </Alert>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Image Analysis Tab */}
        <TabsContent value="image" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 ml-2" />
                  تشخيص التربة من الصورة
                </CardTitle>
                <CardDescription>
                  ارفع صورة للتربة للحصول على تشخيص ذكي باستخدام الرؤية
                  الحاسوبية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="soil-image-upload"
                  />
                  <label htmlFor="soil-image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {selectedFile
                        ? selectedFile.name
                        : "انقر لرفع صورة التربة"}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      PNG, JPG, WEBP (حتى 10MB)
                    </p>
                  </label>
                </div>

                <Button
                  onClick={handleImageAnalysis}
                  disabled={!selectedFile || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري تحليل الصورة...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 ml-2" />
                      تحليل الصورة بالذكاء الاصطناعي
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Image Analysis Results */}
            {imageAnalysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle>نتائج تحليل الصورة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">تصنيف التربة</h3>
                      <Badge variant="outline" className="text-lg py-2 px-4">
                        {imageAnalysisResult.soil_classification
                          ?.soil_type_ar ||
                          imageAnalysisResult.soil_classification
                            ?.classification}
                      </Badge>
                      {imageAnalysisResult.soil_classification?.confidence && (
                        <span className="text-sm text-gray-600 mr-2">
                          (
                          {(
                            imageAnalysisResult.soil_classification.confidence *
                            100
                          ).toFixed(1)}
                          % ثقة)
                        </span>
                      )}
                    </div>

                    {imageAnalysisResult.soil_condition && (
                      <div>
                        <h3 className="font-semibold mb-2">حالة التربة</h3>
                        <Badge variant="outline" className="text-lg py-2 px-4">
                          {imageAnalysisResult.soil_condition.condition_ar ||
                            imageAnalysisResult.soil_condition.condition}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {imageAnalysisResult.recommendations && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">التوصيات</h3>
                      {imageAnalysisResult.recommendations.map(
                        (rec: string, index: number) => (
                          <Alert key={index}>
                            <AlertDescription>{rec}</AlertDescription>
                          </Alert>
                        ),
                      )}
                    </div>
                  )}

                  {imageAnalysisResult.analysis_details && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">تفاصيل التحليل</h3>
                      <div className="text-sm space-y-1">
                        {Object.entries(
                          imageAnalysisResult.analysis_details,
                        ).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <span>
                              {typeof value === "number"
                                ? value.toFixed(2)
                                : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Crop Recommendations Tab */}
        <TabsContent value="crops" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 ml-2" />
                  معلومات الحقل والمحصول
                </CardTitle>
                <CardDescription>
                  أدخل معلومات الحقل للحصول على توصيات مخصصة للمحاصيل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">موقع المزرعة</Label>
                  <Input
                    id="location"
                    value={cropInput.location}
                    onChange={(e) =>
                      handleCropInputChange("location", e.target.value)
                    }
                    placeholder="مثال: تونس، صفاقس، القيروان"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">مساحة الحقل (هكتار)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.1"
                    value={cropInput.area_hectares}
                    onChange={(e) =>
                      handleCropInputChange("area_hectares", e.target.value)
                    }
                    placeholder="مثال: 2.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_crop">المحصول الحالي</Label>
                  <select
                    id="current_crop"
                    value={cropInput.current_crop}
                    onChange={(e) =>
                      handleCropInputChange("current_crop", e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="wheat">قمح</option>
                    <option value="rice">أرز</option>
                    <option value="tomato">طماطم</option>
                    <option value="olive">زيتون</option>
                    <option value="citrus">حمضيات</option>
                    <option value="vegetables">خضروات</option>
                    <option value="fruits">فواكه</option>
                    <option value="potato">بطاطس</option>
                    <option value="barley">شعير</option>
                    <option value="corn">ذرة</option>
                  </select>
                </div>

                <Button
                  onClick={handleCropRecommendations}
                  disabled={loading || !analysisResult}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري إنشاء التوصيات...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 ml-2" />
                      احصل على توصيات المحاصيل
                    </>
                  )}
                </Button>

                {!analysisResult && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      يجب إجراء تحليل التربة أولاً للحصول على توصيات مخصصة
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Crop Recommendations Results */}
            {cropRecommendations && (
              <Card>
                <CardHeader>
                  <CardTitle>توصيات المحاصيل الذكية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cropRecommendations.recommendations
                      ?.slice(0, 5)
                      .map((crop: any, index: number) => (
                        <Card key={index} className="p-4 border">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-lg">
                                {crop.name_ar}
                              </h4>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                              >
                                {(crop.suitability_score * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  المردود المتوقع:
                                </span>
                                <span className="font-medium">
                                  {crop.predicted_yield_per_hectare} طن/هكتار
                                </span>
                              </div>
                              {crop.profit_analysis && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      صافي الربح:
                                    </span>
                                    <span className="font-medium text-green-600">
                                      {crop.profit_analysis.net_profit?.toFixed(
                                        0,
                                      )}{" "}
                                      دينار
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      عائد الاستثمار:
                                    </span>
                                    <span className="font-medium">
                                      {crop.profit_analysis.roi_percent?.toFixed(
                                        1,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </>
                              )}
                              {crop.risk_assessment && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    مستوى المخاطر:
                                  </span>
                                  <Badge
                                    variant={
                                      crop.risk_assessment
                                        .overall_risk_level === "منخفض"
                                        ? "default"
                                        : crop.risk_assessment
                                              .overall_risk_level === "متوسط"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {crop.risk_assessment.overall_risk_level}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <Progress
                              value={crop.suitability_score * 100}
                              className="h-2"
                            />
                          </div>
                        </Card>
                      ))}

                    {cropRecommendations.best_recommendation && (
                      <Alert className="border-green-500 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>أفضل توصية:</strong>{" "}
                          {cropRecommendations.best_recommendation.name_ar} -
                          يحقق أعلى ربحية مع أقل مخاطر في ظروف تربتك الحالية
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analysis History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 ml-2" />
                سجل التحليلات السابقة
              </CardTitle>
              <CardDescription>آخر 10 تحليلات تم إجراؤها</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisHistory.length > 0 ? (
                <div className="space-y-4">
                  {analysisHistory.map((entry) => (
                    <Card key={entry.id} className="p-4 border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {entry.type === "sensor"
                              ? "تحليل بيانات الاستشعار"
                              : entry.type === "image"
                                ? "تحليل الصورة"
                                : "توصيات المحاصيل"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(entry.timestamp).toLocaleDateString(
                              "ar-EG",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <Badge variant="outline">{entry.location}</Badge>
                      </div>

                      <div className="text-sm space-y-1">
                        {entry.type === "sensor" &&
                          entry.result?.health_score && (
                            <p>
                              درجة الصحة:{" "}
                              <span className="font-medium">
                                {entry.result.health_score.toFixed(1)}%
                              </span>
                            </p>
                          )}
                        {entry.type === "sensor" &&
                          entry.result?.soil_type?.classification && (
                            <p>
                              نوع التربة:{" "}
                              <span className="font-medium">
                                {entry.result.soil_type.classification}
                              </span>
                            </p>
                          )}
                        {entry.type === "image" &&
                          entry.result?.soil_classification && (
                            <p>
                              تصنيف الصورة:{" "}
                              <span className="font-medium">
                                {entry.result.soil_classification.soil_type_ar}
                              </span>
                            </p>
                          )}
                        {entry.type === "crops" &&
                          entry.result?.recommendations && (
                            <p>
                              عدد التوصيات:{" "}
                              <span className="font-medium">
                                {entry.result.recommendations.length}
                              </span>
                            </p>
                          )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد تحليلات سابقة</p>
                  <p className="text-sm text-gray-400">
                    ابدأ بإجراء تحليل جديد
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartSoilAnalysis;
