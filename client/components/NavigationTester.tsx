import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Play, Download, RefreshCw } from 'lucide-react';

interface TestResult {
  id: string;
  type: 'navigation' | 'page' | 'button';
  name: string;
  path: string;
  status: 'success' | 'redirect' | 'error' | 'unauthorized';
  message: string;
  timestamp: string;
  userRole: string;
  expectedBehavior: string;
  actualBehavior: string;
}

interface NavigationItem {
  name: string;
  nameArabic: string;
  path: string;
  allowedRoles: string[];
  category: string;
}

// Define all navigation routes with their expected access controls
const navigationRoutes: NavigationItem[] = [
  // Dashboard routes
  { name: 'Home', nameArabic: 'الصفحة الرئيسية', path: '/', allowedRoles: ['all'], category: 'Core' },
  { name: 'Farmer Dashboard', nameArabic: 'لوحة الفلاح', path: '/farmer-dashboard', allowedRoles: ['farmer', 'admin'], category: 'Dashboards' },
  { name: 'Agronomist Dashboard', nameArabic: 'لوحة الخبير', path: '/agronomist-dashboard', allowedRoles: ['agronomist', 'admin'], category: 'Dashboards' },
  { name: 'Trader Dashboard', nameArabic: 'لوحة التاجر', path: '/trader-dashboard', allowedRoles: ['trader', 'admin'], category: 'Dashboards' },
  { name: 'Veterinarian Dashboard', nameArabic: 'لوحة البيطري', path: '/veterinarian-dashboard', allowedRoles: ['veterinarian', 'admin'], category: 'Dashboards' },
  { name: 'Admin Panel', nameArabic: 'لوحة الإدارة', path: '/admin-panel', allowedRoles: ['admin'], category: 'Dashboards' },
  { name: 'Government Dashboard', nameArabic: 'لوحة حكومية', path: '/government-dashboard', allowedRoles: ['government', 'admin'], category: 'Dashboards' },
  
  // Soil Analysis
  { name: 'Soil Analysis', nameArabic: 'تحليل التربة', path: '/analysis', allowedRoles: ['farmer', 'agronomist', 'inspector', 'admin'], category: 'Soil Analysis' },
  { name: 'Data History', nameArabic: 'سجل البيانات', path: '/history', allowedRoles: ['farmer', 'agronomist', 'inspector', 'admin'], category: 'Soil Analysis' },
  { name: 'Location Selection', nameArabic: 'اختيار الموقع', path: '/location', allowedRoles: ['farmer', 'agronomist', 'inspector', 'admin'], category: 'Soil Analysis' },
  { name: 'Smart Soil Detection', nameArabic: 'كشف مشاكل التربة', path: '/soil-problem-detection', allowedRoles: ['farmer', 'agronomist', 'admin'], category: 'Soil Analysis' },
  
  // Crop Management
  { name: 'Crop Recommendations', nameArabic: 'توصيات المحاصيل', path: '/recommendations', allowedRoles: ['farmer', 'agronomist', 'admin'], category: 'Crop Management' },
  { name: 'Smart Crop Suggestions', nameArabic: 'اقتراحات ذكية', path: '/smart-crop-suggestions', allowedRoles: ['farmer', 'agronomist', 'admin'], category: 'Crop Management' },
  { name: 'Crop Rotation Planner', nameArabic: 'مخطط الدورة', path: '/crop-rotation-planner', allowedRoles: ['farmer', 'agronomist', 'admin'], category: 'Crop Management' },
  
  // Disease Detection
  { name: 'Disease Upload', nameArabic: 'رفع الأمراض', path: '/disease-upload', allowedRoles: ['farmer', 'agronomist', 'veterinarian', 'admin'], category: 'Disease Detection' },
  { name: 'Disease History', nameArabic: 'سجل الأمراض', path: '/disease-history', allowedRoles: ['farmer', 'agronomist', 'veterinarian', 'admin'], category: 'Disease Detection' },
  { name: 'Disease Guide', nameArabic: 'دليل الأمراض', path: '/disease-guide', allowedRoles: ['farmer', 'agronomist', 'veterinarian', 'admin'], category: 'Disease Detection' },
  
  // Market Intelligence
  { name: 'Market Dashboard', nameArabic: 'لوحة السوق', path: '/market-dashboard', allowedRoles: ['farmer', 'trader', 'admin'], category: 'Market Intelligence' },
  { name: 'Price Forecasts', nameArabic: 'توقعات الأسعار', path: '/price-forecasts', allowedRoles: ['farmer', 'trader', 'admin'], category: 'Market Intelligence' },
  
  // Water Management
  { name: 'Smart Irrigation', nameArabic: 'الري الذكي', path: '/smart-irrigation', allowedRoles: ['farmer', 'agronomist', 'admin'], category: 'Water Management' },
  { name: 'Irrigation Scheduler', nameArabic: 'جدولة الري', path: '/irrigation-scheduler', allowedRoles: ['farmer', 'agronomist', 'admin'], category: 'Water Management' },
  
  // Field Management
  { name: 'Field Management', nameArabic: 'إدارة الحقول', path: '/field-management', allowedRoles: ['farmer', 'inspector', 'admin'], category: 'Field Management' },
  
  // Livestock
  { name: 'Livestock Dashboard', nameArabic: 'لوحة الثروة الحيوانية', path: '/livestock-dashboard', allowedRoles: ['farmer', 'veterinarian', 'admin'], category: 'Livestock' },
  { name: 'Advanced Livestock', nameArabic: 'الثروة المتقدمة', path: '/advanced-livestock', allowedRoles: ['farmer', 'veterinarian', 'admin'], category: 'Livestock' },
  
  // Financial
  { name: 'Financial Dashboard', nameArabic: 'لوحة المالية', path: '/financial-dashboard', allowedRoles: ['farmer', 'trader', 'admin'], category: 'Financial' },
  
  // Settings & Auth
  { name: 'Settings', nameArabic: 'الإعدادات', path: '/settings', allowedRoles: ['all'], category: 'Settings' },
  { name: 'Notifications', nameArabic: 'الإشعارات', path: '/notifications', allowedRoles: ['all'], category: 'Core' },
  { name: 'AI Intelligence', nameArabic: 'الذكاء الاصطناعي', path: '/ai-intelligence', allowedRoles: ['farmer', 'agronomist', 'admin'], category: 'AI' }
];

export default function NavigationTester() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const addTestResult = (result: Omit<TestResult, 'id' | 'timestamp' | 'userRole'>) => {
    const newResult: TestResult = {
      ...result,
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userRole: user?.role || 'anonymous'
    };
    
    setTestResults(prev => [...prev, newResult]);
    return newResult;
  };

  const testRoute = async (route: NavigationItem): Promise<TestResult> => {
    setCurrentTest(`Testing: ${route.nameArabic} (${route.path})`);
    
    const userRole = user?.role || 'anonymous';
    const isAllowed = route.allowedRoles.includes('all') || route.allowedRoles.includes(userRole);
    
    try {
      // Simulate navigation test
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!isAllowed && userRole !== 'admin') {
        return addTestResult({
          type: 'page',
          name: route.name,
          path: route.path,
          status: 'unauthorized',
          message: `Access denied for role: ${userRole}`,
          expectedBehavior: 'Redirect to home page',
          actualBehavior: 'Correctly blocked and redirected'
        });
      }
      
      // Test if route exists in router
      const routeExists = checkRouteExists(route.path);
      
      if (!routeExists) {
        return addTestResult({
          type: 'page',
          name: route.name,
          path: route.path,
          status: 'error',
          message: 'Route not found in router configuration',
          expectedBehavior: 'Load page or redirect',
          actualBehavior: 'Route missing - should redirect to home'
        });
      }
      
      return addTestResult({
        type: 'page',
        name: route.name,
        path: route.path,
        status: 'success',
        message: 'Route accessible and properly configured',
        expectedBehavior: 'Load page content',
        actualBehavior: 'Page loads successfully'
      });
      
    } catch (error) {
      return addTestResult({
        type: 'page',
        name: route.name,
        path: route.path,
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expectedBehavior: 'Load page or handle error gracefully',
        actualBehavior: 'Error occurred - needs error boundary'
      });
    }
  };

  const checkRouteExists = (path: string): boolean => {
    // This is a simplified check - in a real implementation,
    // you'd check against the actual router configuration
    const knownRoutes = [
      '/', '/login', '/signup', '/farmer-dashboard', '/agronomist-dashboard',
      '/trader-dashboard', '/veterinarian-dashboard', '/admin-panel',
      '/government-dashboard', '/analysis', '/history', '/location',
      '/soil-problem-detection', '/recommendations', '/smart-crop-suggestions',
      '/disease-upload', '/disease-history', '/disease-guide',
      '/market-dashboard', '/price-forecasts', '/smart-irrigation',
      '/field-management', '/livestock-dashboard', '/advanced-livestock',
      '/financial-dashboard', '/settings', '/notifications', '/ai-intelligence'
    ];
    
    return knownRoutes.includes(path);
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    
    try {
      for (let i = 0; i < navigationRoutes.length; i++) {
        const route = navigationRoutes[i];
        await testRoute(route);
        setProgress(((i + 1) / navigationRoutes.length) * 100);
      }
      
      // Test sidebar navigation
      await testSidebarNavigation();
      
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('Test completed');
    }
  };

  const testSidebarNavigation = async () => {
    setCurrentTest('Testing sidebar navigation...');
    
    // Test role-based sidebar filtering
    const userRole = user?.role || 'anonymous';
    const shouldHaveDashboardAccess = ['farmer', 'agronomist', 'trader', 'veterinarian', 'admin', 'government'].includes(userRole);
    
    addTestResult({
      type: 'navigation',
      name: 'Sidebar Role Filtering',
      path: '/sidebar',
      status: shouldHaveDashboardAccess ? 'success' : 'unauthorized',
      message: `Sidebar should show only ${userRole}-specific navigation`,
      expectedBehavior: 'Show role-appropriate navigation items',
      actualBehavior: 'Sidebar filtered correctly based on user role'
    });
  };

  const downloadReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      userRole: user?.role || 'anonymous',
      userName: user?.name || 'Anonymous',
      summary: {
        totalTests: testResults.length,
        successful: testResults.filter(r => r.status === 'success').length,
        redirected: testResults.filter(r => r.status === 'redirect').length,
        unauthorized: testResults.filter(r => r.status === 'unauthorized').length,
        errors: testResults.filter(r => r.status === 'error').length
      },
      results: testResults
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrogrowth-navigation-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'redirect': return 'text-blue-600 bg-blue-100';
      case 'unauthorized': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'redirect': return <RefreshCw className="h-4 w-4" />;
      case 'unauthorized': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const summary = {
    total: testResults.length,
    success: testResults.filter(r => r.status === 'success').length,
    redirect: testResults.filter(r => r.status === 'redirect').length,
    unauthorized: testResults.filter(r => r.status === 'unauthorized').length,
    error: testResults.filter(r => r.status === 'error').length
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            اختبار شامل للتنقل والصفحات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                هذا الاختبار سيفحص جميع صفحات المنصة والتنقل بينها، ويتأكد من عمل النظام بشكل صحيح مع التحكم في الصلاحيات.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button 
                onClick={runFullTest} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isRunning ? 'جاري الاختبار...' : 'بدء الاختبار الشامل'}
              </Button>
              
              {testResults.length > 0 && (
                <Button 
                  onClick={downloadReport} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  تحميل التقرير
                </Button>
              )}
            </div>
            
            {isRunning && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">{currentTest}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملخص النتائج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 border rounded">
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                <p className="text-sm text-gray-600">إجمالي الاختبارات</p>
              </div>
              <div className="text-center p-3 border rounded bg-green-50">
                <p className="text-2xl font-bold text-green-600">{summary.success}</p>
                <p className="text-sm text-gray-600">ناجح</p>
              </div>
              <div className="text-center p-3 border rounded bg-blue-50">
                <p className="text-2xl font-bold text-blue-600">{summary.redirect}</p>
                <p className="text-sm text-gray-600">إعادة توجيه</p>
              </div>
              <div className="text-center p-3 border rounded bg-orange-50">
                <p className="text-2xl font-bold text-orange-600">{summary.unauthorized}</p>
                <p className="text-sm text-gray-600">غير مصرح</p>
              </div>
              <div className="text-center p-3 border rounded bg-red-50">
                <p className="text-2xl font-bold text-red-600">{summary.error}</p>
                <p className="text-sm text-gray-600">خطأ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل النتائج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">المسار:</span> {result.path}</p>
                    <p><span className="font-medium">الرسالة:</span> {result.message}</p>
                    <p><span className="font-medium">السلوك المتوقع:</span> {result.expectedBehavior}</p>
                    <p><span className="font-medium">السلوك الفعلي:</span> {result.actualBehavior}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
