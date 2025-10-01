import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calculator,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Lightbulb,
  PieChart,
  BarChart3,
  Calendar,
  FileText,
  Save,
  Download,
  RefreshCw
} from 'lucide-react';

interface BudgetPlan {
  id: string;
  farmerId: string;
  seasonYear: number;
  cropType: string;
  plannedArea: number;
  estimatedExpenses: {
    category: string;
    plannedAmount: number;
    actualAmount?: number;
    variance?: number;
  }[];
  projectedRevenue: number;
  estimatedProfit: number;
  riskFactors: string[];
  aiRecommendations: string[];
  status: 'draft' | 'approved' | 'active' | 'completed';
  createdDate: string;
  lastUpdated: string;
}

interface ExpenseTemplate {
  category: string;
  label: string;
  defaultAmount: number;
  unit: string;
  description: string;
}

const BudgetPlanning: React.FC = () => {
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BudgetPlan | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [formData, setFormData] = useState({
    cropType: '',
    plannedArea: '1',
    seasonYear: new Date().getFullYear(),
    customExpenses: [] as { category: string; plannedAmount: number }[]
  });

  const cropTypes = [
    'قمح', 'شعير', 'زيتون', 'حمضيات', 'طماطم', 'خيار', 'فلفل', 'باذنجان',
    'جزر', 'بطاطس', 'بصل', 'عنب', 'تفاح', 'رمان', 'تين', 'لوز'
  ];

  const expenseTemplates: ExpenseTemplate[] = [
    { category: 'البذور', label: 'البذور والشتلات', defaultAmount: 150, unit: 'دينار/هكتار', description: 'تكلفة البذور عالية الجودة' },
    { category: 'الأسمدة', label: 'الأسمدة والتغذية', defaultAmount: 300, unit: 'دينار/هكتار', description: 'أسمدة أساسية ومغذيات التربة' },
    { category: 'المبيدات', label: 'المبيدات والحماية', defaultAmount: 120, unit: 'دينار/هكتار', description: 'مبيدات حشرية وفطرية' },
    { category: 'العمالة', label: 'تكاليف العمالة', defaultAmount: 400, unit: 'دينار/هكتار', description: 'أجور العمال والمزارعين' },
    { category: 'المعدات', label: 'المعدات والآلات', defaultAmount: 200, unit: 'دينار/هكتار', description: 'تشغيل وصيانة المعدات' },
    { category: 'الري', label: 'نظام الري', defaultAmount: 250, unit: 'دينار/هكتار', description: 'مياه الري وصيانة النظام' },
    { category: 'النقل', label: 'النقل والتسويق', defaultAmount: 100, unit: 'دينار/هكتار', description: 'نقل المحصول للأسواق' },
    { category: 'أخرى', label: 'مصروفات أخرى', defaultAmount: 80, unit: 'دينار/هكتار', description: 'مصروفات متنوعة وطوارئ' }
  ];

  useEffect(() => {
    fetchBudgetPlans();
  }, [selectedStatus]);

  const fetchBudgetPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      
      const response = await fetch(`/api/budget-plans?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBudgetPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching budget plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIBudget = async () => {
    if (!formData.cropType) {
      alert('يرجى اختيار نوع المحصول أولاً');
      return;
    }

    try {
      const response = await fetch('/api/budget-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cropType: formData.cropType,
          plannedArea: parseFloat(formData.plannedArea),
          customExpenses: formData.customExpenses.length > 0 ? formData.customExpenses : undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchBudgetPlans();
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error generating budget:', error);
    }
  };

  const updateBudgetStatus = async (planId: string, newStatus: BudgetPlan['status']) => {
    try {
      const response = await fetch(`/api/budget-plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchBudgetPlans();
      }
    } catch (error) {
      console.error('Error updating budget status:', error);
    }
  };

  const deleteBudgetPlan = async (planId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      try {
        const response = await fetch(`/api/budget-plans/${planId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchBudgetPlans();
        }
      } catch (error) {
        console.error('Error deleting budget plan:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cropType: '',
      plannedArea: '1',
      seasonYear: new Date().getFullYear(),
      customExpenses: []
    });
  };

  const addCustomExpense = () => {
    setFormData({
      ...formData,
      customExpenses: [...formData.customExpenses, { category: '', plannedAmount: 0 }]
    });
  };

  const updateCustomExpense = (index: number, field: string, value: any) => {
    const updated = [...formData.customExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, customExpenses: updated });
  };

  const removeCustomExpense = (index: number) => {
    const updated = formData.customExpenses.filter((_, i) => i !== index);
    setFormData({ ...formData, customExpenses: updated });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'مسودة',
      approved: 'معتمدة',
      active: 'نشطة',
      completed: 'مكتملة'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const calculateVariance = (planned: number, actual?: number) => {
    if (!actual) return 0;
    return ((actual - planned) / planned) * 100;
  };

  const getVarianceColor = (variance: number) => {
    if (variance <= 5) return 'text-green-600';
    if (variance <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">تخطيط الميزانية</h1>
          <p className="text-gray-600">تخطيط مالي ذكي للمواسم القادمة بتوصيات الذكاء الاصطناعي</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="جميع الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="approved">معتمدة</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                خطة ميزانية جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء خطة ميزانية جديدة</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cropType">نوع المحصول</Label>
                    <Select value={formData.cropType} onValueChange={(value) => 
                      setFormData({ ...formData, cropType: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المحصول" />
                      </SelectTrigger>
                      <SelectContent>
                        {cropTypes.map(crop => (
                          <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plannedArea">المساحة المخططة (هكتار)</Label>
                    <Input
                      id="plannedArea"
                      type="number"
                      step="0.1"
                      value={formData.plannedArea}
                      onChange={(e) => setFormData({ ...formData, plannedArea: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seasonYear">موسم</Label>
                    <Select value={formData.seasonYear.toString()} onValueChange={(value) => 
                      setFormData({ ...formData, seasonYear: parseInt(value) })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expense Templates */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">قالب المصروفات المقترح</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expenseTemplates.map((template, index) => (
                      <Card key={index} className="border-2 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{template.label}</h4>
                            <span className="text-sm text-gray-600">{template.unit}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(template.defaultAmount)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Custom Expenses */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">مصروفات مخصصة (اختياري)</h3>
                    <Button variant="outline" onClick={addCustomExpense} className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة مصروف
                    </Button>
                  </div>
                  
                  {formData.customExpenses.map((expense, index) => (
                    <div key={index} className="flex gap-4 items-end mb-3">
                      <div className="flex-1">
                        <Label>فئة المصروف</Label>
                        <Input
                          value={expense.category}
                          onChange={(e) => updateCustomExpense(index, 'category', e.target.value)}
                          placeholder="مثال: مصروفات إضافية"
                        />
                      </div>
                      <div className="w-32">
                        <Label>المبلغ (دينار)</Label>
                        <Input
                          type="number"
                          value={expense.plannedAmount}
                          onChange={(e) => updateCustomExpense(index, 'plannedAmount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => removeCustomExpense(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={generateAIBudget} className="flex-1 gap-2">
                    <Lightbulb className="h-4 w-4" />
                    إنشاء ميزانية بالذكاء الاصطناعي
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Plans */}
      {budgetPlans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calculator className="mx-auto h-12 w-12 mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">لا توجد خطط ميزانية</p>
            <p className="text-sm text-gray-400">ابدأ بإنشاء أول خطة ميزانية لك</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {budgetPlans.map((plan) => (
            <Card key={plan.id} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.cropType} - موسم {plan.seasonYear}
                      <Badge className={getStatusColor(plan.status)}>
                        {getStatusLabel(plan.status)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      المساحة: {plan.plannedArea} هكتار | آخر تحديث: {new Date(plan.lastUpdated).toLocaleDateString('ar-TN')}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    {plan.status === 'draft' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateBudgetStatus(plan.id, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        اعتم��د
                      </Button>
                    )}
                    {plan.status === 'approved' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateBudgetStatus(plan.id, 'active')}
                      >
                        <Clock className="h-4 w-4 ml-1" />
                        تفعيل
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteBudgetPlan(plan.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="expenses">المصروفات</TabsTrigger>
                    <TabsTrigger value="risks">المخاطر</TabsTrigger>
                    <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-blue-600 mb-1">المصروفات المقدرة</p>
                        <p className="text-lg font-bold text-blue-800">
                          {formatCurrency(plan.estimatedExpenses.reduce((sum, exp) => sum + exp.plannedAmount, 0))}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-green-600 mb-1">الإيراد المتوقع</p>
                        <p className="text-lg font-bold text-green-800">
                          {formatCurrency(plan.projectedRevenue)}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-purple-600 mb-1">الربح المقدر</p>
                        <p className="text-lg font-bold text-purple-800">
                          {formatCurrency(plan.estimatedProfit)}
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <PieChart className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <p className="text-sm text-orange-600 mb-1">هامش الربح</p>
                        <p className="text-lg font-bold text-orange-800">
                          {plan.projectedRevenue > 0 ? 
                            ((plan.estimatedProfit / plan.projectedRevenue) * 100).toFixed(1) : 0
                          }%
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="expenses" className="space-y-4">
                    <div className="space-y-3">
                      {plan.estimatedExpenses.map((expense, index) => {
                        const variance = calculateVariance(expense.plannedAmount, expense.actualAmount);
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{expense.category}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600">
                                  مخطط: {formatCurrency(expense.plannedAmount)}
                                </span>
                                {expense.actualAmount && (
                                  <>
                                    <span className="text-sm text-gray-600">
                                      فعلي: {formatCurrency(expense.actualAmount)}
                                    </span>
                                    <span className={`text-sm font-medium ${getVarianceColor(Math.abs(variance))}`}>
                                      {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="w-32">
                              <Progress 
                                value={expense.actualAmount ? 
                                  (expense.actualAmount / expense.plannedAmount) * 100 : 0
                                } 
                                className="h-2"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="risks" className="space-y-4">
                    <div className="space-y-3">
                      {plan.riskFactors.map((risk, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{risk}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <div className="space-y-3">
                      {plan.aiRecommendations.map((recommendation, index) => (
                        <Alert key={index}>
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>{recommendation}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetPlanning;
