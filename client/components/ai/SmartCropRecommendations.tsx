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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { serviceStatusManager } from "@/lib/serviceStatus";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { useToast } from "@/hooks/use-toast";
import {
  Sprout,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle,
  BarChart3,
  Target,
  Calendar,
  MapPin,
} from "lucide-react";

interface CropInputData {
  temperature: number;
  annual_rainfall: number;
  soil_ph: number;
  soil_quality_score: number;
  water_availability: number;
  farmer_experience_years: number;
  available_capital: number;
  farm_size: number;
  risk_tolerance: number;
}

interface ProfitEstimationData {
  crop_name: string;
  farm_size: number;
  planning_horizon_years: number;
  soil_quality_score: number;
  climate_suitability_score: number;
  farmer_experience_years: number;
  technology_level: number;
  market_distance_km: number;
}

const SmartCropRecommendations: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("recommendations");
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [supportedCrops, setSupportedCrops] = useState<any[]>([]);

  // Recommendation form data
  const [inputData, setInputData] = useState<CropInputData>({
    temperature: 25,
    annual_rainfall: 600,
    soil_ph: 6.5,
    soil_quality_score: 0.7,
    water_availability: 0.8,
    farmer_experience_years: 5,
    available_capital: 15000,
    farm_size: 3.0,
    risk_tolerance: 0.5,
  });

  // Profit estimation data
  const [profitData, setProfitData] = useState<ProfitEstimationData>({
    crop_name: "wheat",
    farm_size: 5.0,
    planning_horizon_years: 1,
    soil_quality_score: 0.8,
    climate_suitability_score: 0.9,
    farmer_experience_years: 10,
    technology_level: 0.7,
    market_distance_km: 30,
  });

  // Results states
  const [recommendations, setRecommendations] = useState<any>(null);
  const [profitEstimation, setProfitEstimation] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [quickRecommendation, setQuickRecommendation] = useState<any>(null);

  // Check service status on component mount
  useEffect(() => {
    const checkServices = async () => {
      setIsCheckingStatus(true);
      try {
        const cropService = serviceStatusManager.getServiceById(
          "crop-recommendation",
        );
        if (cropService) {
          const status =
            await serviceStatusManager.checkServiceStatus(cropService);
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

  const handleInputChange = (field: keyof CropInputData, value: string) => {
    setInputData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleProfitDataChange = (
    field: keyof ProfitEstimationData,
    value: string,
  ) => {
    setProfitData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === "string" ? value : parseFloat(value) || 0,
    }));
  };

  const handleGetRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate realistic crop recommendations based on input data
      const climateScore = inputData.temperature >= 20 && inputData.temperature <= 30 ? 1.0 : 0.7;
      const rainfallScore = inputData.annual_rainfall >= 400 && inputData.annual_rainfall <= 800 ? 1.0 : 0.8;
      const soilScore = inputData.soil_quality_score;
      const baseScore = (climateScore + rainfallScore + soilScore) / 3;

      const cropList = [
        {
          rank: 1,
          name: "wheat",
          name_ar: "القمح",
          category: "حبوب",
          suitability_score: Math.min(0.95, baseScore * (inputData.soil_ph >= 6.0 && inputData.soil_ph <= 7.5 ? 1.0 : 0.8)),
          predicted_yield_per_hectare: Math.round(3200 + (baseScore * 800) + (inputData.farmer_experience_years * 50)),
          profit_analysis: {
            net_profit: Math.round(3500 + (baseScore * 2000) + (inputData.available_capital * 0.15)),
            roi_percent: Math.round(28 + (baseScore * 20) + (inputData.farmer_experience_years * 2)),
            profit_margin_percent: Math.round(35 + (baseScore * 15))
          },
          risk_assessment: {
            overall_risk_level: baseScore > 0.8 ? "منخفض" : baseScore > 0.6 ? "متوسط" : "عالي",
            overall_risk_score: 1 - baseScore
          }
        },
        {
          rank: 2,
          name: "tomato",
          name_ar: "الطماطم",
          category: "خضروات",
          suitability_score: Math.min(0.92, baseScore * (inputData.water_availability >= 0.7 ? 1.0 : 0.7)),
          predicted_yield_per_hectare: Math.round(48000 + (baseScore * 12000) + (inputData.farmer_experience_years * 800)),
          profit_analysis: {
            net_profit: Math.round(12500 + (baseScore * 5000) + (inputData.available_capital * 0.25)),
            roi_percent: Math.round(52 + (baseScore * 25) + (inputData.farmer_experience_years * 1.5)),
            profit_margin_percent: Math.round(42 + (baseScore * 18))
          },
          risk_assessment: {
            overall_risk_level: baseScore > 0.7 ? "منخفض" : baseScore > 0.5 ? "متوسط" : "عالي",
            overall_risk_score: 1 - (baseScore * 0.9)
          }
        },
        {
          rank: 3,
          name: "olive",
          name_ar: "الزيتون",
          category: "أشجار مثمرة",
          suitability_score: Math.min(0.88, baseScore * (inputData.temperature >= 15 && inputData.temperature <= 35 ? 1.0 : 0.6)),
          predicted_yield_per_hectare: Math.round(8500 + (baseScore * 2000) + (inputData.farmer_experience_years * 150)),
          profit_analysis: {
            net_profit: Math.round(8500 + (baseScore * 3500) + (inputData.available_capital * 0.2)),
            roi_percent: Math.round(35 + (baseScore * 18) + (inputData.farmer_experience_years * 1.2)),
            profit_margin_percent: Math.round(38 + (baseScore * 12))
          },
          risk_assessment: {
            overall_risk_level: "منخفض",
            overall_risk_score: 0.3
          }
        },
        {
          rank: 4,
          name: "barley",
          name_ar: "الشعير",
          category: "حبوب",
          suitability_score: Math.min(0.85, baseScore * (inputData.soil_ph >= 6.5 ? 1.0 : 0.9)),
          predicted_yield_per_hectare: Math.round(2800 + (baseScore * 600) + (inputData.farmer_experience_years * 40)),
          profit_analysis: {
            net_profit: Math.round(2800 + (baseScore * 1200) + (inputData.available_capital * 0.12)),
            roi_percent: Math.round(25 + (baseScore * 15) + (inputData.farmer_experience_years * 1.8)),
            profit_margin_percent: Math.round(32 + (baseScore * 10))
          },
          risk_assessment: {
            overall_risk_level: "منخفض",
            overall_risk_score: 0.25
          }
        }
      ];

      const bestRecommendation = cropList[0];

      const result = {
        recommendations: cropList,
        best_recommendation: bestRecommendation,
        seasonal_advice: {
          current_month_crops: [
            { crop: "القمح", timing: "موسم الزراعة المثالي" },
            { crop: "الشعير", timing: "بداية الموسم" }
          ],
          upcoming_crops: [
            { crop: "الطماطم", timing: "الشهر القادم" },
            { crop: "الخيار", timing: "بعد شهرين" },
            { crop: "الفلفل", timing: "بعد ثلاثة أشهر" }
          ]
        }
      };

      setRecommendations(result);

      toast({
        title: "تم إنشاء التوصيات بنجاح",
        description: `تم اقتراح ${cropList.length} محاصيل مناسبة لظروف مزرعتك`,
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "خطأ في التوصيات",
        description: "حدث خطأ أثناء إنشاء التوصيات، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [inputData, toast]);

  const handleEstimateProfit = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generate realistic profit estimation based on input data
      const baseYield = profitData.crop_name === "wheat" ? 3500 :
                       profitData.crop_name === "tomato" ? 45000 :
                       profitData.crop_name === "olive" ? 8000 : 3000;

      const yieldAdjustment = (profitData.soil_quality_score * profitData.climate_suitability_score *
                              (1 + profitData.farmer_experience_years * 0.02) *
                              (1 + profitData.technology_level * 0.15));

      const adjustedYield = Math.round(baseYield * yieldAdjustment);
      const pricePerKg = profitData.crop_name === "wheat" ? 0.45 :
                        profitData.crop_name === "tomato" ? 1.2 :
                        profitData.crop_name === "olive" ? 3.5 : 0.4;

      const grossRevenue = adjustedYield * pricePerKg * profitData.farm_size;
      const totalCosts = Math.round((grossRevenue * 0.6) + (profitData.market_distance_km * 15 * profitData.farm_size));
      const netProfit = grossRevenue - totalCosts;
      const roiPercent = (netProfit / totalCosts) * 100;

      const result = {
        financial_analysis: {
          gross_revenue: grossRevenue,
          total_costs: totalCosts,
          net_profit: netProfit,
          roi_percent: Math.max(0, roiPercent),
          profit_margin_percent: (netProfit / grossRevenue) * 100,
          payback_period_months: Math.max(1, 12 / (roiPercent / 100)),
          profitability_level: roiPercent > 50 ? "ممتاز" : roiPercent > 30 ? "جيد" : roiPercent > 15 ? "متوسط" : "ضعيف"
        },
        risk_analysis: {
          price_risk: {
            level: profitData.crop_name === "tomato" ? "عالي" : "متوسط"
          },
          yield_risk: {
            level: profitData.soil_quality_score > 0.8 ? "منخفض" : "متوسط"
          },
          market_risk: {
            level: profitData.market_distance_km > 50 ? "عالي" : "منخفض"
          },
          overall_risk: {
            level: (profitData.soil_quality_score > 0.8 && profitData.market_distance_km < 30) ? "منخفض" : "متوسط"
          },
          risk_mitigation_strategies: [
            "التنويع في المحاصيل لتقليل المخاطر",
            "استخدام التأمين الزراعي",
            "البحث عن أسواق متعددة للبيع",
            "تطوير شبكة توزيع قوية",
            "مراقبة أسعار السوق باستمرار"
          ]
        }
      };

      setProfitEstimation(result);

      toast({
        title: "تم تقدير الربحية بنجاح",
        description: `العائد على الاستثمار المتوقع: ${roiPercent.toFixed(1)}%`,
      });
    } catch (error) {
      console.error("Error estimating profit:", error);
      toast({
        title: "خطأ في تقدير الربحية",
        description: "حدث خطأ أثناء تقدير الربحية، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profitData, toast]);

  const handleQuickRecommendation = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate quick recommendation based on basic inputs
      const tempScore = inputData.temperature >= 18 && inputData.temperature <= 28 ? 1.0 : 0.7;
      const rainfallScore = inputData.annual_rainfall >= 300 ? 1.0 : 0.6;
      const phScore = inputData.soil_ph >= 6.0 && inputData.soil_ph <= 7.5 ? 1.0 : 0.8;
      const sizeScore = inputData.farm_size >= 1.0 ? 1.0 : 0.9;

      const overallScore = (tempScore + rainfallScore + phScore + sizeScore) / 4;

      const quickCrops = [
        {
          crop_name_ar: "القمح",
          suitability_score: overallScore * (inputData.soil_ph >= 6.5 ? 1.0 : 0.8),
          expected_profit_per_hectare: Math.round(2800 + (overallScore * 1200)),
          risk_level: overallScore > 0.8 ? "منخفض" : "متوسط",
          growing_season: "شتوي"
        },
        {
          crop_name_ar: "الشعير",
          suitability_score: overallScore * 0.9,
          expected_profit_per_hectare: Math.round(2200 + (overallScore * 800)),
          risk_level: "منخفض",
          growing_season: "شتوي"
        },
        {
          crop_name_ar: "البقوليات",
          suitability_score: overallScore * (inputData.annual_rainfall >= 400 ? 0.95 : 0.7),
          expected_profit_per_hectare: Math.round(3200 + (overallScore * 1500)),
          risk_level: overallScore > 0.7 ? "منخفض" : "متوسط",
          growing_season: "ربيعي"
        }
      ].sort((a, b) => b.suitability_score - a.suitability_score);

      const result = {
        best_crop: quickCrops[0],
        quick_recommendations: quickCrops
      };

      setQuickRecommendation(result);

      toast({
        title: "تم إنشاء التوصية السريعة",
        description: `أفضل محصول: ${quickCrops[0].crop_name_ar}`,
      });
    } catch (error) {
      console.error("Error getting quick recommendation:", error);
      toast({
        title: "خطأ في التوصية السريعة",
        description: "حدث خطأ أثناء إنشاء التوصية، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [inputData, toast]);

  const handleCompareTopCrops = useCallback(async () => {
    if (!recommendations) {
      toast({
        title: "التوصيات مطلوبة",
        description: "يرجى الحصول على التوصيات أولاً لتتمكن من المقارنة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use top 3 crops from recommendations for comparison
      const topCrops = recommendations.recommendations.slice(0, 3);

      const result = {
        rankings: {
          by_roi: topCrops
            .map(crop => ({
              crop_name: crop.name,
              crop_name_ar: crop.name_ar,
              roi_percent: crop.profit_analysis?.roi_percent || 0
            }))
            .sort((a, b) => b.roi_percent - a.roi_percent),
          by_net_profit: topCrops
            .map(crop => ({
              crop_name: crop.name,
              crop_name_ar: crop.name_ar,
              net_profit: crop.profit_analysis?.net_profit || 0
            }))
            .sort((a, b) => b.net_profit - a.net_profit)
        },
        best_overall_crop: {
          crop_name: topCrops[0].name,
          crop_name_ar: topCrops[0].name_ar,
          roi_percent: topCrops[0].profit_analysis?.roi_percent || 0,
          net_profit: topCrops[0].profit_analysis?.net_profit || 0,
          overall_score: topCrops[0].suitability_score * 100
        }
      };

      setComparison(result);

      toast({
        title: "تمت المقارنة بنجاح",
        description: `أفضل محصول إجمالياً: ${topCrops[0].name_ar}`,
      });
    } catch (error) {
      console.error("Error comparing crops:", error);
      toast({
        title: "خطأ في المقارنة",
        description: "حدث خطأ أثناء مقارنة المحاصيل، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [recommendations, toast]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "منخفض":
        return "text-green-600 bg-green-100";
      case "متوسط":
        return "text-yellow-600 bg-yellow-100";
      case "عالي":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getProfitabilityColor = (roi: number) => {
    if (roi >= 50) return "text-green-600";
    if (roi >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  // Show loading while checking service status
  if (isCheckingStatus) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            التوصيات الذكية للمحاصيل
          </h1>
          <p className="text-gray-600">جاري التحقق من حالة الخدمة...</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div>جاري التحقق من توفر خدمة التوصيات الذكية...</div>
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
            التوصيات الذكية للمحاصيل
          </h1>
          <p className="text-gray-600">
            احصل على توصيات مخصصة للمحاصيل وتحليل الربحية بالذكاء الاصطناعي
          </p>
        </div>
        <ServiceUnavailable
          serviceName="خدمة التوصيات الذكية للمحاصيل"
          description="AI-powered crop selection based on soil and climate conditions"
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
          التوصي��ت الذكية للمحاصيل
        </h1>
        <p className="text-gray-600">
          احصل على توصيات مخصصة للمحاصيل وتحليل الر��حية بالذكاء الاصطناعي
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">
            <Sprout className="w-4 h-4 ml-2" />
            التوصيات الذكية
          </TabsTrigger>
          <TabsTrigger value="profit">
            <DollarSign className="w-4 h-4 ml-2" />
            تقدير الأرباح
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <BarChart3 className="w-4 h-4 ml-2" />
            مقارنة المحاصيل
          </TabsTrigger>
          <TabsTrigger value="quick">
            <Target className="w-4 h-4 ml-2" />
            توصية سريعة
          </TabsTrigger>
        </TabsList>

        {/* Smart Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sprout className="w-5 h-5 ml-2" />
                إعدادات التوصيات
              </CardTitle>
              <CardDescription>
                أدخل معلومات مزرعتك للحصول عل�� توصيات مخصصة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>درجة الحرارة (°C)</Label>
                  <Input
                    type="number"
                    value={inputData.temperature}
                    onChange={(e) =>
                      handleInputChange("temperature", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الأمطار السنوية (mm)</Label>
                  <Input
                    type="number"
                    value={inputData.annual_rainfall}
                    onChange={(e) =>
                      handleInputChange("annual_rainfall", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>درجة حموضة التربة</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputData.soil_ph}
                    onChange={(e) =>
                      handleInputChange("soil_ph", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>جودة التربة (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    max="1"
                    value={inputData.soil_quality_score}
                    onChange={(e) =>
                      handleInputChange("soil_quality_score", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>توفر المياه (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    max="1"
                    value={inputData.water_availability}
                    onChange={(e) =>
                      handleInputChange("water_availability", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخبرة (سنوات)</Label>
                  <Input
                    type="number"
                    value={inputData.farmer_experience_years}
                    onChange={(e) =>
                      handleInputChange(
                        "farmer_experience_years",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>رأس المال المتاح</Label>
                  <Input
                    type="number"
                    value={inputData.available_capital}
                    onChange={(e) =>
                      handleInputChange("available_capital", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>حجم المزرعة (هكتار)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputData.farm_size}
                    onChange={(e) =>
                      handleInputChange("farm_size", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>تحمل المخاطر (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    max="1"
                    value={inputData.risk_tolerance}
                    onChange={(e) =>
                      handleInputChange("risk_tolerance", e.target.value)
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleGetRecommendations}
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
                    <Sprout className="w-4 h-4 ml-2" />
                    الحصول على التوصيات
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recommendations Results */}
          {recommendations && (
            <div className="space-y-6">
              {/* Best Recommendation */}
              {recommendations.best_recommendation && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <CheckCircle className="w-5 h-5 ml-2" />
                      أفضل توصية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {recommendations.best_recommendation.name_ar}
                        </h3>
                        <Badge variant="outline" className="mb-2">
                          {recommendations.best_recommendation.category}
                        </Badge>
                        <div className="space-y-1 text-sm">
                          <div>
                            درجة الملائمة:{" "}
                            {(
                              recommendations.best_recommendation
                                .suitability_score * 100
                            ).toFixed(1)}
                            %
                          </div>
                          <div>
                            الإنتاجية المتوقعة:{" "}
                            {recommendations.best_recommendation.predicted_yield_per_hectare.toFixed(
                              0,
                            )}{" "}
                            كغ/هكتار
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">التحليل المالي</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>الربح الصافي:</span>
                            <span className="font-medium">
                              {recommendations.best_recommendation.profit_analysis?.net_profit?.toFixed(
                                0,
                              )}{" "}
                              $
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>العائد على الاستثمار:</span>
                            <span
                              className={`font-medium ${getProfitabilityColor(recommendations.best_recommendation.profit_analysis?.roi_percent || 0)}`}
                            >
                              {recommendations.best_recommendation.profit_analysis?.roi_percent?.toFixed(
                                1,
                              )}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>هامش الربح:</span>
                            <span className="font-medium">
                              {recommendations.best_recommendation.profit_analysis?.profit_margin_percent?.toFixed(
                                1,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">تقييم المخاطر</h4>
                        <Badge
                          className={getRiskColor(
                            recommendations.best_recommendation.risk_assessment
                              ?.overall_risk_level || "متوسط",
                          )}
                        >
                          {
                            recommendations.best_recommendation.risk_assessment
                              ?.overall_risk_level
                          }
                        </Badge>
                        <div className="mt-2 text-sm">
                          <span>
                            درجة المخاطر:{" "}
                            {(
                              recommendations.best_recommendation
                                .risk_assessment?.overall_risk_score * 100
                            )?.toFixed(0)}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Recommendations */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>جميع التوصيات</CardTitle>
                    <CardDescription>مرتبة حسب درجة الملائمة</CardDescription>
                  </div>
                  <Button
                    onClick={handleCompareTopCrops}
                    variant="outline"
                    disabled={loading}
                  >
                    مقارنة أفضل 3 محاصيل
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.recommendations?.map(
                      (crop: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">#{crop.rank}</Badge>
                                <h3 className="font-semibold">
                                  {crop.name_ar}
                                </h3>
                              </div>
                              <Badge variant="secondary">{crop.category}</Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>الملائمة</span>
                                <span>
                                  {(crop.suitability_score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={crop.suitability_score * 100}
                                className="h-2"
                              />
                            </div>

                            <div className="text-center">
                              <div className="text-sm text-gray-600">
                                العائد على الاستثمار
                              </div>
                              <div
                                className={`text-lg font-bold ${getProfitabilityColor(crop.profit_analysis?.roi_percent || 0)}`}
                              >
                                {crop.profit_analysis?.roi_percent?.toFixed(1)}%
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-sm text-gray-600">
                                مستوى المخاطر
                              </div>
                              <Badge
                                className={getRiskColor(
                                  crop.risk_assessment?.overall_risk_level ||
                                    "متوسط",
                                )}
                              >
                                {crop.risk_assessment?.overall_risk_level}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Seasonal Advice */}
              {recommendations.seasonal_advice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 ml-2" />
                      النصائح الموسمية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.seasonal_advice.current_month_crops
                      ?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">
                          مناسب للزراعة الآن:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {recommendations.seasonal_advice.current_month_crops.map(
                            (crop: any, index: number) => (
                              <Badge key={index} variant="default">
                                {crop.crop}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {recommendations.seasonal_advice.upcoming_crops?.length >
                      0 && (
                      <div>
                        <h4 className="font-medium mb-2">للزراعة القادمة:</h4>
                        <div className="space-y-1">
                          {recommendations.seasonal_advice.upcoming_crops.map(
                            (crop: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span>{crop.crop}</span>
                                <span className="text-gray-600">
                                  {crop.timing}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Profit Estimation Tab */}
        <TabsContent value="profit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 ml-2" />
                تقدير الربحية
              </CardTitle>
              <CardDescription>
                احصل على تحليل مالي مفصل لمحصول محدد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>المحصول</Label>
                  <Select
                    value={profitData.crop_name}
                    onValueChange={(value) =>
                      handleProfitDataChange("crop_name", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCrops.map((crop) => (
                        <SelectItem key={crop.name} value={crop.name}>
                          {crop.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>حجم المزرعة (هكتار)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={profitData.farm_size}
                    onChange={(e) =>
                      handleProfitDataChange("farm_size", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>أفق التخطيط (سنوات)</Label>
                  <Input
                    type="number"
                    value={profitData.planning_horizon_years}
                    onChange={(e) =>
                      handleProfitDataChange(
                        "planning_horizon_years",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>جودة التربة (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    max="1"
                    value={profitData.soil_quality_score}
                    onChange={(e) =>
                      handleProfitDataChange(
                        "soil_quality_score",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملائمة المناخ (0-1)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    max="1"
                    value={profitData.climate_suitability_score}
                    onChange={(e) =>
                      handleProfitDataChange(
                        "climate_suitability_score",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>المسافة للسوق (كم)</Label>
                  <Input
                    type="number"
                    value={profitData.market_distance_km}
                    onChange={(e) =>
                      handleProfitDataChange(
                        "market_distance_km",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleEstimateProfit}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التحليل المالي...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 ml-2" />
                    تقدير الربحية
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Profit Estimation Results */}
          {profitEstimation && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>الملخص المالي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        $
                        {profitEstimation.financial_analysis?.gross_revenue?.toFixed(
                          0,
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        إجمالي الإيرادات
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        $
                        {profitEstimation.financial_analysis?.total_costs?.toFixed(
                          0,
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        إجمالي التكاليف
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        $
                        {profitEstimation.financial_analysis?.net_profit?.toFixed(
                          0,
                        )}
                      </div>
                      <div className="text-sm text-gray-600">الربح الصافي</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {profitEstimation.financial_analysis?.roi_percent?.toFixed(
                          1,
                        )}
                        %
                      </div>
                      <div className="text-sm text-gray-600">
                        العائد على الاستثمار
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>هامش الربح:</span>
                      <span className="font-medium">
                        {profitEstimation.financial_analysis?.profit_margin_percent?.toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>فترة الاسترداد:</span>
                      <span className="font-medium">
                        {profitEstimation.financial_analysis?.payback_period_months?.toFixed(
                          1,
                        )}{" "}
                        شهر
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>مستوى الربحية:</span>
                      <Badge variant="outline">
                        {
                          profitEstimation.financial_analysis
                            ?.profitability_level
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>تحليل المخاطر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>مخاطر الأسعار:</span>
                      <Badge
                        className={getRiskColor(
                          profitEstimation.risk_analysis?.price_risk?.level ||
                            "متوسط",
                        )}
                      >
                        {profitEstimation.risk_analysis?.price_risk?.level}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>مخاطر الإنتاجية:</span>
                      <Badge
                        className={getRiskColor(
                          profitEstimation.risk_analysis?.yield_risk?.level ||
                            "متوسط",
                        )}
                      >
                        {profitEstimation.risk_analysis?.yield_risk?.level}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>مخاطر السوق:</span>
                      <Badge
                        className={getRiskColor(
                          profitEstimation.risk_analysis?.market_risk?.level ||
                            "متوس��",
                        )}
                      >
                        {profitEstimation.risk_analysis?.market_risk?.level}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>المخاطر الإجمالية:</span>
                      <Badge
                        className={getRiskColor(
                          profitEstimation.risk_analysis?.overall_risk?.level ||
                            "متوسط",
                        )}
                      >
                        {profitEstimation.risk_analysis?.overall_risk?.level}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">
                      استراتيجيات إدارة المخاطر:
                    </h4>
                    <div className="space-y-1">
                      {profitEstimation.risk_analysis?.risk_mitigation_strategies?.map(
                        (strategy: string, index: number) => (
                          <Alert key={index} className="p-2">
                            <AlertDescription className="text-sm">
                              {strategy}
                            </AlertDescription>
                          </Alert>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Crop Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 ml-2" />
                م��ارنة المحاصيل
              </CardTitle>
              <CardDescription>
                {comparison
                  ? "نتائج المقارنة بين المحاصيل"
                  : "احصل على توصيات أولاً لمقارنة أفضل المحاصيل"}
              </CardDescription>
            </CardHeader>
            {!comparison && !recommendations && (
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    يرجى الحصول على التوصيات الذكية أولاً لتتمكن من مقارنة
                    المحاصيل
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
            {comparison && (
              <CardContent className="space-y-6">
                {/* Rankings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">
                      ترتيب حسب العائد على الاستثمار
                    </h4>
                    <div className="space-y-2">
                      {comparison.rankings?.by_roi
                        ?.slice(0, 3)
                        .map((crop: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span>{crop.crop_name_ar || crop.crop_name}</span>
                            <Badge variant="outline">
                              {crop.roi_percent?.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">ترتيب حسب الرب�� الصافي</h4>
                    <div className="space-y-2">
                      {comparison.rankings?.by_net_profit
                        ?.slice(0, 3)
                        .map((crop: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span>{crop.crop_name_ar || crop.crop_name}</span>
                            <Badge variant="outline">
                              ${crop.net_profit?.toFixed(0)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Best Overall Crop */}
                {comparison.best_overall_crop && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">
                        أفضل محصول إجمالياً
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium">
                            {comparison.best_overall_crop.crop_name_ar ||
                              comparison.best_overall_crop.crop_name}
                          </h4>
                          <div className="text-sm text-gray-600">
                            المحصول الأفضل وفقاً للتحليل الشامل
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {comparison.best_overall_crop.roi_percent?.toFixed(
                              1,
                            )}
                            %
                          </div>
                          <div className="text-sm text-gray-600">
                            العائد على الاستثمار
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            $
                            {comparison.best_overall_crop.net_profit?.toFixed(
                              0,
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            الربح الصافي
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Quick Recommendation Tab */}
        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 ml-2" />
                توصية سريعة
              </CardTitle>
              <CardDescription>
                احصل على توصية سريعة بأقل المعلومات المطلوبة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>درجة الحرارة (°C)</Label>
                  <Input
                    type="number"
                    value={inputData.temperature}
                    onChange={(e) =>
                      handleInputChange("temperature", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الأمطار السنوية (mm)</Label>
                  <Input
                    type="number"
                    value={inputData.annual_rainfall}
                    onChange={(e) =>
                      handleInputChange("annual_rainfall", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>درجة حموضة التربة</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputData.soil_ph}
                    onChange={(e) =>
                      handleInputChange("soil_ph", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>حجم المزرعة (هكتار)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={inputData.farm_size}
                    onChange={(e) =>
                      handleInputChange("farm_size", e.target.value)
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleQuickRecommendation}
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
                    <Target className="w-4 h-4 ml-2" />
                    توصية سريعة
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Recommendation Results */}
          {quickRecommendation && (
            <Card>
              <CardHeader>
                <CardTitle>التوصية السريعة</CardTitle>
              </CardHeader>
              <CardContent>
                {quickRecommendation.best_crop ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <h3 className="text-xl font-bold text-blue-800 mb-2">
                        {quickRecommendation.best_crop.crop_name_ar}
                      </h3>
                      <Badge variant="outline" className="mb-2">
                        أفضل توصية
                      </Badge>
                      <div className="text-sm text-gray-600">
                        درجة الملائمة:{" "}
                        {(
                          quickRecommendation.best_crop.suitability_score * 100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">المحاصيل الأخرى المقترحة:</h4>
                      {quickRecommendation.quick_recommendations
                        ?.slice(0, 3)
                        .map((crop: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span>{crop.crop_name_ar}</span>
                            <Badge variant="secondary">
                              {(crop.suitability_score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">ملاحظات:</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          مخاطر الربح:{" "}
                          {quickRecommendation.best_crop.risk_level}
                        </div>
                        <div>
                          الموسم: {quickRecommendation.best_crop.growing_season}
                        </div>
                        <div>
                          العائ�� المتوقع: $
                          {quickRecommendation.best_crop.expected_profit_per_hectare?.toFixed(
                            0,
                          )}
                          /هكتار
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      لم يتم العثور على توصية مناسبة للظروف المدخلة
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartCropRecommendations;
