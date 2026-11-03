import express from "express";

/**
 * Predictive Analytics API.
 *
 * Serves the model registry, prediction history, analyses, performance metrics
 * and data-source catalogue consumed by client/pages/PredictiveAnalytics.tsx.
 *
 * NOTE: AgroGrowth does not host trained forecasting models in-process. The
 * metrics below are synthetic demonstration values used to exercise the UI.
 * They are flagged with `dataSource: "simulated"` / `isRealData: false` so they
 * are never presented as validated model performance. Replace `models` and
 * `performance` with real inference service output when wired.
 */

const router = express.Router();

const PROVENANCE = {
  dataSource: "simulated" as const,
  isRealData: false,
  disclaimer:
    "مؤشرات النماذج التنبؤية هنا بيانات محاكاة توضيحية وليست نتائج نموذج مدرّب وموثّق.",
};

const models = [
  {
    id: "model-yield-1",
    name: "توقّع إنتاجية القمح",
    type: "yield_prediction" as const,
    description: "تقدير الإنتاجية حسب الطقس والتربة والري.",
    accuracy: 0.81,
    confidence_interval: { lower: 0.74, upper: 0.88 },
    data_sources: ["weather_api", "sensor", "manual_input"],
    training_period: "2019-2023",
    last_trained: "2024-05-28",
    last_prediction: "2024-06-11",
    predictions_count: 1240,
    status: "active" as const,
    model_version: "1.4.0",
    parameters: { algorithm: "gradient_boosting", features: 12 },
    performance_metrics: {
      mse: 0.042,
      rmse: 0.205,
      mae: 0.161,
      r_squared: 0.78,
      precision: 0.8,
      recall: 0.76,
      f1_score: 0.78,
    },
    feature_importance: [
      { feature: "الأمطار", importance: 0.31 },
      { feature: "الحرارة", importance: 0.24 },
      { feature: "الري", importance: 0.19 },
    ],
  },
  {
    id: "model-price-1",
    name: "توقّع أسعار السوق",
    type: "price_forecast" as const,
    description: "توقّع اتجاه الأسعار حسب العرض والطلب الموسمي.",
    accuracy: 0.72,
    confidence_interval: { lower: 0.64, upper: 0.8 },
    data_sources: ["market_data"],
    training_period: "2020-2024",
    last_trained: "2024-06-01",
    last_prediction: "2024-06-12",
    predictions_count: 980,
    status: "testing" as const,
    model_version: "0.9.2",
    parameters: { algorithm: "arima", features: 8 },
    performance_metrics: {
      mse: 0.061,
      rmse: 0.247,
      mae: 0.19,
      r_squared: 0.69,
      precision: 0.71,
      recall: 0.68,
      f1_score: 0.69,
    },
    feature_importance: [
      { feature: "الموسم", importance: 0.28 },
      { feature: "التصدير", importance: 0.22 },
    ],
  },
];

const predictions = [
  {
    id: "pred-1",
    model_id: "model-yield-1",
    model_name: "توقّع إنتاجية القمح",
    prediction_type: "yield_prediction",
    target_variable: "الإنتاجية (طن/هكتار)",
    predicted_value: 4.2,
    confidence_score: 0.79,
    prediction_range: { min: 3.6, max: 4.8 },
    input_features: { rainfall: 420, irrigation: "مرتفع" },
    prediction_date: "2024-06-11T08:00:00.000Z",
    valid_until: "2024-07-11T08:00:00.000Z",
    factors_analysis: [
      { factor: "الأمطار", impact: 0.3, direction: "positive" as const },
      { factor: "الحرارة", impact: 0.18, direction: "negative" as const },
    ],
    recommendations: ["زيادة جرعة الري في مرحلة الإثمار"],
    risk_assessment: {
      risk_level: "medium" as const,
      risk_factors: ["موجة حرارة محتملة"],
      mitigation_suggestions: ["الري التكميلي"],
    },
  },
];

const analyses = [
  {
    id: "ana-1",
    analysis_name: "تحليل اتجاه الإنتاجية",
    analysis_type: "trend_analysis" as const,
    data_source: "sensor",
    time_period: "آخر 12 شهراً",
    status: "completed" as const,
    results: {
      summary: "اتجاه تصاعدي طفيف في الإنتاجية.",
      key_insights: ["تحسّن الري رفع الإنتاجية"],
      trends_detected: [{ trend: "إنتاجية", strength: 0.4, direction: "up" }],
      anomalies_found: 1,
      correlations: [{ variable1: "الري", variable2: "الإنتاجية", correlation: 0.62 }],
      patterns: [{ pattern: "موسمي", frequency: 12, significance: "متوسط" }],
    },
    visualizations: { chart_type: "line", data_points: 12, time_series: true },
    created_at: "2024-06-01T10:00:00.000Z",
    completed_at: "2024-06-01T10:02:00.000Z",
    execution_time: 120,
  },
];

const performance = [
  {
    model_id: "model-yield-1",
    model_name: "توقّع إنتاجية القمح",
    performance_score: 81,
    accuracy_trend: [
      { date: "2024-04", accuracy: 0.77 },
      { date: "2024-05", accuracy: 0.81 },
    ],
    prediction_errors: [
      { date: "2024-04", error: 0.24 },
      { date: "2024-05", error: 0.2 },
    ],
    confidence_levels: [
      { date: "2024-04", confidence: 0.75 },
      { date: "2024-05", confidence: 0.79 },
    ],
    usage_statistics: {
      total_predictions: 1240,
      avg_predictions_per_day: 12,
      success_rate: 0.96,
      user_satisfaction: 4.1,
    },
    recommendations: ["إعادة التدريب الشهرية", "إضافة متغيّر رطوبة التربة"],
  },
];

const dataSources = [
  {
    id: "ds-weather",
    name: "مزود الطقس (Open-Meteo)",
    type: "weather_api" as const,
    description: "بيانات طقس حقيقية مجانية من Open-Meteo.",
    connection_status: "connected" as const,
    data_quality: 92,
    last_update: "2024-06-12T09:00:00.000Z",
    update_frequency: "كل ساعة",
    data_volume: "متوسط",
    coverage_area: "تونس",
    variables_provided: ["الحرارة", "الأمطار", "الرياح", "الرطوبة"],
    reliability_score: 0.9,
    cost_per_month: 0,
  },
  {
    id: "ds-sensors",
    name: "حسّاسات الحقل",
    type: "sensor" as const,
    description: "حسّاسات رطوبة التربة والحرارة (بيانات توضيحية).",
    connection_status: "connected" as const,
    data_quality: 74,
    last_update: "2024-06-12T09:10:00.000Z",
    update_frequency: "كل 15 دقيقة",
    data_volume: "مرتفع",
    coverage_area: "مزرعة تجريبية",
    variables_provided: ["رطوبة التربة", "الحرارة", "pH"],
    reliability_score: 0.78,
    cost_per_month: 0,
  },
];

router.get("/models", (_req, res) => {
  res.json(models);
});

router.get("/predictions", (_req, res) => {
  res.json(predictions);
});

router.get("/analyses", (_req, res) => {
  res.json(analyses);
});

router.get("/performance", (_req, res) => {
  res.json(performance);
});

router.get("/data-sources", (_req, res) => {
  res.json(dataSources);
});

router.post("/models/:modelId/train", (req, res) => {
  const model = models.find((m) => m.id === req.params.modelId);
  if (!model) return res.status(404).json({ error: "Model not found" });
  // No training pipeline is configured; report the request honestly rather than
  // claiming a model was retrained.
  res.status(501).json({
    error: "Training pipeline not configured",
    message:
      "لا يوجد خط تدريب فعلي مرتبط بهذه المنصة بعد. لم يتم تدريب أي نموذج.",
    modelId: model.id,
    dataSource: "simulated",
    isRealData: false,
  });
});

router.post("/models/:modelId/predict", (req, res) => {
  const model = models.find((m) => m.id === req.params.modelId);
  if (!model) return res.status(404).json({ error: "Model not found" });
  const input = req.body?.input_data ?? {};
  if (!input || typeof input !== "object" || Object.keys(input).length === 0) {
    return res.status(400).json({ error: "input_data is required" });
  }
  // No inference service is configured: return a clearly-labelled placeholder
  // instead of a fabricated "prediction".
  res.status(503).json({
    error: "Prediction service not configured",
    message:
      "لا توجد خدمة استدلال فعلية متصلة. لم يتم توليد أي توقّع.",
    modelId: model.id,
    dataSource: "unavailable",
    isRealData: false,
  });
});

router.post("/analyses", (req, res) => {
  const { analysis_type, parameters } = req.body ?? {};
  if (!analysis_type) {
    return res.status(400).json({ error: "analysis_type is required" });
  }
  const analysis = {
    id: `ana-${Date.now()}`,
    analysis_name: `${analysis_type} analysis`,
    analysis_type,
    data_source: parameters?.data_source ?? "manual_input",
    time_period: parameters?.time_period ?? "غير محدد",
    status: "scheduled" as const,
    results: {
      summary: "تم جدولة التحليل. سيُعرض هنا عند توفر محرك تحليل حقيقي.",
      key_insights: [],
      trends_detected: [],
      anomalies_found: 0,
      correlations: [],
      patterns: [],
    },
    visualizations: { chart_type: "line", data_points: 0, time_series: true },
    created_at: new Date().toISOString(),
    execution_time: 0,
    ...PROVENANCE,
  };
  analyses.push(analysis as unknown as (typeof analyses)[number]);
  res.status(202).json(analysis);
});

router.get("/dashboard", (_req, res) => {
  res.json({
    totalModels: models.length,
    activeModels: models.filter((m) => m.status === "active").length,
    totalPredictions: models.reduce((sum, m) => sum + m.predictions_count, 0),
    connectedDataSources: dataSources.filter(
      (d) => d.connection_status === "connected",
    ).length,
    ...PROVENANCE,
  });
});

export default router;
