import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { soilAnalysisService } from "@/lib/services/soilAnalysisService";
import { RawSoilData } from "@shared/api";
import { Loader2, Check, AlertCircle, TrendingUp, Leaf, Droplets } from "lucide-react";

export default function SoilAnalysisDetailedReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [formData, setFormData] = useState<RawSoilData>(
    soilAnalysisService.createSampleSoilData()
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "sampleDepth" || !isNaN(parseFloat(value))
          ? parseFloat(value)
          : value,
    }));
  };

  const loadSampleData = () => {
    setFormData(soilAnalysisService.createSampleSoilData());
    toast.success("تم تحميل البيانات النموذجية", {
      description: "استخدم هذه البيانات لاختبار التحليل",
    });
  };

  const handleAnalyze = async () => {
    try {
      // Validate data
      const validation = soilAnalysisService.validateSoilData(formData);
      if (!validation.valid) {
        toast.error("بيانات غير صحيحة", {
          description: validation.errors.join("\n"),
        });
        return;
      }

      setIsLoading(true);
      const result = await soilAnalysisService.analyzeSoil(formData);
      setAnalysis(result);

      toast.success("تم التحليل بنجاح", {
        description: "تم تحليل عينة التربة بنجاح",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("خطأ في التحليل", {
        description:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحليل التربة",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setFormData(soilAnalysisService.createSampleSoilData());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            تحليل التربة الشامل
          </h1>
          <p className="text-gray-600 text-lg">
            تقرير مفصل عن خصوبة التربة والمحاصيل المناسبة والتوصيات الزراعية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>بيانات عينة التربة</CardTitle>
                <CardDescription>أدخل معاملات التربة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Parameters */}
                <div className="space-y-2">
                  <Label htmlFor="fieldId">معرف الحقل</Label>
                  <Input
                    id="fieldId"
                    name="fieldId"
                    value={formData.fieldId || ""}
                    onChange={handleInputChange}
                    placeholder="حقل #1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">الموقع</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleInputChange}
                    placeholder="اسم المنطقة"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ph">
                    درجة الحموضة (pH) *{" "}
                    <span className="text-xs text-gray-500">{formData.ph}</span>
                  </Label>
                  <Input
                    id="ph"
                    name="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={formData.ph}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moisture">
                    الرطوبة (%) *{" "}
                    <span className="text-xs text-gray-500">
                      {formData.moisture}%
                    </span>
                  </Label>
                  <Input
                    id="moisture"
                    name="moisture"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.moisture}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organicMatter">
                    المادة العضوية (%) *{" "}
                    <span className="text-xs text-gray-500">
                      {formData.organicMatter}%
                    </span>
                  </Label>
                  <Input
                    id="organicMatter"
                    name="organicMatter"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={formData.organicMatter}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Macronutrients */}
                <div className="border-t pt-4">
                  <p className="font-semibold text-sm mb-2">العناصر الكبرى</p>

                  <div className="space-y-2">
                    <Label htmlFor="nitrogen">النيتروجين (mg/kg)</Label>
                    <Input
                      id="nitrogen"
                      name="nitrogen"
                      type="number"
                      value={formData.nitrogen || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="phosphorus">الفوسفور (mg/kg)</Label>
                    <Input
                      id="phosphorus"
                      name="phosphorus"
                      type="number"
                      value={formData.phosphorus || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="potassium">البوتاسيوم (mg/kg)</Label>
                    <Input
                      id="potassium"
                      name="potassium"
                      type="number"
                      value={formData.potassium || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Other Parameters */}
                <div className="border-t pt-4 space-y-2">
                  <Label htmlFor="electricalConductivity">
                    التوصيل الكهربائي (dS/m)
                  </Label>
                  <Input
                    id="electricalConductivity"
                    name="electricalConductivity"
                    type="number"
                    step="0.1"
                    value={formData.electricalConductivity || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />

                  <Label htmlFor="soilTexture" className="mt-2 block">
                    نسيج التربة
                  </Label>
                  <select
                    id="soilTexture"
                    name="soilTexture"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={formData.soilTexture || "loam"}
                    onChange={(e) =>
                      setFormData({ ...formData, soilTexture: e.target.value as any })
                    }
                  >
                    <option value="sandy">رملي</option>
                    <option value="clay">طيني</option>
                    <option value="loam">طميي</option>
                    <option value="silty">غريني</option>
                  </select>

                  <Label htmlFor="currentCrop" className="mt-2 block">
                    المحصول الحالي
                  </Label>
                  <Input
                    id="currentCrop"
                    name="currentCrop"
                    value={formData.currentCrop || ""}
                    onChange={handleInputChange}
                    placeholder="قمح، طماطم، إلخ"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري التحليل...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        تحليل التربة
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={loadSampleData}
                    variant="outline"
                    className="w-full"
                  >
                    بيانات نموذجية
                  </Button>

                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    className="w-full"
                    disabled={!analysis}
                  >
                    مسح
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2">
            {!analysis ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Droplets className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    أدخل بيانات التربة وانقر على "تحليل التربة" لعرض النتائج
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-2">
                {/* Soil Type Summary */}
                {analysis?.soilAnalysis?.soilType && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-green-600" />
                        نوع التربة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>التصنيف:</strong>{" "}
                        {analysis.soilAnalysis.soilType.classification}
                      </p>
                      <p>
                        <strong>النسيج:</strong>{" "}
                        {analysis.soilAnalysis.soilType.texture}
                      </p>
                      <p>
                        <strong>البنية:</strong>{" "}
                        {analysis.soilAnalysis.soilType.structure}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {analysis.soilAnalysis.soilType.description_ar}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Overall Grade */}
                {analysis?.soilAnalysis?.currentStatus?.overallGrade && (
                  <Card>
                    <CardHeader>
                      <CardTitle>تقييم جودة التربة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-green-600">
                          {analysis.soilAnalysis.currentStatus.overallGrade.grade}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {analysis.soilAnalysis.currentStatus.overallGrade.score}
                        </p>
                      </div>
                      <p className="text-center text-sm">
                        {analysis.soilAnalysis.currentStatus.overallGrade
                          .interpretation_ar}
                      </p>

                      {/* Detailed Scores */}
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                        {Object.entries(
                          analysis.soilAnalysis.currentStatus.detailedScoring || {}
                        ).map(([key, score]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}:
                            </span>
                            <span className="font-semibold">{score}/100</span>
                          </div>
                        ))}
                      </div>

                      {/* Strengths & Limitations */}
                      {analysis.soilAnalysis.currentStatus.strengths_ar && (
                        <div className="border-t pt-3">
                          <p className="font-semibold text-green-700 mb-2">
                            نقاط القوة:
                          </p>
                          <ul className="space-y-1">
                            {analysis.soilAnalysis.currentStatus.strengths_ar.map(
                              (strength: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{strength}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {analysis.soilAnalysis.currentStatus.limitations_ar && (
                        <div className="border-t pt-3">
                          <p className="font-semibold text-amber-700 mb-2">
                            التحديات والقيود:
                          </p>
                          <ul className="space-y-1">
                            {analysis.soilAnalysis.currentStatus.limitations_ar.map(
                              (limitation: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{limitation}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Crop Suitability */}
                {analysis?.soilAnalysis?.cropSuitability && (
                  <>
                    {/* Excellent Crops */}
                    {analysis.soilAnalysis.cropSuitability.excellent_crops?.length >
                      0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-green-700">
                            المحاصيل الممتازة
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysis.soilAnalysis.cropSuitability.excellent_crops.map(
                              (crop: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="border border-green-200 bg-green-50 p-3 rounded"
                                >
                                  <p className="font-semibold">
                                    {crop.name_ar} ({crop.name})
                                  </p>
                                  <p className="text-sm text-green-700">
                                    توافق: {crop.compatibility}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {crop.reason_ar}
                                  </p>
                                  {crop.specialCareNeeds_ar && (
                                    <p className="text-xs text-amber-700 mt-2">
                                      💡 {crop.specialCareNeeds_ar}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Good Crops */}
                    {analysis.soilAnalysis.cropSuitability.good_crops?.length >
                      0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-blue-700">
                            المحاصيل الجيدة
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-2">
                            {analysis.soilAnalysis.cropSuitability.good_crops.map(
                              (crop: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="border border-blue-200 bg-blue-50 p-2 rounded text-sm"
                                >
                                  <p className="font-semibold">
                                    {crop.name_ar} - {crop.compatibility}
                                  </p>
                                  <p className="text-gray-600">
                                    {crop.reason_ar}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Professional Summary */}
                {analysis?.soilAnalysis?.professionalSummary && (
                  <Card className="border-2 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800">الملخص والتوصيات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-700 mb-1">
                          الملخص التنفيذي:
                        </p>
                        <p className="text-sm">
                          {analysis.soilAnalysis.professionalSummary
                            .executiveSummary_ar}
                        </p>
                      </div>

                      <div className="bg-green-50 p-3 rounded border-l-4 border-green-600">
                        <p className="font-semibold text-sm text-green-800 mb-1">
                          الإجراء الأساسي الأول:
                        </p>
                        <p className="text-sm text-green-900">
                          {analysis.soilAnalysis.professionalSummary
                            .primaryAction_ar}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-sm text-gray-700 mb-1">
                          الخطوات التالية:
                        </p>
                        <p className="text-sm text-gray-600">
                          {analysis.soilAnalysis.professionalSummary.nextSteps_ar}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
