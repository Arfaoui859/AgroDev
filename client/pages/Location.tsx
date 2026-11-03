import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Navigation, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Globe,
  Thermometer,
  Droplets,
  Wind,
  Sun
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const locationSchema = z.object({
  method: z.enum(["gps", "manual", "region"]),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  address: z.string().optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
});

type LocationForm = z.infer<typeof locationSchema>;

const tunisianGovernorates = [
  { value: "tunis", label: "تونس" },
  { value: "ariana", label: "أريانة" },
  { value: "ben-arous", label: "بن عروس" },
  { value: "manouba", label: "منوبة" },
  { value: "nabeul", label: "نابل" },
  { value: "zaghouan", label: "زغوان" },
  { value: "bizerte", label: "بنزرت" },
  { value: "beja", label: "باجة" },
  { value: "jendouba", label: "جندوبة" },
  { value: "kef", label: "الكاف" },
  { value: "siliana", label: "سليانة" },
  { value: "sousse", label: "سوسة" },
  { value: "monastir", label: "المنستير" },
  { value: "mahdia", label: "المهدية" },
  { value: "sfax", label: "صفاقس" },
  { value: "kairouan", label: "القيروان" },
  { value: "kasserine", label: "القصرين" },
  { value: "sidi-bouzid", label: "سيدي بوزيد" },
  { value: "gabès", label: "قابس" },
  { value: "medenine", label: "مدنين" },
  { value: "tataouine", label: "تطاوين" },
  { value: "gafsa", label: "قفصة" },
  { value: "tozeur", label: "توزر" },
  { value: "kebili", label: "قبلي" },
];

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export default function Location() {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      method: "region",
      latitude: "",
      longitude: "",
      address: "",
      governorate: "",
      city: "",
      region: "",
    },
  });

  const watchMethod = form.watch("method");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع الجغرافي");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("latitude", latitude.toString());
        form.setValue("longitude", longitude.toString());
        form.setValue("method", "gps");
        setIsGettingLocation(false);
        setLocationSet(true);
        toast.success("تم تحديد الموقع بنجاح");
        fetchWeatherData(latitude, longitude);
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "فشل في تحديد الموقع";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "تم رفض الإذن لتحديد الموقع";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "الموقع غير متاح";
            break;
          case error.TIMEOUT:
            message = "انتهت مهلة تحديد الموقع";
            break;
        }
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  /**
   * Resolve a governorate through the weather service and return its current
   * conditions, or null when the provider is unavailable.
   */
  const fetchWeatherForGovernorate = async (
    governorate: string,
  ): Promise<WeatherData | null> => {
    try {
      const response = await fetch(
        `/api/weather/location?governorate=${encodeURIComponent(governorate)}`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      const current = data?.current;
      if (!current) return null;
      return {
        temperature: Number(current.temperature),
        humidity: Number(current.humidity),
        windSpeed: Number(current.windSpeed),
        description: String(current.description ?? ""),
        icon: String(current.icon ?? "partly-cloudy"),
      };
    } catch (error) {
      console.error("Governorate weather error:", error);
      return null;
    }
  };

  /**
   * Fetch current weather for a coordinate pair from the backend, which proxies
   * a real weather provider. The previous version invented a temperature and
   * humidity locally on every call.
   */
  const fetchWeatherData = async (lat: number, lon: number) => {
    setIsLoadingWeather(true);
    try {
      const response = await fetch(`/api/weather/coordinates?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error(`Weather request failed: ${response.status}`);
      }
      const data = await response.json();
      const current = data?.current;
      if (!current) {
        throw new Error("لم تُرجع خدمة الطقس أي بيانات حالية");
      }
      setWeatherData({
        temperature: Number(current.temperature),
        humidity: Number(current.humidity),
        windSpeed: Number(current.windSpeed),
        description: String(current.description ?? ""),
        icon: String(current.icon ?? "partly-cloudy"),
      });
      toast.success("تم جلب بيانات الطقس بنجاح");
    } catch (error) {
      console.error("Weather fetch error:", error);
      setWeatherData(null);
      toast.error("فشل في جلب بيانات الطقس");
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const onSubmit = async (data: LocationForm) => {
    let resolvedWeather = weatherData;

    // Region/manual selections carry a governorate but no weather yet; fetch it
    // now so crop recommendations run against the real local conditions.
    if (!resolvedWeather && data.governorate) {
      resolvedWeather = await fetchWeatherForGovernorate(data.governorate);
    }

    const locationData = {
      ...data,
      timestamp: new Date().toISOString(),
      weatherData: resolvedWeather,
    };
    
    localStorage.setItem('selectedLocation', JSON.stringify(locationData));
    toast.success("تم حفظ الموقع بنجاح");
    navigate('/recommendations');
  };

  /**
   * Resolve the selected governorate to coordinates through the weather
   * service, which knows the coordinates of Tunisian governorates. Free-text
   * address geocoding needs a geocoding provider that is not configured, so we
   * ask the farmer to pick a governorate or use GPS instead of guessing.
   */
  const handleAddressSearch = async () => {
    const governorate = form.getValues("governorate");
    if (!governorate) {
      toast.error("يرجى اختيار الولاية أولاً");
      return;
    }

    setIsLoadingWeather(true);
    try {
      const response = await fetch(
        `/api/weather/location?governorate=${encodeURIComponent(governorate)}`,
      );
      if (!response.ok) {
        throw new Error(`Location lookup failed: ${response.status}`);
      }
      const data = await response.json();
      const loc = data?.location;
      if (!loc || typeof loc.lat !== "number" || typeof loc.lon !== "number") {
        throw new Error("تعذّر تحديد إحداثيات الولاية");
      }

      form.setValue("latitude", String(loc.lat));
      form.setValue("longitude", String(loc.lon));
      setLocationSet(true);
      toast.success("تم تحديد موقع الولاية");

      const current = data?.current;
      if (current) {
        setWeatherData({
          temperature: Number(current.temperature),
          humidity: Number(current.humidity),
          windSpeed: Number(current.windSpeed),
          description: String(current.description ?? ""),
          icon: String(current.icon ?? "partly-cloudy"),
        });
      }
    } catch (error) {
      console.error("Governorate lookup error:", error);
      toast.error("فشل في تحديد الموقع. استخدم GPS أو أدخل الإحداثيات يدوياً.");
    } finally {
      setIsLoadingWeather(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">تحديد الموقع الجغرافي</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          حدد موقع حقلك أو مزرعتك للحصول على توصيات محاصيل مخصصة بناءً على المناخ المحلي وظروف السوق
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Location Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>طريقة تحديد الموقع</CardTitle>
              <CardDescription>
                اختر الطريقة المناسبة لك لتحديد موقع المزرعة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className={`cursor-pointer transition-colors ${field.value === "gps" ? "border-primary bg-primary/5" : ""}`}>
                        <CardContent className="p-4 text-center" onClick={() => field.onChange("gps")}>
                          <Navigation className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium">GPS تلقائي</h3>
                          <p className="text-sm text-muted-foreground">تحديد دقيق باستخدام GPS</p>
                        </CardContent>
                      </Card>

                      <Card className={`cursor-pointer transition-colors ${field.value === "manual" ? "border-primary bg-primary/5" : ""}`}>
                        <CardContent className="p-4 text-center" onClick={() => field.onChange("manual")}>
                          <Search className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium">بحث بالعنوان</h3>
                          <p className="text-sm text-muted-foreground">إدخال العنوان يدوياً</p>
                        </CardContent>
                      </Card>

                      <Card className={`cursor-pointer transition-colors ${field.value === "region" ? "border-primary bg-primary/5" : ""}`}>
                        <CardContent className="p-4 text-center" onClick={() => field.onChange("region")}>
                          <Globe className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <h3 className="font-medium">اختيار المنطقة</h3>
                          <p className="text-sm text-muted-foreground">اختيار من قائمة المحافظات</p>
                        </CardContent>
                      </Card>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* GPS Location */}
          {watchMethod === "gps" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Navigation className="w-5 h-5" />
                  <span>تحديد الموقع بـ GPS</span>
                </CardTitle>
                <CardDescription>
                  انقر على الزر أدناه للسم��ح للتطبيق بالوصول إلى موقعك الحالي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري تحديد الموقع...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 ml-2" />
                      تحديد موقعي الحالي
                    </>
                  )}
                </Button>

                {locationSet && form.getValues("latitude") && form.getValues("longitude") && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      تم تحديد الموقع: {parseFloat(form.getValues("latitude")!).toFixed(4)}, {parseFloat(form.getValues("longitude")!).toFixed(4)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual Address */}
          {watchMethod === "manual" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Search className="w-5 h-5" />
                  <span>تحديد الموقع بالولاية</span>
                </CardTitle>
                <CardDescription>
                  اختر الولاية لتحديد إحداثيات المزرعة وجلب الطقس الفعلي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="governorate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الولاية</FormLabel>
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الولاية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-48">
                            {tunisianGovernorates.map((gov) => (
                              <SelectItem key={gov.value} value={gov.value}>
                                {gov.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={handleAddressSearch}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        البحث بالعنوان الحر غير مدعوم حالياً لعدم توفر خدمة
                        جغرافية؛ اختر الولاية أو استخدم GPS.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {locationSet && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      تم العثور على الموقع وتحديد الإحداثيات
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Region Selection */}
          {watchMethod === "region" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Globe className="w-5 h-5" />
                  <span>اختيار المنطقة</span>
                </CardTitle>
                <CardDescription>
                  اختر المحافظة والمدينة من القوائم أدناه
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="governorate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المحافظة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المحافظة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-48">
                          {tunisianGovernorates.map((gov) => (
                            <SelectItem key={gov.value} value={gov.value}>
                              {gov.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة/المركز</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="اكتب اسم المدينة أو المركز"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        اكتب اسم المدينة أو المركز
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>القرية/المنطقة</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="اسم القرية أو المنطقة التفصيلي"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        أدخل اسم القرية أو المنطقة بالتفصيل
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Weather Data Display */}
          {weatherData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Sun className="w-5 h-5" />
                  <span>بيانات الطقس الحالي</span>
                </CardTitle>
                <CardDescription>
                  الظروف الجوية الحالية للموقع المحدد
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{Math.round(weatherData.temperature)}°C</p>
                      <p className="text-sm text-muted-foreground">درجة الحرارة</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{Math.round(weatherData.humidity)}%</p>
                      <p className="text-sm text-muted-foreground">الرطوبة</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                    <Wind className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{Math.round(weatherData.windSpeed)} كم/س</p>
                      <p className="text-sm text-muted-foreground">سرعة الرياح</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 border rounded-lg">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">{weatherData.description}</p>
                      <p className="text-sm text-muted-foreground">الحالة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoadingWeather && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">جاري جلب بيانات الطقس...</span>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              className="px-8"
              disabled={!locationSet && watchMethod !== "region"}
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              الحصول على توصيات المحاصيل
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
