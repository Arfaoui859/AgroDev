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

  /**
   * All three analyses are computed by the backend agronomic engines. The
   * component previously generated plausible-looking numbers in the browser
   * (Math.random + setTimeout), which presented fabricated results as real
   * analysis. It now posts the readings/image and renders what the engine
   * returns, including its provenance flags.
   */
  const [provenance, setProvenance] = useState<{
    dataSource?: string;
    isRealData?: boolean;
    modelSource?: string | null;
  } | null>(null);

  const postJson = useCallback(
    async (path: string, body: unknown) => {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (data && (data.error || data.message)) ||
            `فشل الطلب (رمز ${response.status})`,
        );
      }
      if (data && typeof data === "object") {
        setProvenance({
          dataSource: data.dataSource,
          isRealData: data.isRealData,
          modelSource: data.modelSource ?? null,
        });
      }
      return data;
    },
    [],
  );

  const handleSensorAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson("/api/ai/soil/analyze", {
        sensor_data: soilData,
        location: cropInput.location,
      });
      setAnalysisResult(data);
      saveAnalysisToHistory(data, "sensor");
      toast({
        title: "تم التحليل بنجاح",
        description: "تم تحليل عينة التربة وإنشاء التوصيات المناسبة",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحليل",
        description:
          (error as Error).message ||
          "حدث خطأ أثناء تحليل التربة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [soilData, cropInput.location, postJson, toast]);

  const handleImageAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const response = await fetch("/api/ai/soil/diagnose-image", {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (data && (data.error || data.message)) ||
            `فشل تحليل الصورة (رمز ${response.status})`,
        );
      }
      if (data && typeof data === "object") {
        setProvenance({
          dataSource: data.dataSource,
          isRealData: data.isRealData,
          modelSource: data.modelSource ?? null,
        });
      }
      setImageAnalysisResult(data);
      saveAnalysisToHistory(data, "image");
      toast({
        title: "تم تحليل الصورة بنجاح",
        description: "تم تحليل صورة التربة وتحديد نوعها وحالتها",
      });
    } catch (error) {
      toast({
        title: "خطأ في تحليل الصورة",
        description:
          (error as Error).message ||
          "حدث خطأ أثناء تحليل صورة التربة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedFile, postJson, toast]);

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
      const data = await postJson("/api/ai/crops/recommend", {
        ph: soilData.ph,
        temperature: soilData.temperature,
        rainfall: undefined,
        salinity: soilData.salinity,
        organic_matter: soilData.organic_matter,
        area_hectares: cropInput.area_hectares,
        season: undefined,
      });
      setCropRecommendations(data);
      saveAnalysisToHistory(data, "crops");
      toast({
        title: "تم إنشاء التوصيات بنجاح",
        description: `تم اقتراح ${data?.recommendations?.length ?? 0} محاصيل مناسبة لظروف تربتك`,
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء التوصيات",
        description:
          (error as Error).message ||
          "حدث خطأ أثناء إنشاء توصيات المحاصيل، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [analysisResult, soilData, cropInput, postJson, toast]);

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
      case "low":
      case "needs_attention":
      case "يحتاج تحسين":
        return "bg-yellow-500";
      case "high":
      case "poor":
      case "ضعيف":
        return "bg-red-500";
      case "missing":
        return "bg-gray-400";
      default:
        return "bg-gray-500";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "optimal":
        return "مثالي";
      case "low":
        return "منخفض";
      case "high":
        return "مرتفع";
      case "missing":
        return "غير مُقاس";
      default:
        return status;
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
                  {provenance && !provenance.isRealData && (
                    <Alert className="border-amber-300 bg-amber-50 text-amber-900">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        النتائج محسوبة بمحرك قواعد زراعية
                        {provenance.modelSource
                          ? ` (${provenance.modelSource})`
                          : ""}{" "}
                        وليست تنبؤاً من نموذج مدرّب. تحقّق مع مهندس زراعي قبل
                        القرار.
                      </AlertDescription>
                    </Alert>
                  )}
                  {/* Soil Type */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">تصنيف التربة</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-lg py-2 px-4">
                        {analysisResult.soil_type?.classification}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        (
                        {(
                          (analysisResult.soil_type?.confidence ?? 0) * 100
                        ).toFixed(1)}
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
                          {(analysisResult.health_score ?? 0).toFixed(1)}%
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
                          ([property, data]: [string, any]) => {
                            // The engine labels each parameter in Arabic and may
                            // report it as missing when no reading was supplied.
                            const finding = (
                              analysisResult.findings as any[] | undefined
                            )?.find((f) => f.parameter === property);
                            const value =
                              data.current_value ?? data.value ?? null;
                            return (
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
                                      {finding?.labelAr ?? property}
                                    </span>
                                    <p className="text-sm text-gray-600">
                                      {value === null
                                        ? "غير مُقاس"
                                        : `القيمة: ${Number(value).toFixed(2)}${data.unit ? ` ${data.unit}` : ""}`}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {statusLabel(data.status)}
                                </Badge>
                              </div>
                            );
                          },
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
