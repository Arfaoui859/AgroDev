import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NavigationTester from '@/components/NavigationTester';
import { TestTube, Shield, Navigation, Bug, Database, Monitor } from 'lucide-react';

export default function SystemTest() {
  const { user } = useAuth();
  const { isArabic } = useLanguage();

  // Get stored logs
  const getStoredErrors = () => {
    return JSON.parse(localStorage.getItem('agrogrowth_errors') || '[]');
  };

  const getStoredAccessLogs = () => {
    return JSON.parse(localStorage.getItem('agrogrowth_access_logs') || '[]');
  };

  const getStored404Logs = () => {
    return JSON.parse(localStorage.getItem('agrogrowth_404_logs') || '[]');
  };

  const clearLogs = (type: string) => {
    localStorage.removeItem(`agrogrowth_${type}`);
    window.location.reload();
  };

  const errors = getStoredErrors();
  const accessLogs = getStoredAccessLogs();
  const notFoundLogs = getStored404Logs();

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            {isArabic ? 'اختبار النظام الشامل' : 'Comprehensive System Testing'}
          </h1>
          <p className="text-muted-foreground">
            {isArabic 
              ? 'أدوات شاملة لاختبار جميع صفحات ووظائف منصة أجرو جروث'
              : 'Comprehensive tools for testing all pages and features of AgroGrowth platform'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {isArabic ? 'مستخدم:' : 'User:'} {isArabic ? user?.roleArabic : user?.role}
          </Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={errors.length > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'أخطاء النظام' : 'System Errors'}
            </CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {errors.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'في آخر جلسة' : 'in current session'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'عمليات الوصول' : 'Access Attempts'}
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {accessLogs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'صفحة تم الوصول إليها' : 'pages accessed'}
            </p>
          </CardContent>
        </Card>

        <Card className={notFoundLogs.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? 'صفحات غير موجودة' : '404 Not Found'}
            </CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${notFoundLogs.length > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
              {notFoundLogs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'محاولات وصول فاشلة' : 'failed access attempts'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Testing Interface */}
      <Tabs defaultValue="navigation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="navigation" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            {isArabic ? 'اختبار التنقل' : 'Navigation Test'}
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            {isArabic ? 'سجل الأخطاء' : 'Error Logs'}
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {isArabic ? 'سجل الوصول' : 'Access Logs'}
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            {isArabic ? 'المراقبة' : 'Monitoring'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="navigation" className="space-y-6">
          <Alert>
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              {isArabic 
                ? 'هذا الاختبار سيفحص جميع روابط التنقل في المنصة ويتأكد من عمل النظام بشكل صحيح مع التحكم في الصلاحيات حسب دور المستخدم.'
                : 'This test will examine all navigation links in the platform and ensure the system works correctly with role-based access control.'
              }
            </AlertDescription>
          </Alert>
          
          <NavigationTester />
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{isArabic ? 'سجل الأخطاء' : 'Error Log'}</span>
                {errors.length > 0 && (
                  <button
                    onClick={() => clearLogs('errors')}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    {isArabic ? 'مسح السجل' : 'Clear Log'}
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {isArabic ? 'لا توجد أخطاء مسجلة' : 'No errors recorded'}
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {errors.map((error: any, index: number) => (
                    <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-red-800">{error.error.name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-red-700 mb-2">{error.error.message}</p>
                      <p className="text-xs text-gray-600">URL: {error.url}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{isArabic ? 'سجل الوصول' : 'Access Log'}</span>
                {accessLogs.length > 0 && (
                  <button
                    onClick={() => clearLogs('access_logs')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {isArabic ? 'مسح السجل' : 'Clear Log'}
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accessLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {isArabic ? 'لا توجد سجلات وصول' : 'No access logs recorded'}
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {accessLogs.slice(-20).reverse().map((log: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-blue-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.path}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.authenticated ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {log.authenticated ? (isArabic ? 'مصرح' : 'Authenticated') : (isArabic ? 'غير مصرح' : 'Not Auth')}
                        </span>
                        <span className="text-gray-600">
                          {isArabic ? 'الدور:' : 'Role:'} {log.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isArabic ? 'الصفحات المفقودة (404)' : '404 Not Found Pages'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notFoundLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    {isArabic ? 'لا توجد محاولات وصول فاش��ة' : 'No 404 attempts recorded'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notFoundLogs.slice(-10).reverse().map((log: any, index: number) => (
                      <div key={index} className="border border-orange-200 rounded p-2 bg-orange-50">
                        <div className="flex justify-between items-center">
                          <code className="text-sm font-mono text-orange-800">{log.path}</code>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isArabic ? 'إحصائيات النظام' : 'System Statistics'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{isArabic ? 'المستخدم الحالي:' : 'Current User:'}</span>
                    <span className="font-medium">{isArabic ? user?.nameArabic : user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isArabic ? 'الدور:' : 'Role:'}</span>
                    <span className="font-medium">{isArabic ? user?.roleArabic : user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isArabic ? 'إجمالي الأخطاء:' : 'Total Errors:'}</span>
                    <span className={`font-medium ${errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {errors.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isArabic ? 'إجمالي الوصول:' : 'Total Access:'}</span>
                    <span className="font-medium text-blue-600">{accessLogs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isArabic ? 'صفحات 404:' : '404 Pages:'}</span>
                    <span className={`font-medium ${notFoundLogs.length > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {notFoundLogs.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
