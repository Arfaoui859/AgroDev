import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Package, 
  CreditCard, 
  Users, 
  Crown, 
  Star, 
  Check, 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Gift,
  Target,
  Zap,
  Shield,
  BarChart3,
  FileText,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent,
  Calendar,
  Settings
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  role: 'farmer' | 'agronomist' | 'trader' | 'consultant' | 'investor';
  type: 'free' | 'basic' | 'professional' | 'enterprise';
  price: number;
  originalPrice?: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  featuresAr: string[];
  limitations: Record<string, number>;
  maxUsers: number;
  maxFarms: number;
  maxStorage: number; // in GB
  apiCalls: number;
  supportLevel: 'basic' | 'priority' | 'dedicated';
  isPopular: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  type: 'credit_card' | 'bank_transfer' | 'mobile_payment' | 'crypto';
  icon: string;
  fees: {
    percentage: number;
    fixed: number;
  };
  isActive: boolean;
  countries: string[];
}

interface PromoCode {
  id: string;
  code: string;
  nameAr: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  applicablePlans: string[];
  applicableRoles: string[];
}

const SubscriptionManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [plansRes, paymentRes, promoRes] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/subscription/payment-methods'),
        fetch('/api/subscription/promo-codes')
      ]);

      const [plansData, paymentData, promoData] = await Promise.all([
        plansRes.json(),
        paymentRes.json(),
        promoRes.json()
      ]);

      if (plansData.success) setPlans(plansData.data);
      if (paymentData.success) setPaymentMethods(paymentData.data);
      if (promoData.success) setPromoCodes(promoData.data);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      farmer: 'مزارع',
      agronomist: 'مهندس زراعي',
      trader: 'تاجر',
      consultant: 'مستشار',
      investor: 'مستثمر'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getPlanTypeLabel = (type: string) => {
    const labels = {
      free: 'مجاني',
      basic: 'أساسي',
      professional: 'احترافي',
      enterprise: 'مؤسسي'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSupportLevelLabel = (level: string) => {
    const labels = {
      basic: 'أساسي',
      priority: 'أولوية',
      dedicated: 'مخصص'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'free': return <Gift className="h-5 w-5 text-gray-600" />;
      case 'basic': return <Package className="h-5 w-5 text-blue-600" />;
      case 'professional': return <Star className="h-5 w-5 text-orange-600" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-purple-600" />;
      default: return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      professional: 'bg-orange-100 text-orange-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة الاشتراكات</h1>
          <p className="text-gray-600">إدارة خطط الاشتراك وأساليب الدفع والعروض الترويجية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                خطة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء خطة اشتراك جديدة</DialogTitle>
                <DialogDescription>
                  أضف خطة اشتراك جديدة مع الميزات والأسعار المناسبة
                </DialogDescription>
              </DialogHeader>
              {/* Plan creation form will be here */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planName">اسم الخطة</Label>
                    <Input id="planName" placeholder="خطة احترافية" />
                  </div>
                  <div>
                    <Label htmlFor="planPrice">السعر</Label>
                    <Input id="planPrice" type="number" placeholder="50" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button>
                    إنشاء الخطة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">خطط الاشتراك</TabsTrigger>
          <TabsTrigger value="payment">طرق الدفع</TabsTrigger>
          <TabsTrigger value="promo">العروض الترويجية</TabsTrigger>
          <TabsTrigger value="analytics">تحليلات الاشتراك</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`border-2 transition-all duration-200 hover:shadow-lg ${
                plan.isPopular ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-200'
              }`}>
                <CardHeader className="text-center">
                  {plan.isPopular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                      الأكثر شعبية
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getPlanIcon(plan.type)}
                    <CardTitle className="text-xl">{plan.nameAr}</CardTitle>
                  </div>
                  
                  <Badge className={getTypeColor(plan.type)}>
                    {getPlanTypeLabel(plan.type)} - {getRoleLabel(plan.role)}
                  </Badge>
                  
                  <div className="mt-4">
                    {plan.originalPrice && plan.originalPrice > plan.price && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatCurrency(plan.originalPrice)}
                      </p>
                    )}
                    <p className="text-3xl font-bold text-blue-600">
                      {plan.price === 0 ? 'مجاناً' : formatCurrency(plan.price)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {plan.billingPeriod === 'monthly' ? 'شهرياً' : 'سنوياً'}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>{plan.descriptionAr}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">الميزات الرئيسية:</h4>
                    <ul className="space-y-1">
                      {plan.featuresAr.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.featuresAr.length > 4 && (
                        <li className="text-sm text-gray-500">
                          +{plan.featuresAr.length - 4} ميزة أخرى
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 border-t pt-3">
                    <div>
                      <span className="font-medium">المستخدمين:</span> {plan.maxUsers}
                    </div>
                    <div>
                      <span className="font-medium">المزارع:</span> {plan.maxFarms}
                    </div>
                    <div>
                      <span className="font-medium">التخزين:</span> {plan.maxStorage} جيجا
                    </div>
                    <div>
                      <span className="font-medium">API:</span> {plan.apiCalls} طلب
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <Badge className={plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {plan.isActive ? 'نشط' : 'معطل'}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingPlan(plan)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{method.nameAr}</CardTitle>
                        <p className="text-sm text-gray-600 capitalize">{method.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Switch checked={method.isActive} />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">رسوم النسبة</p>
                      <p className="font-bold">{method.fees.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">رسوم ثابتة</p>
                      <p className="font-bold">{formatCurrency(method.fees.fixed)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">البلدان المدعومة:</p>
                    <div className="flex flex-wrap gap-1">
                      {method.countries.slice(0, 3).map((country) => (
                        <Badge key={country} variant="outline" className="text-xs">
                          {country}
                        </Badge>
                      ))}
                      {method.countries.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{method.countries.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      إعدادات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promo" className="space-y-6">
          <div className="space-y-4">
            {promoCodes.map((promo) => {
              const isExpired = new Date(promo.validTo) < new Date();
              const usagePercentage = (promo.usedCount / promo.usageLimit) * 100;
              
              return (
                <Card key={promo.id} className={`border-2 ${isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Percent className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{promo.code}</h3>
                            <p className="text-gray-600">{promo.nameAr}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{promo.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">نوع الخصم</p>
                            <p className="font-medium">
                              {promo.discountType === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">قيم�� الخصم</p>
                            <p className="font-bold text-green-600">
                              {promo.discountType === 'percentage' ? 
                                `${promo.discountValue}%` : 
                                formatCurrency(promo.discountValue)
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">مرات الاستخدام</p>
                            <p className="font-medium">{promo.usedCount} من {promo.usageLimit}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">تاريخ الانتهاء</p>
                            <p className="font-medium">
                              {new Date(promo.validTo).toLocaleDateString('ar-TN')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">معدل الاستخدام</span>
                            <span className="text-sm font-medium">{usagePercentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={isExpired ? 'bg-red-100 text-red-800' : 
                          promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {isExpired ? 'منتهي' : promo.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                        
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء خطط الاشتراك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">
                  قريباً - تحليلات تفصيلية لأداء كل خطة اشتراك
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحليل طرق الدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">
                  قريباً - إحصائيات استخدام طرق الدفع المختلفة
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionManagement;
