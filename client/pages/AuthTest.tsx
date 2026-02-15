import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle, XCircle, Mail, Lock, TestTube } from "lucide-react";

const AuthTest: React.FC = () => {
  const [testData, setTestData] = useState({
    email: "test@example.com",
    password: "test123456",
  });
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testSignup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      setResults({ type: "signup", ...result });
    } catch (error: any) {
      setResults({ type: "signup", status: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testSignin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      setResults({ type: "signin", ...result });
    } catch (error: any) {
      setResults({ type: "signin", status: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            اختبار نظام المصادقة
          </h1>
          <p className="text-muted-foreground mt-2">
            اختبار Supabase Auth بشكل مباشر
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>بيانات الاختبار</CardTitle>
            <CardDescription>
              أدخل بيانات المستخدم لاختبار التسجيل وتسجيل الدخول
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={testData.email}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="test@example.com"
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={testData.password}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="كلمة المرور"
                    className="pr-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={testSignup}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                اختبار التسجيل
              </Button>
              <Button
                onClick={testSignin}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                اختبار تسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.status === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                نتيجة اختبار{" "}
                {results.type === "signup" ? "التسجيل" : "تسجيل الدخول"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert
                  variant={
                    results.status === "success" ? "default" : "destructive"
                  }
                >
                  <AlertDescription>
                    <strong>الحالة:</strong>{" "}
                    {results.status === "success" ? "نجح" : "فشل"}
                    <br />
                    <strong>الرسالة:</strong> {results.message}
                  </AlertDescription>
                </Alert>

                {results.data && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">تفاصيل النتيجة:</h4>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(results.data, null, 2)}
                    </pre>
                  </div>
                )}

                {results.error_details && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-red-800">
                      تفاصيل الخطأ:
                    </h4>
                    <pre className="text-sm text-red-700 overflow-auto">
                      {JSON.stringify(results.error_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>ملاحظات مهمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                • إذا كان التسجيل ناجحاً ولكن needs_confirmation = true، فإن
                Supabase يتطلب تأكيد البريد الإلكتروني
              </p>
              <p>
                • إذا فشل تسجيل الدخول بـ "Invalid login credentials"، تحقق من:
              </p>
              <ul className="list-disc list-inside mr-4 space-y-1">
                <li>هل تم إنشاء المستخدم بنجاح؟</li>
                <li>هل يحتاج المستخدم لتأكيد البريد الإلكتروني؟</li>
                <li>هل كلمة المرور صحيحة؟</li>
              </ul>
              <p>
                • يمكن تعطيل تأكيد البريد الإلكتروني من Supabase Dashboard{" "}
                {"->"} Authentication {"->"} Settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTest;
