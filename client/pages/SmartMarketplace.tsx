import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { 
  ShoppingCart, 
  Users, 
  Truck, 
  Package, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Star,
  Plus,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  User,
  Shield,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  Globe,
  Zap,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
  Share2,
  Bookmark,
  Download,
  Upload,
  FileText,
  CreditCard,
  Banknote,
  Scale,
  Leaf,
  Droplets,
  Sun,
  CloudRain
} from 'lucide-react';

interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  sellerLocation: string;
  sellerType: 'farmer' | 'wholesaler' | 'cooperative';
  productName: string;
  productNameAr: string;
  category: 'vegetables' | 'fruits' | 'grains' | 'livestock' | 'dairy' | 'equipment';
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalValue: number;
  currency: string;
  qualityGrade: 'A' | 'B' | 'C';
  organic: boolean;
  harvestDate: string;
  expiryDate: string;
  location: {
    governorate: string;
    city: string;
    coordinates: [number, number];
  };
  images: string[];
  description: string;
  descriptionAr: string;
  certifications: string[];
  status: 'active' | 'reserved' | 'sold' | 'expired';
  createdAt: string;
  updatedAt: string;
  views: number;
  inquiries: number;
  isFeatured: boolean;
  negotiations: {
    enabled: boolean;
    minPrice: number;
    autoAcceptPrice: number;
  };
  logistics: {
    deliveryAvailable: boolean;
    pickupAvailable: boolean;
    shippingCost: number;
    processingTime: number;
  };
}

interface BuyerInquiry {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerType: 'trader' | 'retailer' | 'restaurant' | 'processor';
  listingId: string;
  quantity: number;
  proposedPrice: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  createdAt: string;
  responses: InquiryResponse[];
}

interface InquiryResponse {
  id: string;
  senderId: string;
  senderType: 'buyer' | 'seller';
  message: string;
  proposedPrice?: number;
  quantity?: number;
  timestamp: string;
}

interface MarketAnalytics {
  totalListings: number;
  activeListings: number;
  totalValue: number;
  averagePrice: number;
  topCategories: Array<{
    category: string;
    categoryAr: string;
    count: number;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  topRegions: Array<{
    region: string;
    listings: number;
    value: number;
  }>;
  priceHistory: Array<{
    product: string;
    date: string;
    price: number;
  }>;
  marketTrends: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    topGrowing: string[];
    declining: string[];
  };
}

interface SupplyChainNode {
  id: string;
  type: 'farm' | 'warehouse' | 'processing' | 'distribution' | 'retail';
  name: string;
  location: string;
  coordinates: [number, number];
  status: 'active' | 'maintenance' | 'offline';
  capacity: number;
  utilization: number;
  lastUpdate: string;
}

const SmartMarketplace: React.FC = () => {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [inquiries, setInquiries] = useState<BuyerInquiry[]>([]);
  const [analytics, setAnalytics] = useState<MarketAnalytics | null>(null);
  const [supplyChain, setSupplyChain] = useState<SupplyChainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchMarketplaceData();
  }, [selectedCategory, selectedLocation, sortBy]);

  const generateDemoListings = (): MarketListing[] => {
    const products = [
      { name: 'Tomatoes', nameAr: 'طماطم', category: 'vegetables', variety: 'روما', basePrice: 2.5 },
      { name: 'Wheat', nameAr: 'قمح', category: 'grains', variety: 'قمح شتوي', basePrice: 0.45 },
      { name: 'Olives', nameAr: 'زيتون', category: 'fruits', variety: 'زيتون أخضر', basePrice: 4.2 },
      { name: 'Barley', nameAr: 'شعير', category: 'grains', variety: 'شعير علفي', basePrice: 0.38 },
      { name: 'Dates', nameAr: 'تمر', category: 'fruits', variety: 'دقلة نور', basePrice: 8.5 },
      { name: 'Potatoes', nameAr: 'بطاطس', category: 'vegetables', variety: 'بطاطس بيضاء', basePrice: 1.8 },
      { name: 'Oranges', nameAr: 'برتقال', category: 'fruits', variety: 'برتقال مالطي', basePrice: 1.2 },
      { name: 'Onions', nameAr: 'بصل', category: 'vegetables', variety: 'بصل أحمر', basePrice: 0.9 }
    ];

    const locations = [
      { governorate: 'تونس', city: 'تونس العاصمة', coords: [36.8065, 10.1815] },
      { governorate: 'صفاقس', city: 'صفاقس', coords: [34.7406, 10.7603] },
      { governorate: 'سوسة', city: 'سوسة', coords: [35.8256, 10.6369] },
      { governorate: 'القيروان', city: 'القيروان', coords: [35.6781, 10.0963] },
      { governorate: 'بنزرت', city: 'بنزرت', coords: [37.2744, 9.8739] },
      { governorate: 'قابس', city: 'قابس', coords: [33.8815, 10.0982] }
    ];

    const sellers = [
      { name: 'محمد الحبيب', type: 'farmer', rating: 4.8 },
      { name: 'فاطمة السعيدي', type: 'farmer', rating: 4.6 },
      { name: 'تعاونية الفلاحين', type: 'cooperative', rating: 4.9 },
      { name: 'أحمد التاجر', type: 'wholesaler', rating: 4.3 },
      { name: 'مزرعة البركة', type: 'farmer', rating: 4.7 },
      { name: 'شركة الأغذية الطبيعية', type: 'wholesaler', rating: 4.5 }
    ];

    return products.flatMap((product, productIndex) =>
      Array.from({ length: 3 + Math.floor(Math.random() * 4) }, (_, index) => {
        const seller = sellers[Math.floor(Math.random() * sellers.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const quantity = 50 + Math.floor(Math.random() * 950);
        const priceVariation = 0.8 + Math.random() * 0.4; // ±20% price variation
        const price = product.basePrice * priceVariation;
        const isOrganic = Math.random() > 0.7;
        const isFeatured = Math.random() > 0.85;
        const qualityGrades = ['A', 'B', 'C'] as const;
        const quality = qualityGrades[Math.floor(Math.random() * qualityGrades.length)];
        const statuses = ['active', 'active', 'active', 'reserved', 'sold'] as const;
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const harvestDate = new Date();
        harvestDate.setDate(harvestDate.getDate() - Math.floor(Math.random() * 30));

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 14) + 1);

        return {
          id: `listing-${productIndex}-${index}`,
          sellerId: `seller-${Math.floor(Math.random() * 100)}`,
          sellerName: seller.name,
          sellerRating: seller.rating,
          sellerLocation: location.city,
          sellerType: seller.type as 'farmer' | 'wholesaler' | 'cooperative',
          productName: product.name,
          productNameAr: product.nameAr,
          category: product.category as 'vegetables' | 'fruits' | 'grains' | 'livestock' | 'dairy' | 'equipment',
          variety: product.variety,
          quantity,
          unit: product.category === 'grains' ? 'كغ' : product.category === 'fruits' ? 'كغ' : 'كغ',
          pricePerUnit: Number(price.toFixed(2)),
          totalValue: Number((price * quantity).toFixed(2)),
          currency: 'TND',
          qualityGrade: quality,
          organic: isOrganic,
          harvestDate: harvestDate.toISOString(),
          expiryDate: expiryDate.toISOString(),
          location: {
            governorate: location.governorate,
            city: location.city,
            coordinates: location.coords as [number, number]
          },
          images: [`/images/${product.name.toLowerCase()}.jpg`],
          description: `منتج طازج عالي الجودة من مزارع ${location.governorate}`,
          descriptionAr: `منتج طازج عالي الجودة من مزارع ${location.governorate}`,
          certifications: isOrganic ? ['عضوي معتمد'] : [],
          status,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          views: Math.floor(Math.random() * 200) + 10,
          inquiries: Math.floor(Math.random() * 15) + 1,
          isFeatured,
          negotiations: {
            enabled: Math.random() > 0.3,
            minPrice: price * 0.9,
            autoAcceptPrice: price * 1.1
          },
          logistics: {
            deliveryAvailable: Math.random() > 0.4,
            pickupAvailable: true,
            shippingCost: Math.floor(Math.random() * 50) + 10,
            processingTime: Math.floor(Math.random() * 3) + 1
          }
        };
      })
    );
  };

  const generateDemoInquiries = (): BuyerInquiry[] => {
    const buyers = [
      { name: 'مطعم الأصالة', type: 'restaurant' },
      { name: 'سوق المركزي', type: 'retailer' },
      { name: 'شركة التصدير', type: 'trader' },
      { name: 'مصنع المعلبات', type: 'processor' }
    ];

    return Array.from({ length: 12 }, (_, index) => {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const statuses = ['pending', 'accepted', 'rejected', 'negotiating'] as const;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        id: `inquiry-${index}`,
        buyerId: `buyer-${index}`,
        buyerName: buyer.name,
        buyerType: buyer.type as 'trader' | 'retailer' | 'restaurant' | 'processor',
        listingId: `listing-${Math.floor(Math.random() * 10)}`,
        quantity: Math.floor(Math.random() * 500) + 50,
        proposedPrice: Number((Math.random() * 3 + 1).toFixed(2)),
        message: 'مهتم بشراء هذا المنتج، هل يمكن التفاوض على السعر والكمية؟',
        status,
        createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        responses: status === 'negotiating' ? [
          {
            id: 'response-1',
            senderId: 'seller-1',
            senderType: 'seller',
            message: 'يمكننا التفاوض، ما هي الكمية المطلوبة بالضبط؟',
            timestamp: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ] : []
      };
    });
  };

  const generateDemoAnalytics = (): MarketAnalytics => {
    return {
      totalListings: 156,
      activeListings: 128,
      totalValue: 245000,
      averagePrice: 2.85,
      topCategories: [
        { category: 'vegetables', categoryAr: 'خضروات', count: 45, value: 85000, trend: 'up' },
        { category: 'fruits', categoryAr: 'فواكه', count: 38, value: 92000, trend: 'up' },
        { category: 'grains', categoryAr: 'حبوب', count: 32, value: 48000, trend: 'stable' },
        { category: 'dairy', categoryAr: 'ألبان', count: 25, value: 35000, trend: 'down' }
      ],
      topRegions: [
        { region: 'صفاقس', listings: 42, value: 98000 },
        { region: 'تونس', listings: 38, value: 85000 },
        { region: 'سوسة', listings: 28, value: 62000 },
        { region: 'القيروان', listings: 22, value: 45000 }
      ],
      priceHistory: [],
      marketTrends: {
        weeklyGrowth: 12.5,
        monthlyGrowth: 28.3,
        topGrowing: ['طماطم عضوية', 'زيتون مكبوس', 'تمر مجهول', 'قمح شتوي'],
        declining: ['بطاطس صيفية', 'خيار مخلل']
      }
    };
  };

  const generateDemoSupplyChain = (): SupplyChainNode[] => {
    return [
      {
        id: 'farm-1',
        type: 'farm',
        name: 'مزرعة البركة',
        location: 'صفاقس، تونس',
        coordinates: [34.7406, 10.7603],
        status: 'active',
        capacity: 1000,
        utilization: 85,
        lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'warehouse-1',
        type: 'warehouse',
        name: 'مستودع المركزي',
        location: 'تونس العاصمة',
        coordinates: [36.8065, 10.1815],
        status: 'active',
        capacity: 5000,
        utilization: 72,
        lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'processing-1',
        type: 'processing',
        name: 'مصنع التعليب',
        location: 'سوسة',
        coordinates: [35.8256, 10.6369],
        status: 'active',
        capacity: 2000,
        utilization: 90,
        lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'distribution-1',
        type: 'distribution',
        name: 'مركز التوزيع',
        location: 'بنزرت',
        coordinates: [37.2744, 9.8739],
        status: 'maintenance',
        capacity: 3000,
        utilization: 45,
        lastUpdate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'retail-1',
        type: 'retail',
        name: 'سوق البلدي',
        location: 'قابس',
        coordinates: [33.8815, 10.0982],
        status: 'active',
        capacity: 800,
        utilization: 95,
        lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'farm-2',
        type: 'farm',
        name: 'مزرعة الزيتون',
        location: 'القيروان',
        coordinates: [35.6781, 10.0963],
        status: 'active',
        capacity: 750,
        utilization: 68,
        lastUpdate: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];
  };

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate realistic demo data
      let demoListings = generateDemoListings();
      const demoInquiries = generateDemoInquiries();
      const demoAnalytics = generateDemoAnalytics();
      const demoSupplyChain = generateDemoSupplyChain();

      // Apply filters
      if (selectedCategory !== 'all') {
        demoListings = demoListings.filter(listing => listing.category === selectedCategory);
      }

      if (selectedLocation !== 'all') {
        demoListings = demoListings.filter(listing =>
          listing.location.governorate.includes(selectedLocation) ||
          listing.location.city.includes(selectedLocation)
        );
      }

      if (searchQuery) {
        demoListings = demoListings.filter(listing =>
          listing.productNameAr.includes(searchQuery) ||
          listing.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.variety.includes(searchQuery) ||
          listing.sellerName.includes(searchQuery)
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          demoListings.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
          break;
        case 'price_high':
          demoListings.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
          break;
        case 'quantity':
          demoListings.sort((a, b) => b.quantity - a.quantity);
          break;
        case 'rating':
          demoListings.sort((a, b) => b.sellerRating - a.sellerRating);
          break;
        case 'nearest':
          // For demo, randomize
          demoListings.sort(() => Math.random() - 0.5);
          break;
        case 'newest':
        default:
          demoListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }

      setListings(demoListings);
      setInquiries(demoInquiries);
      setAnalytics(demoAnalytics);
      setSupplyChain(demoSupplyChain);

    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      vegetables: 'خضروات',
      fruits: 'فواكه',
      grains: 'حبوب',
      livestock: 'ثروة حيوانية',
      dairy: 'منتجات الألبان',
      equipment: 'معدات زراعية'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getSellerTypeLabel = (type: string) => {
    const labels = {
      farmer: 'مزارع',
      wholesaler: 'تاجر جملة',
      cooperative: 'تعاونية زراعية'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'متاح',
      reserved: 'محجوز',
      sold: 'مباع',
      expired: 'منتهي'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getQualityColor = (grade: string) => {
    const colors = {
      A: 'text-green-600',
      B: 'text-yellow-600',
      C: 'text-orange-600'
    };
    return colors[grade as keyof typeof colors] || 'text-gray-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-TN');
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading && !analytics) {
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
          <h1 className="text-3xl font-bold text-gray-900">السوق الذكي المتكامل</h1>
          <p className="text-gray-600">منصة ربط المزارعين والتجار مع تتبع سلسلة التوريد</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="البحث في المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="جميع الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              <SelectItem value="vegetables">خضروات</SelectItem>
              <SelectItem value="fruits">فواكه</SelectItem>
              <SelectItem value="grains">حبوب</SelectItem>
              <SelectItem value="livestock">ثروة حيوانية</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={fetchMarketplaceData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة منتج للسوق</DialogTitle>
                <DialogDescription>
                  أضف منتجك ال��راعي للعرض في السوق الذكي
                </DialogDescription>
              </DialogHeader>
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <p className="text-gray-500">نموذج إضافة المنتج قيد التطوير</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العروض</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalListings.toLocaleString('ar-TN')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                نشط: {analytics.activeListings}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.totalValue)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                متوسط السعر: {formatCurrency(analytics.averagePrice)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النمو الأسبوعي</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                +{analytics.marketTrends.weeklyGrowth}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                نمو شهري: +{analytics.marketTrends.monthlyGrowth}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المناطق النشطة</CardTitle>
              <MapPin className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analytics.topRegions.length}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                أعلى منطقة: {analytics.topRegions[0]?.region}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="marketplace">السوق</TabsTrigger>
          <TabsTrigger value="inquiries">الاستفسارات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="supply-chain">سلسلة التوريد</TabsTrigger>
          <TabsTrigger value="contracts">العقود</TabsTrigger>
        </TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const daysUntilExpiry = calculateDaysUntilExpiry(listing.expiryDate);
              const isUrgent = daysUntilExpiry <= 3;

              return (
                <Card key={listing.id} className={`border-2 hover:shadow-lg transition-all duration-200 ${
                  listing.isFeatured ? 'border-yellow-200 ring-2 ring-yellow-100' : 'border-gray-200'
                } ${isUrgent ? 'border-red-200' : ''}`}>
                  <CardHeader>
                    {listing.isFeatured && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white">
                        مميز
                      </Badge>
                    )}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{listing.productNameAr}</CardTitle>
                          {listing.organic && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              عضوي
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span>{getCategoryLabel(listing.category)}</span>
                          <span>•</span>
                          <span>{listing.variety}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{listing.sellerName}</span>
                          <span>({getSellerTypeLabel(listing.sellerType)})</span>
                        </div>
                      </div>
                      
                      <Badge className={getStatusColor(listing.status)}>
                        {getStatusLabel(listing.status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">الكمية</p>
                        <p className="font-bold">{listing.quantity} {listing.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">السعر</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(listing.pricePerUnit)}/{listing.unit}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">الجودة</p>
                        <div className="flex items-center gap-1">
                          <span className={`font-bold ${getQualityColor(listing.qualityGrade)}`}>
                            الدرجة {listing.qualityGrade}
                          </span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < (listing.qualityGrade === 'A' ? 5 : listing.qualityGrade === 'B' ? 4 : 3) 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600">الموقع</p>
                        <p className="font-medium">{listing.location.city}</p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-600">تاريخ الحصاد</p>
                      <p className="font-medium">{formatDate(listing.harvestDate)}</p>
                    </div>

                    {isUrgent && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          ينتهي خلال {daysUntilExpiry} أيام - سعر مخفض!
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {listing.inquiries}
                        </span>
                      </div>
                      <span>{formatDate(listing.createdAt)}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <ShoppingCart className="h-3 w-3 ml-1" />
                        استفسار
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 ml-1" />
                        تفاصيل
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries" className="space-y-6">
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <Card key={inquiry.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{inquiry.buyerName}</h3>
                        <Badge className="text-xs">
                          {inquiry.buyerType === 'trader' ? 'تاجر' :
                           inquiry.buyerType === 'retailer' ? 'بائع تجزئة' :
                           inquiry.buyerType === 'restaurant' ? 'مطعم' : 'معالج'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-2">{inquiry.message}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">الكمية المطلوبة:</span>
                          <span className="font-medium ml-1">{inquiry.quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">السعر المقترح:</span>
                          <span className="font-medium ml-1 text-green-600">
                            {formatCurrency(inquiry.proposedPrice)}
                          </span>
                        </div>
                      </div>

                      {inquiry.responses.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600 mb-1">آخر رد:</p>
                          <p className="text-sm">{inquiry.responses[inquiry.responses.length - 1].message}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={
                        inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        inquiry.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        inquiry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {inquiry.status === 'pending' ? 'قيد الانتظار' :
                         inquiry.status === 'accepted' ? 'مقبول' :
                         inquiry.status === 'rejected' ? 'مرفوض' : 'تفاوض'}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="h-3 w-3" />
                        </Button>
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
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  أهم الفئات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {analytics.topCategories.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{category.categoryAr}</span>
                          {getTrendIcon(category.trend)}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{category.count} عرض</p>
                          <p className="text-sm text-gray-600">{formatCurrency(category.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Regions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  أهم المناطق
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    {analytics.topRegions.map((region, index) => (
                      <div key={region.region} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{region.region}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{region.listings} عرض</p>
                          <p className="text-sm text-gray-600">{formatCurrency(region.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Market Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                اتجاهات السوق
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">المنتجات الصاعدة</h4>
                    <div className="space-y-2">
                      {analytics.marketTrends.topGrowing.map((product, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{product}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3">المنتجات المتراجعة</h4>
                    <div className="space-y-2">
                      {analytics.marketTrends.declining.map((product, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                          <span className="text-sm">{product}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supply Chain Tab */}
        <TabsContent value="supply-chain" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {supplyChain.map((node) => (
              <Card key={node.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {node.type === 'farm' && <Leaf className="h-5 w-5 text-green-600" />}
                        {node.type === 'warehouse' && <Package className="h-5 w-5 text-blue-600" />}
                        {node.type === 'processing' && <Settings className="h-5 w-5 text-purple-600" />}
                        {node.type === 'distribution' && <Truck className="h-5 w-5 text-orange-600" />}
                        {node.type === 'retail' && <ShoppingCart className="h-5 w-5 text-pink-600" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{node.name}</CardTitle>
                        <p className="text-sm text-gray-600">{node.location}</p>
                      </div>
                    </div>
                    <Badge className={node.status === 'active' ? 'bg-green-100 text-green-800' : 
                      node.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}>
                      {node.status === 'active' ? 'نشط' : 
                       node.status === 'maintenance' ? 'صيانة' : 'متوقف'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">الاستخدام</span>
                      <span className="text-sm font-medium">{node.utilization}%</span>
                    </div>
                    <Progress value={node.utilization} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">السعة</p>
                      <p className="font-bold">{node.capacity.toLocaleString('ar-TN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">آخر تحديث</p>
                      <p className="font-medium">{formatDate(node.lastUpdate)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 ml-1" />
                      تفاصيل
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <MapPin className="h-3 w-3 ml-1" />
                      موقع
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-gray-500">نظام إدارة العقود الذكية قيد التطوير</p>
              <p className="text-sm text-gray-400 mt-2">سيتضمن عقود البيع والشراء الآلية والمدفوعات الذكية</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartMarketplace;
