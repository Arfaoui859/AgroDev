import { Request, Response } from 'express';

// Financial Data Interfaces
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

interface RevenueRecord {
  id: string;
  farmerId: string;
  cropType: string;
  varietyName: string;
  quantitySold: number;
  unit: 'kg' | 'ton' | 'quintals' | 'pieces';
  pricePerUnit: number;
  totalRevenue: number;
  currency: string;
  saleDate: string;
  buyer: string;
  marketLocation: string;
  qualityGrade: 'A' | 'B' | 'C' | 'Premium';
  seasonYear: number;
  harvestDate: string;
  storageTime: number; // days
  transportationCost: number;
  marketingCost: number;
  netRevenue: number;
}

interface CropProfitabilityData {
  cropType: string;
  seasonYear: number;
  totalInvestment: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  roi: number; // Return on Investment percentage
  costBreakdown: {
    seeds: number;
    fertilizers: number;
    pesticides: number;
    labor: number;
    equipment: number;
    other: number;
  };
  revenueMetrics: {
    averagePricePerUnit: number;
    totalQuantityProduced: number;
    totalQuantitySold: number;
    qualityDistribution: Record<string, number>;
  };
}

interface BudgetPlan {
  id: string;
  farmerId: string;
  seasonYear: number;
  cropType: string;
  plannedArea: number; // hectares
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
    incomeGrowth: number; // percentage
    expenseGrowth: number;
    profitGrowth: number;
  };
}

// AI Financial Analysis Engine
class AIFinancialAnalysisEngine {
  static analyzeProfitabilityTrends(records: CropProfitabilityData[]): any {
    const analysis = {
      mostProfitableCrops: [] as any[],
      seasonalTrends: [] as any[],
      riskAssessment: [] as any[],
      optimizationSuggestions: [] as string[]
    };

    // Sort crops by ROI
    const sortedByROI = [...records].sort((a, b) => b.roi - a.roi);
    analysis.mostProfitableCrops = sortedByROI.slice(0, 5).map(crop => ({
      cropType: crop.cropType,
      roi: crop.roi,
      profitMargin: crop.profitMargin,
      netProfit: crop.netProfit
    }));

    // Seasonal analysis
    const seasonalData = records.reduce((acc, record) => {
      const key = `${record.seasonYear}-${record.cropType}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {} as Record<string, CropProfitabilityData[]>);

    Object.entries(seasonalData).forEach(([key, crops]) => {
      const avgROI = crops.reduce((sum, crop) => sum + crop.roi, 0) / crops.length;
      const avgMargin = crops.reduce((sum, crop) => sum + crop.profitMargin, 0) / crops.length;
      
      analysis.seasonalTrends.push({
        period: key,
        averageROI: avgROI,
        averageMargin: avgMargin,
        totalProfit: crops.reduce((sum, crop) => sum + crop.netProfit, 0)
      });
    });

    // Risk assessment
    records.forEach(record => {
      let riskLevel = 'منخفض';
      let riskFactors = [];
      
      if (record.profitMargin < 15) {
        riskLevel = 'عالي';
        riskFactors.push('هامش ربح منخفض');
      } else if (record.profitMargin < 25) {
        riskLevel = 'متوسط';
        riskFactors.push('هامش ربح معتدل');
      }
      
      if (record.roi < 20) {
        riskFactors.push('عائد استثمار منخفض');
      }

      analysis.riskAssessment.push({
        cropType: record.cropType,
        riskLevel,
        riskFactors,
        recommendation: this.generateRiskRecommendation(record)
      });
    });

    // Optimization suggestions
    analysis.optimizationSuggestions = this.generateOptimizationSuggestions(records);

    return analysis;
  }

  static generateRiskRecommendation(crop: CropProfitabilityData): string {
    if (crop.profitMargin < 15) {
      return 'فكر في تنويع المحاصيل أو تحسين كفاءة التكلفة';
    } else if (crop.roi < 20) {
      return 'راجع استراتيجية الاستثمار والتسويق';
    } else {
      return 'محصول مربح، حافظ على الممارسات الحالية';
    }
  }

  static generateOptimizationSuggestions(records: CropProfitabilityData[]): string[] {
    const suggestions = [];
    
    // Cost optimization analysis
    const avgCosts = records.reduce((acc, record) => {
      Object.entries(record.costBreakdown).forEach(([category, cost]) => {
        if (!acc[category]) acc[category] = [];
        acc[category].push(cost);
      });
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(avgCosts).forEach(([category, costs]) => {
      const avg = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const max = Math.max(...costs);
      
      if (max > avg * 1.5) {
        suggestions.push(`راجع تكاليف ${this.translateCategory(category)} - توجد فرصة للتوفير`);
      }
    });

    // Revenue optimization
    const avgRevenues = records.map(r => r.totalRevenue);
    const maxRevenue = Math.max(...avgRevenues);
    const avgRevenue = avgRevenues.reduce((sum, rev) => sum + rev, 0) / avgRevenues.length;
    
    if (maxRevenue > avgRevenue * 1.3) {
      suggestions.push('فكر في زيادة المساحة المزروعة للمحاصيل عالية العائد');
    }

    // Market timing suggestions
    suggestions.push('راقب أسعار السوق لتحديد أفضل وقت للبيع');
    suggestions.push('فكر في التعاقد المسبق لضمان أسعار مستقرة');

    return suggestions;
  }

  static translateCategory(category: string): string {
    const translations = {
      seeds: 'البذور',
      fertilizers: 'الأسمدة',
      pesticides: 'المبيدات',
      labor: 'العمالة',
      equipment: 'المعدات',
      other: 'أخرى'
    };
    return translations[category as keyof typeof translations] || category;
  }

  static generateBudgetRecommendations(historical: CropProfitabilityData[], cropType: string): BudgetPlan {
    const relevantRecords = historical.filter(record => record.cropType === cropType);
    
    if (relevantRecords.length === 0) {
      // Default budget for new crop
      return this.generateDefaultBudget(cropType);
    }

    const avgCosts = this.calculateAverageCosts(relevantRecords);
    const avgRevenue = relevantRecords.reduce((sum, record) => sum + record.totalRevenue, 0) / relevantRecords.length;
    
    const estimatedExpenses = Object.entries(avgCosts).map(([category, amount]) => ({
      category: this.translateCategory(category),
      plannedAmount: Math.round(amount * 1.1), // 10% buffer
      actualAmount: undefined,
      variance: undefined
    }));

    const totalEstimatedCost = Object.values(avgCosts).reduce((sum, cost) => sum + cost, 0);
    
    return {
      id: Date.now().toString(),
      farmerId: 'current-farmer',
      seasonYear: new Date().getFullYear(),
      cropType,
      plannedArea: 1, // Default to 1 hectare
      estimatedExpenses,
      projectedRevenue: Math.round(avgRevenue * 1.05), // 5% growth assumption
      estimatedProfit: Math.round((avgRevenue * 1.05) - (totalEstimatedCost * 1.1)),
      riskFactors: [
        'تقلبات أسعار السوق',
        'تغيرات المناخ',
        'توفر العمالة',
        'تكاليف المدخلات'
      ],
      aiRecommendations: this.generateOptimizationSuggestions(relevantRecords),
      status: 'draft',
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  static calculateAverageCosts(records: CropProfitabilityData[]): Record<string, number> {
    const totalCosts = records.reduce((acc, record) => {
      Object.entries(record.costBreakdown).forEach(([category, cost]) => {
        acc[category] = (acc[category] || 0) + cost;
      });
      return acc;
    }, {} as Record<string, number>);

    Object.keys(totalCosts).forEach(category => {
      totalCosts[category] /= records.length;
    });

    return totalCosts;
  }

  static generateDefaultBudget(cropType: string): BudgetPlan {
    // Default budget estimates for common crops in Tunisia
    const defaultCosts = {
      'قمح': { seeds: 150, fertilizers: 300, pesticides: 100, labor: 200, equipment: 150, other: 100 },
      'شعير': { seeds: 120, fertilizers: 250, pesticides: 80, labor: 180, equipment: 130, other: 90 },
      'زيتون': { seeds: 50, fertilizers: 400, pesticides: 150, labor: 300, equipment: 200, other: 150 },
      'حمضيات': { seeds: 100, fertilizers: 500, pesticides: 200, labor: 400, equipment: 250, other: 200 },
      'طماطم': { seeds: 200, fertilizers: 600, pesticides: 300, labor: 500, equipment: 300, other: 250 }
    };

    const costs = defaultCosts[cropType as keyof typeof defaultCosts] || defaultCosts['قمح'];
    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    const estimatedExpenses = Object.entries(costs).map(([category, amount]) => ({
      category: this.translateCategory(category),
      plannedAmount: amount,
      actualAmount: undefined,
      variance: undefined
    }));

    return {
      id: Date.now().toString(),
      farmerId: 'current-farmer',
      seasonYear: new Date().getFullYear(),
      cropType,
      plannedArea: 1,
      estimatedExpenses,
      projectedRevenue: Math.round(totalCost * 1.4), // Assume 40% profit margin
      estimatedProfit: Math.round(totalCost * 0.4),
      riskFactors: [
        'محصول جديد - بيانات محدودة',
        'تقلبات السوق',
        'المخاطر المناخية'
      ],
      aiRecommendations: [
        'ابدأ بمساحة صغيرة للتجربة',
        'اطلب استشارة من مزارعين خبراء',
        'راقب أسعار السوق عن كثب'
      ],
      status: 'draft',
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
}

// Sample data for development
const sampleExpenses: ExpenseRecord[] = [
  {
    id: '1',
    farmerId: 'farmer1',
    category: 'seeds',
    subcategory: 'بذور قمح',
    amount: 150,
    currency: 'TND',
    date: '2024-10-15',
    description: 'بذور قمح عالية الجودة للموسم الجديد',
    cropRelated: 'قمح',
    isRecurring: false,
    receiptUrl: '/receipts/seeds-001.jpg',
    paymentMethod: 'bank_transfer',
    supplier: 'شركة البذور التونسية',
    tags: ['بذور', 'قمح', 'موسم2024']
  },
  {
    id: '2',
    farmerId: 'farmer1',
    category: 'fertilizers',
    subcategory: 'سماد فوسفاتي',
    amount: 200,
    currency: 'TND',
    date: '2024-10-20',
    description: 'سماد فوسفاتي للتربة الزراعية',
    cropRelated: 'قمح',
    isRecurring: true,
    recurringPeriod: 'seasonal',
    paymentMethod: 'cash',
    supplier: 'تعاونية الأسمدة',
    tags: ['أسمدة', 'فوسفات']
  }
];

const sampleRevenues: RevenueRecord[] = [
  {
    id: '1',
    farmerId: 'farmer1',
    cropType: 'قمح',
    varietyName: 'قمح صلب',
    quantitySold: 500,
    unit: 'kg',
    pricePerUnit: 1.2,
    totalRevenue: 600,
    currency: 'TND',
    saleDate: '2024-06-15',
    buyer: 'مطحنة تونس',
    marketLocation: 'سوق الحبوب - تونس',
    qualityGrade: 'A',
    seasonYear: 2024,
    harvestDate: '2024-06-01',
    storageTime: 14,
    transportationCost: 50,
    marketingCost: 20,
    netRevenue: 530
  },
  {
    id: '2',
    farmerId: 'farmer1',
    cropType: 'زيتون',
    varietyName: 'شملالي',
    quantitySold: 300,
    unit: 'kg',
    pricePerUnit: 2.5,
    totalRevenue: 750,
    currency: 'TND',
    saleDate: '2024-11-20',
    buyer: 'معصرة الزيتون',
    marketLocation: 'سوق الزيتون - صفاقس',
    qualityGrade: 'Premium',
    seasonYear: 2024,
    harvestDate: '2024-11-10',
    storageTime: 10,
    transportationCost: 30,
    marketingCost: 15,
    netRevenue: 705
  }
];

let expenses: ExpenseRecord[] = [...sampleExpenses];
let revenues: RevenueRecord[] = [...sampleRevenues];
let budgetPlans: BudgetPlan[] = [];

// API Routes
export async function createExpense(req: Request, res: Response) {
  try {
    const expenseData: Omit<ExpenseRecord, 'id'> = req.body;
    
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: Date.now().toString()
    };
    
    expenses.push(newExpense);
    
    res.json({
      success: true,
      data: newExpense,
      message: 'تم إضافة المصروف بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إضافة المصروف',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getExpenses(req: Request, res: Response) {
  try {
    const { farmerId, category, startDate, endDate, cropType } = req.query;
    
    let filteredExpenses = expenses;
    
    if (farmerId) {
      filteredExpenses = filteredExpenses.filter(exp => exp.farmerId === farmerId);
    }
    
    if (category) {
      filteredExpenses = filteredExpenses.filter(exp => exp.category === category);
    }
    
    if (startDate && endDate) {
      filteredExpenses = filteredExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= new Date(startDate as string) && expDate <= new Date(endDate as string);
      });
    }
    
    if (cropType) {
      filteredExpenses = filteredExpenses.filter(exp => exp.cropRelated === cropType);
    }
    
    // Calculate totals by category
    const categoryTotals = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    res.json({
      success: true,
      data: {
        expenses: filteredExpenses,
        categoryTotals,
        totalExpenses,
        count: filteredExpenses.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في استرجاع المصروفات',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function createRevenue(req: Request, res: Response) {
  try {
    const revenueData: Omit<RevenueRecord, 'id'> = req.body;
    
    const newRevenue: RevenueRecord = {
      ...revenueData,
      id: Date.now().toString()
    };
    
    revenues.push(newRevenue);
    
    res.json({
      success: true,
      data: newRevenue,
      message: 'تم إضافة الإيراد بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إضافة الإيراد',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getRevenues(req: Request, res: Response) {
  try {
    const { farmerId, cropType, startDate, endDate, seasonYear } = req.query;
    
    let filteredRevenues = revenues;
    
    if (farmerId) {
      filteredRevenues = filteredRevenues.filter(rev => rev.farmerId === farmerId);
    }
    
    if (cropType) {
      filteredRevenues = filteredRevenues.filter(rev => rev.cropType === cropType);
    }
    
    if (startDate && endDate) {
      filteredRevenues = filteredRevenues.filter(rev => {
        const saleDate = new Date(rev.saleDate);
        return saleDate >= new Date(startDate as string) && saleDate <= new Date(endDate as string);
      });
    }
    
    if (seasonYear) {
      filteredRevenues = filteredRevenues.filter(rev => rev.seasonYear === parseInt(seasonYear as string));
    }
    
    // Calculate totals by crop type
    const cropTotals = filteredRevenues.reduce((acc, rev) => {
      acc[rev.cropType] = (acc[rev.cropType] || 0) + rev.totalRevenue;
      return acc;
    }, {} as Record<string, number>);
    
    const totalRevenue = filteredRevenues.reduce((sum, rev) => sum + rev.totalRevenue, 0);
    const totalNetRevenue = filteredRevenues.reduce((sum, rev) => sum + rev.netRevenue, 0);
    
    res.json({
      success: true,
      data: {
        revenues: filteredRevenues,
        cropTotals,
        totalRevenue,
        totalNetRevenue,
        count: filteredRevenues.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في استرجاع الإيرادات',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getProfitabilityAnalysis(req: Request, res: Response) {
  try {
    const { farmerId, cropType, seasonYear } = req.query;
    
    // Filter expenses and revenues
    let filteredExpenses = expenses;
    let filteredRevenues = revenues;
    
    if (farmerId) {
      filteredExpenses = filteredExpenses.filter(exp => exp.farmerId === farmerId);
      filteredRevenues = filteredRevenues.filter(rev => rev.farmerId === farmerId);
    }
    
    if (cropType) {
      filteredExpenses = filteredExpenses.filter(exp => exp.cropRelated === cropType);
      filteredRevenues = filteredRevenues.filter(rev => rev.cropType === cropType);
    }
    
    if (seasonYear) {
      const year = parseInt(seasonYear as string);
      filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date).getFullYear() === year);
      filteredRevenues = filteredRevenues.filter(rev => rev.seasonYear === year);
    }
    
    // Group by crop and season
    const profitabilityData: CropProfitabilityData[] = [];
    
    const cropSeasons = new Set(filteredRevenues.map(rev => `${rev.cropType}-${rev.seasonYear}`));
    
    cropSeasons.forEach(cropSeason => {
      const [crop, season] = cropSeason.split('-');
      const yearNum = parseInt(season);
      
      const cropExpenses = filteredExpenses.filter(exp => 
        exp.cropRelated === crop && new Date(exp.date).getFullYear() === yearNum
      );
      
      const cropRevenues = filteredRevenues.filter(rev => 
        rev.cropType === crop && rev.seasonYear === yearNum
      );
      
      const totalInvestment = cropExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalRevenue = cropRevenues.reduce((sum, rev) => sum + rev.totalRevenue, 0);
      const netProfit = totalRevenue - totalInvestment;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
      
      // Cost breakdown
      const costBreakdown = cropExpenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Revenue metrics
      const totalQuantityProduced = cropRevenues.reduce((sum, rev) => sum + rev.quantitySold, 0);
      const averagePricePerUnit = totalQuantityProduced > 0 ? totalRevenue / totalQuantityProduced : 0;
      
      const qualityDistribution = cropRevenues.reduce((acc, rev) => {
        acc[rev.qualityGrade] = (acc[rev.qualityGrade] || 0) + rev.quantitySold;
        return acc;
      }, {} as Record<string, number>);
      
      profitabilityData.push({
        cropType: crop,
        seasonYear: yearNum,
        totalInvestment,
        totalRevenue,
        netProfit,
        profitMargin,
        roi,
        costBreakdown: {
          seeds: costBreakdown.seeds || 0,
          fertilizers: costBreakdown.fertilizers || 0,
          pesticides: costBreakdown.pesticides || 0,
          labor: costBreakdown.labor || 0,
          equipment: costBreakdown.equipment || 0,
          other: (costBreakdown.fuel || 0) + (costBreakdown.maintenance || 0) + (costBreakdown.utilities || 0) + (costBreakdown.insurance || 0) + (costBreakdown.other || 0)
        },
        revenueMetrics: {
          averagePricePerUnit,
          totalQuantityProduced,
          totalQuantitySold: totalQuantityProduced,
          qualityDistribution
        }
      });
    });
    
    // Generate AI analysis
    const aiAnalysis = AIFinancialAnalysisEngine.analyzeProfitabilityTrends(profitabilityData);
    
    res.json({
      success: true,
      data: {
        profitabilityData,
        aiAnalysis,
        summary: {
          totalInvestment: profitabilityData.reduce((sum, data) => sum + data.totalInvestment, 0),
          totalRevenue: profitabilityData.reduce((sum, data) => sum + data.totalRevenue, 0),
          totalNetProfit: profitabilityData.reduce((sum, data) => sum + data.netProfit, 0),
          avgProfitMargin: profitabilityData.length > 0 ? 
            profitabilityData.reduce((sum, data) => sum + data.profitMargin, 0) / profitabilityData.length : 0,
          avgROI: profitabilityData.length > 0 ? 
            profitabilityData.reduce((sum, data) => sum + data.roi, 0) / profitabilityData.length : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحليل الربحية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getFinancialSummary(req: Request, res: Response) {
  try {
    const { farmerId, period = 'yearly', year, month, quarter } = req.query;
    
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    
    let filteredExpenses = expenses.filter(exp => 
      (!farmerId || exp.farmerId === farmerId) &&
      new Date(exp.date).getFullYear() === currentYear
    );
    
    let filteredRevenues = revenues.filter(rev => 
      (!farmerId || rev.farmerId === farmerId) &&
      rev.seasonYear === currentYear
    );
    
    // Further filter by period
    if (period === 'monthly' && month) {
      const monthNum = parseInt(month as string);
      filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date).getMonth() + 1 === monthNum);
      filteredRevenues = filteredRevenues.filter(rev => new Date(rev.saleDate).getMonth() + 1 === monthNum);
    } else if (period === 'quarterly' && quarter) {
      const quarterNum = parseInt(quarter as string);
      const quarterMonths = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12]
      };
      const months = quarterMonths[quarterNum as keyof typeof quarterMonths];
      
      filteredExpenses = filteredExpenses.filter(exp => months.includes(new Date(exp.date).getMonth() + 1));
      filteredRevenues = filteredRevenues.filter(rev => months.includes(new Date(rev.saleDate).getMonth() + 1));
    }
    
    const totalIncome = filteredRevenues.reduce((sum, rev) => sum + rev.totalRevenue, 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    
    // Find top performing crop
    const cropRevenues = filteredRevenues.reduce((acc, rev) => {
      acc[rev.cropType] = (acc[rev.cropType] || 0) + rev.totalRevenue;
      return acc;
    }, {} as Record<string, number>);
    
    const topPerformingCrop = Object.keys(cropRevenues).length > 0 ? 
      Object.keys(cropRevenues).reduce((a, b) => cropRevenues[a] > cropRevenues[b] ? a : b) : 'لا يوجد';
    
    // Find highest expense category
    const expenseCategories = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const highestExpenseCategory = Object.keys(expenseCategories).length > 0 ? 
      Object.keys(expenseCategories).reduce((a, b) => expenseCategories[a] > expenseCategories[b] ? a : b) : 'لا يوجد';
    
    // Generate cash flow data (monthly breakdown)
    const cashFlow = [];
    for (let i = 1; i <= 12; i++) {
      const monthExpenses = filteredExpenses.filter(exp => new Date(exp.date).getMonth() + 1 === i);
      const monthRevenues = filteredRevenues.filter(rev => new Date(rev.saleDate).getMonth() + 1 === i);
      
      const monthIncome = monthRevenues.reduce((sum, rev) => sum + rev.totalRevenue, 0);
      const monthExpense = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      cashFlow.push({
        date: `${currentYear}-${i.toString().padStart(2, '0')}`,
        income: monthIncome,
        expenses: monthExpense,
        balance: monthIncome - monthExpense
      });
    }
    
    // Calculate trends (compare with previous period)
    const summary: FinancialSummary = {
      farmerId: farmerId as string || 'current-farmer',
      period: period as 'monthly' | 'quarterly' | 'yearly',
      year: currentYear,
      month: month ? parseInt(month as string) : undefined,
      quarter: quarter ? parseInt(quarter as string) : undefined,
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      avgMonthlyProfit: netProfit / (period === 'monthly' ? 1 : period === 'quarterly' ? 3 : 12),
      topPerformingCrop,
      highestExpenseCategory: AIFinancialAnalysisEngine.translateCategory(highestExpenseCategory),
      cashFlow,
      trends: {
        incomeGrowth: 5.2, // Mock data for now
        expenseGrowth: 3.1,
        profitGrowth: 8.7
      }
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء الملخص المالي',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function createBudgetPlan(req: Request, res: Response) {
  try {
    const { cropType, plannedArea, customExpenses } = req.body;
    
    // Get historical data for this crop
    const historicalData = revenues
      .filter(rev => rev.cropType === cropType)
      .map(rev => {
        const cropExpenses = expenses.filter(exp => 
          exp.cropRelated === cropType && 
          new Date(exp.date).getFullYear() === rev.seasonYear
        );
        
        const totalInvestment = cropExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const costBreakdown = cropExpenses.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          cropType,
          seasonYear: rev.seasonYear,
          totalInvestment,
          totalRevenue: rev.totalRevenue,
          netProfit: rev.totalRevenue - totalInvestment,
          profitMargin: rev.totalRevenue > 0 ? ((rev.totalRevenue - totalInvestment) / rev.totalRevenue) * 100 : 0,
          roi: totalInvestment > 0 ? ((rev.totalRevenue - totalInvestment) / totalInvestment) * 100 : 0,
          costBreakdown: {
            seeds: costBreakdown.seeds || 0,
            fertilizers: costBreakdown.fertilizers || 0,
            pesticides: costBreakdown.pesticides || 0,
            labor: costBreakdown.labor || 0,
            equipment: costBreakdown.equipment || 0,
            other: Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0) - 
              (costBreakdown.seeds || 0) - (costBreakdown.fertilizers || 0) - 
              (costBreakdown.pesticides || 0) - (costBreakdown.labor || 0) - (costBreakdown.equipment || 0)
          },
          revenueMetrics: {
            averagePricePerUnit: rev.pricePerUnit,
            totalQuantityProduced: rev.quantitySold,
            totalQuantitySold: rev.quantitySold,
            qualityDistribution: { [rev.qualityGrade]: rev.quantitySold }
          }
        } as CropProfitabilityData;
      });
    
    let budgetPlan: BudgetPlan;
    
    if (customExpenses && customExpenses.length > 0) {
      // Use custom expenses provided by user
      const totalEstimatedCost = customExpenses.reduce((sum: number, exp: any) => sum + exp.plannedAmount, 0);
      const estimatedRevenue = totalEstimatedCost * 1.4; // Assume 40% profit margin
      
      budgetPlan = {
        id: Date.now().toString(),
        farmerId: 'current-farmer',
        seasonYear: new Date().getFullYear(),
        cropType,
        plannedArea: plannedArea || 1,
        estimatedExpenses: customExpenses,
        projectedRevenue: Math.round(estimatedRevenue),
        estimatedProfit: Math.round(estimatedRevenue - totalEstimatedCost),
        riskFactors: [
          'تقلبات أسعار السوق',
          'المخاطر المناخية',
          'توفر المدخلات'
        ],
        aiRecommendations: [
          'راقب أسعار السوق بانتظام',
          'احتفظ بمخزون طوارئ من المدخلات',
          'فكر في التأمين الزراعي'
        ],
        status: 'draft',
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Generate AI-based budget plan
      budgetPlan = AIFinancialAnalysisEngine.generateBudgetRecommendations(historicalData, cropType);
      budgetPlan.plannedArea = plannedArea || 1;
      
      // Scale expenses based on planned area
      if (plannedArea && plannedArea !== 1) {
        budgetPlan.estimatedExpenses = budgetPlan.estimatedExpenses.map(exp => ({
          ...exp,
          plannedAmount: Math.round(exp.plannedAmount * plannedArea)
        }));
        budgetPlan.projectedRevenue = Math.round(budgetPlan.projectedRevenue * plannedArea);
        budgetPlan.estimatedProfit = Math.round(budgetPlan.estimatedProfit * plannedArea);
      }
    }
    
    budgetPlans.push(budgetPlan);
    
    res.json({
      success: true,
      data: budgetPlan,
      message: 'تم إنشاء خطة الميزانية بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء خطة الميزانية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getBudgetPlans(req: Request, res: Response) {
  try {
    const { farmerId, status, cropType, seasonYear } = req.query;
    
    let filteredPlans = budgetPlans;
    
    if (farmerId) {
      filteredPlans = filteredPlans.filter(plan => plan.farmerId === farmerId);
    }
    
    if (status) {
      filteredPlans = filteredPlans.filter(plan => plan.status === status);
    }
    
    if (cropType) {
      filteredPlans = filteredPlans.filter(plan => plan.cropType === cropType);
    }
    
    if (seasonYear) {
      filteredPlans = filteredPlans.filter(plan => plan.seasonYear === parseInt(seasonYear as string));
    }
    
    res.json({
      success: true,
      data: filteredPlans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في استرجاع خطط الميزانية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function updateBudgetPlan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const planIndex = budgetPlans.findIndex(plan => plan.id === id);
    
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'خطة الميزانية غير موجودة'
      });
    }
    
    budgetPlans[planIndex] = {
      ...budgetPlans[planIndex],
      ...updateData,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: budgetPlans[planIndex],
      message: 'تم تحديث خطة الميزانية بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث خطة الميزانية',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
