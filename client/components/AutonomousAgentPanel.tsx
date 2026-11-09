import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Activity, BellRing, Clock3, RefreshCw, ShieldCheck, Sprout } from "lucide-react";

type AgentStatus = {
  enabled: boolean;
  cadenceMinutes: number;
  lastScanAt: string | null;
  nextScanAt: string | null;
  lastEventsCount: number;
  farmsCount: number;
  delivery: string;
  scheduler: string;
};

type ScanEvent = { key: string; title: string; message: string; priority: "normal" | "high" };

export default function AutonomousAgentPanel() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState("");

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("يلزم تسجيل الدخول من جديد.");
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...(init.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success !== true) {
      throw new Error(payload.message || payload.code || `HTTP ${response.status}`);
    }
    return payload;
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const payload = await request("/api/assistant/agent/status");
      setStatus(payload.data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر جلب حالة المراقبة.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 60_000);
    return () => window.clearInterval(timer);
  }, [loadStatus]);

  const runScan = async () => {
    setScanning(true);
    setError("");
    try {
      const payload = await request("/api/assistant/agent/scan", { method: "POST", body: "{}" });
      const result = payload.data;
      setEvents(result.events || []);
      setLastResult(`تم فحص ${result.farmsScanned} مزرعة، واكتشاف ${result.eventsDetected} تنبيه، وإنشاء ${result.notificationsCreated} إشعار جديد.`);
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل فحص المزرعة.");
    } finally {
      setScanning(false);
    }
  };

  const updateSettings = async (patch: { enabled?: boolean; cadenceMinutes?: number }) => {
    if (!status) return;
    setSaving(true);
    setError("");
    try {
      const payload = await request("/api/assistant/agent/settings", {
        method: "PATCH",
        body: JSON.stringify({ enabled: patch.enabled ?? status.enabled, cadenceMinutes: patch.cadenceMinutes ?? status.cadenceMinutes }),
      });
      setStatus((current) => current ? { ...current, enabled: payload.data.enabled, cadenceMinutes: payload.data.cadence_minutes, lastScanAt: payload.data.last_scan_at, lastEventsCount: payload.data.last_events_count } : current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر حفظ الإعدادات.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2"><Sprout className="h-5 w-5 text-emerald-700" /></div>
            <div>
              <CardTitle className="text-lg">المستشار الزراعي المستقل</CardTitle>
              <CardDescription>يراقب سجلات المزرعة ويحوّل التواريخ والقياسات المسجلة إلى تنبيهات قابلة للمتابعة.</CardDescription>
            </div>
          </div>
          <Badge variant={status?.enabled ? "default" : "secondary"}>
            {loading ? "جارٍ التحقق" : status?.enabled ? "المراقبة مفعّلة" : "المراقبة متوقفة"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sprout className="h-4 w-4" /> المزارع المرتبطة</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{loading ? "…" : status?.farmsCount ?? "—"}</div>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><BellRing className="h-4 w-4" /> آخر عدد تنبيهات مكتشفة</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{loading ? "…" : status?.lastEventsCount ?? "—"}</div>
          </div>
          <div className="rounded-lg border bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" /> دورية الفحص</div>
            <Select value={String(status?.cadenceMinutes ?? 60)} onValueChange={(value) => void updateSettings({ cadenceMinutes: Number(value) })} disabled={!status || saving}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">كل 15 دقيقة</SelectItem>
                <SelectItem value="30">كل 30 دقيقة</SelectItem>
                <SelectItem value="60">كل ساعة</SelectItem>
                <SelectItem value="180">كل 3 ساعات</SelectItem>
                <SelectItem value="360">كل 6 ساعات</SelectItem>
                <SelectItem value="1440">كل 24 ساعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <div>
              <p className="text-sm font-medium">تفعيل المتابعة التلقائية</p>
              <p className="text-xs text-muted-foreground">يمكنك إيقافها أو إعادة تشغيلها في أي وقت.</p>
            </div>
          </div>
          <Switch checked={status?.enabled ?? false} disabled={!status || saving} onCheckedChange={(enabled) => void updateSettings({ enabled })} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>آخر فحص: {status?.lastScanAt ? new Date(status.lastScanAt).toLocaleString() : "لم يتم الفحص بعد"}</span>
          <span>الفحص المجدول: {status?.nextScanAt ? new Date(status.nextScanAt).toLocaleString() : "بانتظار أول فحص"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void runScan()} disabled={scanning || loading || !status?.farmsCount}>
            <Activity className="mr-2 h-4 w-4" />{scanning ? "جارٍ فحص بيانات المزرعة..." : "افحص مزرعتي الآن"}
          </Button>
          <Button variant="outline" onClick={() => void loadStatus()} disabled={loading || scanning}>
            <RefreshCw className="mr-2 h-4 w-4" />تحديث الحالة
          </Button>
        </div>

        {lastResult && <p className="rounded-lg bg-emerald-100/70 p-3 text-sm text-emerald-900">{lastResult}</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {events.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">نتائج آخر فحص</p>
            {events.map((event) => (
              <div key={event.key} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <Badge variant={event.priority === "high" ? "destructive" : "secondary"}>{event.priority === "high" ? "أولوية مرتفعة" : "متابعة"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{event.message}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          هذا المفتاح يحفظ تفضيل المراقبة ولا يثبت وحده أن الجدولة تعمل. يلزم تطبيق ملف SQL وإعداد أسرار Render وGitHub وتشغيل Workflow من الفرع الافتراضي.
        </p>
        <p className="text-xs text-muted-foreground">
          حدود النسخة الحالية: الفحص يعتمد على سجلات المزارع والمحاصيل وتحاليل التربة والحساسات المسجلة. لا يدّعي مراقبة بث حي أو الطقس أو الأمراض أو السوق بعد. التنبيهات داخل المنصة فقط؛ البريد وSMS وPush غير مفعّلة.
        </p>
      </CardContent>
    </Card>
  );
}
