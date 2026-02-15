import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAIServices } from "@/hooks/useAIServices";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Droplets,
  Zap,
  Leaf,
  ArrowRight,
  FileText,
  Download,
  AlertCircle,
  Thermometer,
  Activity,
  RefreshCw,
  Lightbulb,
  Target,
} from "lucide-react";

interface SoilData {
  location: string;
  area: string;
  cropType: string;
  ph: string;
  moisture?: string;
  organicMatter?: string;
  nitrogen?: string;
  phosphorus?: string;
  potassium?: string;
  conductivity?: string;
  temperature?: string;
  pollutants?: string[];
  customPollutants?: string;
  notes?: string;
  timestamp: string;
  id: string;
  sensorData?: Record<string, number>;
  analysisResult?: any;
}

interface AnalysisResult {
  status: "excellent" | "good" | "fair" | "poor";
  score: number;
  message: string;
}

export default function Analysis() {
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [cropRecommendations, setCropRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { analyzeSoilData, getSmartCropRecommendations } = useAIServices();

  useEffect(() => {
    const data = localStorage.getItem("currentAnalysis");
    if (data) {
      const parsedData = JSON.parse(data);
      setSoilData(parsedData);
      
      // If we already have AI analysis results, use them
      if (parsedData.analysisResult) {
        setAiAnalysisResult(parsedData.analysisResult);
      } else if (parsedData.sensorData) {
        // If we have sensor data but no analysis, run AI analysis
        runAIAnalysis(parsedData.sensorData, parsedData);
      }
    }
  }, []);

  const runAIAnalysis = async (sensorData: Record<string, number>, originalData: SoilData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Run AI soil analysis
      const analysisResult = await analyzeSoilData(sensorData);
      setAiAnalysisResult(analysisResult);
      
      // Get crop recommendations based on soil analysis
      const recommendationInput = {
        ph: sensorData.ph || 7.0,
        nitrogen: sensorData.nitrogen || 0,
        phosphorus: sensorData.phosphorus || 0,
        potassium: sensorData.potassium || 0,
        temperature: sensorData.temperature || 25,
        humidity: 65, // Default
        rainfall: 600, // Default for Tunisia
        area_hectares: parseFloat(originalData.area) || 2.0,
        current_crop: originalData.cropType || 'wheat',
        location: originalData.location || 'Tunisia',
        soil_type: analysisResult.soil_type?.classification || 'mixed'
      };
      
      const recommendations = await getSmartCropRecommendations(recommendationInput);
      setCropRecommendations(recommendations);
      
      // Save updated data with AI results
      const updatedData = {
        ...originalData,
        analysisResult,
        cropRecommendations: recommendations
      };
      localStorage.setItem("currentAnalysis", JSON.stringify(updatedData));
      
      toast({
        title: "تم التحليل بنجاح",
        description: "تم إكمال التحليل الذكي للتربة والحصول على التوصيات",
      });
      
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setError("فشل في التحليل الذكي للتربة");
      toast({
        title: "خطأ في التحليل",
        description: "تعذر إجراء التحليل الذكي، سيتم عرض التحليل الأساسي",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const retryAIAnalysis = () => {
    if (soilData?.sensorData) {
      runAIAnalysis(soilData.sensorData, soilData);
    }
  };

  // Fallback basic analysis functions
  const analyzePH = (ph: string): AnalysisResult => {
    const value = parseFloat(ph);
    if (value >= 6.0 && value <= 7.5) {
      return {
        status: "excellent",
        score: 95,
        message: "مستوى الحموضة ممتاز ومناسب لمعظم المحاصيل",
      };
    } else if (value >= 5.5 && value <= 8.0) {
      return {
        status: "good",
        score: 80,
        message: "مستوى الحموضة جيد مع إمكانية للتحسين",
      };
    } else if (value >= 4.5 && value <= 9.0) {
      return {
        status: "fair",
        score: 60,
        message: "مستوى الحموضة متوسط ويحتاج معالجة",
      };
    } else {
      return {
        status: "poor",
        score: 30,
        message: "مستوى الحموضة غير مناسب ويحتاج تدخل فوري",
      };
    }
  };

  const analyzeNutrient = (
    value: string,
    type: "nitrogen" | "phosphorus" | "potassium",
  ): AnalysisResult => {
    const num = parseFloat(value);
    const ranges = {
      nitrogen: { excellent: [120, 200], good: [80, 250], fair: [40, 300] },
      phosphorus: { excellent: [25, 60], good: [15, 80], fair: [10, 100] },
      potassium: { excellent: [150, 250], good: [100, 300], fair: [50, 350] },
    };

    const range = ranges[type];
    const names = {
      nitrogen: "النيتروجين",
      phosphorus: "الفوسفور",
      potassium: "البوتاسيوم",
    };

    if (num >= range.excellent[0] && num <= range.excellent[1]) {
      return {
        status: "excellent",
        score: 95,
        message: `مستوى ${names[type]} ممتاز`,
      };
    } else if (num >= range.good[0] && num <= range.good[1]) {
      return { status: "good", score: 80, message: `مستوى ${names[type]} جيد` };
    } else if (num >= range.fair[0] && num <= range.fair[1]) {
      return {
        status: "fair",
        score: 60,
        message: `مستوى ${names[type]} متوسط`,
      };
    } else {
      return {
        status: "poor",
        score: 30,
        message: `مستوى ${names[type]} غير مناسب`,
      };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
      case "optimal":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "good":
      case "acceptable":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "fair":
      case "needs_attention":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "poor":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
      case "optimal":
        return "bg-green-500";
      case "good":
      case "acceptable":
        return "bg-blue-500";
      case "fair":
      case "needs_attention":
        return "bg-yellow-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const cropTypeMap: { [key: string]: string } = {
    olive: "زيتون",
    citrus: "حمضيات",
    wheat: "قمح صلب",
    tomato: "طماطم",
    artichoke: "خرشوف",
    vegetables: "خضروات",
    fruits: "فواكه",
    grains: "حبوب",
    trees: "أشجار مثمرة",
    rice: "أرز",
    other: "أخرى",
  };

  if (!soilData) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">لا توجد بيانات للتحليل</h2>
        <p className="text-muted-foreground mb-6">
          يرجى إدخال بيانات التربة أولاً للحصول على التحليل
        </p>
        <Button onClick={() => navigate("/")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          إدخال بيانات التربة
        </Button>
      </div>
    );
  }

  // Determine which analysis to use - AI results or fallback basic analysis
  let analysisData: any = {};
  let overallScore = 0;
  let overallStatus = "fair";

  if (aiAnalysisResult) {
    // Use AI analysis results
    analysisData = aiAnalysisResult;
    overallScore = aiAnalysisResult.health_score || 0;
    overallStatus = aiAnalysisResult.fertility_level === 'خصب' ? 'excellent' :
                    aiAnalysisResult.fertility_level === 'جيد' ? 'good' :
                    aiAnalysisResult.fertility_level === 'متوسط' ? 'fair' : 'poor';
  } else {
    // Use basic fallback analysis
    const phAnalysis = analyzePH(soilData.ph);
    const nitrogenAnalysis = soilData.nitrogen ? analyzeNutrient(soilData.nitrogen, "nitrogen") : null;
    const phosphorusAnalysis = soilData.phosphorus ? analyzeNutrient(soilData.phosphorus, "phosphorus") : null;
    const potassiumAnalysis = soilData.potassium ? analyzeNutrient(soilData.potassium, "potassium") : null;

    const analyses = [phAnalysis, nitrogenAnalysis, phosphorusAnalysis, potassiumAnalysis].filter(Boolean);
    overallScore = analyses.reduce((sum, analysis) => sum + analysis!.score, 0) / analyses.length;
    overallStatus = overallScore >= 85 ? "excellent" : overallScore >= 70 ? "good" : overallScore >= 50 ? "fair" : "poor";
    
    analysisData = {
      basic_analysis: true,
      ph: phAnalysis,
      nitrogen: nitrogenAnalysis,
      phosphorus: phosphorusAnalysis,
      potassium: potassiumAnalysis
    };
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">تحليل التربة الذكي</h1>
        <p className="text-muted-foreground">
          نتائج التحليل والتوصيات المخصصة لحقل {soilData.location}
        </p>
      </div>

      {/* AI Analysis Status */}
      {loading && (
        <Alert className="border-blue-500 bg-blue-50">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            جاري إجراء التحليل الذكي باستخدام الذكاء الاصطناعي...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={retryAIAnalysis}>
              <RefreshCw className="h-3 w-3 mr-1" />
              إعادة المحاولة
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Analysis Success */}
      {aiAnalysisResult && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            تم التحليل بنجاح باستخدام الذكاء الاصطناعي المتطور
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2 rtl:space-x-reverse">
              {getStatusIcon(overallStatus)}
              <span>التق��يم العام للتربة</span>
              {aiAnalysisResult && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  AI-Powered
                </Badge>
              )}
            </span>
            <Badge
              variant={
                overallStatus === "excellent"
                  ? "default"
                  : overallStatus === "good"
                    ? "secondary"
                    : "destructive"
              }
            >
              {Math.round(overallScore)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>نسبة صحة التربة</span>
                  <span className="font-medium">
                    {Math.round(overallScore)}%
                  </span>
                </div>
                <Progress value={overallScore} className="h-3" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {aiAnalysisResult ? (
                aiAnalysisResult.fertility_level === 'خصب' ? "تربة ممتازة ومناسبة جداً للزراعة" :
                aiAnalysisResult.fertility_level === 'جيد' ? "تربة جيدة مع إمكانيات للتحسين" :
                aiAnalysisResult.fertility_level === 'متوسط' ? "تربة متوسطة تحتاج معالجة" :
                "تربة تحتاج تدخل فوري لتحسين الإنتاجية"
              ) : (
                overallStatus === "excellent"
                  ? "تربة ممتازة ومناسبة جداً للزراعة"
                  : overallStatus === "good"
                    ? "تربة جيدة مع إمكانيات للتحسين"
                    : overallStatus === "fair"
                      ? "تربة متوسطة تحتاج معالجة"
                      : "تربة تحتاج تدخل فوري لتحسين الإنتاجية"
              )}
            </p>
            {aiAnalysisResult?.soil_type && (
              <div className="mt-3 p-3 bg-white/50 rounded-lg">
                <p className="text-sm">
                  <strong>نوع التربة:</strong> {aiAnalysisResult.soil_type.classification}
                  <span className="text-gray-500 mr-2">
                    ({(aiAnalysisResult.soil_type.confidence * 100).toFixed(1)}% ثقة)
                  </span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">التحليل التفصيلي</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          <TabsTrigger value="crops">اقتراحات المحاصيل</TabsTrigger>
          <TabsTrigger value="data">البيانات المدخلة</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {/* AI Detailed Analysis */}
          {aiAnalysisResult ? (
            <>
              {/* Soil Properties from AI */}
              {aiAnalysisResult.properties && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Activity className="w-5 h-5" />
                      <span>تحليل خصائص التربة بالذكاء الاصطناعي</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(aiAnalysisResult.properties).map(([property, data]: [string, any]) => (
                        <Card key={property} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{property}</span>
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`} />
                            </div>
                            <div className="text-xs text-gray-600">
                              القيمة الحالية: {data.current_value?.toFixed(2)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {data.status}
                            </Badge>
                            {data.recommendation && (
                              <p className="text-xs text-muted-foreground">
                                {data.recommendation}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Recommendations */}
              {aiAnalysisResult.overall_recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Lightbulb className="w-5 h-5" />
                      <span>توصيات الذكاء الاصطناعي</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {aiAnalysisResult.overall_recommendations.map((recommendation: string, index: number) => (
                        <Alert key={index}>
                          <Target className="h-4 w-4" />
                          <AlertDescription>{recommendation}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Basic Analysis - pH */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Activity className="w-5 h-5" />
                    <span>تحليل درجة الحموضة (pH)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {getStatusIcon(analysisData.ph?.status)}
                      <div>
                        <p className="font-medium">pH = {soilData.ph}</p>
                        <p className="text-sm text-muted-foreground">
                          {analysisData.ph?.message}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        analysisData.ph?.status === "excellent"
                          ? "default"
                          : analysisData.ph?.status === "good"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {analysisData.ph?.score}%
                    </Badge>
                  </div>
                  <Progress value={analysisData.ph?.score} className="h-2" />
                </CardContent>
              </Card>

              {/* Basic Analysis - Nutrients */}
              {(analysisData.nitrogen || analysisData.phosphorus || analysisData.potassium) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Leaf className="w-5 h-5" />
                      <span>تحليل العناصر الغذائية</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisData.nitrogen && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          {getStatusIcon(analysisData.nitrogen.status)}
                          <div>
                            <p className="font-medium">
                              النيتروجين: {soilData.nitrogen} ppm
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {analysisData.nitrogen.message}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            analysisData.nitrogen.status === "excellent"
                              ? "default"
                              : analysisData.nitrogen.status === "good"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {analysisData.nitrogen.score}%
                        </Badge>
                      </div>
                    )}

                    {analysisData.phosphorus && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          {getStatusIcon(analysisData.phosphorus.status)}
                          <div>
                            <p className="font-medium">
                              الفوسفور: {soilData.phosphorus} ppm
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {analysisData.phosphorus.message}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            analysisData.phosphorus.status === "excellent"
                              ? "default"
                              : analysisData.phosphorus.status === "good"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {analysisData.phosphorus.score}%
                        </Badge>
                      </div>
                    )}

                    {analysisData.potassium && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          {getStatusIcon(analysisData.potassium.status)}
                          <div>
                            <p className="font-medium">
                              البوتاسيوم: {soilData.potassium} ppm
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {analysisData.potassium.message}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            analysisData.potassium.status === "excellent"
                              ? "default"
                              : analysisData.potassium.status === "good"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {analysisData.potassium.score}%
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Additional Parameters */}
          {(soilData.moisture || soilData.conductivity || soilData.temperature) && (
            <Card>
              <CardHeader>
                <CardTitle>المعاملات الإضافية</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {soilData.moisture && (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">الرطوبة</p>
                      <p className="text-sm text-muted-foreground">
                        {soilData.moisture}%
                      </p>
                    </div>
                  </div>
                )}

                {soilData.conductivity && (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">التوصيل الكهربائي</p>
                      <p className="text-sm text-muted-foreground">
                        {soilData.conductivity} dS/m
                      </p>
                    </div>
                  </div>
                )}

                {soilData.temperature && (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                    <Thermometer className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium">درجة الحرارة</p>
                      <p className="text-sm text-muted-foreground">
                        {soilData.temperature}°C
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {aiAnalysisResult?.overall_recommendations && aiAnalysisResult.overall_recommendations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">
                  توصيات الذكاء الاصطناعي المتقدمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiAnalysisResult.overall_recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>توصيات عامة لتحسين التربة</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      إضافة 3-5 طن/هكتار من الكومبوست أو السماد العضوي سنوياً
                    </span>
                  </li>
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>تطبيق نظام الدورة الزراعية لتحسين خصوبة التربة</span>
                  </li>
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      استخدام تقنيات الحراثة المحافظة لتقليل تآكل التربة
                    </span>
                  </li>
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>إجراء تحليل دوري للتربة كل 6-12 شهر</span>
                  </li>
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>تحسين نظام الصرف لتجنب تراكم المياه</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="crops" className="space-y-6">
          {cropRecommendations ? (
            <>
              {/* AI Crop Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <span>توصيات المحاصيل المدعومة بالذكاء الاصطناعي</span>
                  </CardTitle>
                  <CardDescription>
                    أفضل المحاصيل المناسبة لظروف التربة والمناخ الحالية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cropRecommendations.recommendations?.slice(0, 6).map((crop: any, index: number) => (
                      <Card key={index} className="p-4 border">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-lg">{crop.name_ar}</h4>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {(crop.suitability_score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">المردود المتوقع:</span>
                              <span className="font-medium">{crop.predicted_yield_per_hectare} طن/هكتار</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">صافي الربح:</span>
                              <span className="font-medium text-green-600">
                                {crop.profit_analysis?.net_profit?.toFixed(0)} دينار
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">عائد الاستثمار:</span>
                              <span className="font-medium">{crop.profit_analysis?.roi_percent?.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">مستوى المخاطر:</span>
                              <Badge variant={crop.risk_assessment?.overall_risk_level === 'منخفض' ? 'default' : 
                                            crop.risk_assessment?.overall_risk_level === 'متوسط' ? 'secondary' : 'destructive'}>
                                {crop.risk_assessment?.overall_risk_level}
                              </Badge>
                            </div>
                          </div>
                          <Progress value={crop.suitability_score * 100} className="h-2" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Best Recommendation Highlight */}
              {cropRecommendations.best_recommendation && (
                <Card className="border-green-500 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-700">
                      أفضل توصية للزراعة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-green-800">
                        {cropRecommendations.best_recommendation.name_ar}
                      </h3>
                      <p className="text-green-700">
                        هذا المحصول يحقق أعلى ربحية وأقل مخاطر في ظروف تربتك الحالية
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">
                  توصيات عامة للمحاصيل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>بناءً على تحليل التربة الأساسي، يُنصح بالمحاصيل التالية:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span>القمح الصلب - مناسب للمناخ التونسي</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span>الزيتون - محصول استراتيجي مربح</span>
                    </li>
                    <li className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span>الحمضيات - حسب توفر المياه</span>
                    </li>
                  </ul>
                  <Alert className="mt-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      لتوصيات أكثر دقة، قم بإدخال جميع بيانات التربة للحصول على تحليل بالذكاء الاصطناعي
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ملخص البيانات المدخلة</CardTitle>
              <CardDescription>
                البيانات التي تم إدخالها في{" "}
                {new Date(soilData.timestamp).toLocaleDateString("ar-EG")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>الموقع:</strong> {soilData.location}
                  </p>
                  <p>
                    <strong>المساحة:</strong> {soilData.area}
                  </p>
                  <p>
                    <strong>نوع المحصول:</strong>{" "}
                    {cropTypeMap[soilData.cropType] || soilData.cropType}
                  </p>
                  <p>
                    <strong>درجة الحموضة:</strong> {soilData.ph}
                  </p>
                  {soilData.moisture && (
                    <p>
                      <strong>الرطوبة:</strong> {soilData.moisture}%
                    </p>
                  )}
                  {soilData.organicMatter && (
                    <p>
                      <strong>المادة العضوية:</strong> {soilData.organicMatter}%
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {soilData.nitrogen && (
                    <p>
                      <strong>النيتروجين:</strong> {soilData.nitrogen} ppm
                    </p>
                  )}
                  {soilData.phosphorus && (
                    <p>
                      <strong>الفوسفور:</strong> {soilData.phosphorus} ppm
                    </p>
                  )}
                  {soilData.potassium && (
                    <p>
                      <strong>البوتاسيوم:</strong> {soilData.potassium} ppm
                    </p>
                  )}
                  {soilData.conductivity && (
                    <p>
                      <strong>التوصيل الكهربائي:</strong>{" "}
                      {soilData.conductivity} dS/m
                    </p>
                  )}
                  {soilData.temperature && (
                    <p>
                      <strong>درجة الحرارة:</strong> {soilData.temperature}°C
                    </p>
                  )}
                </div>
              </div>
              {soilData.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>ملاحظات:</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {soilData.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => navigate("/")} variant="outline">
          <FileText className="w-4 h-4 ml-2" />
          تحليل جديد
        </Button>
        <Button onClick={() => navigate("/history")}>
          <FileText className="w-4 h-4 ml-2" />
          حفظ في السجل
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="w-4 h-4 ml-2" />
          طباعة التقرير
        </Button>
        {soilData.sensorData && !aiAnalysisResult && !loading && (
          <Button onClick={retryAIAnalysis} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحليل ذكي
          </Button>
        )}
      </div>
    </div>
  );
}
