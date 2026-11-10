import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Pencil, Trash2, Wrench, ClipboardList } from "lucide-react";

type Farm = { id: string; name: string; size_hectares?: number };
type Equipment = {
  id: string; farm_id: string; name: string; category: string; brand: string;
  model: string; serial_number: string | null; purchase_date: string | null;
  purchase_cost: number | null; currency: string; condition: string; status: string; notes: string;
};
type FarmTask = {
  id: string; farm_id: string; title: string; description: string; task_type: string;
  priority: string; status: string; due_date: string | null; assigned_to: string | null;
};

const emptyEquipment = {
  name: "", category: "other", brand: "", model: "", serial_number: "",
  purchase_date: "", purchase_cost: "", condition: "unknown", status: "active", notes: "",
};
const emptyTask = {
  title: "", description: "", task_type: "general", priority: "medium",
  status: "pending", due_date: "", assigned_to: "",
};

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || (body.success !== true && body.status !== "success")) {
    throw new Error(body.message || `Request failed (HTTP ${response.status})`);
  }
  return body;
}

export default function FarmOperationsManager() {
  const { isArabic } = useLanguage();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [equipmentForm, setEquipmentForm] = useState<any>(emptyEquipment);
  const [taskForm, setTaskForm] = useState<any>(emptyTask);
  const [editingEquipment, setEditingEquipment] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newFarm, setNewFarm] = useState({ name: "", region: "", size_hectares: "" });
  const ar = isArabic;

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await readJson(await apiFetch("/api/farms", { headers: { Accept: "application/json" } }));
      const rows = Array.isArray(body.data) ? body.data : [];
      setFarms(rows);
      setFarmId((current) => rows.some((farm: Farm) => farm.id === current) ? current : (rows[0]?.id ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : (ar ? "تعذّر تحميل المزارع." : "Could not load farms."));
    } finally {
      setLoading(false);
    }
  }, [ar]);

  const loadOperations = useCallback(async () => {
    if (!farmId) {
      setEquipment([]);
      setTasks([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [equipmentBody, tasksBody] = await Promise.all([
        apiFetch(`/api/farm-operations/equipment?farm_id=${encodeURIComponent(farmId)}`).then(readJson),
        apiFetch(`/api/farm-operations/tasks?farm_id=${encodeURIComponent(farmId)}`).then(readJson),
      ]);
      setEquipment(Array.isArray(equipmentBody.data) ? equipmentBody.data : []);
      setTasks(Array.isArray(tasksBody.data) ? tasksBody.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : (ar ? "تعذّر تحميل العمليات." : "Could not load farm operations."));
    } finally {
      setLoading(false);
    }
  }, [farmId, ar]);

  useEffect(() => { void loadFarms(); }, [loadFarms]);
  useEffect(() => { void loadOperations(); }, [loadOperations]);

  const createFarm = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null); setNotice(null);
    try {
      const response = await apiFetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newFarm, size_hectares: Number(newFarm.size_hectares) }),
      });
      const body = await readJson(response);
      setNewFarm({ name: "", region: "", size_hectares: "" });
      setNotice(ar ? "تم إنشاء المزرعة وحفظها." : "Farm created and saved.");
      await loadFarms();
      if (body.data?.id) setFarmId(body.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Farm creation failed.");
    } finally { setSaving(false); }
  };

  const saveEquipment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!farmId) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      const url = editingEquipment ? `/api/farm-operations/equipment/${editingEquipment}` : "/api/farm-operations/equipment";
      const response = await apiFetch(url, {
        method: editingEquipment ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...equipmentForm, farm_id: farmId, purchase_cost: equipmentForm.purchase_cost === "" ? null : Number(equipmentForm.purchase_cost) }),
      });
      await readJson(response);
      setEquipmentForm(emptyEquipment); setEditingEquipment(null);
      setNotice(ar ? "تم حفظ المعدّة في قاعدة البيانات." : "Equipment saved to the database.");
      await loadOperations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Equipment save failed.");
    } finally { setSaving(false); }
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!farmId) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      const url = editingTask ? `/api/farm-operations/tasks/${editingTask}` : "/api/farm-operations/tasks";
      const response = await apiFetch(url, {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskForm, farm_id: farmId }),
      });
      await readJson(response);
      setTaskForm(emptyTask); setEditingTask(null);
      setNotice(ar ? "تم حفظ المهمة في قاعدة البيانات." : "Task saved to the database.");
      await loadOperations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task save failed.");
    } finally { setSaving(false); }
  };

  const removeRecord = async (kind: "equipment" | "tasks", id: string) => {
    if (!window.confirm(ar ? "هل تريد حذف هذا السجل نهائياً؟" : "Delete this record permanently?")) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      await readJson(await apiFetch(`/api/farm-operations/${kind}/${id}`, { method: "DELETE" }));
      setNotice(ar ? "تم الحذف من قاعدة البيانات." : "Record deleted from the database.");
      await loadOperations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally { setSaving(false); }
  };

  const editEquipment = (item: Equipment) => {
    setEditingEquipment(item.id);
    setEquipmentForm({
      name: item.name, category: item.category, brand: item.brand || "", model: item.model || "",
      serial_number: item.serial_number || "", purchase_date: item.purchase_date || "",
      purchase_cost: item.purchase_cost == null ? "" : String(item.purchase_cost),
      condition: item.condition, status: item.status, notes: item.notes || "",
    });
  };
  const editTask = (item: FarmTask) => {
    setEditingTask(item.id);
    setTaskForm({
      title: item.title, description: item.description || "", task_type: item.task_type,
      priority: item.priority, status: item.status, due_date: item.due_date || "",
      assigned_to: item.assigned_to || "",
    });
  };

  const fieldClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  const labelClass = "mb-1 block text-sm font-medium";
  const inputField = (label: string, value: string, onChange: (value: string) => void, type = "text") => (
    <label className="block"><span className={labelClass}>{label}</span><Input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />{ar ? "سجلّ المعدات والمهام" : "Equipment & Task Register"}</CardTitle>
        <CardDescription>{ar ? "إدارة سجلات حقيقية محفوظة في Supabase، مع عزل بيانات كل مزرعة." : "Manage real Supabase records with farm-level tenant isolation."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1"><span className={labelClass}>{ar ? "المزرعة" : "Farm"}</span>
            <select className={fieldClass} value={farmId} onChange={(e) => setFarmId(e.target.value)}>
              <option value="">{ar ? "اختر مزرعة" : "Select a farm"}</option>
              {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
            </select>
          </label>
          <Button type="button" variant="outline" onClick={() => { void loadFarms(); void loadOperations(); }} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />{ar ? "تحديث" : "Refresh"}</Button>
        </div>

        {error && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        {notice && <div role="status" className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm">{notice}</div>}
        {!loading && farms.length === 0 && <form onSubmit={createFarm} className="grid gap-3 rounded-lg border border-dashed p-4 sm:grid-cols-3">
          <div className="sm:col-span-3"><p className="font-medium">{ar ? "إنشاء أول مزرعة" : "Create your first farm"}</p><p className="text-sm text-muted-foreground">{ar ? "يلزم تسجيل مزرعة قبل إضافة المعدات والمهام." : "A farm is required before adding equipment and tasks."}</p></div>
          {inputField(ar ? "اسم المزرعة *" : "Farm name *", newFarm.name, (v) => setNewFarm((p) => ({ ...p, name: v })))}
          {inputField(ar ? "الولاية / المنطقة *" : "Region *", newFarm.region, (v) => setNewFarm((p) => ({ ...p, region: v })))}
          {inputField(ar ? "المساحة (هكتار) *" : "Area (hectares) *", newFarm.size_hectares, (v) => setNewFarm((p) => ({ ...p, size_hectares: v })), "number")}
          <div className="sm:col-span-3"><Button type="submit" disabled={saving || !newFarm.name.trim() || !newFarm.region.trim() || Number(newFarm.size_hectares) <= 0}><Plus className="mr-2 h-4 w-4" />{ar ? "إنشاء المزرعة" : "Create farm"}</Button></div>
        </form>}

        {farmId && <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{ar ? "المعدات" : "Equipment"} <Badge variant="secondary">{equipment.length}</Badge></h3></div>
            <form onSubmit={saveEquipment} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              {inputField(ar ? "اسم المعدّة *" : "Equipment name *", equipmentForm.name, (v) => setEquipmentForm((p: any) => ({ ...p, name: v })))}
              <label className="block"><span className={labelClass}>{ar ? "الفئة" : "Category"}</span><select className={fieldClass} value={equipmentForm.category} onChange={(e) => setEquipmentForm((p: any) => ({ ...p, category: e.target.value }))}>{["tractor","irrigation","vehicle","harvester","sprayer","sensor","tool","other"].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
              {inputField(ar ? "الشركة المصنّعة" : "Brand", equipmentForm.brand, (v) => setEquipmentForm((p: any) => ({ ...p, brand: v })))}
              {inputField(ar ? "الطراز" : "Model", equipmentForm.model, (v) => setEquipmentForm((p: any) => ({ ...p, model: v })))}
              {inputField(ar ? "الرقم التسلسلي" : "Serial number", equipmentForm.serial_number, (v) => setEquipmentForm((p: any) => ({ ...p, serial_number: v })))}
              {inputField(ar ? "تاريخ الشراء" : "Purchase date", equipmentForm.purchase_date, (v) => setEquipmentForm((p: any) => ({ ...p, purchase_date: v })), "date")}
              {inputField(ar ? "تكلفة الشراء (د.ت)" : "Purchase cost (TND)", equipmentForm.purchase_cost, (v) => setEquipmentForm((p: any) => ({ ...p, purchase_cost: v })), "number")}
              <label className="block"><span className={labelClass}>{ar ? "الحالة" : "Condition"}</span><select className={fieldClass} value={equipmentForm.condition} onChange={(e) => setEquipmentForm((p: any) => ({ ...p, condition: e.target.value }))}>{["new","good","fair","poor","out_of_service","unknown"].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
              <label className="block"><span className={labelClass}>{ar ? "الوضع" : "Status"}</span><select className={fieldClass} value={equipmentForm.status} onChange={(e) => setEquipmentForm((p: any) => ({ ...p, status: e.target.value }))}>{["active","maintenance","inactive","retired"].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
              <label className="block sm:col-span-2"><span className={labelClass}>{ar ? "ملاحظات" : "Notes"}</span><Textarea value={equipmentForm.notes} onChange={(e) => setEquipmentForm((p: any) => ({ ...p, notes: e.target.value }))} /></label>
              <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={saving || !equipmentForm.name.trim()}><Plus className="mr-2 h-4 w-4" />{editingEquipment ? (ar ? "حفظ التعديل" : "Save changes") : (ar ? "إضافة معدّة" : "Add equipment")}</Button>{editingEquipment && <Button type="button" variant="outline" onClick={() => { setEditingEquipment(null); setEquipmentForm(emptyEquipment); }}>{ar ? "إلغاء" : "Cancel"}</Button>}</div>
            </form>
            <div className="space-y-2">{equipment.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.category} · {item.brand} {item.model} · {item.status}</p></div><div className="flex shrink-0 gap-1"><Button type="button" size="icon" variant="ghost" aria-label="Edit equipment" onClick={() => editEquipment(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label="Delete equipment" disabled={saving} onClick={() => void removeRecord("equipment", item.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}{!loading && equipment.length === 0 && <p className="text-sm text-muted-foreground">{ar ? "لا توجد معدات مسجلة." : "No equipment records yet."}</p>}</div>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4" />{ar ? "المهام الزراعية" : "Farm tasks"} <Badge variant="secondary">{tasks.length}</Badge></h3>
            <form onSubmit={saveTask} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{inputField(ar ? "عنوان المهمة *" : "Task title *", taskForm.title, (v) => setTaskForm((p: any) => ({ ...p, title: v })))}</div>
              <label className="block"><span className={labelClass}>{ar ? "نوع المهمة" : "Task type"}</span><select className={fieldClass} value={taskForm.task_type} onChange={(e) => setTaskForm((p: any) => ({ ...p, task_type: e.target.value }))}>{["planting","irrigation","fertilization","pest_control","harvesting","maintenance","inspection","general"].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
              <label className="block"><span className={labelClass}>{ar ? "الأولوية" : "Priority"}</span><select className={fieldClass} value={taskForm.priority} onChange={(e) => setTaskForm((p: any) => ({ ...p, priority: e.target.value }))}>{["low","medium","high","urgent"].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
              <label className="block"><span className={labelClass}>{ar ? "الحالة" : "Status"}</span><select className={fieldClass} value={taskForm.status} onChange={(e) => setTaskForm((p: any) => ({ ...p, status: e.target.value }))}>{["pending","in_progress","completed","cancelled"].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
              {inputField(ar ? "تاريخ الاستحقاق" : "Due date", taskForm.due_date, (v) => setTaskForm((p: any) => ({ ...p, due_date: v })), "date")}
              <label className="block sm:col-span-2"><span className={labelClass}>{ar ? "الوصف" : "Description"}</span><Textarea value={taskForm.description} onChange={(e) => setTaskForm((p: any) => ({ ...p, description: e.target.value }))} /></label>
              <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={saving || !taskForm.title.trim()}><Plus className="mr-2 h-4 w-4" />{editingTask ? (ar ? "حفظ التعديل" : "Save changes") : (ar ? "إضافة مهمة" : "Add task")}</Button>{editingTask && <Button type="button" variant="outline" onClick={() => { setEditingTask(null); setTaskForm(emptyTask); }}>{ar ? "إلغاء" : "Cancel"}</Button>}</div>
            </form>
            <div className="space-y-2">{tasks.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><div className="min-w-0"><p className="truncate font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.task_type} · {item.priority} · {item.status}{item.due_date ? ` · ${item.due_date}` : ""}</p></div><div className="flex shrink-0 gap-1"><Button type="button" size="icon" variant="ghost" aria-label="Edit task" onClick={() => editTask(item)}><Pencil className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label="Delete task" disabled={saving} onClick={() => void removeRecord("tasks", item.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}{!loading && tasks.length === 0 && <p className="text-sm text-muted-foreground">{ar ? "لا توجد مهام مسجلة." : "No tasks recorded yet."}</p>}</div>
          </section>
        </div>}
        {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />{ar ? "جاري تحميل السجلات..." : "Loading records..."}</div>}
      </CardContent>
    </Card>
  );
}
