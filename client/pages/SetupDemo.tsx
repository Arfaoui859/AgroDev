import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface UserSetupResult {
  successful: Array<{
    email: string;
    role: string;
    userId: string;
  }>;
  failed: Array<{
    email: string;
    reason: string;
  }>;
  total: number;
}

export default function SetupDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UserSetupResult | null>(null);
  const [error, setError] = useState('');

  const handleSetupDemoUsers = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup-demo-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Setup failed with status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to set up demo users');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupInspector = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup-inspector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'neuroforgesoultion@gmail.com',
          password: '123456789',
          full_name: 'مراقب الحقول',
          full_name_ar: 'مراقب الحقول',
          role: 'inspector',
        }),
      });

      if (!response.ok) {
        throw new Error(`Setup failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setResult({
          successful: [{
            email: data.email,
            role: data.role,
            userId: data.userId,
          }],
          failed: [],
          total: 1,
        });
      } else {
        setError(data.error || 'Failed to set up inspector user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set up inspector user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">إعداد المستخدمين التجريبيين</h1>
          <p className="text-gray-600">إنشاء حسابات اختبار لجميع أدوار المستخدمين في النظام</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demo Users Setup Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">إعداد جميع المستخدمين التجريبيين</CardTitle>
              <CardDescription>
                سيتم إنشاء حسابات لجميع الأدوار (فلاح، خبير، تاجر، بيطري، مراقب، مسؤول)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold text-blue-900">المستخدمون الذين سيتم إنشاؤهم:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• farmer@demo.com (فلاح)</li>
                  <li>• agronomist@demo.com (خبير زراعي)</li>
                  <li>• trader@demo.com (تاجر)</li>
                  <li>• veterinarian@demo.com (طبيب بيطري)</li>
                  <li>• neuroforgesoultion@gmail.com (مراقب حقول)</li>
                  <li>• admin@demo.com (مسؤول)</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2">كلمة المرور لجميعهم: <code>demo123</code></p>
              </div>
              <Button
                onClick={handleSetupDemoUsers}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإعداد...
                  </>
                ) : (
                  'إنشاء جميع المستخدمين التجريبيين'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Inspector Only Setup Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">إعداد مراقب الحقول</CardTitle>
              <CardDescription>
                إنشاء حساب مراقب الحقول فقط
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold text-green-900">بيانات الدخول:</p>
                <div className="space-y-1 text-green-800">
                  <p>البريد الإلكتروني: <code className="bg-white px-2 py-1 rounded">neuroforgesoultion@gmail.com</code></p>
                  <p>كلمة المرور: <code className="bg-white px-2 py-1 rounded">123456789</code></p>
                </div>
              </div>
              <Button
                onClick={handleSetupInspector}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإعد��د...
                  </>
                ) : (
                  'إنشاء حساب مراقب الحقول'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Results */}
        {result && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                تم إعداد المستخدمين بنجاح
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.successful.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">المستخدمون المنشأة بنجاح:</h3>
                  <div className="space-y-2">
                    {result.successful.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 bg-white rounded border border-green-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">{user.role}</p>
                        </div>
                        <Badge className="bg-green-600">{user.userId.slice(0, 8)}...</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.failed.length > 0 && (
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">الأخطاء:</h3>
                  <div className="space-y-2">
                    {result.failed.map((failed) => (
                      <div
                        key={failed.email}
                        className="flex items-center justify-between p-3 bg-white rounded border border-orange-200"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{failed.email}</p>
                          <p className="text-sm text-orange-600">{failed.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg text-sm mt-4">
                <p className="font-semibold text-blue-900 mb-2">الخطوة التالية:</p>
                <p className="text-blue-800">
                  يمكنك الآن تسجيل الدخول باستخدام أي من الحسابات المنشأة أعلاه
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
