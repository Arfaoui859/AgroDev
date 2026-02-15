import express from 'express';

const router = express.Router();

interface Product {
  id: string;
  name: string;
  nameArabic: string;
  category: 'seeds' | 'fertilizers' | 'pesticides' | 'equipment' | 'crops' | 'tools';
  type: 'buying' | 'selling' | 'both';
  currentStock: number;
  unit: string;
  unitArabic: string;
  buyingPrice: number;
  sellingPrice: number;
  profitMargin: number;
  supplier?: string;
  supplierArabic?: string;
  quality: 'premium' | 'standard' | 'basic';
  expiryDate?: string;
  storageLocation: string;
  storageLocationArabic: string;
  demand: 'high' | 'medium' | 'low';
  marketTrend: 'rising' | 'falling' | 'stable';
  lastUpdated: string;
}

interface Order {
  id: string;
  type: 'purchase' | 'sale';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  clientName: string;
  clientNameArabic: string;
  clientType: 'farmer' | 'wholesaler' | 'retailer' | 'supplier';
  products: Array<{
    productId: string;
    productName: string;
    productNameArabic: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentMethod: 'cash' | 'bank_transfer' | 'credit' | 'check';
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  shippingAddress: string;
  shippingAddressArabic: string;
  notes?: string;
  notesArabic?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface MarketOpportunity {
  id: string;
  type: 'buying' | 'selling';
  productCategory: string;
  productCategoryArabic: string;
  description: string;
  descriptionArabic: string;
  quantity: number;
  priceRange: {
    min: number;
    max: number;
  };
  location: string;
  locationArabic: string;
  contactInfo: {
    name: string;
    nameArabic: string;
    phone: string;
    email?: string;
  };
  validUntil: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  quality: string;
  qualityArabic: string;
  verified: boolean;
  source: 'farmer' | 'wholesaler' | 'export' | 'market_analysis';
}

interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  productNameArabic: string;
  alertType: 'low_stock' | 'expiry_warning' | 'demand_spike' | 'price_change' | 'quality_issue';
  message: string;
  messageArabic: string;
  severity: 'info' | 'warning' | 'critical';
  currentStock: number;
  recommendedAction: string;
  recommendedActionArabic: string;
  createdAt: string;
  acknowledged: boolean;
}

interface FinancialSummary {
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  expenses: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  profit: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  profitMargin: number;
  outstandingPayments: number;
  pendingOrders: number;
  cashFlow: number;
  inventoryValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    productNameArabic: string;
    revenue: number;
    quantity: number;
    profitMargin: number;
  }>;
}

interface TraderMetrics {
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  completedOrdersThisMonth: number;
  customerSatisfactionScore: number;
  averageOrderValue: number;
  inventoryTurnover: number;
  marketOpportunities: number;
  supplierRating: number;
  deliverySuccessRate: number;
}

// Mock data generators
const generateMockProducts = (): Product[] => [
  {
    id: 'prod_001',
    name: 'NPK Fertilizer 20-20-20',
    nameArabic: 'سماد NPK 20-20-20',
    category: 'fertilizers',
    type: 'both',
    currentStock: 250,
    unit: 'kg',
    unitArabic: 'كيلوغرام',
    buyingPrice: 2.5,
    sellingPrice: 3.2,
    profitMargin: 28,
    supplier: 'AgroTech Tunisia',
    supplierArabic: 'أجروتك تونس',
    quality: 'premium',
    expiryDate: '2025-12-31',
    storageLocation: 'Warehouse A-1',
    storageLocationArabic: 'المستودع أ-1',
    demand: 'high',
    marketTrend: 'rising',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'prod_002',
    name: 'Wheat Seeds - Durum Variety',
    nameArabic: 'بذور القمح - صنف القاسي',
    category: 'seeds',
    type: 'selling',
    currentStock: 15,
    unit: 'bags (50kg)',
    unitArabic: 'كيس (50 كغ)',
    buyingPrice: 45,
    sellingPrice: 58,
    profitMargin: 29,
    supplier: 'National Seeds Company',
    supplierArabic: 'الشركة الوطنية للبذور',
    quality: 'premium',
    storageLocation: 'Cold Storage B-2',
    storageLocationArabic: 'التخزين البارد ب-2',
    demand: 'medium',
    marketTrend: 'stable',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'prod_003',
    name: 'Organic Pesticide - Neem Oil',
    nameArabic: 'مبيد عضوي - زيت النيم',
    category: 'pesticides',
    type: 'both',
    currentStock: 85,
    unit: 'liters',
    unitArabic: 'لتر',
    buyingPrice: 15,
    sellingPrice: 22,
    profitMargin: 47,
    supplier: 'BioProtect Solutions',
    supplierArabic: 'حلول البايو للحماية',
    quality: 'premium',
    expiryDate: '2024-08-15',
    storageLocation: 'Chemical Storage C-1',
    storageLocationArabic: 'تخزين المواد الكيميائية ج-1',
    demand: 'high',
    marketTrend: 'rising',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'prod_004',
    name: 'Fresh Tomatoes - Roma Variety',
    nameArabic: 'طماطم طازجة - صنف روما',
    category: 'crops',
    type: 'buying',
    currentStock: 500,
    unit: 'kg',
    unitArabic: 'كيلوغرام',
    buyingPrice: 1.8,
    sellingPrice: 2.4,
    profitMargin: 33,
    supplier: 'Green Valley Farm',
    supplierArabic: 'مزرعة الوادي الأخضر',
    quality: 'standard',
    storageLocation: 'Refrigerated Storage D-1',
    storageLocationArabic: 'التخزين المبرد د-1',
    demand: 'high',
    marketTrend: 'rising',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'prod_005',
    name: 'Drip Irrigation Kit',
    nameArabic: 'طقم الري بالتنقيط',
    category: 'equipment',
    type: 'selling',
    currentStock: 12,
    unit: 'sets',
    unitArabic: 'طقم',
    buyingPrice: 150,
    sellingPrice: 195,
    profitMargin: 30,
    supplier: 'IrriTech Systems',
    supplierArabic: 'أنظمة إيري تك',
    quality: 'premium',
    storageLocation: 'Equipment Storage E-1',
    storageLocationArabic: 'تخزين المعدات هـ-1',
    demand: 'medium',
    marketTrend: 'stable',
    lastUpdated: new Date().toISOString()
  }
];

const generateMockOrders = (): Order[] => [
  {
    id: 'order_001',
    type: 'sale',
    status: 'confirmed',
    clientName: 'Ahmed Ben Ali',
    clientNameArabic: 'أحمد بن علي',
    clientType: 'farmer',
    products: [
      {
        productId: 'prod_001',
        productName: 'NPK Fertilizer 20-20-20',
        productNameArabic: 'سماد NPK 20-20-20',
        quantity: 50,
        unitPrice: 3.2,
        totalPrice: 160
      }
    ],
    totalAmount: 160,
    paymentStatus: 'pending',
    paymentMethod: 'bank_transfer',
    orderDate: '2024-01-20T09:30:00Z',
    expectedDelivery: '2024-01-25T14:00:00Z',
    shippingAddress: 'Green Valley Farm, Bizerte',
    shippingAddressArabic: 'مزرعة الوادي الأخضر، بنزرت',
    notes: 'Deliver to main storage building',
    notesArabic: 'التسليم إلى مبنى التخزين الرئيسي',
    priority: 'medium'
  },
  {
    id: 'order_002',
    type: 'purchase',
    status: 'processing',
    clientName: 'Fatma Mansouri',
    clientNameArabic: 'فاطمة المنصوري',
    clientType: 'farmer',
    products: [
      {
        productId: 'prod_004',
        productName: 'Fresh Tomatoes - Roma Variety',
        productNameArabic: 'طماطم طازجة - صنف روما',
        quantity: 200,
        unitPrice: 1.8,
        totalPrice: 360
      }
    ],
    totalAmount: 360,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    orderDate: '2024-01-21T11:15:00Z',
    expectedDelivery: '2024-01-22T08:00:00Z',
    shippingAddress: 'Central Market, Tunis',
    shippingAddressArabic: 'السوق المركزي، تونس',
    priority: 'high'
  },
  {
    id: 'order_003',
    type: 'sale',
    status: 'shipped',
    clientName: 'Mohamed Trading Co.',
    clientNameArabic: 'شركة محمد للتجارة',
    clientType: 'wholesaler',
    products: [
      {
        productId: 'prod_002',
        productName: 'Wheat Seeds - Durum Variety',
        productNameArabic: 'بذور القمح - صنف القاسي',
        quantity: 10,
        unitPrice: 58,
        totalPrice: 580
      },
      {
        productId: 'prod_003',
        productName: 'Organic Pesticide - Neem Oil',
        productNameArabic: 'مبيد عضوي - زيت النيم',
        quantity: 25,
        unitPrice: 22,
        totalPrice: 550
      }
    ],
    totalAmount: 1130,
    paymentStatus: 'partial',
    paymentMethod: 'credit',
    orderDate: '2024-01-18T14:45:00Z',
    expectedDelivery: '2024-01-24T10:00:00Z',
    actualDelivery: '2024-01-23T16:30:00Z',
    shippingAddress: 'Wholesale Market, Sousse',
    shippingAddressArabic: 'سوق الجملة، سوسة',
    priority: 'high'
  }
];

const generateMockMarketOpportunities = (): MarketOpportunity[] => [
  {
    id: 'opp_001',
    type: 'buying',
    productCategory: 'Olive Oil',
    productCategoryArabic: 'زيت الزيتون',
    description: 'Premium extra virgin olive oil available for bulk purchase',
    descriptionArabic: 'زيت زيتون بكر ممتاز متوفر للشراء بالجملة',
    quantity: 500,
    priceRange: { min: 28, max: 32 },
    location: 'Sfax, Tunisia',
    locationArabic: 'صفاقس، تونس',
    contactInfo: {
      name: 'Olive Growers Cooperative',
      nameArabic: 'تعاونية مزارعي الزيتون',
      phone: '+216 74 123 456',
      email: 'info@olivecoop.tn'
    },
    validUntil: '2024-02-15T23:59:59Z',
    urgency: 'medium',
    quality: 'Premium Grade A',
    qualityArabic: 'درجة ممتازة أ',
    verified: true,
    source: 'farmer'
  },
  {
    id: 'opp_002',
    type: 'selling',
    productCategory: 'Organic Fertilizers',
    productCategoryArabic: 'أسمدة عضوية',
    description: 'High demand for organic fertilizers in Bizerte region',
    descriptionArabic: 'طلب عالي على الأسمدة العضوية في منطقة بنزرت',
    quantity: 1000,
    priceRange: { min: 4.5, max: 6.2 },
    location: 'Bizerte, Tunisia',
    locationArabic: 'بنزرت، تونس',
    contactInfo: {
      name: 'Agricultural Supplies Network',
      nameArabic: 'شبكة اللوازم الزراعية',
      phone: '+216 72 987 654',
      email: 'orders@agrisupply.tn'
    },
    validUntil: '2024-01-30T23:59:59Z',
    urgency: 'high',
    quality: 'Certified Organic',
    qualityArabic: 'عضوي معتمد',
    verified: true,
    source: 'market_analysis'
  },
  {
    id: 'opp_003',
    type: 'buying',
    productCategory: 'Fresh Citrus',
    productCategoryArabic: 'حمضيات طازجة',
    description: 'Export opportunity for fresh oranges and lemons to Europe',
    descriptionArabic: 'فرصة تصدير للبرتقال والليمون الطازج إلى أوروبا',
    quantity: 2000,
    priceRange: { min: 1.2, max: 1.8 },
    location: 'Nabeul, Tunisia',
    locationArabic: 'نابل، تونس',
    contactInfo: {
      name: 'Mediterranean Export Ltd.',
      nameArabic: 'شركة التصدير المتوسطي المحدودة',
      phone: '+216 72 555 888'
    },
    validUntil: '2024-02-05T23:59:59Z',
    urgency: 'urgent',
    quality: 'Export Grade',
    qualityArabic: 'درجة التصدير',
    verified: true,
    source: 'export'
  }
];

const generateMockInventoryAlerts = (): InventoryAlert[] => [
  {
    id: 'alert_001',
    productId: 'prod_002',
    productName: 'Wheat Seeds - Durum Variety',
    productNameArabic: 'بذور القمح - صنف القاسي',
    alertType: 'low_stock',
    message: 'Stock level below minimum threshold (20 bags)',
    messageArabic: 'مستوى المخزون أقل من الحد الأدنى (20 كيس)',
    severity: 'warning',
    currentStock: 15,
    recommendedAction: 'Reorder 50 bags from supplier',
    recommendedActionArabic: 'إعادة طلب 50 كيس من المورد',
    createdAt: '2024-01-21T08:00:00Z',
    acknowledged: false
  },
  {
    id: 'alert_002',
    productId: 'prod_003',
    productName: 'Organic Pesticide - Neem Oil',
    productNameArabic: 'مبيد عضوي - زيت النيم',
    alertType: 'expiry_warning',
    message: 'Product expires in 30 days',
    messageArabic: 'ينتهي صلاحية المنتج خلال 30 يوماً',
    severity: 'warning',
    currentStock: 85,
    recommendedAction: 'Promote sales or offer discount',
    recommendedActionArabic: 'الترويج للمبيعات أو تقديم خصم',
    createdAt: '2024-01-21T10:30:00Z',
    acknowledged: false
  },
  {
    id: 'alert_003',
    productId: 'prod_004',
    productName: 'Fresh Tomatoes - Roma Variety',
    productNameArabic: 'طماطم طازجة - صنف روما',
    alertType: 'demand_spike',
    message: 'Unusual high demand detected - consider price adjustment',
    messageArabic: 'تم رصد طلب عالي غير عادي - فكر في تعديل السعر',
    severity: 'info',
    currentStock: 500,
    recommendedAction: 'Increase selling price by 10-15%',
    recommendedActionArabic: 'زيادة سعر البيع بنسبة 10-15%',
    createdAt: '2024-01-21T12:15:00Z',
    acknowledged: true
  }
];

const generateMockFinancialSummary = (): FinancialSummary => ({
  revenue: {
    daily: 2450,
    weekly: 16800,
    monthly: 68500,
    yearly: 820000
  },
  expenses: {
    daily: 1680,
    weekly: 11400,
    monthly: 46200,
    yearly: 555000
  },
  profit: {
    daily: 770,
    weekly: 5400,
    monthly: 22300,
    yearly: 265000
  },
  profitMargin: 32.3,
  outstandingPayments: 15600,
  pendingOrders: 8,
  cashFlow: 48900,
  inventoryValue: 125000,
  topProducts: [
    {
      productId: 'prod_001',
      productName: 'NPK Fertilizer 20-20-20',
      productNameArabic: 'سماد NPK 20-20-20',
      revenue: 18600,
      quantity: 580,
      profitMargin: 28
    },
    {
      productId: 'prod_004',
      productName: 'Fresh Tomatoes - Roma Variety',
      productNameArabic: 'طماطم طازجة - صنف روما',
      revenue: 12800,
      quantity: 5300,
      profitMargin: 33
    }
  ]
});

const generateMockTraderMetrics = (): TraderMetrics => ({
  totalProducts: 156,
  lowStockProducts: 8,
  pendingOrders: 12,
  completedOrdersThisMonth: 67,
  customerSatisfactionScore: 4.6,
  averageOrderValue: 485,
  inventoryTurnover: 6.8,
  marketOpportunities: 23,
  supplierRating: 4.4,
  deliverySuccessRate: 94.2
});

// API Routes

// Get trader dashboard overview
router.get('/overview', (req, res) => {
  try {
    const products = generateMockProducts();
    const orders = generateMockOrders();
    const opportunities = generateMockMarketOpportunities();
    const alerts = generateMockInventoryAlerts();
    const financialSummary = generateMockFinancialSummary();
    const metrics = generateMockTraderMetrics();

    const dashboardData = {
      summary: {
        totalProducts: products.length,
        lowStockAlerts: alerts.filter(a => a.alertType === 'low_stock' && !a.acknowledged).length,
        pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
        dailyRevenue: financialSummary.revenue.daily,
        profitMargin: financialSummary.profitMargin,
        marketOpportunities: opportunities.length,
        outstandingPayments: financialSummary.outstandingPayments,
        inventoryValue: financialSummary.inventoryValue
      },
      recentOrders: orders.slice(0, 5),
      urgentAlerts: alerts.filter(a => a.severity === 'critical' || !a.acknowledged).slice(0, 3),
      topOpportunities: opportunities.filter(o => o.urgency === 'high' || o.urgency === 'urgent').slice(0, 3),
      metrics,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData,
      message: 'Trader dashboard data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving trader dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get inventory/products
router.get('/inventory', (req, res) => {
  try {
    const products = generateMockProducts();
    const { category, type, demand, stock_level } = req.query;

    let filteredProducts = products;

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    if (type) {
      filteredProducts = filteredProducts.filter(p => p.type === type || p.type === 'both');
    }

    if (demand) {
      filteredProducts = filteredProducts.filter(p => p.demand === demand);
    }

    if (stock_level === 'low') {
      filteredProducts = filteredProducts.filter(p => p.currentStock < 50); // Arbitrary threshold
    }

    res.json({
      success: true,
      data: filteredProducts,
      message: 'Inventory data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get orders
router.get('/orders', (req, res) => {
  try {
    const orders = generateMockOrders();
    const { type, status, client_type, date_from, date_to } = req.query;

    let filteredOrders = orders;

    if (type) {
      filteredOrders = filteredOrders.filter(o => o.type === type);
    }

    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status);
    }

    if (client_type) {
      filteredOrders = filteredOrders.filter(o => o.clientType === client_type);
    }

    if (date_from) {
      filteredOrders = filteredOrders.filter(o => new Date(o.orderDate) >= new Date(date_from as string));
    }

    if (date_to) {
      filteredOrders = filteredOrders.filter(o => new Date(o.orderDate) <= new Date(date_to as string));
    }

    res.json({
      success: true,
      data: filteredOrders,
      message: 'Orders data retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving orders data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new order
router.post('/orders', (req, res) => {
  try {
    const {
      type,
      clientName,
      clientNameArabic,
      clientType,
      products,
      paymentMethod,
      expectedDelivery,
      shippingAddress,
      shippingAddressArabic,
      notes,
      notesArabic,
      priority
    } = req.body;

    const totalAmount = products.reduce((sum: number, p: any) => sum + p.totalPrice, 0);

    const newOrder: Order = {
      id: `order_${Date.now()}`,
      type,
      status: 'pending',
      clientName,
      clientNameArabic,
      clientType,
      products,
      totalAmount,
      paymentStatus: 'pending',
      paymentMethod,
      orderDate: new Date().toISOString(),
      expectedDelivery,
      shippingAddress,
      shippingAddressArabic,
      notes,
      notesArabic,
      priority: priority || 'medium'
    };

    // In a real implementation, save to database
    res.json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update order status
router.put('/orders/:orderId/status', (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    // In a real implementation, update the order in the database
    res.json({
      success: true,
      data: { orderId, status, notes, updatedAt: new Date().toISOString() },
      message: 'Order status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market opportunities
router.get('/market-opportunities', (req, res) => {
  try {
    const opportunities = generateMockMarketOpportunities();
    const { type, urgency, location, verified } = req.query;

    let filteredOpportunities = opportunities;

    if (type) {
      filteredOpportunities = filteredOpportunities.filter(o => o.type === type);
    }

    if (urgency) {
      filteredOpportunities = filteredOpportunities.filter(o => o.urgency === urgency);
    }

    if (location) {
      filteredOpportunities = filteredOpportunities.filter(o => 
        o.location.toLowerCase().includes((location as string).toLowerCase()) ||
        o.locationArabic.includes(location as string)
      );
    }

    if (verified !== undefined) {
      const isVerified = verified === 'true';
      filteredOpportunities = filteredOpportunities.filter(o => o.verified === isVerified);
    }

    res.json({
      success: true,
      data: filteredOpportunities,
      message: 'Market opportunities retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving market opportunities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get inventory alerts
router.get('/alerts', (req, res) => {
  try {
    const alerts = generateMockInventoryAlerts();
    const { type, severity, acknowledged } = req.query;

    let filteredAlerts = alerts;

    if (type) {
      filteredAlerts = filteredAlerts.filter(a => a.alertType === type);
    }

    if (severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
    }

    if (acknowledged !== undefined) {
      const isAcknowledged = acknowledged === 'true';
      filteredAlerts = filteredAlerts.filter(a => a.acknowledged === isAcknowledged);
    }

    res.json({
      success: true,
      data: filteredAlerts,
      message: 'Inventory alerts retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Acknowledge alert
router.put('/alerts/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params;
    const { action_taken } = req.body;

    // In a real implementation, update the alert in the database
    res.json({
      success: true,
      data: { alertId, acknowledged: true, acknowledgedAt: new Date().toISOString(), action_taken },
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get financial summary
router.get('/financial-summary', (req, res) => {
  try {
    const financialSummary = generateMockFinancialSummary();
    const { period } = req.query;

    let data = financialSummary;

    if (period) {
      // In a real implementation, filter data by period
      // For now, return the same data
    }

    res.json({
      success: true,
      data,
      message: 'Financial summary retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving financial summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get trader metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = generateMockTraderMetrics();

    res.json({
      success: true,
      data: metrics,
      message: 'Trader metrics retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving trader metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
