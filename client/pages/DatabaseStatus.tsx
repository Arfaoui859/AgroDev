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
import { CheckCircle, XCircle, Database, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

const DatabaseStatus: React.FC = () => {
  const [status, setStatus] = useState({
    connected: false,
    tablesExist: false,
    canInsert: false,
    loading: true,
    error: null as string | null,
  });

  const checkDatabaseStatus = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Test 1: Basic connection
      console.log("Testing Supabase connection...");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Test 2: Check if tables exist
      console.log("Checking if tables exist...");
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id")
        .limit(1);

      const tablesExist = !usersError && !profilesError;

      // Test 3: Check insert permissions
      console.log("Testing insert permissions...");
      let canInsert = false;
      if (tablesExist) {
        const testId = "test-" + Date.now();
        const { error: insertError } = await supabase.from("users").insert({
          id: testId,
          email: "test@example.com",
          full_name: "Test User",
          full_name_ar: "مستخدم تجريبي",
          role: "farmer",
          verified: false,
        });

        if (!insertError) {
          canInsert = true;
          // Clean up test record
          await supabase.from("users").delete().eq("id", testId);
        }
      }

      setStatus({
        connected: true,
        tablesExist,
        canInsert,
        loading: false,
        error: null,
      });

      if (usersError || profilesError) {
        console.error("Table errors:", { usersError, profilesError });
      }
    } catch (error: any) {
      console.error("Database status check failed:", error);
      setStatus({
        connected: false,
        tablesExist: false,
        canInsert: false,
        loading: false,
        error: error.message,
      });
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusIcon = (isOk: boolean) => {
    return isOk ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusBadge = (isOk: boolean) => {
    return isOk ? (
      <Badge className="bg-green-100 text-green-700">جاهز</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700">غير جاهز</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              حال�� قاعدة البيانات
            </h1>
            <p className="text-muted-foreground mt-2">
              فحص جاهزية قاعدة البيانات للتسجيل الفعلي
            </p>
          </div>
          <Button
            onClick={checkDatabaseStatus}
            disabled={status.loading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${status.loading ? "animate-spin" : ""}`}
            />
            إعادة فحص
          </Button>
        </div>

        {status.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>اتصال Supabase</span>
                {getStatusIcon(status.connected)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(status.connected)}
              <p className="text-sm text-muted-foreground mt-2">
                {status.connected
                  ? "الاتصال بـ Supabase نجح"
                  : "فشل الاتصال بـ Supabase"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>الجداول المطلوبة</span>
                {getStatusIcon(status.tablesExist)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(status.tablesExist)}
              <p className="text-sm text-muted-foreground mt-2">
                {status.tablesExist
                  ? "جداول users و user_profiles موجودة"
                  : "الجداول المطلوبة غير موجودة"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>صلاحيات الإدراج</span>
                {getStatusIcon(status.canInsert)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(status.canInsert)}
              <p className="text-sm text-muted-foreground mt-2">
                {status.canInsert
                  ? "يمكن إدراج بيانات جديدة"
                  : "لا يمكن إدراج البيانات"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تقرير التشخيص</CardTitle>
          </CardHeader>
          <CardContent>
            {status.loading ? (
              <p className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                جاري فحص قاعدة البيانات...
              </p>
            ) : (
              <div className="space-y-2">
                {status.connected && status.tablesExist && status.canInsert ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>🎉 ممتاز!</strong> قاعدة البيانات جاهزة للتسجيل
                      الفعلي. يمكنك الآن إنشاء حسابات جديدة وتسجيل الدخول بنجاح.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>تحتاج إصلاح:</strong>
                      {!status.connected && (
                        <span> الاتصال بـ Supabase فاشل.</span>
                      )}
                      {!status.tablesExist && (
                        <span> الجداول المطلوبة غير موجودة.</span>
                      )}
                      {!status.canInsert && (
                        <span> صلاحيات الإدراج غير مفعلة.</span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!status.tablesExist && !status.loading && (
          <Card>
            <CardHeader>
              <CardTitle>الحل المطلوب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>لحل مشكلة الجداول المفقودة:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>افتح Supabase Dashboard</li>
                  <li>اذهب إلى SQL Editor</li>
                  <li>شغل ملفات cloud-setup.sql و supabase-setup.sql</li>
                  <li>تأكد من إنشاء الجداول وصلاحيات RLS</li>
                  <li>اضغط "إعادة فحص" للتحقق من الإصلاح</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DatabaseStatus;
