import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  Zap,
  Bot,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Plus,
  Eye,
  Edit
} from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  nameAr: string;
  product: string;
  basePrice: number;
  factors: {
    demand: number;
    supply: number;
    seasonality: number;
    quality: number;
    competition: number;
    weather: number;
  };
  constraints: {
    minPrice: number;
    maxPrice: number;
    maxChangePercent: number;
  };
  currentPrice: number;
  recommendedPrice: number;
  confidence: number;
  status: 'active' | 'paused' | 'testing';
  lastUpdate: string;
  performance: {
    sales: number;
    revenue: number;
    profit: number;
    conversionRate: number;
  };
}

interface NegotiationSession {
  id: string;
  productId: string;
  productName: string;
  buyerName: string;
  originalPrice: number;
  currentOffer: number;
  counterOffer: number;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  rounds: number;
  aiRecommendation: number;
  deadline: string;
  history: Array<{
    round: number;
    party: 'buyer' | 'seller' | 'ai';
    offer: number;
    timestamp: string;
    message?: string;
  }>;
}

interface MarketData {
  product: string;
  currentPrice: number;
  averageMarketPrice: number;
  demandIndex: number;
  supplyIndex: number;
  priceVolatility: number;
  trend: 'up' | 'down' | 'stable';
  competitors: Array<{
    name: string;
    price: number;
    marketShare: number;
  }>;
}

const DynamicPricing: React.FC = () => {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [negotiations, setNegotiations] = useState<NegotiationSession[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pricing');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API calls
      setTimeout(() => {
        setPricingRules([
          {
            id: 'rule_1',
            name: 'Tomato Dynamic Pricing',
            nameAr: 'تسعير الطماطم الديناميكي',
            product: 'طماطم',
            basePrice: 2.5,
            factors: {
              demand: 85,
              supply: 70,
              seasonality: 90,
              quality: 95,
              competition: 80,
              weather: 75
            },
            constraints: {
              minPrice: 2.0,
              maxPrice: 4.0,
              maxChangePercent: 15
            },
            currentPrice: 2.8,
            recommendedPrice: 3.1,
            confidence: 87,
            status: 'active',
            lastUpdate: '2024-02-22T14:30:00Z',
            performance: {
              sales: 1250,
              revenue: 3500,
              profit: 1200,
              conversionRate: 78
            }
          },
          {
            id: 'rule_2',
            name: 'Olive Oil Premium Pricing',
            nameAr: 'تسعير زيت الزيتون المميز',
            product: 'زيت زيتون',
            basePrice: 8.5,
            factors: {
              demand: 75,
              supply: 60,
              seasonality: 85,
              quality: 98,
              competition: 70,
              weather: 80
            },
            constraints: {
              minPrice: 7.0,
              maxPrice: 12.0,
              maxChangePercent: 10
            },
            currentPrice: 9.2,
            recommendedPrice: 9.5,
            confidence: 92,
            status: 'active',
            lastUpdate: '2024-02-22T13:15:00Z',
            performance: {
              sales: 850,
              revenue: 7820,
              profit: 3200,
              conversionRate: 85
            }
          }
        ]);

        setNegotiations([
          {
            id: 'nego_1',
            productId: 'prod_1',
            productName: 'طماطم عضوية',
            buyerName: 'مطعم البحر المتوسط',
            originalPrice: 2.8,
            currentOffer: 2.5,
            counterOffer: 2.7,
            status: 'active',
            rounds: 3,
            aiRecommendation: 2.6,
            deadline: '2024-02-23T18:00:00Z',
            history: [
              { round: 1, party: 'buyer', offer: 2.3, timestamp: '2024-02-22T10:00:00Z', message: 'نحتاج كمية كبيرة أسبوعياً' },
              { round: 2, party: 'seller', offer: 2.7, timestamp: '2024-02-22T11:30:00Z', message: 'يمكننا تقديم هذا السعر للكمية المطلوبة' },
              { round: 3, party: 'buyer', offer: 2.5, timestamp: '2024-02-22T14:00:00Z', message: 'آخر عرض نهائي' },
              { round: 3, party: 'ai', offer: 2.6, timestamp: '2024-02-22T14:30:00Z', message: 'توصية الذكاء الاصطناعي: قبول 2.6 دينار' }
            ]
          }
        ]);

        setMarketData([
          {
            product: 'طماطم',
            currentPrice: 2.8,
            averageMarketPrice: 2.9,
            demandIndex: 85,
            supplyIndex: 70,
            priceVolatility: 12,
            trend: 'up',
            competitors: [
              { name: 'مزرعة الخير', price: 2.7, marketShare: 25 },
              { name: 'تعاونية الساحل', price: 3.0, marketShare: 20 },
              { name: 'مزرعة النور', price: 2.9, marketShare: 15 }
            ]
          }
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      testing: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'نشط',
      paused: 'متوقف',
      testing: 'اختبار',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      expired: 'منتهي'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التسعير الديناميكي والتفاوض الآلي</h1>
          <p className="text-gray-600">تحسين الأسعار تلقائياً بناءً على عوامل السوق والذكاء الاصطناعي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            قاعدة جديدة
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pricing">التسعير الذكي</TabsTrigger>
          <TabsTrigger value="negotiations">التفاوض الآلي</TabsTrigger>
          <TabsTrigger value="market">بيانات السوق</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        {/* Pricing Rules Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="space-y-4">
            {pricingRules.map((rule) => (
              <Card key={rule.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">{rule.nameAr}</h3>
                        <Badge className={getStatusColor(rule.status)}>
                          {getStatusLabel(rule.status)}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          الثقة: {rule.confidence}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">السعر الحالي</p>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(rule.currentPrice)}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">السعر المقترح</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(rule.recommendedPrice)}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">الإيرادات</p>
                          <p className="text-xl font-bold text-purple-600">{formatCurrency(rule.performance.revenue)}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">معدل التحويل</p>
                          <p className="text-xl font-bold text-orange-600">{rule.performance.conversionRate}%</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-3">عوامل التسعير:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(rule.factors).map(([factor, value]) => (
                            <div key={factor} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="capitalize">
                                  {factor === 'demand' ? 'الطلب' :
                                   factor === 'supply' ? 'العرض' :
                                   factor === 'seasonality' ? 'الموسمية' :
                                   factor === 'quality' ? 'الجودة' :
                                   factor === 'competition' ? 'المنافسة' : 'الطقس'}
                                </span>
                                <span className="font-bold">{value}%</span>
                              </div>
                              <Progress value={value} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>نطاق السعر: {formatCurrency(rule.constraints.minPrice)} - {formatCurrency(rule.constraints.maxPrice)}</span>
                        <span>آخر تحديث: {new Date(rule.lastUpdate).toLocaleDateString('ar-TN')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Negotiations Tab */}
        <TabsContent value="negotiations" className="space-y-6">
          <div className="space-y-4">
            {negotiations.map((nego) => (
              <Card key={nego.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="h-5 w-5 text-orange-600" />
                        <h3 className="text-lg font-semibold">{nego.productName}</h3>
                        <Badge className={getStatusColor(nego.status)}>
                          {getStatusLabel(nego.status)}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          جولة {nego.rounds}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">السعر الأصلي</p>
                          <p className="text-lg font-bold">{formatCurrency(nego.originalPrice)}</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600">عرض المشتري</p>
                          <p className="text-lg font-bold text-red-600">{formatCurrency(nego.currentOffer)}</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">عرض البائع</p>
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(nego.counterOffer)}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">توصية الذكاء الاصطناعي</p>
                          <p className="text-lg font-bold text-purple-600">{formatCurrency(nego.aiRecommendation)}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-3">تاريخ التفاوض:</h4>
                        <div className="space-y-2">
                          {nego.history.slice(-3).map((entry, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <div className="p-1 bg-blue-100 rounded">
                                {entry.party === 'buyer' ? <Target className="h-3 w-3 text-blue-600" /> :
                                 entry.party === 'seller' ? <DollarSign className="h-3 w-3 text-green-600" /> :
                                 <Bot className="h-3 w-3 text-purple-600" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {entry.party === 'buyer' ? 'المشتري' :
                                     entry.party === 'seller' ? 'البائع' : 'الذكاء الاصطناعي'}
                                  </span>
                                  <span className="text-sm font-bold">{formatCurrency(entry.offer)}</span>
                                </div>
                                {entry.message && (
                                  <p className="text-xs text-gray-600">{entry.message}</p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(entry.timestamp).toLocaleTimeString('ar-TN')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>المشتري: {nego.buyerName}</span>
                        <span>الموعد النهائي: {new Date(nego.deadline).toLocaleDateString('ar-TN')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {nego.status === 'active' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            قبول
                          </Button>
                          <Button variant="outline" size="sm">
                            عرض مضاد
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Market Data Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="space-y-4">
            {marketData.map((market, index) => (
              <Card key={index} className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold">{market.product}</h3>
                        {getTrendIcon(market.trend)}
                        <Badge className={market.trend === 'up' ? 'bg-green-100 text-green-800' :
                          market.trend === 'down' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                          {market.trend === 'up' ? 'صاعد' : market.trend === 'down' ? 'هابط' : 'مستقر'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">سعرنا</p>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(market.currentPrice)}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600">متوسط السوق</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(market.averageMarketPrice)}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-gray-600">مؤشر الطلب</p>
                          <p className="text-xl font-bold text-purple-600">{market.demandIndex}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">مؤشر العرض</p>
                          <p className="text-xl font-bold text-orange-600">{market.supplyIndex}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold mb-3">أسعار المنافسين:</h4>
                        <div className="space-y-2">
                          {market.competitors.map((competitor, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="font-medium">{competitor.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold">{formatCurrency(competitor.price)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {competitor.marketShare}% حصة
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <span>تقلبات السعر: {market.priceVolatility}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء التسعير الذكي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">+18.5%</div>
                  <p className="text-gray-600">زيادة في الإيرادات</p>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>معدل نجاح التفاوض</span>
                      <span className="font-bold">87%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>متوسط توفير الوقت</span>
                      <span className="font-bold">45 دقيقة</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>رضا العملاء</span>
                      <span className="font-bold">92%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات التفاوض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>جلسات نشطة</span>
                    <span className="font-bold text-blue-600">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تفاوض مكتمل</span>
                    <span className="font-bold text-green-600">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>متوسط عدد الجولات</span>
                    <span className="font-bold">3.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>متوسط الوقت للإنهاء</span>
                    <span className="font-bold">2.5 ساعة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DynamicPricing;
