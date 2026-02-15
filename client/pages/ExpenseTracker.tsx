import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download,
  Upload,
  Receipt,
  Calendar,
  DollarSign,
  PieChart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ExpenseRecord {
  id: string;
  farmerId: string;
  category: 'seeds' | 'fertilizers' | 'pesticides' | 'labor' | 'equipment' | 'fuel' | 'maintenance' | 'utilities' | 'insurance' | 'other';
  subcategory: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  cropRelated?: string;
  isRecurring: boolean;
  recurringPeriod?: 'weekly' | 'monthly' | 'seasonal' | 'yearly';
  receiptUrl?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit' | 'check';
  supplier?: string;
  tags: string[];
}

interface ExpenseCategory {
  category: string;
  label: string;
  icon: string;
  subcategories: string[];
}

const ExpenseTracker: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<string>('');
  const [filterCrop, setFilterCrop] = useState<string>('');

  const [formData, setFormData] = useState({
    category: 'seeds' as ExpenseRecord['category'],
    subcategory: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cropRelated: '',
    isRecurring: false,
    recurringPeriod: 'monthly' as ExpenseRecord['recurringPeriod'],
    paymentMethod: 'cash' as ExpenseRecord['paymentMethod'],
    supplier: '',
    tags: ''
  });

  const expenseCategories: ExpenseCategory[] = [
    {
      category: 'seeds',
      label: 'البذور',
      icon: '🌱',
      subcategories: ['بذور قمح', 'بذور شعير', 'بذور زيتون', 'بذور حمضيات', 'بذور خضار', 'بذور أخرى']
    },
    {
      category: 'fertilizers',
      label: 'الأسمدة',
      icon: '🧪',
      subcategories: ['سماد نيتروجيني', 'سماد فوسفاتي', 'سماد بوتاسي', 'سماد عضوي', 'سماد مركب']
    },
    {
      category: 'pesticides',
      label: 'المبيدات',
      icon: '🚫',
      subcategories: ['مبيد حشري', 'مبيد فطري', 'مبيد عشبي', 'مبيد طبيعي', 'مبيد متخصص']
    },
    {
      category: 'labor',
      label: 'العمالة',
      icon: '👷',
      subcategories: ['عمالة زراعة', 'عمالة حصاد', 'عمالة صيانة', 'عمالة موسمية', 'أجور إدارية']
    },
    {
      category: 'equipment',
      label: 'المعدات',
      icon: '🚜',
      subcategories: ['شراء معدات', 'تأجير معدات', 'صيانة معدات', 'قطع غيار', 'أدوات يدوية']
    },
    {
      category: 'fuel',
      label: 'الوقود',
      icon: '⛽',
      subcategories: ['وقود ديزل', 'بنزين', 'زيوت التشحيم', 'غاز', 'كهرباء معدات']
    },
    {
      category: 'maintenance',
      label: 'الصيانة',
      icon: '🔧',
      subcategories: ['صيانة أراضي', 'صيانة ري', 'صيانة مباني', 'صيانة طرق', 'صيانة أسوار']
    },
    {
      category: 'utilities',
      label: 'المرافق',
      icon: '💡',
      subcategories: ['فاتورة كهرباء', 'فاتورة مياه', 'اتصالات', 'إنترنت', 'خدمات أخرى']
    },
    {
      category: 'insurance',
      label: 'التأمين',
      icon: '🛡️',
      subcategories: ['تأمين محاصيل', 'تأمين معدات', 'تأمين مسؤولية', 'تأمين عمال', 'تأمين حريق']
    },
    {
      category: 'other',
      label: 'أخرى',
      icon: '📋',
      subcategories: ['رسوم حكومية', 'استشارات', 'تحاليل تربة', 'نقل ومواصلات', 'مصروفات متنوعة']
    }
  ];

  const cropTypes = [
    'قمح', 'شعير', 'زيتون', 'حمضيات', 'طماطم', 'خضروات', 'فواكه', 'أعلاف', 'بقوليات', 'عام'
  ];

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, filterDateRange, filterCrop]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filterCategory) params.append('category', filterCategory);
      if (filterCrop) params.append('cropType', filterCrop);
      
      if (filterDateRange) {
        const now = new Date();
        let startDate = new Date();
        
        switch (filterDateRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', now.toISOString().split('T')[0]);
      }
      
      const response = await fetch(`/api/expenses?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setExpenses(data.data.expenses);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        farmerId: 'current-farmer',
        category: formData.category,
        subcategory: formData.subcategory,
        amount: parseFloat(formData.amount),
        currency: 'TND',
        date: formData.date,
        description: formData.description,
        cropRelated: formData.cropRelated || undefined,
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined,
        paymentMethod: formData.paymentMethod,
        supplier: formData.supplier || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchExpenses();
        resetForm();
        setIsAddDialogOpen(false);
        setEditingExpense(null);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      subcategory: expense.subcategory,
      amount: expense.amount.toString(),
      date: expense.date,
      description: expense.description,
      cropRelated: expense.cropRelated || '',
      isRecurring: expense.isRecurring,
      recurringPeriod: expense.recurringPeriod || 'monthly',
      paymentMethod: expense.paymentMethod,
      supplier: expense.supplier || '',
      tags: expense.tags.join(', ')
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        const response = await fetch(`/api/expenses/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          fetchExpenses();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'seeds',
      subcategory: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      cropRelated: '',
      isRecurring: false,
      recurringPeriod: 'monthly',
      paymentMethod: 'cash',
      supplier: '',
      tags: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const cat = expenseCategories.find(c => c.category === category);
    return cat ? cat.label : category;
  };

  const getCategoryIcon = (category: string) => {
    const cat = expenseCategories.find(c => c.category === category);
    return cat ? cat.icon : '📋';
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'نقداً',
      bank_transfer: 'تحويل بنكي',
      credit: 'ائتمان',
      check: 'شيك'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">تتبع المصروفات</h1>
          <p className="text-gray-600">إدارة وتسجيل مصروفات المزرعة</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مصروف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">فئة المصروف</Label>
                  <Select value={formData.category} onValueChange={(value: any) => {
                    setFormData({ ...formData, category: value, subcategory: '' });
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">التصني�� الفرعي</Label>
                  <Select value={formData.subcategory} onValueChange={(value) => 
                    setFormData({ ...formData, subcategory: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف الفرعي" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories
                        .find(cat => cat.category === formData.category)
                        ?.subcategories.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ (د��نار)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">التاريخ</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cropRelated">المحصول المرتبط (اختياري)</Label>
                  <Select value={formData.cropRelated} onValueChange={(value) => 
                    setFormData({ ...formData, cropRelated: value })
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
                  <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value: any) => 
                    setFormData({ ...formData, paymentMethod: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقداً</SelectItem>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="credit">ائتمان</SelectItem>
                      <SelectItem value="check">شيك</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف تفصيلي للمصروف..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">المورد (اختياري)</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="اسم المورد أو الشركة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">علامات (مفصولة بفواصل)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="مثال: موسم2024, استثمار, ضروري"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                />
                <Label htmlFor="isRecurring">مصروف متكرر</Label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurringPeriod">فترة التكرار</Label>
                  <Select value={formData.recurringPeriod} onValueChange={(value: any) => 
                    setFormData({ ...formData, recurringPeriod: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">أسبوعياً</SelectItem>
                      <SelectItem value="monthly">شهرياً</SelectItem>
                      <SelectItem value="seasonal">موسمياً</SelectItem>
                      <SelectItem value="yearly">سنوياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  {editingExpense ? 'تحديث المصروف' : 'إضافة المصروف'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {filteredExpenses.length} عملية شراء
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أكثر الفئات تكلفة</CardTitle>
            <PieChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-600">
              {Object.keys(categoryTotals).length > 0 ? 
                getCategoryLabel(Object.keys(categoryTotals).reduce((a, b) => 
                  categoryTotals[a] > categoryTotals[b] ? a : b
                )) : 'لا يوجد'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {Object.keys(categoryTotals).length > 0 ? 
                formatCurrency(Math.max(...Object.values(categoryTotals))) : '0 دينار'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط المصروف</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {filteredExpenses.length > 0 ? 
                formatCurrency(totalExpenses / filteredExpenses.length) : '0 دينار'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">
              لكل عملية شراء
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات المتكررة</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {filteredExpenses.filter(exp => exp.isRecurring).length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              من أصل {filteredExpenses.length} مصروف
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث والتصفية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الوصف أو المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>فئة المصروف</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المحصول</Label>
              <Select value={filterCrop} onValueChange={setFilterCrop}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المحاصيل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المحاصيل</SelectItem>
                  {cropTypes.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفترات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفترات</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                  <SelectItem value="year">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>قائمة المصروفات</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>لا توجد مصروفات مسجلة</p>
              <p className="text-sm">ابدأ بإضافة أول مصروف لك</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="border-r-4 border-r-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {getCategoryIcon(expense.category)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{expense.subcategory}</h3>
                            <Badge variant="secondary">
                              {getCategoryLabel(expense.category)}
                            </Badge>
                            {expense.isRecurring && (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 ml-1" />
                                متكرر
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-600 text-sm mt-1">
                            {expense.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(expense.date).toLocaleDateString('ar-TN')}
                            </span>
                            
                            {expense.supplier && (
                              <span>المورد: {expense.supplier}</span>
                            )}
                            
                            {expense.cropRelated && (
                              <span>المحصول: {expense.cropRelated}</span>
                            )}
                            
                            <span>
                              الدفع: {getPaymentMethodLabel(expense.paymentMethod)}
                            </span>
                          </div>
                          
                          {expense.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {expense.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="text-lg font-bold text-red-600">
                            {formatCurrency(expense.amount)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseTracker;
