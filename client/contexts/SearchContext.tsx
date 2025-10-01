import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  descriptionArabic: string;
  category: string;
  categoryArabic: string;
  url: string;
  icon: string;
  keywords: string[];
  keywordsArabic: string[];
  matchScore: number;
  data?: any;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  performSearch: (query: string) => void;
  clearSearch: () => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  searchHistory: SearchResult[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

// Search data index for all modules and features
const searchIndex: Omit<SearchResult, 'matchScore'>[] = [
  // Dashboard Pages
  {
    id: 'farmer-dashboard',
    title: 'Farmer Dashboard',
    titleArabic: 'لوحة تحكم الفلاح',
    description: 'Complete farming management dashboard with crop monitoring and recommendations',
    descriptionArabic: 'لوحة تحكم شاملة لإدارة المزرعة مع مراقبة المحاصيل والتوصيات',
    category: 'Dashboards',
    categoryArabic: 'لوحات التحكم',
    url: '/farmer-dashboard',
    icon: 'User',
    keywords: ['farmer', 'dashboard', 'farming', 'crop', 'agriculture', 'management'],
    keywordsArabic: ['فلاح', 'لوحة', 'زراعة', 'محصول', 'إدارة', 'مزرعة']
  },
  {
    id: 'agronomist-dashboard',
    title: 'Agronomist Dashboard',
    titleArabic: 'لوحة تحكم الخبير الزراعي',
    description: 'Agricultural expert dashboard for crop analysis and farmer consultation',
    descriptionArabic: 'لوحة تحكم الخبير الزراعي لتحليل المحاصيل واستشارة المزارعين',
    category: 'Dashboards',
    categoryArabic: 'لوحات التحكم',
    url: '/agronomist-dashboard',
    icon: 'Award',
    keywords: ['agronomist', 'expert', 'consultation', 'analysis', 'agriculture'],
    keywordsArabic: ['خبير', 'زراعي', 'استشارة', 'تحليل', 'زراعة']
  },
  {
    id: 'trader-dashboard',
    title: 'Trader Dashboard',
    titleArabic: 'لوحة تحكم التاجر',
    description: 'Agricultural trading platform with market analysis and price tracking',
    descriptionArabic: 'منصة التداول الزراعي مع تحليل السوق وتتبع الأسعار',
    category: 'Dashboards',
    categoryArabic: 'لوحات التحكم',
    url: '/trader-dashboard',
    icon: 'ShoppingCart',
    keywords: ['trader', 'trading', 'market', 'prices', 'commerce'],
    keywordsArabic: ['تاجر', 'تداول', 'سوق', 'أسعار', 'تجارة']
  },
  {
    id: 'veterinarian-dashboard',
    title: 'Veterinarian Dashboard',
    titleArabic: 'لوحة تحكم الطبيب البيطري',
    description: 'Veterinary management system for livestock health and treatment',
    descriptionArabic: 'نظام إدارة بيطرية لصحة الثروة الحيوانية والعلاج',
    category: 'Dashboards',
    categoryArabic: 'لوحات التحكم',
    url: '/veterinarian-dashboard',
    icon: 'Stethoscope',
    keywords: ['veterinarian', 'livestock', 'health', 'animals', 'treatment'],
    keywordsArabic: ['بيطري', 'ثروة', 'حيوانية', 'صحة', 'علاج']
  },
  {
    id: 'admin-panel',
    title: 'Admin Panel',
    titleArabic: 'لوحة تحكم مدير المنصة',
    description: 'Platform administration with user management and system monitoring',
    descriptionArabic: 'إدارة المنصة مع إدارة المستخدمين ومراقبة النظام',
    category: 'Administration',
    categoryArabic: 'الإدارة',
    url: '/admin-panel',
    icon: 'Settings',
    keywords: ['admin', 'administration', 'users', 'system', 'management'],
    keywordsArabic: ['إدارة', 'مدير', 'مستخدمين', 'نظام', 'إعدادات']
  },
  {
    id: 'government-dashboard',
    title: 'Government Official Dashboard',
    titleArabic: 'لوحة تحكم مسؤول الجهة الحكومية',
    description: 'Government oversight dashboard for agricultural policy and compliance monitoring',
    descriptionArabic: 'لوحة رقابة حكومية للسياسات الزراعية ومراقبة الامتثال',
    category: 'Government',
    categoryArabic: 'حكومي',
    url: '/government-dashboard',
    icon: 'Flag',
    keywords: ['government', 'policy', 'compliance', 'oversight', 'regulation'],
    keywordsArabic: ['حكومة', 'سياسة', 'امتثال', 'رقابة', 'تنظيم']
  },
  
  // Soil Analysis
  {
    id: 'soil-analysis',
    title: 'Soil Analysis',
    titleArabic: 'تحليل التربة',
    description: 'Comprehensive soil testing and analysis tools',
    descriptionArabic: 'أدوات شاملة لفحص وتحليل التربة',
    category: 'Soil Analysis',
    categoryArabic: 'تحليل التربة',
    url: '/analysis',
    icon: 'BarChart3',
    keywords: ['soil', 'analysis', 'testing', 'nutrients', 'pH'],
    keywordsArabic: ['تربة', 'تحليل', 'فحص', 'مغذيات', 'حموضة']
  },
  {
    id: 'soil-problem-detection',
    title: 'Smart Soil Problem Detection',
    titleArabic: 'كاشف مشاكل التربة الذكي',
    description: 'AI-powered soil problem detection and diagnosis',
    descriptionArabic: 'كشف وتشخيص مشاكل التربة بالذكاء الاصطناعي',
    category: 'Soil Analysis',
    categoryArabic: 'تحليل التربة',
    url: '/soil-problem-detection',
    icon: 'Brain',
    keywords: ['soil', 'problems', 'detection', 'AI', 'diagnosis'],
    keywordsArabic: ['تربة', 'مشاكل', 'كشف', 'ذكاء', 'تشخيص']
  },
  
  // Crop Management
  {
    id: 'crop-recommendations',
    title: 'Crop Recommendations',
    titleArabic: 'توصيات المحاصيل',
    description: 'AI-powered crop selection and farming recommendations',
    descriptionArabic: 'توصيات اختيار المحاصيل والزراعة بالذكاء الاصطناعي',
    category: 'Crop Management',
    categoryArabic: 'إدارة المحاصيل',
    url: '/recommendations',
    icon: 'Lightbulb',
    keywords: ['crop', 'recommendations', 'selection', 'farming', 'AI'],
    keywordsArabic: ['محاصيل', 'توصيات', 'اختيار', 'زراعة', 'ذكاء']
  },
  {
    id: 'smart-crop-suggestions',
    title: 'Smart Crop Suggestions',
    titleArabic: 'اقتراحات الزراعة الذكية',
    description: 'Intelligent crop variety suggestions based on soil and climate',
    descriptionArabic: 'اقتراحات ذكية لأصناف المحاصيل حسب التربة والمناخ',
    category: 'Crop Management',
    categoryArabic: 'إدارة المحاصيل',
    url: '/smart-crop-suggestions',
    icon: 'Sparkles',
    keywords: ['smart', 'crop', 'suggestions', 'variety', 'climate'],
    keywordsArabic: ['ذكي', 'محاصيل', 'اقتراحات', 'أصناف', 'مناخ']
  },
  {
    id: 'crop-rotation-planner',
    title: 'Crop Rotation Planner',
    titleArabic: 'مخطط الدورة الزراعية',
    description: 'Plan optimal crop rotation schedules for soil health',
    descriptionArabic: 'تخطيط جداول الدورة الزراعية المثلى لصحة التربة',
    category: 'Crop Management',
    categoryArabic: 'إدارة المحاصيل',
    url: '/crop-rotation-planner',
    icon: 'RefreshCw',
    keywords: ['crop', 'rotation', 'planning', 'schedule', 'soil health'],
    keywordsArabic: ['دورة', 'زراعية', 'تخطيط', 'جدول', 'صحة التربة']
  },
  
  // Disease Detection
  {
    id: 'disease-diagnosis',
    title: 'Disease Diagnosis',
    titleArabic: 'تشخيص الأمراض',
    description: 'AI-powered plant disease detection using image analysis',
    descriptionArabic: 'كشف أمراض النباتات بالذكاء الاصطناعي وتحليل الصور',
    category: 'Disease Detection',
    categoryArabic: 'كشف الأمراض',
    url: '/disease-upload',
    icon: 'Camera',
    keywords: ['disease', 'diagnosis', 'plants', 'detection', 'AI', 'image'],
    keywordsArabic: ['مرض', 'تشخيص', 'نباتات', 'كشف', 'ذكاء', 'صورة']
  },
  {
    id: 'treatment-recommendations',
    title: 'Smart Treatment Recommendations',
    titleArabic: 'توصيات العلاج الذكية',
    description: 'Intelligent treatment suggestions for plant diseases',
    descriptionArabic: 'اقتراحات ذكية لعلاج أمراض النباتات',
    category: 'Disease Detection',
    categoryArabic: 'كشف الأمراض',
    url: '/treatment-recommendations',
    icon: 'Stethoscope',
    keywords: ['treatment', 'recommendations', 'plants', 'diseases', 'cure'],
    keywordsArabic: ['علاج', 'توصيات', 'نباتات', 'أمراض', 'شفاء']
  },
  
  // Market Intelligence
  {
    id: 'market-dashboard',
    title: 'Smart Market Dashboard',
    titleArabic: 'السوق الذكي',
    description: 'Real-time market prices and trading intelligence',
    descriptionArabic: 'أسعار السوق الفورية وذكاء التداول',
    category: 'Market Intelligence',
    categoryArabic: 'ذكاء السوق',
    url: '/market-dashboard',
    icon: 'DollarSign',
    keywords: ['market', 'prices', 'trading', 'intelligence', 'real-time'],
    keywordsArabic: ['سوق', 'أسعار', 'تداول', 'ذكاء', 'فوري']
  },
  {
    id: 'price-forecasts',
    title: 'Price Forecasts',
    titleArabic: 'توقعات الأسعار',
    description: 'AI-powered crop price predictions and market trends',
    descriptionArabic: 'تنبؤات أسعار المحاصيل واتجاهات السوق بالذكاء الاصطناعي',
    category: 'Market Intelligence',
    categoryArabic: 'ذكاء السوق',
    url: '/price-forecasts',
    icon: 'LineChart',
    keywords: ['prices', 'forecasts', 'predictions', 'trends', 'market'],
    keywordsArabic: ['أسعار', 'توقعات', 'تنبؤات', 'اتجاهات', 'سوق']
  },
  
  // Water Management
  {
    id: 'smart-irrigation',
    title: 'Smart Irrigation System',
    titleArabic: 'نظام الري الذكي',
    description: 'AI-powered irrigation scheduling and water optimization',
    descriptionArabic: 'جدولة الري وتحسين المياه بالذكاء الاصطناعي',
    category: 'Water Management',
    categoryArabic: 'إدارة المياه',
    url: '/smart-irrigation',
    icon: 'Droplets',
    keywords: ['irrigation', 'water', 'smart', 'scheduling', 'optimization'],
    keywordsArabic: ['ري', 'مياه', 'ذكي', 'جدولة', 'تحسين']
  },
  {
    id: 'water-analytics',
    title: 'Water Usage Analytics',
    titleArabic: 'تحليل استهلاك المياه',
    description: 'Comprehensive water usage tracking and analytics',
    descriptionArabic: 'تتبع وتحليل شامل لاستهلاك المياه',
    category: 'Water Management',
    categoryArabic: 'إدارة المياه',
    url: '/water-analytics',
    icon: 'Zap',
    keywords: ['water', 'usage', 'analytics', 'tracking', 'consumption'],
    keywordsArabic: ['مياه', 'استهلاك', 'تحليل', 'تتبع', 'استخدام']
  },
  
  // Livestock Management
  {
    id: 'livestock-dashboard',
    title: 'Livestock Management',
    titleArabic: 'إدارة الثروة الحيوانية',
    description: 'Complete livestock management and monitoring system',
    descriptionArabic: 'نظام شامل لإدارة ومراقبة الثروة الحيوانية',
    category: 'Livestock Management',
    categoryArabic: 'إدارة الثروة الحيوانية',
    url: '/livestock-dashboard',
    icon: 'Users',
    keywords: ['livestock', 'animals', 'management', 'monitoring', 'health'],
    keywordsArabic: ['ثروة', 'حيوانية', 'إدارة', 'مراقبة', 'صحة']
  },
  {
    id: 'animal-health-monitoring',
    title: 'Animal Health Monitoring',
    titleArabic: 'مراقبة صحة الحيوانات',
    description: 'Real-time animal health tracking and alert system',
    descriptionArabic: 'نظام تتبع صحة الحيوانات والتنبيهات الفورية',
    category: 'Livestock Management',
    categoryArabic: 'إدارة الثروة الحيوانية',
    url: '/animal-health-monitoring',
    icon: 'Heart',
    keywords: ['animal', 'health', 'monitoring', 'tracking', 'alerts'],
    keywordsArabic: ['حيوان', 'صحة', 'مراقبة', 'تتبع', 'تنبيهات']
  },
  
  // Financial Management
  {
    id: 'financial-dashboard',
    title: 'Financial Dashboard',
    titleArabic: 'لوحة المالية',
    description: 'Comprehensive farm financial management and analytics',
    descriptionArabic: 'إدارة وتحليل مالي شامل للمزرعة',
    category: 'Financial Management',
    categoryArabic: 'الإدارة المالية',
    url: '/financial-dashboard',
    icon: 'Calculator',
    keywords: ['financial', 'management', 'analytics', 'farm', 'money'],
    keywordsArabic: ['مالية', 'إدارة', 'تحليل', 'مزرعة', 'أموال']
  },
  {
    id: 'budget-planning',
    title: 'Budget Planning',
    titleArabic: 'تخطيط الميزانية',
    description: 'Strategic budget planning and financial forecasting',
    descriptionArabic: 'تخطيط استراتيجي للميزانية والتنبؤ المالي',
    category: 'Financial Management',
    categoryArabic: 'الإدارة المالية',
    url: '/budget-planning',
    icon: 'PiggyBank',
    keywords: ['budget', 'planning', 'financial', 'forecasting', 'strategy'],
    keywordsArabic: ['ميزانية', 'تخطيط', 'مالي', 'تنبؤ', 'استراتيجية']
  }
];

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agroGrowthRecentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    const savedHistory = localStorage.getItem('agroGrowthSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save recent searches to localStorage
  const addRecentSearch = (query: string) => {
    if (!query.trim() || recentSearches.includes(query)) return;
    
    const updated = [query, ...recentSearches.slice(0, 9)]; // Keep last 10 searches
    setRecentSearches(updated);
    localStorage.setItem('agroGrowthRecentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('agroGrowthRecentSearches');
  };

  // Search algorithm with fuzzy matching and scoring
  const calculateMatchScore = (item: Omit<SearchResult, 'matchScore'>, query: string): number => {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let score = 0;
    const maxScore = 100;

    // Exact title match (highest priority)
    if (item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.titleArabic.includes(query)) {
      score += 40;
    }

    // Exact description match
    if (item.description.toLowerCase().includes(query.toLowerCase()) || 
        item.descriptionArabic.includes(query)) {
      score += 30;
    }

    // Keywords match
    const allKeywords = [...item.keywords, ...item.keywordsArabic].map(k => k.toLowerCase());
    searchTerms.forEach(term => {
      allKeywords.forEach(keyword => {
        if (keyword.includes(term)) {
          score += 15;
        }
        if (keyword === term) {
          score += 10; // Exact keyword match bonus
        }
      });
    });

    // Category match
    if (item.category.toLowerCase().includes(query.toLowerCase()) || 
        item.categoryArabic.includes(query)) {
      score += 20;
    }

    // Partial matches with fuzzy logic
    searchTerms.forEach(term => {
      if (term.length >= 3) {
        // Check if any word starts with the search term
        const titleWords = [...item.title.toLowerCase().split(' '), ...item.titleArabic.split(' ')];
        const descWords = [...item.description.toLowerCase().split(' '), ...item.descriptionArabic.split(' ')];
        
        titleWords.forEach(word => {
          if (word.startsWith(term)) score += 5;
        });
        
        descWords.forEach(word => {
          if (word.startsWith(term)) score += 3;
        });
      }
    });

    return Math.min(score, maxScore);
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay for realistic search experience
    await new Promise(resolve => setTimeout(resolve, 200));

    const results = searchIndex
      .map(item => ({
        ...item,
        matchScore: calculateMatchScore(item, query)
      }))
      .filter(item => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20); // Limit to top 20 results

    setSearchResults(results);
    setIsSearching(false);

    // Add to search history if results found
    if (results.length > 0 && results[0].matchScore > 20) {
      const topResult = results[0];
      const historyItem = { ...topResult, searchQuery: query };
      const updatedHistory = [historyItem, ...searchHistory.filter(h => h.id !== topResult.id)].slice(0, 50);
      setSearchHistory(updatedHistory);
      localStorage.setItem('agroGrowthSearchHistory', JSON.stringify(updatedHistory));
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const value: SearchContextType = {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    performSearch,
    clearSearch,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    searchHistory
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};
