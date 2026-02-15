import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Search, Clock } from 'lucide-react';

export default function NotFound() {
  const { isArabic } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Log 404 error for monitoring
  useEffect(() => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      user: user?.id || 'anonymous',
      role: user?.role || 'none',
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    // Store 404 logs
    const existing404s = JSON.parse(localStorage.getItem('agrogrowth_404_logs') || '[]');
    existing404s.push(errorLog);
    
    // Keep only last 20 logs
    if (existing404s.length > 20) {
      existing404s.shift();
    }
    
    localStorage.setItem('agrogrowth_404_logs', JSON.stringify(existing404s));
    
    console.warn('404 Page Not Found:', errorLog);
  }, [location, user]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  const suggestedPages = [
    { 
      name: isArabic ? 'الصفحة الرئيسية' : 'Home Page', 
      path: '/', 
      description: isArabic ? 'العودة إلى لوحة التحكم الرئيسية' : 'Return to main dashboard'
    },
    { 
      name: isArabic ? 'تحليل ��لتربة' : 'Soil Analysis', 
      path: '/analysis', 
      description: isArabic ? 'تحليل التربة بالذكاء الاصطناعي' : 'AI-powered soil analysis'
    },
    { 
      name: isArabic ? 'إدارة الحقول' : 'Field Management', 
      path: '/field-management', 
      description: isArabic ? 'إدارة شاملة للحقول والمزارع' : 'Comprehensive field and farm management'
    }
  ];

  // Filter suggestions based on user role
  const filteredSuggestions = suggestedPages.filter(page => {
    if (page.path === '/') return true;
    if (!user) return false;
    
    // Role-based filtering
    if (page.path === '/analysis') {
      return ['farmer', 'agronomist', 'inspector', 'admin'].includes(user.role);
    }
    if (page.path === '/field-management') {
      return ['farmer', 'inspector', 'admin'].includes(user.role);
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            {/* 404 Animation */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-red-500 mb-4 animate-pulse">
                404
              </div>
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping"></div>
                <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                  <Search className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {isArabic ? 'الصفحة غير موجودة' : 'Page Not Found'}
              </h1>
              
              <p className="text-gray-600 mb-2 text-lg">
                {isArabic 
                  ? 'عذراً، الصفحة التي تبحث عنها غير متوفرة'
                  : "Sorry, the page you're looking for doesn't exist"
                }
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                {isArabic ? 'المسار المطلوب:' : 'Requested path:'} 
                <code className="bg-gray-100 px-2 py-1 rounded mx-2 font-mono text-red-600">
                  {location.pathname}
                </code>
              </p>

              {/* Auto-redirect countdown */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-blue-800">
                  <Clock className="h-5 w-5" />
                  <span>
                    {isArabic 
                      ? `سيتم توجيهك تلقائياً إلى الصفحة الرئيسية خلال ${countdown} ثانية`
                      : `Auto-redirecting to home in ${countdown} seconds`
                    }
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                onClick={handleGoHome}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                size="lg"
              >
                <Home className="h-5 w-5" />
                {isArabic ? 'الصفحة الرئيسية' : 'Go Home'}
              </Button>
              
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="flex items-center gap-2"
                size="lg"
              >
                <ArrowLeft className={`h-5 w-5 ${isArabic ? 'rotate-180' : ''}`} />
                {isArabic ? 'العودة للخلف' : 'Go Back'}
              </Button>
            </div>

            {/* Suggested Pages */}
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {isArabic ? 'صفحات مقترحة' : 'Suggested Pages'}
              </h3>
              
              <div className="grid gap-3">
                {filteredSuggestions.map((page) => (
                  <Link
                    key={page.path}
                    to={page.path}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-green-700">
                          {page.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {page.description}
                        </p>
                      </div>
                      <ArrowLeft className={`h-4 w-4 text-gray-400 group-hover:text-green-600 ${isArabic ? 'rotate-180' : ''}`} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {isArabic ? 'مسجل الدخول كـ:' : 'Logged in as:'} 
                  <span className="font-medium text-gray-700 mx-1">
                    {isArabic ? user.nameArabic : user.name}
                  </span>
                  <span className="text-gray-400">
                    ({isArabic ? user.roleArabic : user.role})
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
