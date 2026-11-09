import type { SupabaseClient } from "@supabase/supabase-js";

type AgentEvent = {
  key: string;
  farmId: string;
  type: string;
  title: string;
  message: string;
  priority: "normal" | "high";
  actionUrl: string;
  evidence: Record<string, unknown>;
  recommendedActions: string[];
};

function utcDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function utcWeekStart(value: Date): string {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const weekday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - weekday);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) -
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) / 86_400_000);
}

/**
 * Build only evidence-backed operational reminders. This is not an agronomic
 * diagnosis engine: it never infers disease, soil deficiency, irrigation need,
 * yield or market price from missing data.
 */
export function buildFarmAgentEvents(input: {
  farms: any[];
  cultivations: any[];
  soilAnalyses: any[];
  sensors: any[];
  diseaseDetections?: any[];
  now?: Date;
  soilReviewDays?: number;
}): AgentEvent[] {
  const now = input.now ?? new Date();
  const today = utcDay(now);
  const soilReviewDays = input.soilReviewDays ?? 180;
  const events: AgentEvent[] = [];

  for (const farm of input.farms) {
    const farmName = String(farm.name || "مزرعتك");
    const farmSoil = input.soilAnalyses
      .filter((row) => row.farm_id === farm.id)
      .sort((a, b) => Date.parse(b.analyzed_at || b.created_at || "") - Date.parse(a.analyzed_at || a.created_at || ""));
    const latestSoil = farmSoil[0];
    if (!latestSoil) {
      events.push({
        key: `soil-baseline:${farm.id}:${utcWeekStart(now)}`,
        farmId: farm.id,
        type: "agent_soil_baseline_missing",
        title: "بيانات التربة غير متوفرة",
        message: `لم يتم العثور على تحليل تربة مخبري أو قياسات حساسات موثوقة مسجلة لمزرعة «${farmName}». أضف قياسات موثقة حتى تكون توصيات التربة مبنية على بيانات فعلية.`,
        recommendedActions: ["احجز تحليلاً مخبرياً لعينة ممثلة من الحقل.", "سجّل تاريخ أخذ العينة وموقعها وعمقها.", "لا تعتمد قرارات التسميد على قياسات غير موثقة."],
        priority: "normal",
        actionUrl: "/soil-analysis",
        evidence: { evidence: "no_verified_soil_analysis_record", farm_name: farmName },
      });
    } else {
      const soilDate = new Date(latestSoil.analyzed_at || latestSoil.created_at);
      if (Number.isFinite(soilDate.getTime()) && daysBetween(soilDate, now) >= soilReviewDays) {
        events.push({
          key: `soil-review:${farm.id}:${utcWeekStart(now)}`,
          farmId: farm.id,
          type: "agent_soil_review_due",
          title: "مراجعة بيانات التربة",
          message: `آخر تحليل تربة مسجل لمزرعة «${farmName}» عمره ${daysBetween(soilDate, now)} يوماً. راجع إن كانت القياسات مازالت تمثل الوضع الحالي قبل اعتماد توصيات جديدة.`,
          recommendedActions: ["قارن تاريخ التحليل بآخر عمليات تسميد أو ري.", "إذا تغيرت ظروف الحقل، أعد أخذ عينة مخبرية.", "حدّث سجل التحليل قبل طلب توصية جديدة."],
          priority: "normal",
          actionUrl: "/soil-analysis",
          evidence: { last_analysis_at: soilDate.toISOString(), age_days: daysBetween(soilDate, now), review_window_days: soilReviewDays },
        });
      }
    }
  }

  for (const cultivation of input.cultivations) {
    if (!cultivation.expected_harvest_date || cultivation.status !== "active") continue;
    const harvestDate = new Date(`${cultivation.expected_harvest_date}T00:00:00.000Z`);
    if (!Number.isFinite(harvestDate.getTime())) continue;
    const delta = daysBetween(now, harvestDate);
    const farm = input.farms.find((row) => row.id === cultivation.farm_id);
    const crop = String(cultivation.crop_name || "المحصول");
    const farmName = String(farm?.name || "المزرعة");
    if (delta >= 0 && delta <= 7) {
      events.push({
        key: `harvest-upcoming-${delta <= 2 ? "48h" : "7d"}:${cultivation.id}:${cultivation.expected_harvest_date}`,
        farmId: cultivation.farm_id,
        type: "agent_harvest_upcoming",
        title: "موعد حصاد مسجل يقترب",
        message: delta === 0
          ? `موعد الحصاد المتوقع المسجل لمحصول «${crop}» في «${farmName}» هو اليوم. راجع النضج والظروف الميدانية قبل تحديد موعد الحصاد النهائي.`
          : `موعد الحصاد المتوقع المسجل لمحصول «${crop}» في «${farmName}» بعد ${delta} يوم. راجع النضج والظروف الميدانية قبل تحديد موعد الحصاد النهائي.`,
        recommendedActions: ["افحص نضج المحصول ميدانياً ولا تعتمد التاريخ وحده.", "تحقق من توفر اليد العاملة ومعدات الحصاد.", "راجع توقعات الطقس قبل تثبيت موعد الحصاد."],
        priority: delta <= 2 ? "high" : "normal",
        actionUrl: "/crop-management",
        evidence: { cultivation_id: cultivation.id, expected_harvest_date: cultivation.expected_harvest_date, days_until_harvest: delta },
      });
    } else if (delta < 0) {
      events.push({
        key: `harvest-date-passed:${cultivation.id}:${cultivation.expected_harvest_date}`,
        farmId: cultivation.farm_id,
        type: "agent_harvest_date_passed",
        title: "تجاوز موعد الحصاد المسجل",
        message: `تاريخ الحصاد المتوقع لمحصول «${crop}» في «${farmName}» مرّ منذ ${Math.abs(delta)} يوم، ومازال السجل بحالة نشطة. حدّث حالة المحصول بعد التثبت من الوضع الميداني.`,
        recommendedActions: ["تحقق من المحصول في الحقل.", "حدّث حالة الزراعة إلى محصود أو مدّد الموعد المتوقع.", "سجّل الكمية والجودة والتكاليف بعد الحصاد."],
        priority: "normal",
        actionUrl: "/crop-management",
        evidence: { cultivation_id: cultivation.id, expected_harvest_date: cultivation.expected_harvest_date, days_after_expected_date: Math.abs(delta) },
      });
    }
  }

  // Persisted disease-detection records are follow-up signals, not proof of a
  // confirmed diagnosis. Always ask the farmer/agronomist to verify the record.
  for (const detection of input.diseaseDetections ?? []) {
    const severity = String(detection.severity_level || "").toLowerCase();
    const recovery = String(detection.recovery_status || "").toLowerCase();
    if (!["high", "critical", "severe"].includes(severity) || recovery === "recovered") continue;
    const farm = input.farms.find((row) => row.id === detection.farm_id);
    const farmName = String(farm?.name || "المزرعة");
    const crop = String(detection.plant_type || "المحصول");
    const disease = String(detection.primary_disease || "حالة نباتية مسجلة");
    const detectionDate = detection.detected_at || detection.created_at || null;
    events.push({
      key: `disease-followup:${detection.id}`,
      farmId: detection.farm_id,
      type: "agent_disease_followup",
      title: "نتيجة كشف نباتي تستحق المتابعة",
      message: `توجد نتيجة كشف مسجلة بدرجة خطورة «${severity}» للمحصول «${crop}» في «${farmName}» (${disease}). هذه نتيجة مسجلة وليست تأكيداً مستقلاً للتشخيص؛ افحص النبات واطلب مراجعة مختص، وتابع حالة العلاج.`,
      recommendedActions: ["التقط صوراً واضحة للنباتات المتأثرة.", "اعزل النباتات المشتبه بها إذا كان ذلك مناسباً.", "اطلب مراجعة مهندس فلاحي قبل تطبيق العلاج.", "سجّل العلاج وتاريخ المتابعة بعد التحقق."],
      priority: "high",
      actionUrl: "/disease-detection",
      evidence: {
        detection_id: detection.id,
        detection_method: detection.detection_method ?? null,
        severity_level: severity,
        disease_confidence: detection.disease_confidence ?? null,
        recovery_status: detection.recovery_status ?? null,
        treatment_applied: detection.treatment_applied ?? null,
        detected_at: detectionDate,
        diagnosis_requires_field_verification: true,
      },
    });
  }

  for (const sensor of input.sensors) {
    const farm = input.farms.find((row) => row.id === sensor.farm_id);
    const farmName = String(farm?.name || "المزرعة");
    if (sensor.status === "inactive") {
      events.push({
        key: `sensor-inactive:${sensor.id}:${today}`,
        farmId: sensor.farm_id,
        type: "agent_sensor_inactive",
        title: "حساس مسجل كغير نشط",
        message: `آخر حالة مسجلة للحساس «${sensor.device_id || sensor.id}» في «${farmName}» هي «inactive». تحقق من الطاقة والاتصال قبل الاعتماد على قراءاته.`,
        recommendedActions: ["افحص مصدر الطاقة والاتصال.", "تحقق من آخر قراءة فعلية للحساس.", "حدّث حالة الجهاز بعد الإصلاح."],
        priority: "high",
        actionUrl: "/notifications",
        evidence: { sensor_id: sensor.id, device_status: sensor.status, sensor_record_updated_at: sensor.updated_at ?? null },
      });
    } else if (sensor.status === "maintenance") {
      events.push({
        key: `sensor-maintenance:${sensor.id}:${today}`,
        farmId: sensor.farm_id,
        type: "agent_sensor_maintenance",
        title: "حساس في وضع الصيانة",
        message: `الحساس «${sensor.device_id || sensor.id}» في «${farmName}» مسجل بحالة صيانة. تأكد من تحديث حالته بعد إكمال التدخل.`,
        recommendedActions: ["راجع سبب إدخال الحساس في وضع الصيانة.", "أكمل التدخل الفني.", "حدّث الحالة إلى نشط بعد اختبار القراءة."],
        priority: "normal",
        actionUrl: "/notifications",
        evidence: { sensor_id: sensor.id, device_status: sensor.status, sensor_record_updated_at: sensor.updated_at ?? null },
      });
    }
    const battery = Number(sensor.battery_level);
    if (sensor.battery_level !== null && sensor.battery_level !== undefined && Number.isFinite(battery) && battery >= 0 && battery <= 20) {
      events.push({
        key: `sensor-battery:${sensor.id}:${today}`,
        farmId: sensor.farm_id,
        type: "agent_sensor_battery_low",
        title: "بطارية الحساس منخفضة حسب السجل",
        message: `آخر مستوى بطارية مسجل للحساس «${sensor.device_id || sensor.id}» في «${farmName}» هو ${battery}%. تحقق من الجهاز؛ هذه ليست قراءة بث حي.`,
        recommendedActions: ["افحص مستوى البطارية على الجهاز نفسه.", "اشحن البطارية أو استبدلها حسب تعليمات المصنع.", "تحقق من عودة الاتصال بعد الصيانة."],
        priority: battery <= 10 ? "high" : "normal",
        actionUrl: "/notifications",
        evidence: { sensor_id: sensor.id, battery_level_percent: battery, sensor_record_updated_at: sensor.updated_at ?? null },
      });
    }
  }

  return events.sort((a, b) => (a.priority === "high" ? 0 : 1) - (b.priority === "high" ? 0 : 1));
}

export async function runFarmAgentScan(
  db: SupabaseClient,
  userId: string,
  options: { now?: Date; ignoreDisabled?: boolean } = {},
) {
  const now = options.now ?? new Date();
  const { data: setting, error: settingError } = await db
    .from("farm_agent_settings")
    .select("enabled,cadence_minutes")
    .eq("user_id", userId)
    .maybeSingle();
  if (settingError) throw new Error(`AGENT_SETTINGS_READ_FAILED:${settingError.code || settingError.message}`);
  if (setting?.enabled === false && !options.ignoreDisabled) {
    return { skipped: true, reason: "monitoring_disabled", farmsScanned: 0, eventsDetected: 0, notificationsCreated: 0 };
  }

  const { data: farms, error: farmsError } = await db
    .from("farms")
    .select("id,owner_id,name,location")
    .eq("owner_id", userId);
  if (farmsError) throw new Error(`FARM_DATA_READ_FAILED:${farmsError.code || farmsError.message}`);
  const farmRows = farms ?? [];
  const farmIds = farmRows.map((farm: any) => farm.id);

  if (!farmIds.length) {
    await db.from("farm_agent_settings").upsert({
      user_id: userId,
      enabled: setting?.enabled ?? true,
      cadence_minutes: setting?.cadence_minutes ?? 60,
      last_scan_at: now.toISOString(),
      last_events_count: 0,
      updated_at: now.toISOString(),
    }, { onConflict: "user_id" });
    return { skipped: false, scannedAt: now.toISOString(), farmsScanned: 0, eventsDetected: 0, notificationsCreated: 0, note: "No farms are registered on this account." };
  }

  const [cultivationResult, soilResult, sensorResult, diseaseResult, profileResult] = await Promise.all([
    db.from("crop_cultivations").select("id,farm_id,crop_name,expected_harvest_date,status").in("farm_id", farmIds),
    db.from("soil_analyses").select("id,farm_id,analysis_type,analyzed_at,created_at").in("farm_id", farmIds).in("analysis_type", ["lab", "laboratory", "sensor"]).order("analyzed_at", { ascending: false }),
    db.from("sensor_devices").select("id,farm_id,device_id,status,battery_level,updated_at").in("farm_id", farmIds),
    db.from("plant_disease_detections").select("id,farm_id,plant_type,primary_disease,detection_method,disease_confidence,severity_level,treatment_applied,recovery_status,detected_at,created_at").in("farm_id", farmIds).order("detected_at", { ascending: false }).limit(100),
    db.from("user_profiles").select("preferences").eq("user_id", userId).maybeSingle(),
  ]);
  for (const [name, result] of [["crop_cultivations", cultivationResult], ["soil_analyses", soilResult], ["sensor_devices", sensorResult], ["plant_disease_detections", diseaseResult], ["user_profiles", profileResult]] as const) {
    if (result.error) throw new Error(`AGENT_SOURCE_READ_FAILED:${name}:${result.error.code || result.error.message}`);
  }

  const events = buildFarmAgentEvents({
    farms: farmRows,
    cultivations: cultivationResult.data ?? [],
    soilAnalyses: soilResult.data ?? [],
    sensors: sensorResult.data ?? [],
    diseaseDetections: diseaseResult.data ?? [],
    now,
    soilReviewDays: Number(process.env.AGRO_AGENT_SOIL_REVIEW_DAYS) || 180,
  });
  const notificationsEnabled = profileResult.data?.preferences?.notifications !== false;
  let notificationsCreated = 0;
  if (notificationsEnabled) {
    for (const event of events) {
      const { error } = await db.from("notifications").insert({
        user_id: userId,
        type: event.type,
        title: event.title,
        message: event.message,
        priority: event.priority,
        category: "agrogrowth_agent",
        action_url: event.actionUrl,
        metadata: {
          agent_event_key: event.key,
          agent_source: "agrogrowth-autonomous-agent",
          farm_id: event.farmId,
          evidence: event.evidence,
          recommended_actions: event.recommendedActions,
          observed_at: now.toISOString(),
          data_kind: "record-based-operational-reminder",
        },
        created_at: now.toISOString(),
      });
      if (!error) notificationsCreated += 1;
      else if (error.code !== "23505") throw new Error(`AGENT_NOTIFICATION_WRITE_FAILED:${error.code || error.message}`);
    }
  }

  const { error: updateError } = await db.from("farm_agent_settings").upsert({
    user_id: userId,
    enabled: setting?.enabled ?? true,
    cadence_minutes: setting?.cadence_minutes ?? 60,
    last_scan_at: now.toISOString(),
    last_events_count: events.length,
    updated_at: now.toISOString(),
  }, { onConflict: "user_id" });
  if (updateError) throw new Error(`AGENT_SETTINGS_WRITE_FAILED:${updateError.code || updateError.message}`);

  return {
    skipped: false,
    scannedAt: now.toISOString(),
    farmsScanned: farmRows.length,
    eventsDetected: events.length,
    notificationsCreated,
    notificationsSuppressedByPreference: !notificationsEnabled,
    events,
    sources: ["farms", "crop_cultivations", "soil_analyses", "sensor_devices", "plant_disease_detections"],
    limitations: ["No live sensor stream, weather forecast, automatic image re-analysis or live market feed is evaluated. Existing high/critical disease-detection records are only followed up and still require field verification.", "Alerts are in-app notifications only; push, SMS and email delivery are not configured."],
  };
}
