import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Calendar,
  Plus,
  FileText,
  AlertCircle,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

interface FinancialSummary {
  farmerId: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  year: number;
  month?: number;
  quarter?: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  avgMonthlyProfit: number;
  topPerformingCrop: string;
  highestExpenseCategory: string;
  cashFlow: {
    date: string;
    income: number;
    expenses: number;
    balance: number;
  }[];
  trends: {
    incomeGrowth: number;
    expenseGrowth: number;
    profitGrowth: number;
  };
}

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

const FinancialDashboard: React.FC = () => {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>();
  const [selectedQuarter, setSelectedQuarter] = useState<number>();

  useEffect(() => {
    fetchFinancialSummary();
  }, [selectedPeriod, selectedYear, selectedMonth, selectedQuarter]);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
        year: selectedYear.toString()
      });
      
      if (selectedPeriod === 'monthly' && selectedMonth) {
        params.append('month', selectedMonth.toString());
      }
      
      if (selectedPeriod === 'quarterly' && selectedQuarter) {
        params.append('quarter', selectedQuarter.toString());
      }
      
      const response = await fetch(`/api/financial-summary?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setFinancialSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1];
  };

  const getQuarterName = (quarter: number) => {
    return `الربع ${quarter}`;
  };

  const renderTrendIcon = (value: number) => {
    if (value > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (value < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 20) return 'text-green-600';
    if (margin >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!financialSummary) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            لا توجد بيانات مالية متاحة. يرجى إضافة المصروفات والإيرادات أولاً.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة المالية</h1>
          <p className="text-gray-600">إدارة ومراقبة الأداء المالي للمزرعة</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">شهرياً</SelectItem>
              <SelectItem value="quarterly">ربع سنوي</SelectItem>
              <SelectItem value="yearly">سنوياً</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2022, 2023, 2024, 2025].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPeriod === 'monthly' && (
            <Select value={selectedMonth?.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="اختر الشهر" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {getMonthName(i + 1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedPeriod === 'quarterly' && (
            <Select value={selectedQuarter?.toString()} onValueChange={(value) => setSelectedQuarter(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="اختر الربع" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(quarter => (
                  <SelectItem key={quarter} value={quarter.toString()}>
                    {getQuarterName(quarter)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={() => window.location.href = '/expense-tracker'} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة مصروف
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.totalIncome)}
            </div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              {renderTrendIcon(financialSummary.trends.incomeGrowth)}
              <span className="mr-1">
                {financialSummary.trends.incomeGrowth > 0 ? '+' : ''}
                {financialSummary.trends.incomeGrowth.toFixed(1)}% من الفترة السابقة
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <Wallet className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialSummary.totalExpenses)}
            </div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              {renderTrendIcon(financialSummary.trends.expenseGrowth)}
              <span className="mr-1">
                {financialSummary.trends.expenseGrowth > 0 ? '+' : ''}
                {financialSummary.trends.expenseGrowth.toFixed(1)}% من الفترة السابقة
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(financialSummary.profitMargin)}`}>
              {formatCurrency(financialSummary.netProfit)}
            </div>
            <div className="flex items-center text-xs text-gray-600 mt-1">
              {renderTrendIcon(financialSummary.trends.profitGrowth)}
              <span className="mr-1">
                {financialSummary.trends.profitGrowth > 0 ? '+' : ''}
                {financialSummary.trends.profitGrowth.toFixed(1)}% من الفترة السابقة
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitColor(financialSummary.profitMargin)}`}>
              {financialSummary.profitMargin.toFixed(1)}%
            </div>
            <Progress 
              value={Math.min(Math.max(financialSummary.profitMargin, 0), 100)} 
              className="mt-2"
            />
            <p className="text-xs text-gray-600 mt-1">
              {financialSummary.profitMargin >= 20 ? 'ممتاز' : 
               financialSummary.profitMargin >= 10 ? 'جيد' : 'يحتاج تحسين'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              أفضل محصول أداءً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-green-600 mb-2">
              {financialSummary.topPerformingCrop}
            </div>
            <p className="text-sm text-gray-600">
              يحقق أعلى إيرادات في الفترة المحددة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              أعلى فئة مصروفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-red-600 mb-2">
              {financialSummary.highestExpenseCategory}
            </div>
            <p className="text-sm text-gray-600">
              تتطلب مراجعة لإمكانية التوفير
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            التدفق النقدي الشهري
          </CardTitle>
          <CardDescription>
            مقارنة الإيرادات والمصروفات على مدار السنة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialSummary.cashFlow.map((flow, index) => {
              const monthName = getMonthName(parseInt(flow.date.split('-')[1]));
              const balanceColor = flow.balance >= 0 ? 'text-green-600' : 'text-red-600';
              const maxValue = Math.max(
                ...financialSummary.cashFlow.map(f => Math.max(f.income, f.expenses))
              );
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{monthName}</span>
                    <span className={`text-sm font-medium ${balanceColor}`}>
                      {formatCurrency(flow.balance)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {/* Income Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 w-16">إيرادات</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(flow.income / maxValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-20 text-left">
                        {formatCurrency(flow.income)}
                      </span>
                    </div>
                    
                    {/* Expenses Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 w-16">مصروفات</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(flow.expenses / maxValue) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-20 text-left">
                        {formatCurrency(flow.expenses)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-16 gap-3"
          onClick={() => window.location.href = '/expense-tracker'}
        >
          <Plus className="h-5 w-5" />
          <div className="text-right">
            <div className="font-medium">إضافة مصروف</div>
            <div className="text-xs text-gray-500">تسجيل مصروفات جديدة</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-16 gap-3"
          onClick={() => window.location.href = '/revenue-analysis'}
        >
          <DollarSign className="h-5 w-5" />
          <div className="text-right">
            <div className="font-medium">تحليل الإيرادات</div>
            <div className="text-xs text-gray-500">مراجعة المبيعات والأرباح</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-16 gap-3"
          onClick={() => window.location.href = '/profitability-reports'}
        >
          <FileText className="h-5 w-5" />
          <div className="text-right">
            <div className="font-medium">تقارير الربحية</div>
            <div className="text-xs text-gray-500">تحليل مفصل للأداء</div>
          </div>
        </Button>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(financialSummary.avgMonthlyProfit)}
              </div>
              <p className="text-sm text-gray-600">متوسط الربح الشهري</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {((financialSummary.totalIncome / financialSummary.totalExpenses) * 100 - 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">العائد على الاستثمار</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(financialSummary.totalExpenses / 12)}
              </div>
              <p className="text-sm text-gray-600">متوسط المصروفات الشهرية (دينار)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
