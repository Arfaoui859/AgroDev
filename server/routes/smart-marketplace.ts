import { RequestHandler } from "express";

// Sample marketplace data
const mockListings = [
  {
    id: 'listing_1',
    sellerId: 'seller_1',
    sellerName: 'مزرعة أحمد التونسي',
    sellerRating: 4.8,
    sellerLocation: 'صفاقس',
    sellerType: 'farmer',
    productName: 'Tomatoes',
    productNameAr: 'طماطم',
    category: 'vegetables',
    variety: 'طماطم كرزية',
    quantity: 500,
    unit: 'كغ',
    pricePerUnit: 2.5,
    totalValue: 1250,
    currency: 'TND',
    qualityGrade: 'A',
    organic: true,
    harvestDate: '2024-02-20',
    expiryDate: '2024-02-27',
    location: {
      governorate: 'صفاقس',
      city: 'صفاقس المدينة',
      coordinates: [34.7406, 10.7603]
    },
    images: ['tomato1.jpg', 'tomato2.jpg'],
    description: 'طماطم طازجة عالية الجودة',
    descriptionAr: 'طماطم طازجة عالية الجودة مزروعة بطرق عضوية',
    certifications: ['عضوي', 'ISO 9001'],
    status: 'active',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-22',
    views: 156,
    inquiries: 12,
    isFeatured: true,
    negotiations: {
      enabled: true,
      minPrice: 2.0,
      autoAcceptPrice: 2.3
    },
    logistics: {
      deliveryAvailable: true,
      pickupAvailable: true,
      shippingCost: 15,
      processingTime: 24
    }
  },
  {
    id: 'listing_2',
    sellerId: 'seller_2',
    sellerName: 'تعاونية المنستير الزراعية',
    sellerRating: 4.6,
    sellerLocation: 'المنستير',
    sellerType: 'cooperative',
    productName: 'Olive Oil',
    productNameAr: 'زيت زيتون',
    category: 'fruits',
    variety: 'زيت زيتون بكر ممتاز',
    quantity: 200,
    unit: 'لتر',
    pricePerUnit: 8.5,
    totalValue: 1700,
    currency: 'TND',
    qualityGrade: 'A',
    organic: false,
    harvestDate: '2024-01-15',
    expiryDate: '2025-01-15',
    location: {
      governorate: 'المنستير',
      city: 'المنستير',
      coordinates: [35.7643, 10.8113]
    },
    images: ['olive1.jpg'],
    description: 'زيت زيتون عالي الجودة',
    descriptionAr: 'زيت زيتون بكر ممتاز من أشجار تونسية أصيلة',
    certifications: ['FDA', 'CE'],
    status: 'active',
    createdAt: '2024-02-18',
    updatedAt: '2024-02-22',
    views: 234,
    inquiries: 18,
    isFeatured: false,
    negotiations: {
      enabled: true,
      minPrice: 7.5,
      autoAcceptPrice: 8.0
    },
    logistics: {
      deliveryAvailable: true,
      pickupAvailable: true,
      shippingCost: 25,
      processingTime: 48
    }
  }
];

const mockInquiries = [
  {
    id: 'inquiry_1',
    buyerId: 'buyer_1',
    buyerName: 'مطعم البحر المتوسط',
    buyerType: 'restaurant',
    listingId: 'listing_1',
    quantity: 50,
    proposedPrice: 2.2,
    message: 'نحتاج كمية منتظمة أسبوعياً، هل يمكن ترتيب عقد توريد؟',
    status: 'pending',
    createdAt: '2024-02-22T10:30:00Z',
    responses: [
      {
        id: 'response_1',
        senderId: 'seller_1',
        senderType: 'seller',
        message: 'أهلاً وسهلاً، يمكننا ترتيب التوريد الأسبوعي. السعر المقترح مقبول.',
        proposedPrice: 2.2,
        timestamp: '2024-02-22T11:15:00Z'
      }
    ]
  },
  {
    id: 'inquiry_2',
    buyerId: 'buyer_2',
    buyerName: 'شركة الأغذية المتحدة',
    buyerType: 'processor',
    listingId: 'listing_2',
    quantity: 100,
    proposedPrice: 8.0,
    message: 'مهتمون بكمية كبيرة، هل يمكن تقديم خصم؟',
    status: 'negotiating',
    createdAt: '2024-02-21T14:20:00Z',
    responses: [
      {
        id: 'response_2',
        senderId: 'seller_2',
        senderType: 'seller',
        message: 'يمكننا تقديم سعر 8.2 دينار للكمية المطلوبة مع الشحن المجاني',
        proposedPrice: 8.2,
        timestamp: '2024-02-21T16:45:00Z'
      }
    ]
  }
];

const mockAnalytics = {
  totalListings: 1247,
  activeListings: 892,
  totalValue: 2450000,
  averagePrice: 5.8,
  topCategories: [
    { category: 'vegetables', categoryAr: 'خضروات', count: 340, value: 850000, trend: 'up' },
    { category: 'fruits', categoryAr: 'فواكه', count: 285, value: 720000, trend: 'up' },
    { category: 'grains', categoryAr: 'حبوب', count: 156, value: 450000, trend: 'stable' },
    { category: 'dairy', categoryAr: 'منتجات الألبان', count: 78, value: 280000, trend: 'down' },
    { category: 'livestock', categoryAr: 'ثروة حيوانية', count: 33, value: 150000, trend: 'up' }
  ],
  topRegions: [
    { region: 'صفاقس', listings: 234, value: 580000 },
    { region: 'سوسة', listings: 189, value: 420000 },
    { region: 'القيروان', listings: 156, value: 380000 },
    { region: 'قابس', listings: 123, value: 290000 },
    { region: 'بنزرت', listings: 98, value: 245000 }
  ],
  priceHistory: [
    { product: 'طماطم', date: '2024-02-01', price: 2.8 },
    { product: 'طماطم', date: '2024-02-08', price: 2.6 },
    { product: 'طماطم', date: '2024-02-15', price: 2.4 },
    { product: 'طماطم', date: '2024-02-22', price: 2.5 }
  ],
  marketTrends: {
    weeklyGrowth: 8.5,
    monthlyGrowth: 18.2,
    topGrowing: ['طماطم كرزية', 'زيت زيتون', 'لوز'],
    declining: ['برتقال', 'بطاطس']
  }
};

const mockSupplyChainNodes = [
  {
    id: 'node_1',
    type: 'farm',
    name: 'مزرعة الأمل',
    location: 'صفاقس',
    coordinates: [34.7406, 10.7603],
    status: 'active',
    capacity: 10000,
    utilization: 75,
    lastUpdate: '2024-02-22T12:00:00Z'
  },
  {
    id: 'node_2',
    type: 'warehouse',
    name: 'مستودع الوسط',
    location: 'سوسة',
    coordinates: [35.8256, 10.6411],
    status: 'active',
    capacity: 50000,
    utilization: 60,
    lastUpdate: '2024-02-22T11:30:00Z'
  },
  {
    id: 'node_3',
    type: 'distribution',
    name: 'مركز التوزيع الشمالي',
    location: 'تونس',
    coordinates: [36.8065, 10.1815],
    status: 'active',
    capacity: 25000,
    utilization: 85,
    lastUpdate: '2024-02-22T13:15:00Z'
  }
];

export const getMarketplaceListings: RequestHandler = (req, res) => {
  try {
    const { category = 'all', location = 'all', sort = 'newest', search = '' } = req.query;
    
    let filteredListings = [...mockListings];
    
    // Filter by category
    if (category !== 'all') {
      filteredListings = filteredListings.filter(listing => listing.category === category);
    }
    
    // Filter by location
    if (location !== 'all') {
      filteredListings = filteredListings.filter(listing => 
        listing.location.governorate === location || listing.location.city === location
      );
    }
    
    // Filter by search query
    if (search) {
      filteredListings = filteredListings.filter(listing => 
        listing.productNameAr.includes(search as string) ||
        listing.sellerName.includes(search as string) ||
        listing.variety.includes(search as string)
      );
    }
    
    // Sort listings
    switch (sort) {
      case 'newest':
        filteredListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price_low':
        filteredListings.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        break;
      case 'price_high':
        filteredListings.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        break;
      case 'expiry':
        filteredListings.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        break;
    }
    
    res.json({
      success: true,
      data: filteredListings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace listings'
    });
  }
};

export const getMarketplaceInquiries: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockInquiries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace inquiries'
    });
  }
};

export const getMarketplaceAnalytics: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockAnalytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace analytics'
    });
  }
};

export const getSupplyChainNodes: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockSupplyChainNodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supply chain nodes'
    });
  }
};

export const createMarketplaceListing: RequestHandler = (req, res) => {
  try {
    const listingData = req.body;
    
    const newListing = {
      id: `listing_${Date.now()}`,
      ...listingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      inquiries: 0,
      status: 'active'
    };
    
    res.json({
      success: true,
      data: newListing,
      message: 'Marketplace listing created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create marketplace listing'
    });
  }
};

export const createInquiry: RequestHandler = (req, res) => {
  try {
    const inquiryData = req.body;
    
    const newInquiry = {
      id: `inquiry_${Date.now()}`,
      ...inquiryData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      responses: []
    };
    
    res.json({
      success: true,
      data: newInquiry,
      message: 'Inquiry created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create inquiry'
    });
  }
};
