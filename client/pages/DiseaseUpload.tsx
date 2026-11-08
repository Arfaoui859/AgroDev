import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Crop,
  Leaf,
  Eye,
  ArrowRight,
  Info,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const diseaseUploadSchema = z.object({
  cropType: z.string().min(1, "يجب اختيار نوع المحصول"),
  plantPart: z.string().min(1, "يجب تحديد جزء النبات"),
  symptoms: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type DiseaseUploadForm = z.infer<typeof diseaseUploadSchema>;

const tunisianCrops = [
  { value: "olive", label: "زيتون" },
  { value: "citrus", label: "حمضيات" },
  { value: "wheat", label: "قمح صلب" },
  { value: "tomato", label: "طماطم" },
  { value: "artichoke", label: "خرشوف" },
  { value: "pepper", label: "فلفل" },
  { value: "potato", label: "بطاطس" },
  { value: "grape", label: "عنب" },
  { value: "fig", label: "تين" },
  { value: "pomegranate", label: "رمان" },
  { value: "other", label: "أخرى" },
];

const plantParts = [
  { value: "leaves", label: "أوراق" },
  { value: "fruit", label: "ثمار" },
  { value: "stem", label: "ساق" },
  { value: "roots", label: "جذور" },
  { value: "flowers", label: "أزهار" },
  { value: "bark", label: "لحاء" },
  { value: "whole-plant", label: "النبات كاملاً" },
];

interface UploadedImage {
  file: File;
  preview: string;
  id: string;
}

export default function DiseaseUpload() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const form = useForm<DiseaseUploadForm>({
    resolver: zodResolver(diseaseUploadSchema),
    defaultValues: {
      cropType: "",
      plantPart: "",
      symptoms: "",
      additionalInfo: "",
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview, id });
      } else {
        toast.error(`الملف ${file.name} ليس صورة صالحة`);
      }
    });

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
      toast.success(`تم رفع ${newImages.length} صورة بنجاح`);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const SEVERITY_AR: Record<string, string> = {
    none: "منخفض",
    low: "منخفض",
    medium: "متوسط",
    moderate: "متوسط",
    high: "عالي",
    very_high: "عالي",
  };

  /**
   * Sends the uploaded image to the vision service and maps its structured
   * response onto the shape the diagnosis page reads. Results come from the
   * backend engine; the previous implementation fabricated a diagnosis in the
   * browser, which made every upload "succeed" with invented data.
   */
  const analyzeImages = async (data: DiseaseUploadForm) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = uploadedImages[0].file;
      const form = new FormData();
      form.append("file", file);
      if (data.cropType) form.append("plant_type", data.cropType);

      setUploadProgress(30);
      const response = await fetch("/api/ai/images/detect-disease", {
        method: "POST",
        body: form,
      });
      setUploadProgress(90);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (payload && (payload.error || payload.message)) ||
            `فشل التحليل (رمز ${response.status})`,
        );
      }

      const detection = payload.disease_detection ?? {};
      const primary = detection.primary_disease ?? {};
      const plan = payload.treatment_plan ?? {};
      const severityLevel =
        primary.severity_level ??
        detection.top_predictions?.find(
          (prediction: { disease?: string; severity_level?: string }) =>
            prediction.disease === primary.disease,
        )?.severity_level ??
        payload.severity_assessment?.severity_level ??
        "medium";

      const diagnosis = {
        disease: primary.disease_name_ar || primary.disease || "غير محدد",
        confidence: Math.round((primary.probability ?? 0) * 100),
        severity: SEVERITY_AR[severityLevel] ?? "متوسط",
        description:
          primary.description ||
          "تشخيص مبني على تحليل صورة النبات. راجع النتائج مع مهندس زراعي.",
        treatment: [
          ...(plan.immediate_treatment ?? []),
          ...(plan.general_care ?? []),
        ],
        prevention: [
          ...(plan.prevention_measures ?? []),
          ...(plan.follow_up_schedule ?? []),
        ],
      };

      const diagnosisResult = {
        id: Date.now().toString(),
        images: uploadedImages.map((img) => img.file.name),
        cropType: data.cropType,
        plantPart: data.plantPart,
        symptoms: data.symptoms,
        additionalInfo: data.additionalInfo,
        timestamp: new Date().toISOString(),
        confidence: diagnosis.confidence,
        diagnosis,
        // Provenance is surfaced so the UI can label heuristic output honestly.
        dataSource: payload.dataSource,
        isRealData: payload.isRealData,
        modelSource: payload.modelSource,
      };

      const history = JSON.parse(localStorage.getItem("diseaseHistory") || "[]");
      history.unshift(diagnosisResult);
      localStorage.setItem("diseaseHistory", JSON.stringify(history));
      localStorage.setItem("currentDiagnosis", JSON.stringify(diagnosisResult));

      localStorage.setItem(
        "treatmentRedirectData",
        JSON.stringify({
          diagnosisId: diagnosisResult.id,
          diseaseId: primary.disease || "unknown",
          diseaseName: diagnosis.disease,
          cropType: diagnosisResult.cropType,
          severity:
            diagnosis.severity === "عالي"
              ? "Severe"
              : diagnosis.severity === "متوسط"
                ? "Moderate"
                : "Mild",
          confidence: diagnosis.confidence,
        }),
      );

      setUploadProgress(100);
      toast.success("تم تحليل الصور بنجاح!");
      navigate(`/disease-diagnosis/${diagnosisResult.id}`);
    } catch (error) {
      toast.error(
        (error as Error).message || "تعذّر تحليل الصور، يرجى المحاولة مرة أخرى",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: DiseaseUploadForm) => {
    if (uploadedImages.length === 0) {
      toast.error("يجب رفع صورة واحدة على الأقل");
      return;
    }
    analyzeImages(data);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">تشخيص الأمراض بالذكاء الاصطناعي</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          ارفع صور النبات��ت المصابة للحصول على تشخيص فوري دقيق مع توصيات العلاج المناسبة
        </p>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>نصائح للحصول على أفضل النتائج:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• التقط الصور في ضوء طبيعي جيد</li>
            <li>• اقترب من المنطقة المصابة قدر الإمكان</li>
            <li>• تأكد من وضوح الصورة وعدم اهتزازها</li>
            <li>• ارفع عدة صور من زوايا مختلفة إذا أمكن</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Upload className="w-5 h-5" />
                <span>رفع صور النباتات</span>
              </CardTitle>
              <CardDescription>
                ارفع صور واضحة للنباتات المصابة (يدعم JPEG, PNG, WebP)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">اضغط لرفع الصور</p>
                    <p className="text-sm text-muted-foreground">أو اسحب الصور هنا</p>
                  </div>
                  <div className="flex justify-center space-x-4 rtl:space-x-reverse">
                    <Badge variant="outline">حد أقصى 10 صور</Badge>
                    <Badge variant="outline">حد أقصى 5MB لكل صورة</Badge>
                  </div>
                </div>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">الصور المرفوعة ({uploadedImages.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={image.preview}
                            alt="معاينة الصورة"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Leaf className="w-5 h-5" />
                <span>معلومات النبات</span>
              </CardTitle>
              <CardDescription>
                حدد نوع المحصول والجزء المصاب لتحسين دقة التشخيص
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="cropType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المحصول *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المحصول" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tunisianCrops.map((crop) => (
                          <SelectItem key={crop.value} value={crop.value}>
                            {crop.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      نوع النبات المراد تشخيصه
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plantPart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>جزء النبات المصاب *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر جزء النبات" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plantParts.map((part) => (
                          <SelectItem key={part.value} value={part.value}>
                            {part.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      الجزء الذي يظهر عليه المرض أو الأعراض
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                <Eye className="w-5 h-5" />
                <span>معلومات إضافية</span>
              </CardTitle>
              <CardDescription>
                أضف أي ملاحظات إضافية لتحسين دقة التشخيص
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف الأعراض الملاحظة</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="مثال: بقع صفراء على الأوراق، ذبول، تساقط الأوراق..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      صف الأعراض التي تراها على النبات
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>معلومات إضافية</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="مثال: متى بدأت الأعراض، الظروف الجوية، آخر رش..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      أي معلومات أخرى قد تساعد في التشخيص
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Analysis Progress */}
          {isUploading && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-medium">جاري تحليل الصور بالذكاء الاصطناعي...</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    {uploadProgress < 30 && "رفع الصور..."}
                    {uploadProgress >= 30 && uploadProgress < 60 && "معالجة الصور..."}
                    {uploadProgress >= 60 && uploadProgress < 90 && "تحليل الأمراض..."}
                    {uploadProgress >= 90 && "إنتاج التقرير..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              className="px-8"
              disabled={isUploading || uploadedImages.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 ml-2" />
                  تشخيص الأمراض بالذكاء الاصطناعي
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
