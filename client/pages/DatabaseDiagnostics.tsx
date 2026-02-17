import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Key,
  Users,
  Settings,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface TestResult {
  name: string;
  nameAr: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: any;
}

const DatabaseDiagnostics: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const runDiagnostics = async () => {
    setIsLoading(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Basic Supabase connection
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        testResults.push({
          name: "Supabase Connection",
          nameAr: "اتصال Supabase",
          status: "success",
          message: "Connection established successfully",
        });
      } catch (error: any) {
        testResults.push({
          name: "Supabase Connection",
          nameAr: "اتصال Supabase",
          status: "error",
          message: "Connection failed: " + error.message,
          details: error,
        });
      }

      // Test 2: Users table access
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .limit(1);

        if (error) {
          testResults.push({
            name: "Users Table",
            nameAr: "جدول المستخدمين",
            status: "error",
            message: "Table access failed: " + error.message,
            details: error,
          });
        } else {
          testResults.push({
            name: "Users Table",
            nameAr: "جدول المستخدمين",
            status: "success",
            message: "Table accessible and ready",
          });
        }
      } catch (error: any) {
        testResults.push({
          name: "Users Table",
          nameAr: "جدول المستخدمين",
          status: "error",
          message: "Exception: " + error.message,
          details: error,
        });
      }

      // Test 3: User profiles table access
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("id")
          .limit(1);

        if (error) {
          testResults.push({
            name: "User Profiles Table",
            nameAr: "جدول ملفات المستخدمين",
            status: "error",
            message: "Table access failed: " + error.message,
            details: error,
          });
        } else {
          testResults.push({
            name: "User Profiles Table",
            nameAr: "جدول ملفات المستخدمين",
            status: "success",
            message: "Table accessible and ready",
          });
        }
      } catch (error: any) {
        testResults.push({
          name: "User Profiles Table",
          nameAr: "جدول ملفات المستخدمين",
          status: "error",
          message: "Exception: " + error.message,
          details: error,
        });
      }

      // Test 4: Insert permissions test
      try {
        const testId = "test-" + Date.now();
        const { error: insertError } = await supabase.from("users").insert({
          id: testId,
          email: "test@example.com",
          full_name: "Test User",
          full_name_ar: "مستخدم تجريبي",
          role: "farmer",
          verified: false,
        });

        if (insertError) {
          testResults.push({
            name: "Insert Permissions",
            nameAr: "صلاحيات الإدراج",
            status: "error",
            message: "Insert failed: " + insertError.message,
            details: insertError,
          });
        } else {
          testResults.push({
            name: "Insert Permissions",
            nameAr: "صلاحيات الإدراج",
            status: "success",
            message: "Insert permissions working",
          });

          // Clean up test record
          await supabase.from("users").delete().eq("id", testId);
        }
      } catch (error: any) {
        testResults.push({
          name: "Insert Permissions",
          nameAr: "صلاحيات الإدراج",
          status: "error",
          message: "Exception: " + error.message,
          details: error,
        });
      }

      // Test 5: RLS policies
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          testResults.push({
            name: "Row Level Security",
            nameAr: "أمان مستوى الصفوف",
            status: "warning",
            message: "User authenticated - RLS may be blocking operations",
          });
        } else {
          testResults.push({
            name: "Row Level Security",
            nameAr: "أمان مستوى الصفوف",
            status: "warning",
            message: "No authenticated user - anonymous access",
          });
        }
      } catch (error: any) {
        testResults.push({
          name: "Row Level Security",
          nameAr: "أمان مستوى الصفوف",
          status: "error",
          message: "Error checking auth: " + error.message,
          details: error,
        });
      }
    } catch (error) {
      console.error("Diagnostics error:", error);
    }

    setResults(testResults);
    setLastUpdated(new Date().toLocaleString("ar-TN"));
    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            نجح
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">فشل</Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            تحذير
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            غير معروف
          </Badge>
        );
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Database className="h-8 w-8" />
              تشخيص قاعدة البيانات
            </h1>
            <p className="text-muted-foreground mt-2">
              فحص اتصال وإعدادات قاعدة بيانات Supabase
            </p>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "جاري الفحص..." : "إعادة فحص"}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الاختبارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                نجحت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {successCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                تحذيرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {warningCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                أخطاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {errorCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>نتائج التشخيص</CardTitle>
            <CardDescription>آخر فحص: {lastUpdated}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-medium">{result.nameAr}</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.name}
                      </p>
                      <p className="text-sm">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            عرض التفاصيل
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {errorCount > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>إصلاح مطلوب:</strong> توجد أخطاء في قاعدة البيانات. تأكد
              من:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>تشغيل ملفات cloud-setup.sql و supabase-setup.sql</li>
                <li>تعيين صلاحيات RLS بشكل صحيح</li>
                <li>صحة مفاتيح API</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default DatabaseDiagnostics;
