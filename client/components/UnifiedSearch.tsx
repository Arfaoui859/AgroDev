import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, X, Clock, TrendingUp, Filter, ArrowRight, Command, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface UnifiedSearchProps {
  className?: string;
  placeholder?: string;
  showShortcut?: boolean;
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ 
  className, 
  placeholder, 
  showShortcut = true 
}) => {
  const navigate = useNavigate();
  const { isArabic } = useLanguage();
  const {
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
  } = useSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle search input
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue.trim()) {
        performSearch(inputValue);
        setSearchQuery(inputValue);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [inputValue, performSearch, setSearchQuery, clearSearch]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const resultsCount = searchResults.length;
      if (resultsCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % resultsCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? resultsCount - 1 : prev - 1);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleResultClick(searchResults[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  const openSearch = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setInputValue('');
    setSelectedIndex(-1);
    clearSearch();
  };

  const handleResultClick = (result: any) => {
    addRecentSearch(inputValue);
    navigate(result.url);
    closeSearch();
  };

  const handleRecentSearchClick = (query: string) => {
    setInputValue(query);
    performSearch(query);
  };

  const getIconComponent = (iconName: string) => {
    // Simple icon mapping - in a real app you'd import these properly
    const iconMap: { [key: string]: React.ReactNode } = {
      'User': '👤',
      'Award': '🏆',
      'ShoppingCart': '🛒',
      'Stethoscope': '🩺',
      'Settings': '⚙️',
      'Flag': '🏳️',
      'BarChart3': '📊',
      'Brain': '🧠',
      'Lightbulb': '💡',
      'Sparkles': '✨',
      'RefreshCw': '🔄',
      'Camera': '📷',
      'DollarSign': '💰',
      'LineChart': '📈',
      'Droplets': '💧',
      'Zap': '⚡',
      'Users': '👥',
      'Heart': '❤️',
      'Calculator': '🧮',
      'PiggyBank': '🐷'
    };
    return iconMap[iconName] || '📋';
  };

  const categories = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'Dashboards', label: isArabic ? 'لوحات التحكم' : 'Dashboards' },
    { value: 'Soil Analysis', label: isArabic ? 'تحليل التربة' : 'Soil Analysis' },
    { value: 'Crop Management', label: isArabic ? 'إدارة المحاصيل' : 'Crop Management' },
    { value: 'Disease Detection', label: isArabic ? 'كشف الأمراض' : 'Disease Detection' },
    { value: 'Market Intelligence', label: isArabic ? 'ذكاء السوق' : 'Market Intelligence' },
    { value: 'Water Management', label: isArabic ? 'إدارة المياه' : 'Water Management' },
    { value: 'Livestock Management', label: isArabic ? 'إدارة الثروة الحيوانية' : 'Livestock Management' },
    { value: 'Financial Management', label: isArabic ? 'الإدارة المالية' : 'Financial Management' }
  ];

  const filteredResults = selectedCategory === 'all' 
    ? searchResults 
    : searchResults.filter(result => result.category === selectedCategory);

  return (
    <>
      {/* Search Trigger */}
      <div className={cn("relative", className)}>
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground bg-background/60 hover:bg-background/80"
          onClick={openSearch}
        >
          <Search className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          <span className="flex-1 text-left rtl:text-right">
            {placeholder || (isArabic ? 'البحث في جميع الوحدات...' : 'Search across all modules...')}
          </span>
          {showShortcut && (
            <div className="flex items-center gap-1 ml-auto rtl:mr-auto rtl:ml-0">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />
                K
              </kbd>
            </div>
          )}
        </Button>
      </div>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh]">
          <div 
            ref={searchRef}
            className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl border max-h-[80vh] flex flex-col"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isArabic ? 'ابحث عن أي شيء...' : 'Search for anything...'}
                className="border-0 shadow-none focus-visible:ring-0 text-lg"
                autoComplete="off"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(showFilters && "bg-muted")}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={closeSearch}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="p-4 border-b bg-muted/30">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className="text-xs"
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Content */}
            <ScrollArea className="flex-1 max-h-96">
              <div className="p-4">
                {/* Loading State */}
                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                      <span>{isArabic ? 'جاري البحث...' : 'Searching...'}</span>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {!isSearching && inputValue && filteredResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        {isArabic ? 
                          `${filteredResults.length} نتيجة لـ "${inputValue}"` : 
                          `${filteredResults.length} results for "${inputValue}"`
                        }
                      </span>
                    </div>
                    {filteredResults.map((result, index) => (
                      <div
                        key={result.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors group",
                          selectedIndex === index ? "bg-muted border-primary" : "hover:bg-muted/50",
                        )}
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl mt-1">{getIconComponent(result.icon)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {isArabic ? result.titleArabic : result.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {isArabic ? result.categoryArabic : result.category}
                              </Badge>
                              {result.matchScore > 80 && (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {isArabic ? result.descriptionArabic : result.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!isSearching && inputValue && filteredResults.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <h3 className="font-medium mb-1">
                      {isArabic ? 'لم يتم العثور على نتائج' : 'No results found'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? 
                        'جرب مصطلحات بحث مختلفة أو تصفح الفئات' : 
                        'Try different search terms or browse categories'
                      }
                    </p>
                  </div>
                )}

                {/* Default State - Recent Searches & Popular */}
                {!inputValue && (
                  <div className="space-y-6">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4" />
                            <span>{isArabic ? 'عمليات البحث الأخيرة' : 'Recent Searches'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRecentSearches}
                            className="text-xs text-muted-foreground"
                          >
                            {isArabic ? 'مسح الكل' : 'Clear all'}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.slice(0, 6).map((search, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleRecentSearchClick(search)}
                              className="text-xs"
                            >
                              {search}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular/Quick Access */}
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-3">
                        <TrendingUp className="h-4 w-4" />
                        <span>{isArabic ? 'الوصول السريع' : 'Quick Access'}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { name: isArabic ? 'لوحة تحكم الفلاح' : 'Farmer Dashboard', url: '/farmer-dashboard', icon: '👤' },
                          { name: isArabic ? 'تحليل التربة' : 'Soil Analysis', url: '/analysis', icon: '📊' },
                          { name: isArabic ? 'توصيات المحاصيل' : 'Crop Recommendations', url: '/recommendations', icon: '💡' },
                          { name: isArabic ? 'تشخيص الأمراض' : 'Disease Diagnosis', url: '/disease-upload', icon: '📷' },
                          { name: isArabic ? 'السوق الذكي' : 'Smart Market', url: '/market-dashboard', icon: '💰' }
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                            onClick={() => { navigate(item.url); closeSearch(); }}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto rtl:mr-auto rtl:ml-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Search Footer */}
            <div className="p-3 border-t bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{isArabic ? 'اضغط Enter للتنقل' : 'Press Enter to navigate'}</span>
                  <span>{isArabic ? '↑↓ للتنقل' : '↑↓ to navigate'}</span>
                  <span>{isArabic ? 'Esc للإغلاق' : 'Esc to close'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{isArabic ? 'البحث بواسطة' : 'Powered by'}</span>
                  <span className="font-medium">AgroGrowth AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnifiedSearch;
