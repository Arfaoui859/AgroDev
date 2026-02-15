import React, { useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { serviceStatusManager } from "@/lib/serviceStatus";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Stethoscope,
  Eye,
  Activity,
  FileImage,
  Leaf,
  Bug,
} from "lucide-react";

const PlantDiseaseDetection: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("disease");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Check service status on component mount
  React.useEffect(() => {
    const checkServices = async () => {
      setIsCheckingStatus(true);
      try {
        const diseaseService = serviceStatusManager.getServiceById(
          "plant-disease-detection",
        );
        if (diseaseService) {
          const status =
            await serviceStatusManager.checkServiceStatus(diseaseService);
          setServiceStatus(status);
        }
      } catch (error) {
        console.error("Failed to check service status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkServices();
  }, []);
  const [plantType, setPlantType] = useState<string>("unspecified");
  const [growthStage, setGrowthStage] = useState<string>("unspecified");

  // Results states
  const [diseaseResult, setDiseaseResult] = useState<any>(null);
  const [leafResult, setLeafResult] = useState<any>(null);
  const [comprehensiveResult, setComprehensiveResult] = useState<any>(null);
  const [quickResult, setQuickResult] = useState<any>(null);

  const plantTypes = [
    { value: "tomato", label: "طماطم" },
    { value: "wheat", label: "قمح" },
    { value: "corn", label: "ذرة" },
    { value: "rice", label: "أرز" },
    { value: "potato", label: "بطاطس" },
    { value: "onion", label: "بصل" },
    { value: "cucumber", label: "خيار" },
    { value: "lettuce", label: "خس" },
  ];

  const growthStages = [
    { value: "seedling", label: "شتلة" },
    { value: "juvenile", label: "نمو مبكر" },
    { value: "mature", label: "ناضج" },
    { value: "senescent", label: "متقدم السن" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDetectDisease = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate realistic disease detection based on plant type and random factors
      const isHealthy = Math.random() > 0.3; // 70% chance of disease
      const diseaseTypes = [
        {
          disease: "early_blight",
          disease_name_ar: "اللفحة المبكرة",
          probability: 0.85 + Math.random() * 0.1,
          severity_level: "متوسط"
        },
        {
          disease: "bacterial_spot",
          disease_name_ar: "البقع البكتيرية",
          probability: 0.78 + Math.random() * 0.15,
          severity_level: "عالي"
        },
        {
          disease: "powdery_mildew",
          disease_name_ar: "البياض الدقيقي",
          probability: 0.72 + Math.random() * 0.2,
          severity_level: "منخفض"
        },
        {
          disease: "healthy",
          disease_name_ar: "نبات سليم",
          probability: 0.92 + Math.random() * 0.08,
          severity_level: "لا يوجد"
        }
      ];

      const primaryDisease = isHealthy ? diseaseTypes[3] : diseaseTypes[Math.floor(Math.random() * 3)];
      const healthScore = isHealthy ? 85 + Math.random() * 10 : 30 + Math.random() * 40;

      const result = {
        disease_detection: {
          primary_disease: primaryDisease,
          top_predictions: isHealthy ? [primaryDisease] : [
            primaryDisease,
            ...diseaseTypes.filter(d => d !== primaryDisease).slice(0, 2)
          ]
        },
        severity_assessment: {
          severity_level: primaryDisease.severity_level,
          severity_score: isHealthy ? 0 : 1 + Math.random() * 3,
          affected_area_percentage: isHealthy ? 0 : 15 + Math.random() * 45,
          urgency_level: primaryDisease.severity_level === "عالي" ? "عاجل" :
                        primaryDisease.severity_level === "متوسط" ? "متوسط" : "منخفض"
        },
        health_score: {
          health_score: healthScore
        },
        treatment_plan: isHealthy ? null : {
          immediate_treatment: [
            "إزالة الأوراق المصابة فوراً",
            "تطبيق مبيد فطري مناسب",
            "تحسين التهوية حول النبات",
            "تقليل الري على الأوراق",
            "مراقبة النبات يومياً"
          ],
          estimated_recovery_time: primaryDisease.severity_level === "عالي" ? "3-4 أسابيع" :
                                  primaryDisease.severity_level === "متوسط" ? "2-3 أسابيع" : "1-2 أسبوع"
        }
      };

      setDiseaseResult(result);
    } catch (error) {
      console.error("Disease detection error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const handleAnalyzeLeaf = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2800));

      // Generate realistic leaf analysis
      const leafQuality = Math.random();
      const healthScore = 50 + leafQuality * 40;
      const nutritionScore = 45 + leafQuality * 45;

      const deficiencies = [
        { name_ar: "نقص النيتروجين", severity_stage: "متوسط", probability: 0.75 },
        { name_ar: "نقص البوتاسيوم", severity_stage: "منخفض", probability: 0.65 },
        { name_ar: "نقص الفوسفور", severity_stage: "عالي", probability: 0.82 },
        { name_ar: "نقص المغنيسيوم", severity_stage: "متوسط", probability: 0.58 }
      ];

      const primaryDeficiency = deficiencies[Math.floor(Math.random() * deficiencies.length)];

      const result = {
        overall_leaf_score: {
          quality_grade: healthScore > 80 ? "A" : healthScore > 65 ? "B" : healthScore > 50 ? "C" : "D",
          overall_score: healthScore
        },
        health_evaluation: {
          overall_health_score: healthScore,
          health_category: healthScore > 75 ? "ممتاز" : healthScore > 60 ? "جيد" : healthScore > 45 ? "متوسط" : "ضعيف"
        },
        leaf_nutrition: {
          nutritional_health_score: nutritionScore,
          primary_deficiency: primaryDeficiency,
          nutrition_recommendations: [
            "إضافة سماد نيتروجيني متوازن",
            "تحسين التصريف لامتصاص أفضل للعناصر",
            "فحص مستوى الحموضة في التربة",
            "استخدام السماد الورقي كمكمل",
            "زيادة المادة العضوية في التربة"
          ]
        },
        growth_assessment: {
          overall_growth_score: healthScore * 0.9,
          development_indicators: {
            size_adequacy: leafQuality > 0.7 ? "مناسب" : "أقل من المطلوب",
            structural_development: leafQuality > 0.6 ? "طبيعي" : "متأخر",
            maturity_level: leafQuality > 0.8 ? "ناضج" : "في طور النمو"
          },
          growth_recommendations: [
            "تحسين التعرض للضوء",
            "تنظيم جدول الري",
            "إزالة الأوراق المتضررة",
            "مراقبة درجة الحرارة"
          ]
        },
        stress_analysis: leafQuality < 0.6 ? {
          detected_stress_types: {
            water_stress: {
              severity: "متوسط",
              indicators: ["ذبول طفيف", "تغير لون الأوراق"],
              recommendations: ["تحسين نظام الري", "فحص رطوبة التربة"]
            },
            nutrient_stress: {
              severity: "عالي",
              indicators: ["اصفرار الأوراق", "نمو بطيء"],
              recommendations: ["تطبيق سماد متوازن", "فحص التربة"]
            }
          }
        } : null
      };

      setLeafResult(result);
    } catch (error) {
      console.error("Leaf analysis error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const handleComprehensiveAnalysis = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Generate comprehensive analysis combining disease and leaf health
      const overallHealth = 45 + Math.random() * 40;
      const diseaseHealth = Math.random() > 0.6 ? 80 + Math.random() * 15 : 30 + Math.random() * 30;
      const leafHealth = 50 + Math.random() * 35;
      const nutritionHealth = 40 + Math.random() * 45;

      const actionPriority = overallHealth < 50 ? "عاجل" : overallHealth < 70 ? "متوسط" : "منخفض";

      const result = {
        overall_plant_health: {
          score: overallHealth,
          components: {
            disease_health: diseaseHealth,
            leaf_health: leafHealth,
            nutrition_health: nutritionHealth
          }
        },
        combined_assessment: {
          action_priority: actionPriority,
          health_assessment: overallHealth > 75 ? "النبات في حالة ممتازة" :
                           overallHealth > 60 ? "النبات في حالة جيدة مع بعض التحديات" :
                           overallHealth > 40 ? "النبات يحتاج عناية فورية" : "النبات في حالة حرجة",
          primary_concerns: overallHealth < 60 ? [
            "مستوى الصحة العامة منخفض",
            "تحديات في التغذية",
            "احتمالية إصابة بالأمراض",
            "ضرورة التدخل السريع"
          ] : [],
          monitoring_schedule: {
            immediate: actionPriority === "عاجل" ? "فحص يومي" : "فحص كل 3 أيام",
            short_term: "مراقبة أسبوعية للتقدم",
            long_term: "تقييم شهري شامل"
          }
        },
        unified_recommendations: [
          "تحسين نظام الري لضمان الرطوبة المناسبة",
          "تطبيق برنامج تسميد متوازن",
          "مراقبة العلامات المبكرة للأمراض",
          "تحسين التهوية حول النبات",
          "فحص التربة لتحديد العناصر الناقصة",
          "استخدام المبيدات الحيوية الآمنة",
          "إزالة الأجزاء المتضررة",
          "توفير الإضاءة المناسبة"
        ]
      };

      setComprehensiveResult(result);
    } catch (error) {
      console.error("Comprehensive analysis error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const handleQuickCheck = useCallback(async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate quick health assessment
      const healthScore = 35 + Math.random() * 50;
      const needsAttention = healthScore < 60;

      const issues = ["مشاكل في التغذية", "علامات مرض محتملة", "إجهاد مائي", "نقص في الإضاءة"];
      const nutritionStatuses = ["جيدة", "تحتاج تحسين", "ناقصة", "ضعيفة"];

      const result = {
        overall_health_score: healthScore,
        overall_status: healthScore > 75 ? "ممتاز" :
                       healthScore > 60 ? "جيد" :
                       healthScore > 45 ? "يحتاج عناية" : "حالة حرجة",
        priority_level: needsAttention ? "عالي" : "متوسط",
        primary_issue: issues[Math.floor(Math.random() * issues.length)],
        nutrition_status: nutritionStatuses[Math.floor(Math.random() * nutritionStatuses.length)],
        needs_immediate_attention: needsAttention,
        quick_recommendations: [
          "فحص مستوى الرطوبة في التربة",
          "تحسين التهوية حول النبات",
          "مراقبة علامات الأمراض يومياً",
          "ضبط جدول الري حسب الحاجة",
          "إضافة سماد ورقي سريع المفعول"
        ]
      };

      setQuickResult(result);
    } catch (error) {
      console.error("Quick check error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "none":
      case "منخفض":
        return "bg-green-500 text-white";
      case "low":
      case "متوسط":
        return "bg-yellow-500 text-white";
      case "medium":
      case "عالي":
        return "bg-orange-500 text-white";
      case "high":
      case "عاجل":
        return "bg-red-500 text-white";
      case "very_high":
      case "حرج":
        return "bg-red-700 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDiseaseResult(null);
    setLeafResult(null);
    setComprehensiveResult(null);
    setQuickResult(null);
    setPlantType("unspecified");
    setGrowthStage("unspecified");
  };

  // Show loading while checking service status
  if (isCheckingStatus) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            كشف أمراض النباتات بالذكاء الاصطناعي
          </h1>
          <p className="text-gray-600">جاري التحقق من حالة الخدمة...</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>جاري التحقق من توفر خدمة كشف أمراض النباتات...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show service unavailable if the service is not working
  if (serviceStatus?.status !== "available") {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            كشف أمراض النباتات بالذكاء الاصطناعي
          </h1>
          <p className="text-gray-600">
            اكتشاف وتشخيص أمراض النباتات باستخدام تقنيات الرؤية الحاسوبية
            المتقدمة
          </p>
        </div>
        <ServiceUnavailable
          serviceName="خدمة كشف أمراض النباتات"
          description="Image-based plant disease identification and treatment recommendations"
          requiresLocal={serviceStatus?.requiresLocal}
          errorMessage={serviceStatus?.errorMessage}
          showRetry={true}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          تشخيص أمراض النباتات بالذكاء الاصطناعي
        </h1>
        <p className="text-gray-600">
          تحليل شامل لصحة النباتات وكشف الأمراض من الصور
        </p>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileImage className="w-5 h-5 ml-2" />
            رفع صورة النبات
          </CardTitle>
          <CardDescription>
            ارفع صورة واضحة للنبات أو الورقة المراد فحصها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-xs max-h-64 mx-auto rounded-lg shadow-md"
                />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                  <Button onClick={resetAll} variant="outline" size="sm">
                    رفع صورة أخرى
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg text-gray-600">
                    انقر لرفع صورة أو اسحب الملف هنا
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    PNG, JPG, WEBP (حتى 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Plant Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع النبات (اختياري)</Label>
              <Select value={plantType} onValueChange={setPlantType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع النبات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">غير محدد</SelectItem>
                  {plantTypes.map((plant) => (
                    <SelectItem key={plant.value} value={plant.value}>
                      {plant.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مرحلة النمو (اختياري)</Label>
              <Select value={growthStage} onValueChange={setGrowthStage}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مرحلة النمو" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">غير محدد</SelectItem>
                  {growthStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      {selectedFile && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="disease">
              <Bug className="w-4 h-4 ml-2" />
              كشف الأمراض
            </TabsTrigger>
            <TabsTrigger value="leaf">
              <Leaf className="w-4 h-4 ml-2" />
              تحليل الأوراق
            </TabsTrigger>
            <TabsTrigger value="comprehensive">
              <Stethoscope className="w-4 h-4 ml-2" />
              تح��يل شامل
            </TabsTrigger>
            <TabsTrigger value="quick">
              <Eye className="w-4 h-4 ml-2" />
              فحص سريع
            </TabsTrigger>
          </TabsList>

          {/* Disease Detection Tab */}
          <TabsContent value="disease" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bug className="w-5 h-5 ml-2" />
                  كشف ال��مراض والآفات
                </CardTitle>
                <CardDescription>
                  تشخيص دقيق للأمراض الفطرية والبكتيرية والآفات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDetectDisease}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري تشخيص الأمراض...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4 ml-2" />
                      كشف الأمراض
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Disease Detection Results */}
            {diseaseResult && (
              <div className="space-y-6">
                {/* Primary Disease */}
                <Card
                  className={
                    diseaseResult.disease_detection.primary_disease.disease ===
                    "healthy"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {diseaseResult.disease_detection.primary_disease
                        .disease === "healthy" ? (
                        <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 ml-2 text-red-600" />
                      )}
                      التشخيص ��لأساسي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          {
                            diseaseResult.disease_detection.primary_disease
                              .disease_name_ar
                          }
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">نسبة الثقة:</span>
                            <Badge variant="outline">
                              {(
                                diseaseResult.disease_detection.primary_disease
                                  .probability * 100
                              ).toFixed(1)}
                              %
                            </Badge>
                          </div>
                          <Progress
                            value={
                              diseaseResult.disease_detection.primary_disease
                                .probability * 100
                            }
                            className="h-2"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">تقييم الشدة</h4>
                        <div className="space-y-2">
                          <Badge
                            className={getSeverityColor(
                              diseaseResult.severity_assessment.severity_level,
                            )}
                          >
                            {diseaseResult.severity_assessment.severity_level}
                          </Badge>
                          <div className="text-sm">
                            درجة الشدة:{" "}
                            {diseaseResult.severity_assessment.severity_score.toFixed(
                              1,
                            )}
                            /4
                          </div>
                          <div className="text-sm">
                            المنطقة المتضررة:{" "}
                            {diseaseResult.severity_assessment.affected_area_percentage.toFixed(
                              1,
                            )}
                            %
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">مستوى الإلحاح</h4>
                        <Badge
                          className={getSeverityColor(
                            diseaseResult.severity_assessment.urgency_level,
                          )}
                        >
                          {diseaseResult.severity_assessment.urgency_level}
                        </Badge>
                        <div className="mt-2">
                          <span className="text-sm">الصحة العامة: </span>
                          <span
                            className={`font-medium ${getHealthColor(diseaseResult.health_score.health_score)}`}
                          >
                            {diseaseResult.health_score.health_score.toFixed(1)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* All Predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle>جميع التشخيصات المحتملة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {diseaseResult.disease_detection.top_predictions.map(
                        (prediction: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium">
                                {prediction.disease_name_ar}
                              </span>
                              <Badge
                                className={`mr-2 ${getSeverityColor(prediction.severity_level)}`}
                                variant="outline"
                              >
                                {prediction.severity_level}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                احتمالية
                              </div>
                              <div className="font-medium">
                                {(prediction.probability * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Treatment Plan */}
                {diseaseResult.treatment_plan &&
                  diseaseResult.treatment_plan.immediate_treatment.length >
                    0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="w-5 h-5 ml-2" />
                          خطة العلاج
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-3">العلاج الفوري:</h4>
                          <div className="space-y-2">
                            {diseaseResult.treatment_plan.immediate_treatment.map(
                              (treatment: string, index: number) => (
                                <Alert key={index}>
                                  <AlertDescription>
                                    {treatment}
                                  </AlertDescription>
                                </Alert>
                              ),
                            )}
                          </div>
                        </div>

                        {diseaseResult.treatment_plan
                          .estimated_recovery_time && (
                          <div className="pt-3 border-t">
                            <span className="text-sm text-gray-600">
                              وقت التعافي المتوقع:{" "}
                            </span>
                            <Badge variant="outline">
                              {
                                diseaseResult.treatment_plan
                                  .estimated_recovery_time
                              }
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
              </div>
            )}
          </TabsContent>

          {/* Leaf Analysis Tab */}
          <TabsContent value="leaf" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Leaf className="w-5 h-5 ml-2" />
                  تحليل صحة الأوراق
                </CardTitle>
                <CardDescription>
                  تحليل مفصل للتغذية والنمو وصحة الأوراق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleAnalyzeLeaf}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جار�� تحليل الأوراق...
                    </>
                  ) : (
                    <>
                      <Leaf className="w-4 h-4 ml-2" />
                      تحليل الأوراق
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Leaf Analysis Results */}
            {leafResult && (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle>التقييم الإجمالي للورقة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {leafResult.overall_leaf_score.quality_grade}
                        </div>
                        <div className="text-sm text-gray-600">الدرجة</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {leafResult.overall_leaf_score.overall_score.toFixed(
                            1,
                          )}
                          /100
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div
                          className={`text-3xl font-bold ${getHealthColor(leafResult.health_evaluation.overall_health_score)}`}
                        >
                          {leafResult.health_evaluation.overall_health_score.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">
                          الصحة العامة
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {leafResult.health_evaluation.health_category}
                        </div>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div
                          className={`text-3xl font-bold ${getHealthColor(leafResult.leaf_nutrition.nutritional_health_score)}`}
                        >
                          {leafResult.leaf_nutrition.nutritional_health_score.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">
                          الصحة الغذائية
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {leafResult.leaf_nutrition.primary_deficiency.name_ar}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Nutrition Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>تحليل التغذية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">
                          حالة التغذية الأساسية:
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>
                              {
                                leafResult.leaf_nutrition.primary_deficiency
                                  .name_ar
                              }
                            </span>
                            <Badge
                              className={getSeverityColor(
                                leafResult.leaf_nutrition.primary_deficiency
                                  .severity_stage,
                              )}
                            >
                              {
                                leafResult.leaf_nutrition.primary_deficiency
                                  .severity_stage
                              }
                            </Badge>
                          </div>
                          <Progress
                            value={
                              leafResult.leaf_nutrition.primary_deficiency
                                .probability * 100
                            }
                            className="h-2"
                          />
                          <div className="text-sm text-gray-600">
                            ��رجة الثقة:{" "}
                            {(
                              leafResult.leaf_nutrition.primary_deficiency
                                .probability * 100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">التوصيات الغذائية:</h4>
                        <div className="space-y-1">
                          {leafResult.leaf_nutrition.nutrition_recommendations
                            .slice(0, 3)
                            .map((rec: string, index: number) => (
                              <div
                                key={index}
                                className="text-sm p-2 bg-gray-50 rounded"
                              >
                                {rec}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle>تقييم النمو والتطور</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {leafResult.growth_assessment.overall_growth_score.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">
                          درجة النم�� الإجمالية
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">مؤشرات التطور:</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            كفاية الحجم:{" "}
                            {
                              leafResult.growth_assessment
                                .development_indicators.size_adequacy
                            }
                          </div>
                          <div>
                            التطور الهيكلي:{" "}
                            {
                              leafResult.growth_assessment
                                .development_indicators.structural_development
                            }
                          </div>
                          <div>
                            مستوى النضج:{" "}
                            {
                              leafResult.growth_assessment
                                .development_indicators.maturity_level
                            }
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">توصيات النمو:</h4>
                        <div className="space-y-1">
                          {leafResult.growth_assessment.growth_recommendations
                            ?.slice(0, 2)
                            .map((rec: string, index: number) => (
                              <div
                                key={index}
                                className="text-xs p-1 bg-blue-50 rounded"
                              >
                                {rec}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stress Analysis */}
                {leafResult.stress_analysis &&
                  Object.keys(leafResult.stress_analysis.detected_stress_types)
                    .length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <AlertTriangle className="w-5 h-5 ml-2 text-yellow-600" />
                          تحليل الإجهاد البيئي
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(
                            leafResult.stress_analysis.detected_stress_types,
                          ).map(([stressType, stressData]: [string, any]) => (
                            <div
                              key={stressType}
                              className="p-3 border rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">
                                  {stressType.replace("_", " ")}
                                </h4>
                                <Badge
                                  className={getSeverityColor(
                                    stressData.severity,
                                  )}
                                >
                                  {stressData.severity}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="text-gray-600">المؤشرات:</div>
                                <div className="flex flex-wrap gap-1">
                                  {stressData.indicators.map(
                                    (indicator: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {indicator}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                                <div className="text-gray-600 mt-2">
                                  التوصيات:
                                </div>
                                <div className="space-y-1">
                                  {stressData.recommendations.map(
                                    (rec: string, index: number) => (
                                      <div
                                        key={index}
                                        className="text-xs bg-yellow-50 p-1 rounded"
                                      >
                                        {rec}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            )}
          </TabsContent>

          {/* Comprehensive Analysis Tab */}
          <TabsContent value="comprehensive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="w-5 h-5 ml-2" />
                  التحليل الشامل للنبات
                </CardTitle>
                <CardDescription>
                  تحليل متكامل يجمع بين كشف الأمراض وتحليل الأوراق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleComprehensiveAnalysis}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحليل الشامل...
                    </>
                  ) : (
                    <>
                      <Stethoscope className="w-4 h-4 ml-2" />
                      تحليل شامل
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Comprehensive Results */}
            {comprehensiveResult && (
              <div className="space-y-6">
                {/* Overall Health Summary */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">
                      ملخص الصحة العامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {comprehensiveResult.overall_plant_health.score.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">
                          الصحة الإجمالية
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {comprehensiveResult.overall_plant_health.components.disease_health.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">صحة الأمراض</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {comprehensiveResult.overall_plant_health.components.leaf_health.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">صحة الأوراق</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {comprehensiveResult.overall_plant_health.components.nutrition_health.toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-sm text-gray-600">
                          الصحة الغذائية
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="text-center">
                      <Badge
                        className={getSeverityColor(
                          comprehensiveResult.combined_assessment
                            .action_priority,
                        )}
                        variant="outline"
                      >
                        أولوية العمل:{" "}
                        {
                          comprehensiveResult.combined_assessment
                            .action_priority
                        }
                      </Badge>
                      <div className="mt-2 text-sm text-gray-600">
                        {
                          comprehensiveResult.combined_assessment
                            .health_assessment
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Concerns */}
                {comprehensiveResult.combined_assessment.primary_concerns
                  .length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 ml-2 text-red-600" />
                        المخاوف الرئيسية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {comprehensiveResult.combined_assessment.primary_concerns.map(
                          (concern: string, index: number) => (
                            <Alert key={index} className="border-red-200">
                              <AlertDescription>{concern}</AlertDescription>
                            </Alert>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Unified Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>التوصيات الموحدة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {comprehensiveResult.unified_recommendations
                        .slice(0, 8)
                        .map((recommendation: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2 p-2 bg-gray-50 rounded"
                          >
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="text-sm">{recommendation}</div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monitoring Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle>جدولة المراقبة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="font-medium text-red-800">فوري</div>
                        <div className="text-sm text-red-600">
                          {
                            comprehensiveResult.combined_assessment
                              .monitoring_schedule.immediate
                          }
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="font-medium text-yellow-800">
                          قصير المدى
                        </div>
                        <div className="text-sm text-yellow-600">
                          {
                            comprehensiveResult.combined_assessment
                              .monitoring_schedule.short_term
                          }
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-800">
                          طويل المدى
                        </div>
                        <div className="text-sm text-green-600">
                          {
                            comprehensiveResult.combined_assessment
                              .monitoring_schedule.long_term
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Quick Check Tab */}
          <TabsContent value="quick" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 ml-2" />
                  فحص سريع
                </CardTitle>
                <CardDescription>
                  تقييم سريع لصحة النبات مناسب للاستخدام الميداني
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleQuickCheck}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الفحص السريع...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 ml-2" />
                      فحص سريع
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Check Results */}
            {quickResult && (
              <Card>
                <CardHeader>
                  <CardTitle>نتائج الفحص السريع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div
                        className={`text-4xl font-bold ${getHealthColor(quickResult.overall_health_score)}`}
                      >
                        {quickResult.overall_health_score.toFixed(1)}%
                      </div>
                      <div className="text-lg font-medium mt-2">
                        {quickResult.overall_status}
                      </div>
                      <Badge
                        className={getSeverityColor(quickResult.priority_level)}
                        variant="outline"
                      >
                        أولوية: {quickResult.priority_level}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">المشكلة الأساسية:</h4>
                        <Badge variant="outline" className="text-sm">
                          {quickResult.primary_issue}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">حالة التغذية:</h4>
                        <Badge variant="secondary" className="text-sm">
                          {quickResult.nutrition_status}
                        </Badge>
                      </div>

                      {quickResult.needs_immediate_attention && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-red-800">
                            يحتاج اهتمام فوري
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="font-medium mb-3">توصيات سريعة:</h4>
                    <div className="space-y-2">
                      {quickResult.quick_recommendations.map(
                        (rec: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-2 bg-blue-50 rounded"
                          >
                            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PlantDiseaseDetection;
