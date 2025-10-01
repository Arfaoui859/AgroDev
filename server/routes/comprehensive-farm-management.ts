import { RequestHandler } from 'express';

// التنبيهات والإشعارات
interface FarmAlert {
  id: string;
  type: 'weather' | 'disease' | 'irrigation' | 'task' | 'market' | 'emergency' | 'maintenance';
  typeArabic: string;
  title: string;
  titleArabic: string;
  message: string;
  messageArabic: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location: string;
  locationArabic: string;
  cropAffected?: string;
  cropAffectedArabic?: string;
  actionRequired: boolean;
  actionText?: string;
  actionTextArabic?: string;
  resolved: boolean;
  priority: number;
  estimatedImpact: 'low' | 'medium' | 'high';
  relatedData?: any;
}

// المهام اليومية والأسبوعية
interface FarmTask {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  category: 'irrigation' | 'fertilization' | 'pest_control' | 'harvesting' | 'planting' | 'maintenance' | 'monitoring';
  categoryArabic: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  assignedTo: string;
  assignedToArabic: string;
  createdDate: string;
  dueDate: string;
  estimatedDuration: number; // في الدقائق
  location: string;
  locationArabic: string;
  cropInvolved?: string;
  cropInvolvedArabic?: string;
  requiredMaterials: string[];
  requiredMaterialsArabic: string[];
  instructions: string;
  instructionsArabic: string;
  completionNotes?: string;
  completionNotesArabic?: string;
  completedAt?: string;
  weatherDependent: boolean;
  cost: number;
  recurringTask: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
}

// حالة المحاصيل والأراضي
interface CropStatus {
  id: string;
  name: string;
  nameArabic: string;
  variety: string;
  varietyArabic: string;
  area: number; // بالهكتار
  location: string;
  locationArabic: string;
  plantingDate: string;
  expectedHarvestDate: string;
  currentGrowthStage: string;
  currentGrowthStageArabic: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthScore: number; // من 100
  soilMoisture: number; // نسبة مئوية
  soilTemperature: number; // درجة مئوية
  irrigationStatus: 'adequate' | 'needs_irrigation' | 'over_irrigated';
  lastIrrigation: string;
  nextIrrigationDue: string;
  fertilizerStatus: 'adequate' | 'needs_fertilizer' | 'over_fertilized';
  lastFertilization: string;
  nextFertilizationDue: string;
  pestStatus: 'none' | 'minor' | 'moderate' | 'severe';
  diseaseStatus: 'none' | 'minor' | 'moderate' | 'severe';
  yieldProjection: number; // كيلوجرام
  marketValue: number; // القيمة السوقية المتوقعة
  profitMargin: number; // هامش الربح المتوقع
  alerts: FarmAlert[];
  tasks: FarmTask[];
  notes: string;
  notesArabic: string;
}

// بيانات الطقس المتقدمة
interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    conditionArabic: string;
    icon: string;
    lastUpdated: string;
  };
  forecast: Array<{
    date: string;
    minTemp: number;
    maxTemp: number;
    humidity: number;
    precipitation: number;
    precipitationChance: number;
    windSpeed: number;
    condition: string;
    conditionArabic: string;
    icon: string;
    irrigationRecommendation: 'recommended' | 'not_needed' | 'postpone';
    farmingAdvice: string;
    farmingAdviceArabic: string;
  }>;
  alerts: Array<{
    type: 'storm' | 'frost' | 'drought' | 'flood' | 'hail' | 'extreme_heat';
    typeArabic: string;
    severity: 'watch' | 'warning' | 'emergency';
    message: string;
    messageArabic: string;
    startTime: string;
    endTime: string;
    affectedAreas: string[];
    recommendations: string[];
    recommendationsArabic: string[];
  }>;
}

// بيانات السوق والأسعار
interface MarketData {
  id: string;
  cropName: string;
  cropNameArabic: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  marketTrend: 'rising' | 'falling' | 'stable';
  demand: 'high' | 'medium' | 'low';
  supply: 'high' | 'medium' | 'low';
  qualityPremium: number;
  exportOpportunities: boolean;
  localMarketInfo: {
    averagePrice: number;
    bestBuyingPrice: number;
    bestSellingPrice: number;
    recommendedAction: 'buy' | 'sell' | 'hold';
    reasoning: string;
    reasoningArabic: string;
  };
  forecast: Array<{
    period: string;
    expectedPrice: number;
    confidence: number;
    factors: string[];
    factorsArabic: string[];
  }>;
  lastUpdated: string;
}

// تجهيزات وآلات المزرعة
interface EquipmentStatus {
  id: string;
  name: string;
  nameArabic: string;
  type: 'tractor' | 'irrigation_system' | 'harvester' | 'sprayer' | 'plow' | 'generator' | 'pump';
  typeArabic: string;
  status: 'operational' | 'maintenance_due' | 'under_repair' | 'out_of_service';
  location: string;
  locationArabic: string;
  lastMaintenance: string;
  nextMaintenanceDue: string;
  operatingHours: number;
  fuelLevel?: number;
  batteryLevel?: number;
  efficiency: number;
  maintenanceCost: number;
  alerts: FarmAlert[];
  operator: string;
  operatorArabic: string;
  utilizationRate: number;
}

// الموارد المالية والميزانية
interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  budgetUtilization: number;
  monthlyComparison: {
    revenueChange: number;
    expenseChange: number;
    profitChange: number;
  };
  categoryBreakdown: {
    seeds: number;
    fertilizers: number;
    pesticides: number;
    labor: number;
    equipment: number;
    utilities: number;
    other: number;
  };
  revenueBySource: {
    [cropName: string]: number;
  };
  upcomingExpenses: Array<{
    name: string;
    nameArabic: string;
    amount: number;
    dueDate: string;
    category: string;
    categoryArabic: string;
  }>;
  profitability: {
    [cropName: string]: {
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    };
  };
}

// الموظفين والعمال
interface LaborManagement {
  totalWorkers: number;
  presentToday: number;
  absentToday: number;
  productivity: number;
  workers: Array<{
    id: string;
    name: string;
    nameArabic: string;
    role: string;
    roleArabic: string;
    status: 'present' | 'absent' | 'leave' | 'sick';
    shift: 'morning' | 'afternoon' | 'night';
    location: string;
    locationArabic: string;
    currentTask: string;
    currentTaskArabic: string;
    productivity: number;
    salary: number;
    contactInfo: string;
  }>;
  shifts: Array<{
    shift: string;
    workers: number;
    tasks: string[];
    supervisor: string;
  }>;
  payroll: {
    totalMonthlyCost: number;
    overtime: number;
    bonuses: number;
    deductions: number;
  };
}

class ComprehensiveFarmManagementService {
  private generateMockAlerts(): FarmAlert[] {
    const alertTypes = [
      { type: 'weather', typeArabic: 'طقس' },
      { type: 'disease', typeArabic: 'أمراض' },
      { type: 'irrigation', typeArabic: 'ري' },
      { type: 'task', typeArabic: 'مهام' },
      { type: 'market', typeArabic: 'سوق' },
      { type: 'emergency', typeArabic: 'طوارئ' },
      { type: 'maintenance', typeArabic: 'صيانة' }
    ];

    return Array.from({ length: 12 }, (_, index) => {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severities: FarmAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      return {
        id: `alert_${String(index + 1).padStart(3, '0')}`,
        type: alertType.type as any,
        typeArabic: alertType.typeArabic,
        title: `${alertType.type.charAt(0).toUpperCase() + alertType.type.slice(1)} Alert ${index + 1}`,
        titleArabic: `تنبيه ${alertType.typeArabic} ${index + 1}`,
        message: `Important ${alertType.type} notification requiring immediate attention`,
        messageArabic: `إشعار هام يتعلق بـ${alertType.typeArabic} يتطلب انتباهاً فورياً`,
        severity,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        location: `Field ${Math.floor(Math.random() * 10) + 1}`,
        locationArabic: `حقل ${Math.floor(Math.random() * 10) + 1}`,
        cropAffected: Math.random() > 0.5 ? 'Wheat' : 'Tomatoes',
        cropAffectedArabic: Math.random() > 0.5 ? 'قمح' : 'طماطم',
        actionRequired: Math.random() > 0.3,
        actionText: severity === 'critical' ? 'Immediate action required' : 'Monitor situation',
        actionTextArabic: severity === 'critical' ? 'مطلوب إجراء فوري' : 'راقب الوضع',
        resolved: Math.random() > 0.7,
        priority: severity === 'critical' ? 5 : severity === 'high' ? 4 : severity === 'medium' ? 3 : 2,
        estimatedImpact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
      };
    });
  }

  private generateMockTasks(): FarmTask[] {
    const categories = [
      { type: 'irrigation', typeArabic: 'ري' },
      { type: 'fertilization', typeArabic: 'تسميد' },
      { type: 'pest_control', typeArabic: 'مكافحة الآفات' },
      { type: 'harvesting', typeArabic: 'حصاد' },
      { type: 'planting', typeArabic: 'زراعة' },
      { type: 'maintenance', typeArabic: 'صيانة' },
      { type: 'monitoring', typeArabic: 'مراقبة' }
    ];

    return Array.from({ length: 20 }, (_, index) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const priorities: FarmTask['priority'][] = ['low', 'medium', 'high', 'urgent'];
      const statuses: FarmTask['status'][] = ['pending', 'in_progress', 'completed', 'overdue'];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        id: `task_${String(index + 1).padStart(3, '0')}`,
        title: `${category.type.replace('_', ' ').toUpperCase()} Task ${index + 1}`,
        titleArabic: `مهمة ${category.typeArabic} ${index + 1}`,
        description: `Detailed description for ${category.type} task`,
        descriptionArabic: `وصف تفصيلي لمهمة ${category.typeArabic}`,
        category: category.type as any,
        categoryArabic: category.typeArabic,
        priority,
        status,
        assignedTo: `Worker ${Math.floor(Math.random() * 5) + 1}`,
        assignedToArabic: `عامل ${Math.floor(Math.random() * 5) + 1}`,
        createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: Math.floor(Math.random() * 240) + 30, // 30-270 دقيقة
        location: `Field ${Math.floor(Math.random() * 8) + 1}`,
        locationArabic: `حقل ${Math.floor(Math.random() * 8) + 1}`,
        cropInvolved: Math.random() > 0.5 ? 'Wheat' : 'Tomatoes',
        cropInvolvedArabic: Math.random() > 0.5 ? 'قمح' : 'طماطم',
        requiredMaterials: ['Tools', 'Water', 'Fertilizer'].slice(0, Math.floor(Math.random() * 3) + 1),
        requiredMaterialsArabic: ['أدوات', 'مياه', 'سماد'].slice(0, Math.floor(Math.random() * 3) + 1),
        instructions: 'Follow standard procedures for safety and efficiency',
        instructionsArabic: 'اتبع الإجراءات المعيارية للأمان والكفاءة',
        weatherDependent: Math.random() > 0.6,
        cost: Math.floor(Math.random() * 500) + 50,
        recurringTask: Math.random() > 0.7,
        recurringInterval: Math.random() > 0.5 ? 'weekly' : 'monthly'
      };
    });
  }

  private generateMockCropStatus(): CropStatus[] {
    const crops = [
      { name: 'Wheat', nameArabic: 'قمح' },
      { name: 'Tomatoes', nameArabic: 'طماطم' },
      { name: 'Olives', nameArabic: 'زيتون' },
      { name: 'Citrus', nameArabic: 'حمضيات' },
      { name: 'Dates', nameArabic: 'تمر' },
      { name: 'Barley', nameArabic: 'شعير' }
    ];

    return Array.from({ length: 8 }, (_, index) => {
      const crop = crops[Math.floor(Math.random() * crops.length)];
      const healthStatuses: CropStatus['healthStatus'][] = ['excellent', 'good', 'fair', 'poor', 'critical'];
      const healthStatus = healthStatuses[Math.floor(Math.random() * healthStatuses.length)];
      const healthScore = healthStatus === 'excellent' ? 90 + Math.random() * 10 :
                         healthStatus === 'good' ? 70 + Math.random() * 20 :
                         healthStatus === 'fair' ? 50 + Math.random() * 20 :
                         healthStatus === 'poor' ? 30 + Math.random() * 20 : Math.random() * 30;

      return {
        id: `crop_${String(index + 1).padStart(3, '0')}`,
        name: crop.name,
        nameArabic: crop.nameArabic,
        variety: 'Local Variety',
        varietyArabic: 'صنف محلي',
        area: Math.round((Math.random() * 5 + 1) * 10) / 10,
        location: `Field ${index + 1}`,
        locationArabic: `حقل ${index + 1}`,
        plantingDate: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString(),
        expectedHarvestDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        currentGrowthStage: ['Germination', 'Vegetative', 'Flowering', 'Maturity'][Math.floor(Math.random() * 4)],
        currentGrowthStageArabic: ['إنبات', 'نمو خضري', 'إزهار', 'نضج'][Math.floor(Math.random() * 4)],
        healthStatus,
        healthScore: Math.round(healthScore),
        soilMoisture: Math.round(Math.random() * 100),
        soilTemperature: Math.round(15 + Math.random() * 20),
        irrigationStatus: ['adequate', 'needs_irrigation', 'over_irrigated'][Math.floor(Math.random() * 3)] as any,
        lastIrrigation: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextIrrigationDue: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        fertilizerStatus: ['adequate', 'needs_fertilizer', 'over_fertilized'][Math.floor(Math.random() * 3)] as any,
        lastFertilization: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextFertilizationDue: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        pestStatus: ['none', 'minor', 'moderate', 'severe'][Math.floor(Math.random() * 4)] as any,
        diseaseStatus: ['none', 'minor', 'moderate', 'severe'][Math.floor(Math.random() * 4)] as any,
        yieldProjection: Math.floor(Math.random() * 5000) + 1000,
        marketValue: Math.floor(Math.random() * 10000) + 5000,
        profitMargin: Math.round((Math.random() * 50 + 10) * 10) / 10,
        alerts: this.generateMockAlerts().slice(0, Math.floor(Math.random() * 4)),
        tasks: this.generateMockTasks().slice(0, Math.floor(Math.random() * 5)),
        notes: `Crop monitoring notes for ${crop.name}`,
        notesArabic: `ملاحظات مراقبة محصول ${crop.nameArabic}`
      };
    });
  }

  private generateMockWeatherData(): WeatherData {
    const conditions = [
      { en: 'Sunny', ar: 'مشمس' },
      { en: 'Partly Cloudy', ar: 'غائم جزئياً' },
      { en: 'Cloudy', ar: 'غائم' },
      { en: 'Rainy', ar: 'ممطر' },
      { en: 'Clear', ar: 'صافي' }
    ];

    const currentCondition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      current: {
        temperature: Math.round(15 + Math.random() * 20),
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(Math.random() * 25),
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        pressure: Math.round(1000 + Math.random() * 50),
        visibility: Math.round(5 + Math.random() * 15),
        uvIndex: Math.floor(Math.random() * 11),
        condition: currentCondition.en,
        conditionArabic: currentCondition.ar,
        icon: 'weather-icon.png',
        lastUpdated: new Date().toISOString()
      },
      forecast: Array.from({ length: 7 }, (_, index) => {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return {
          date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          minTemp: Math.round(10 + Math.random() * 15),
          maxTemp: Math.round(20 + Math.random() * 15),
          humidity: Math.round(30 + Math.random() * 50),
          precipitation: Math.round(Math.random() * 20),
          precipitationChance: Math.round(Math.random() * 100),
          windSpeed: Math.round(Math.random() * 30),
          condition: condition.en,
          conditionArabic: condition.ar,
          icon: 'forecast-icon.png',
          irrigationRecommendation: ['recommended', 'not_needed', 'postpone'][Math.floor(Math.random() * 3)] as any,
          farmingAdvice: 'Check soil moisture before irrigation',
          farmingAdviceArabic: 'تحقق من رطوبة التربة قبل الري'
        };
      }),
      alerts: Math.random() > 0.7 ? [
        {
          type: ['storm', 'frost', 'drought', 'extreme_heat'][Math.floor(Math.random() * 4)] as any,
          typeArabic: ['عاصفة', 'صقيع', 'جفاف', 'حر شديد'][Math.floor(Math.random() * 4)],
          severity: ['watch', 'warning', 'emergency'][Math.floor(Math.random() * 3)] as any,
          message: 'Weather alert - take necessary precautions',
          messageArabic: 'تنبيه جوي - اتخذ الاحتياطات اللازمة',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          affectedAreas: ['North Field', 'South Field'],
          recommendations: ['Secure equipment', 'Check irrigation systems'],
          recommendationsArabic: ['أمّن المعدات', 'تحقق من أنظمة الري']
        }
      ] : []
    };
  }

  private generateMockMarketData(): MarketData[] {
    const crops = [
      { name: 'Wheat', nameArabic: 'قمح' },
      { name: 'Tomatoes', nameArabic: 'طماطم' },
      { name: 'Olives', nameArabic: 'زيتون' },
      { name: 'Citrus', nameArabic: 'حمضيات' },
      { name: 'Dates', nameArabic: 'تمر' }
    ];

    return crops.map((crop, index) => {
      const currentPrice = Math.round((Math.random() * 50 + 10) * 100) / 100;
      const previousPrice = Math.round((currentPrice + (Math.random() - 0.5) * 5) * 100) / 100;
      const priceChange = Math.round((currentPrice - previousPrice) * 100) / 100;

      return {
        id: `market_${String(index + 1).padStart(3, '0')}`,
        cropName: crop.name,
        cropNameArabic: crop.nameArabic,
        currentPrice,
        previousPrice,
        priceChange,
        priceChangePercent: Math.round((priceChange / previousPrice) * 100 * 100) / 100,
        marketTrend: priceChange > 0 ? 'rising' : priceChange < 0 ? 'falling' : 'stable',
        demand: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        supply: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        qualityPremium: Math.round(Math.random() * 20),
        exportOpportunities: Math.random() > 0.5,
        localMarketInfo: {
          averagePrice: Math.round((currentPrice + (Math.random() - 0.5) * 2) * 100) / 100,
          bestBuyingPrice: Math.round((currentPrice - Math.random() * 2) * 100) / 100,
          bestSellingPrice: Math.round((currentPrice + Math.random() * 3) * 100) / 100,
          recommendedAction: ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)] as any,
          reasoning: 'Market analysis suggests favorable conditions',
          reasoningArabic: 'تحليل السوق يشير إلى ظروف مناسبة'
        },
        forecast: Array.from({ length: 4 }, (_, weekIndex) => ({
          period: `Week ${weekIndex + 1}`,
          expectedPrice: Math.round((currentPrice + (Math.random() - 0.5) * 5) * 100) / 100,
          confidence: Math.round(70 + Math.random() * 30),
          factors: ['Weather conditions', 'Supply chain', 'Demand fluctuation'],
          factorsArabic: ['الظروف الجوية', 'سلسلة التوريد', 'تقلبات الطلب']
        })),
        lastUpdated: new Date().toISOString()
      };
    });
  }

  private generateMockEquipment(): EquipmentStatus[] {
    const equipmentTypes = [
      { type: 'tractor', typeArabic: 'جرار' },
      { type: 'irrigation_system', typeArabic: 'نظام ري' },
      { type: 'harvester', typeArabic: 'حاصدة' },
      { type: 'sprayer', typeArabic: 'رشاش' },
      { type: 'plow', typeArabic: 'محراث' },
      { type: 'generator', typeArabic: 'مولد' },
      { type: 'pump', typeArabic: 'مضخة' }
    ];

    return Array.from({ length: 12 }, (_, index) => {
      const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
      const statuses: EquipmentStatus['status'][] = ['operational', 'maintenance_due', 'under_repair', 'out_of_service'];

      return {
        id: `equip_${String(index + 1).padStart(3, '0')}`,
        name: `${equipment.type.replace('_', ' ')} ${index + 1}`,
        nameArabic: `${equipment.typeArabic} ${index + 1}`,
        type: equipment.type as any,
        typeArabic: equipment.typeArabic,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        location: `Warehouse ${Math.floor(Math.random() * 3) + 1}`,
        locationArabic: `مستودع ${Math.floor(Math.random() * 3) + 1}`,
        lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextMaintenanceDue: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        operatingHours: Math.floor(Math.random() * 2000) + 100,
        fuelLevel: equipment.type === 'tractor' || equipment.type === 'harvester' ? Math.floor(Math.random() * 100) : undefined,
        batteryLevel: equipment.type === 'generator' ? Math.floor(Math.random() * 100) : undefined,
        efficiency: Math.round(70 + Math.random() * 30),
        maintenanceCost: Math.floor(Math.random() * 1000) + 200,
        alerts: this.generateMockAlerts().slice(0, Math.floor(Math.random() * 2)),
        operator: `Operator ${Math.floor(Math.random() * 5) + 1}`,
        operatorArabic: `مشغل ${Math.floor(Math.random() * 5) + 1}`,
        utilizationRate: Math.round(60 + Math.random() * 40)
      };
    });
  }

  private generateMockFinancialSummary(): FinancialSummary {
    const totalRevenue = Math.floor(Math.random() * 50000) + 25000;
    const totalExpenses = Math.floor(totalRevenue * (0.6 + Math.random() * 0.3));
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: Math.round((netProfit / totalRevenue) * 100 * 100) / 100,
      cashFlow: Math.floor(Math.random() * 20000) + 5000,
      budgetUtilization: Math.round(60 + Math.random() * 35),
      monthlyComparison: {
        revenueChange: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
        expenseChange: Math.round((Math.random() - 0.5) * 15 * 100) / 100,
        profitChange: Math.round((Math.random() - 0.5) * 30 * 100) / 100
      },
      categoryBreakdown: {
        seeds: Math.floor(totalExpenses * 0.15),
        fertilizers: Math.floor(totalExpenses * 0.20),
        pesticides: Math.floor(totalExpenses * 0.10),
        labor: Math.floor(totalExpenses * 0.25),
        equipment: Math.floor(totalExpenses * 0.15),
        utilities: Math.floor(totalExpenses * 0.10),
        other: Math.floor(totalExpenses * 0.05)
      },
      revenueBySource: {
        'Wheat': Math.floor(totalRevenue * 0.30),
        'Tomatoes': Math.floor(totalRevenue * 0.25),
        'Olives': Math.floor(totalRevenue * 0.20),
        'Citrus': Math.floor(totalRevenue * 0.15),
        'Other': Math.floor(totalRevenue * 0.10)
      },
      upcomingExpenses: [
        {
          name: 'Fertilizer Purchase',
          nameArabic: 'شراء سماد',
          amount: 2500,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Fertilizers',
          categoryArabic: 'أسمدة'
        },
        {
          name: 'Equipment Maintenance',
          nameArabic: 'صيانة المعدات',
          amount: 1200,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Equipment',
          categoryArabic: 'معدات'
        }
      ],
      profitability: {
        'Wheat': { revenue: 15000, cost: 10000, profit: 5000, margin: 33.3 },
        'Tomatoes': { revenue: 12500, cost: 8000, profit: 4500, margin: 36.0 },
        'Olives': { revenue: 10000, cost: 6500, profit: 3500, margin: 35.0 },
        'Citrus': { revenue: 7500, cost: 5000, profit: 2500, margin: 33.3 }
      }
    };
  }

  private generateMockLaborManagement(): LaborManagement {
    const totalWorkers = 15;
    const presentToday = Math.floor(totalWorkers * (0.8 + Math.random() * 0.2));
    const absentToday = totalWorkers - presentToday;

    return {
      totalWorkers,
      presentToday,
      absentToday,
      productivity: Math.round(75 + Math.random() * 20),
      workers: Array.from({ length: totalWorkers }, (_, index) => ({
        id: `worker_${String(index + 1).padStart(3, '0')}`,
        name: `Worker ${index + 1}`,
        nameArabic: `عامل ${index + 1}`,
        role: ['Field Worker', 'Equipment Operator', 'Supervisor', 'Specialist'][Math.floor(Math.random() * 4)],
        roleArabic: ['عامل حقل', 'مشغل معدات', 'مشرف', 'أخصائي'][Math.floor(Math.random() * 4)],
        status: index < presentToday ? 'present' : ['absent', 'leave', 'sick'][Math.floor(Math.random() * 3)] as any,
        shift: ['morning', 'afternoon', 'night'][Math.floor(Math.random() * 3)] as any,
        location: `Field ${Math.floor(Math.random() * 5) + 1}`,
        locationArabic: `حقل ${Math.floor(Math.random() * 5) + 1}`,
        currentTask: index < presentToday ? 'Irrigation maintenance' : '',
        currentTaskArabic: index < presentToday ? 'صيانة الري' : '',
        productivity: Math.round(70 + Math.random() * 30),
        salary: Math.floor(Math.random() * 1000) + 800,
        contactInfo: `+216 ${Math.floor(Math.random() * 100000000)}`
      })),
      shifts: [
        { shift: 'morning', workers: Math.floor(presentToday * 0.5), tasks: ['Irrigation', 'Planting'], supervisor: 'Supervisor A' },
        { shift: 'afternoon', workers: Math.floor(presentToday * 0.3), tasks: ['Harvesting', 'Maintenance'], supervisor: 'Supervisor B' },
        { shift: 'night', workers: Math.floor(presentToday * 0.2), tasks: ['Security', 'Equipment monitoring'], supervisor: 'Supervisor C' }
      ],
      payroll: {
        totalMonthlyCost: totalWorkers * 850,
        overtime: Math.floor(Math.random() * 2000) + 500,
        bonuses: Math.floor(Math.random() * 1500) + 300,
        deductions: Math.floor(Math.random() * 1000) + 200
      }
    };
  }

  getDashboardOverview(): any {
    return {
      success: true,
      data: {
        alerts: this.generateMockAlerts().slice(0, 8),
        tasks: this.generateMockTasks().slice(0, 10),
        crops: this.generateMockCropStatus().slice(0, 6),
        weather: this.generateMockWeatherData(),
        market: this.generateMockMarketData().slice(0, 5),
        equipment: this.generateMockEquipment().slice(0, 6),
        financial: this.generateMockFinancialSummary(),
        labor: this.generateMockLaborManagement(),
        summary: {
          totalFields: 8,
          activeCrops: 6,
          pendingTasks: this.generateMockTasks().filter(t => t.status === 'pending').length,
          criticalAlerts: this.generateMockAlerts().filter(a => a.severity === 'critical').length,
          operationalEquipment: this.generateMockEquipment().filter(e => e.status === 'operational').length,
          workersPresent: this.generateMockLaborManagement().presentToday,
          todayRevenue: Math.floor(Math.random() * 2000) + 500,
          weatherCondition: this.generateMockWeatherData().current.condition,
          weatherConditionArabic: this.generateMockWeatherData().current.conditionArabic,
          irrigationNeeded: Math.floor(Math.random() * 3) + 1,
          maintenanceDue: this.generateMockEquipment().filter(e => e.status === 'maintenance_due').length
        },
        lastUpdated: new Date().toISOString()
      }
    };
  }

  getDetailedAlerts(): any {
    return {
      success: true,
      data: this.generateMockAlerts()
    };
  }

  getDetailedTasks(): any {
    return {
      success: true,
      data: this.generateMockTasks()
    };
  }

  getDetailedCrops(): any {
    return {
      success: true,
      data: this.generateMockCropStatus()
    };
  }

  getDetailedWeather(): any {
    return {
      success: true,
      data: this.generateMockWeatherData()
    };
  }

  getDetailedMarket(): any {
    return {
      success: true,
      data: this.generateMockMarketData()
    };
  }

  getDetailedEquipment(): any {
    return {
      success: true,
      data: this.generateMockEquipment()
    };
  }

  getDetailedFinancial(): any {
    return {
      success: true,
      data: this.generateMockFinancialSummary()
    };
  }

  getDetailedLabor(): any {
    return {
      success: true,
      data: this.generateMockLaborManagement()
    };
  }
}

const farmManagementService = new ComprehensiveFarmManagementService();

export const getComprehensiveFarmDashboard: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDashboardOverview();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch farm management dashboard' });
  }
};

export const getFarmAlerts: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedAlerts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch farm alerts' });
  }
};

export const getFarmTasks: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedTasks();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch farm tasks' });
  }
};

export const getFarmCrops: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedCrops();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch farm crops' });
  }
};

export const getFarmWeather: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedWeather();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
  }
};

export const getFarmMarket: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedMarket();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch market data' });
  }
};

export const getFarmEquipment: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedEquipment();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch equipment data' });
  }
};

export const getFarmFinancial: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedFinancial();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch financial data' });
  }
};

export const getFarmLabor: RequestHandler = (req, res) => {
  try {
    const result = farmManagementService.getDetailedLabor();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch labor data' });
  }
};
