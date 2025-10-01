import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Brain, Calendar, AlertCircle, Target, CloudRain, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prediction {
  date: string;
  predictedPrice: number;
  confidence: number;
  factors: {
    seasonal: number;
    weather: number;
    demand: number;
    supply: number;
  };
}

interface PredictionData {
  crop: {
    id: string;
    name: string;
    category: string;
  };
  currency: string;
  period: string;
  predictions: Prediction[];
  analysis: {
    outlook: string;
    keyFactors: string[];
    riskLevel: string;
    recommendation: string;
  };
  lastUpdated: string;
}

interface CropOption {
  id: string;
  name: string;
  category: string;
}

const cropOptions: CropOption[] = [
  { id: 'olive', name: 'الزيتون', category: 'fruits' },
  { id: 'tomato', name: 'الطماطم', category: 'vegetables' },
  { id: 'wheat', name: 'القمح', category: 'grains' },
  { id: 'citrus', name: 'الحمضيات', category: 'fruits' },
  { id: 'potato', name: 'البطاطا', category: 'vegetables' },
  { id: 'dates', name: 'التمر', category: 'fruits' },
  { id: 'barley', name: 'الشعير', category: 'grains' },
  { id: 'artichoke', name: 'الخرشوف', category: 'vegetables' },
  { id: 'almond', name: 'اللوز', category: 'nuts' },
];

export default function PriceForecasts() {
  const [selectedCrop, setSelectedCrop] = useState('olive');
  const [forecastPeriod, setForecastPeriod] = useState('30');
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/market-analysis/predictions/${selectedCrop}?days=${forecastPeriod}`);
      const data = await response.json();
      setPredictionData(data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [selectedCrop, forecastPeriod]);

  const formatPrice = (price: number) => `${price.toFixed(2)} د.ت`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-TN', { month: 'short', day: 'numeric' });
  };

  const chartData = predictionData?.predictions.map(pred => ({
    date: formatDate(pred.date),
    price: pred.predictedPrice,
    confidence: Math.round(pred.confidence * 100),
    confidenceRange: pred.predictedPrice * (1 - pred.confidence) * 0.1
  })) || [];

  const getOutlookColor = (outlook: string) => {
    switch (outlook) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getOutlookText = (outlook: string) => {
    switch (outlook) {
      case 'bullish': return 'صاعد';
      case 'bearish': return 'هابط';
      default: return 'مستقر';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'منخفض': return 'bg-green-100 text-green-800';
      case 'متوسط': return 'bg-yellow-100 text-yellow-800';
      case 'عالي': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">توقعات الأسعار</h1>
          <p className="text-muted-foreground">
            تحليلات وتوقعات أسعار المحاصيل باستخدام الذكاء الاصطناعي
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر المحصول" />
            </SelectTrigger>
            <SelectContent>
              {cropOptions.map((crop) => (
                <SelectItem key={crop.id} value={crop.id}>
                  {crop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 أيام</SelectItem>
              <SelectItem value="14">14 يوم</SelectItem>
              <SelectItem value="30">30 يوم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Brain className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">جاري تحليل البيانات وتوقع الأسعار...</p>
        </div>
      ) : predictionData ? (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">التوقع العام</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", getOutlookColor(predictionData.analysis.outlook))}>
                  {getOutlookText(predictionData.analysis.outlook)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {predictionData.period}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مستوى المخاطر</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={getRiskColor(predictionData.analysis.riskLevel)}>
                  {predictionData.analysis.riskLevel}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  تقييم المخاطر
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">التوصية</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-primary">
                  {predictionData.analysis.recommendation}
                </div>
                <p className="text-xs text-muted-foreground">
                  توصية AI
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">آخر تحديث</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {new Date(predictionData.lastUpdated).toLocaleDateString('ar-TN')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(predictionData.lastUpdated).toLocaleTimeString('ar-TN')}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">الرسم البياني</TabsTrigger>
              <TabsTrigger value="factors">العوامل المؤثرة</TabsTrigger>
              <TabsTrigger value="details">تفاصيل التوقعات</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 ml-2" />
                    توقعات أسعار {predictionData.crop.name}
                  </CardTitle>
                  <CardDescription>
                    التوقعات للـ {forecastPeriod} يوماً القادمة مع مؤشر الثقة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'price' ? formatPrice(value) : `${value}%`,
                            name === 'price' ? 'السعر المتوقع' : 'مؤشر الثقة'
                          ]}
                          labelFormatter={(label) => `التاريخ: ${label}`}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.3}
                          name="السعر المتوقع"
                        />
                        <Line
                          type="monotone"
                          dataKey="confidence"
                          stroke="#82ca9d"
                          name="مؤشر الثقة"
                          yAxisId="right"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="factors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 ml-2" />
                    العوامل المؤثرة على الأسعار
                  </CardTitle>
                  <CardDescription>
                    تحليل العوامل الرئيسية التي تؤثر على أسعار {predictionData.crop.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {predictionData.analysis.keyFactors.map((factor, index) => (
                      <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-secondary/50 rounded-lg">
                        <div className="p-2 bg-primary/20 rounded-full">
                          {index === 0 && <CloudRain className="h-4 w-4 text-primary" />}
                          {index === 1 && <Globe className="h-4 w-4 text-primary" />}
                          {index === 2 && <Calendar className="h-4 w-4 text-primary" />}
                          {index === 3 && <TrendingUp className="h-4 w-4 text-primary" />}
                          {index === 4 && <AlertCircle className="h-4 w-4 text-primary" />}
                        </div>
                        <span className="text-sm">{factor}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Factor Impact Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>تأثير العوامل</CardTitle>
                  <CardDescription>
                    مدى تأثير كل عامل على السعر المتوقع
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.slice(0, 7)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="price" stroke="#8884d8" name="السعر الأساسي" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل التوقعات اليومية</CardTitle>
                  <CardDescription>
                    التوقعات المفصلة لكل يوم مع مؤشر الثقة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {predictionData.predictions.slice(0, 10).map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {new Date(prediction.date).toLocaleDateString('ar-TN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ثقة: {Math.round(prediction.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-left rtl:text-right">
                          <div className="text-lg font-bold">
                            {formatPrice(prediction.predictedPrice)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {index > 0 && chartData[index] && chartData[index-1] ? (
                              <Badge variant={
                                chartData[index].price > chartData[index-1].price ? "default" : "destructive"
                              }>
                                {chartData[index].price > chartData[index-1].price ? "+" : ""}
                                {((chartData[index].price - chartData[index-1].price) / chartData[index-1].price * 100).toFixed(1)}%
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد بيانات متاحة</h3>
            <p className="text-muted-foreground">
              لم نتمكن من جلب توقعات الأسعار للمحصول المحدد
            </p>
            <Button className="mt-4" onClick={fetchPredictions}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
