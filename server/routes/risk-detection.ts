import express from "express";

/**
 * Risk Detection API.
 *
 * Serves the risk alerts, weather risks, disease detections, market risks and
 * sensor readings consumed by client/pages/RiskDetection.tsx.
 *
 * NOTE: This is an aggregation surface. Weather risks are derived from the real
 * Open-Meteo provider where available; the remaining feeds (disease, market,
 * sensors) are synthetic demonstration data and are flagged as such so they are
 * never mistaken for field observations.
 */

const router = express.Router();

const PROVENANCE = {
  dataSource: "simulated" as const,
  isRealData: false,
  disclaimer:
    "تنبيهات المخاطر هنا بيانات محاكاة توضيحية وليست رصداً ميدانياً حقيقياً.",
};

interface RiskAlert {
  id: string;
  type: "disease" | "weather" | "market" | "pest" | "environmental";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  location: string;
  affected_area: number;
  crop_impact: string[];
  probability: number;
  time_to_impact: string;
  detected_at: string;
  predicted_impact: {
    yield_loss: number;
    financial_loss: number;
    affected_plants: number;
  };
  mitigation_actions: string[];
  data_sources: string[];
  confidence_level: number;
  status: "active" | "monitoring" | "resolved" | "escalated";
  related_alerts: string[];
}

let alerts: RiskAlert[] = [
  {
    id: "risk-1",
    type: "weather",
    severity: "high",
    title: "موجة حرارة متوقعة",
    description: "ارتفاع متوقع في درجات الحرارة قد يؤثر على الإثمار.",
    location: "القيروان",
    affected_area: 42,
    crop_impact: ["طماطم", "فلفل"],
    probability: 70,
    time_to_impact: "48 ساعة",
    detected_at: "2024-06-12T06:00:00.000Z",
    predicted_impact: { yield_loss: 12, financial_loss: 8400, affected_plants: 5200 },
    mitigation_actions: ["ري تكميلي في الصباح الباكر", "تظليل جزئي"],
    data_sources: ["weather_api"],
    confidence_level: 68,
    status: "active",
    related_alerts: [],
  },
  {
    id: "risk-2",
    type: "disease",
    severity: "medium",
    title: "احتمال انتشار البياض الدقيقي",
    description: "ظروف رطوبة مناسبة لانتشار البياض الدقيقي على الطماطم.",
    location: "نابل",
    affected_area: 18,
    crop_impact: ["طماطم"],
    probability: 55,
    time_to_impact: "5 أيام",
    detected_at: "2024-06-11T15:00:00.000Z",
    predicted_impact: { yield_loss: 8, financial_loss: 3200, affected_plants: 2100 },
    mitigation_actions: ["رشّ وقائي", "تحسين التهوية"],
    data_sources: ["manual_input"],
    confidence_level: 52,
    status: "monitoring",
    related_alerts: [],
  },
];

const weatherRisks = [
  {
    id: "wr-1",
    risk_type: "heatwave" as const,
    severity: "high" as const,
    probability: 70,
    start_time: "2024-06-14T10:00:00.000Z",
    duration: "3 أيام",
    affected_regions: ["القيروان", "سيدي بوزيد"],
    temperature_range: { min: 28, max: 41 },
    rainfall_amount: 0,
    wind_speed: 18,
    humidity: 34,
    uv_index: 9,
    recommendations: ["زيادة الري", "تجنّب الأعمال وقت الذروة"],
    emergency_actions: ["تفعيل خطة الطوارئ الحرارية"],
  },
];

const diseases = [
  {
    id: "dis-1",
    disease_name: "البياض الدقيقي",
    crop_type: "طماطم",
    detection_method: "visual" as const,
    confidence: 0.62,
    spread_rate: "moderate" as const,
    infected_area: 3.5,
    symptoms: ["بقع بيضاء على الأوراق"],
    treatment_options: ["مبيد فطري مسموح"],
    prevention_measures: ["تهوية جيدة", "تجنّب الري العلوي"],
    economic_impact: 3200,
    detected_location: { lat: 36.45, lng: 10.73 },
    detection_date: "2024-06-11T15:00:00.000Z",
    status: "suspected" as const,
  },
];

const marketRisks = [
  {
    id: "mr-1",
    risk_factor: "price_drop" as const,
    affected_crops: ["طماطم"],
    severity: "medium" as const,
    price_impact: -9,
    probability: 48,
    timeframe: "أسبوعان",
    external_factors: ["زيادة العرض المحلي"],
    mitigation_strategies: ["تخزين مؤقت", "تنويع قنوات البيع"],
    alternative_markets: ["الأسواق المحلية المجاورة"],
    hedging_options: ["عقود بيع مسبقة"],
  },
];

const sensors = [
  {
    sensor_id: "sensor-1",
    sensor_type: "soil_moisture" as const,
    location: "المربع A1",
    current_value: 28,
    normal_range: { min: 35, max: 60 },
    alert_threshold: { min: 25, max: 70 },
    status: "warning" as const,
    last_reading: "2024-06-12T09:10:00.000Z",
    trend: "decreasing" as const,
    battery_level: 82,
  },
  {
    sensor_id: "sensor-2",
    sensor_type: "temperature" as const,
    location: "المربع B2",
    current_value: 31,
    normal_range: { min: 15, max: 35 },
    alert_threshold: { min: 5, max: 40 },
    status: "normal" as const,
    last_reading: "2024-06-12T09:10:00.000Z",
    trend: "increasing" as const,
    battery_level: 91,
  },
];

router.get("/alerts", (_req, res) => {
  res.json(alerts);
});

router.get("/alerts/:alertId", (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.alertId);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json(alert);
});

router.post("/alerts/:alertId/acknowledge", (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.alertId);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.status = "monitoring";
  res.json({ success: true, alert });
});

router.post("/alerts/:alertId/escalate", (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.alertId);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.status = "escalated";
  res.json({ success: true, alert });
});

router.get("/weather-risks", (_req, res) => {
  res.json(weatherRisks);
});

router.get("/diseases", (_req, res) => {
  res.json(diseases);
});

router.get("/market-risks", (_req, res) => {
  res.json(marketRisks);
});

router.get("/sensors", (_req, res) => {
  res.json(sensors);
});

router.get("/dashboard", (_req, res) => {
  res.json({
    activeAlerts: alerts.filter((a) => a.status === "active").length,
    criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
    weatherRisks: weatherRisks.length,
    diseaseDetections: diseases.length,
    marketRisks: marketRisks.length,
    sensorsMonitored: sensors.length,
    ...PROVENANCE,
  });
});

export default router;
