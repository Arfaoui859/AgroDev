import { safeErrorMessage } from '../lib/errors';
import express from "express";

const router = express.Router();

/**
 * AgroGrowth has no livestock database wired yet, so this router serves a
 * seeded demonstration herd. Two properties matter for the UI to work:
 *
 *  1. The herd must be identical on every request. Generating it from
 *     `Math.random()` per request meant `/animals` and `/health-alerts` each
 *     drew a different herd, so alert.animalId never matched any animal the
 *     client had rendered and the alerts list could not be joined to animals.
 *  2. Responses must say they are simulated, so the UI does not present a demo
 *     herd as real farm records.
 */
const SIMULATED_PROVENANCE = {
  dataSource: "simulated" as const,
  isRealData: false,
  disclaimer:
    "بيانات قطيع توضيحية مولّدة محلياً وليست سجلات حيوانات حقيقية. لا تعتمد عليها لقرارات بيطرية أو مالية.",
} as const;

/** Deterministic PRNG (mulberry32) so the demo herd is stable across requests. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Types and interfaces for livestock management
interface Animal {
  id: string;
  earTag: string;
  species: "cattle" | "sheep" | "goat" | "poultry" | "camel";
  breed: string;
  gender: "male" | "female";
  birthDate: string;
  weight: number;
  healthStatus: "excellent" | "good" | "fair" | "poor" | "sick";
  breedingStatus: "active" | "pregnant" | "nursing" | "inactive";
  location: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue: number;
  nutritionalNeeds: NutritionalProfile;
  lastHealthCheck: string;
  vaccinationStatus: VaccinationRecord[];
  breedingHistory: BreedingRecord[];
  milkProduction?: MilkProductionRecord[];
  meatProduction?: MeatProductionRecord;
}

interface NutritionalProfile {
  dailyCalories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fats: number; // grams
  fiber: number; // grams
  vitamins: { [key: string]: number };
  minerals: { [key: string]: number };
  waterRequirement: number; // liters
}

interface VaccinationRecord {
  vaccineType: string;
  dateAdministered: string;
  nextDueDate: string;
  veterinarian: string;
  batchNumber: string;
  sideEffects?: string;
}

interface BreedingRecord {
  matingDate: string;
  partner: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  offspring?: string[];
  complications?: string;
  success: boolean;
}

interface MilkProductionRecord {
  date: string;
  morningYield: number; // liters
  eveningYield: number; // liters
  totalDaily: number; // liters
  quality: {
    fatContent: number;
    proteinContent: number;
    cellCount: number;
  };
}

interface MeatProductionRecord {
  slaughterDate: string;
  liveWeight: number;
  carcassWeight: number;
  dressingPercentage: number;
  meatGrades: { [cut: string]: string };
  marketPrice: number;
}

interface FeedInventory {
  id: string;
  feedType: string;
  brand: string;
  quantity: number; // kg
  unitCost: number;
  nutritionalValue: NutritionalProfile;
  expiryDate: string;
  purchaseDate: string;
  supplier: string;
}

interface FeedingRecord {
  animalId: string;
  date: string;
  feedType: string;
  quantity: number; // kg
  cost: number;
  timeOfDay: "morning" | "afternoon" | "evening";
}

interface HealthAlert {
  id: string;
  animalId: string;
  alertType:
    | "vaccination_due"
    | "health_check"
    | "breeding_cycle"
    | "weight_loss"
    | "behavior_change";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  dateCreated: string;
  resolved: boolean;
  actionTaken?: string;
}

// Sample data generators
function generateAnimalData(rng: () => number = Math.random): Animal[] {
  const breeds = {
    cattle: ["هولشتاين", "فريزيان", "ج��رسي", "سيمينتال", "أنجوس"],
    sheep: ["أواسي", "ماريشان", "مريني", "رومانوف", "دورسيت"],
    goat: ["شامي", "مالطي", "بوير", "سانين", "نوبي"],
    poultry: ["دجاج لوهمان", "رود آيلاند", "ليجهورن", "براهما", "بولندي"],
    camel: ["مجاهيم", "حرة", "صفراء", "مقاتيل", "سود"],
  };

  return Array.from({ length: 12 }, (_, i) => {
    const species = ["cattle", "sheep", "goat", "poultry"][
      i % 4
    ] as keyof typeof breeds;
    const breed =
      breeds[species][Math.floor(rng() * breeds[species].length)];
    const birthDate = new Date(
      2020 + Math.floor(rng() * 4),
      Math.floor(rng() * 12),
      Math.floor(rng() * 28),
    );

    return {
      id: `animal_${i + 1}`,
      earTag: `TN${String(i + 1).padStart(4, "0")}`,
      species,
      breed,
      gender: (rng() > 0.5 ? "female" : "male") as "male" | "female",
      birthDate: birthDate.toISOString().split("T")[0],
      weight:
        species === "cattle"
          ? 450 + rng() * 200
          : species === "sheep"
            ? 45 + rng() * 25
            : species === "goat"
              ? 35 + rng() * 20
              : 2 + rng() * 2,
      healthStatus: ["excellent", "good", "fair"][
        Math.floor(rng() * 3)
      ] as any,
      breedingStatus: ["active", "inactive"][
        Math.floor(rng() * 2)
      ] as any,
      location: `المربع ${String.fromCharCode(65 + Math.floor(rng() * 4))}${Math.floor(rng() * 10) + 1}`,
      purchaseDate: new Date(
        2023,
        Math.floor(rng() * 12),
        Math.floor(rng() * 28),
      )
        .toISOString()
        .split("T")[0],
      purchasePrice:
        species === "cattle"
          ? 15000 + rng() * 10000
          : species === "sheep"
            ? 2500 + rng() * 1500
            : species === "goat"
              ? 2000 + rng() * 1000
              : 150 + rng() * 100,
      currentValue: 0, // Will be calculated
      nutritionalNeeds: generateNutritionalProfile(species),
      // Spread over 0-90 days so the "check overdue" alert rule (>30 days) can
      // actually fire; the previous 0-30 day window made that branch dead code.
      lastHealthCheck: new Date(
        Date.now() - rng() * 90 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
      vaccinationStatus: generateVaccinationRecords(rng),
      breedingHistory: rng() > 0.3 ? [generateBreedingRecord(rng)] : [],
      milkProduction:
        species === "cattle" && rng() > 0.4
          ? generateMilkProduction(rng)
          : undefined,
      meatProduction: undefined,
    };
  }).map((animal) => ({
    ...animal,
    currentValue: calculateCurrentValue(animal),
  }));
}

function generateNutritionalProfile(species: string): NutritionalProfile {
  const profiles = {
    cattle: {
      dailyCalories: 25000,
      protein: 1200,
      carbohydrates: 8000,
      fats: 800,
      fiber: 6000,
      vitamins: { A: 30, D: 15, E: 200, B12: 0.05 },
      minerals: { calcium: 45, phosphorus: 35, magnesium: 20 },
      waterRequirement: 80,
    },
    sheep: {
      dailyCalories: 2500,
      protein: 120,
      carbohydrates: 800,
      fats: 80,
      fiber: 600,
      vitamins: { A: 3, D: 1.5, E: 20, B12: 0.005 },
      minerals: { calcium: 4.5, phosphorus: 3.5, magnesium: 2 },
      waterRequirement: 8,
    },
    goat: {
      dailyCalories: 2200,
      protein: 110,
      carbohydrates: 700,
      fats: 70,
      fiber: 550,
      vitamins: { A: 2.8, D: 1.4, E: 18, B12: 0.004 },
      minerals: { calcium: 4, phosphorus: 3, magnesium: 1.8 },
      waterRequirement: 7,
    },
    poultry: {
      dailyCalories: 300,
      protein: 18,
      carbohydrates: 65,
      fats: 8,
      fiber: 15,
      vitamins: { A: 0.4, D: 0.1, E: 2, B12: 0.0001 },
      minerals: { calcium: 3.5, phosphorus: 0.6, magnesium: 0.5 },
      waterRequirement: 0.5,
    },
  };

  return profiles[species as keyof typeof profiles] || profiles.cattle;
}

function generateVaccinationRecords(rng: () => number): VaccinationRecord[] {
  const vaccines = [
    "لقاح الحمى القلاعية",
    "لقاح الجمرة الخبيثة",
    "لقاح ��لنيوكاسل",
    "لقاح الطاعون البقري",
    "لقاح التهاب الكبد الوبائي",
  ];

  return vaccines
    .slice(0, Math.floor(rng() * 3) + 1)
    .map((vaccine) => ({
      vaccineType: vaccine,
      dateAdministered: new Date(
        Date.now() - rng() * 180 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
      nextDueDate: new Date(
        Date.now() + rng() * 180 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
      veterinarian: "د. أحمد محمد الطبيب البيطري",
      batchNumber: `VAC${Math.floor(rng() * 0xfffffff).toString(36).toUpperCase().padStart(6, "0")}`,
    }));
}

function generateBreedingRecord(rng: () => number): BreedingRecord {
  const matingDate = new Date(
    Date.now() - rng() * 300 * 24 * 60 * 60 * 1000,
  );
  const expectedDelivery = new Date(
    matingDate.getTime() + 280 * 24 * 60 * 60 * 1000,
  ); // ~9 months

  return {
    matingDate: matingDate.toISOString().split("T")[0],
    partner: `animal_${Math.floor(rng() * 10) + 1}`,
    expectedDelivery: expectedDelivery.toISOString().split("T")[0],
    success: rng() > 0.2,
    offspring:
      rng() > 0.3
        ? [`offspring_${Math.floor(rng() * 0xfffff).toString(36)}`]
        : undefined,
  };
}

function generateMilkProduction(rng: () => number): MilkProductionRecord[] {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const morningYield = 12 + rng() * 8;
    const eveningYield = 10 + rng() * 6;

    return {
      date: date.toISOString().split("T")[0],
      morningYield,
      eveningYield,
      totalDaily: morningYield + eveningYield,
      quality: {
        fatContent: 3.2 + rng() * 0.8,
        proteinContent: 3.0 + rng() * 0.5,
        cellCount: 150000 + rng() * 100000,
      },
    };
  });
}

function calculateCurrentValue(animal: Animal): number {
  const ageInYears =
    (Date.now() - new Date(animal.birthDate).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);
  const depreciation = Math.max(0.7, 1 - ageInYears * 0.05);
  const healthMultiplier = {
    excellent: 1.1,
    good: 1.0,
    fair: 0.9,
    poor: 0.7,
    sick: 0.5,
  }[animal.healthStatus];

  return Math.round(
    (animal.purchasePrice || 0) * depreciation * healthMultiplier,
  );
}

function generateFeedInventory(rng: () => number = Math.random): FeedInventory[] {
  const feedTypes = [
    { name: "علف مركز للأبقار", cost: 2.5 },
    { name: "علف الشعير", cost: 1.8 },
    { name: "علف البرسيم", cost: 2.1 },
    { name: "علف الذرة", cost: 2.0 },
    { name: "علف البقوليات", cost: 2.3 },
    { name: "علف مك��لات غذائية", cost: 4.5 },
  ];

  return feedTypes.map((feed, i) => ({
    id: `feed_${i + 1}`,
    feedType: feed.name,
    brand: `شركة العلف المتميز ${i + 1}`,
    quantity: 500 + rng() * 1500,
    unitCost: feed.cost,
    nutritionalValue: generateNutritionalProfile("cattle"),
    expiryDate: new Date(
      Date.now() + (30 + rng() * 90) * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0],
    purchaseDate: new Date(
      Date.now() - rng() * 30 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .split("T")[0],
    supplier: `مورد العلف ��لمحلي ${i + 1}`,
  }));
}

function generateHealthAlerts(animals: Animal[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];

  animals.forEach((animal) => {
    // Vaccination due alerts
    animal.vaccinationStatus.forEach((vaccination) => {
      const dueDate = new Date(vaccination.nextDueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (daysUntilDue <= 7 && daysUntilDue >= 0) {
        alerts.push({
          id: `alert_${alerts.length + 1}`,
          animalId: animal.id,
          alertType: "vaccination_due",
          severity: daysUntilDue <= 2 ? "high" : "medium",
          message: `موعد تط��يم ${vaccination.vaccineType} للحيوان ${animal.earTag} خلال ${daysUntilDue} أيام`,
          dateCreated: today.toISOString().split("T")[0],
          resolved: false,
        });
      }
    });

    // Health check alerts
    const lastCheck = new Date(animal.lastHealthCheck);
    const daysSinceCheck = Math.ceil(
      (Date.now() - lastCheck.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (daysSinceCheck > 30) {
      alerts.push({
        id: `alert_${alerts.length + 1}`,
        animalId: animal.id,
        alertType: "health_check",
        severity: daysSinceCheck > 60 ? "high" : "medium",
        message: `لم يتم فحص الحيوان ${animal.earTag} منذ ${daysSinceCheck} يوم`,
        dateCreated: new Date().toISOString().split("T")[0],
        resolved: false,
      });
    }

  });

  return alerts;
}

// API Routes

/** The demo herd, generated once so every endpoint sees the same animals. */
const DEMO_HERD: Animal[] = generateAnimalData(createRng(0x51e2d));
const DEMO_FEED_INVENTORY: FeedInventory[] = generateFeedInventory(createRng(0xfeed0));

// Get all animals
router.get("/animals", (req, res) => {
  try {
    const animals = DEMO_HERD;
    res.json({
      success: true,
      ...SIMULATED_PROVENANCE,
      data: animals,
      summary: {
        totalAnimals: animals.length,
        healthyAnimals: animals.filter((a) =>
          ["excellent", "good"].includes(a.healthStatus),
        ).length,
        breedingAnimals: animals.filter((a) => a.breedingStatus === "active")
          .length,
        totalValue: animals.reduce((sum, a) => sum + a.currentValue, 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع بيانات الحيوانات",
      error: safeErrorMessage(error, "Unknown error"),
    });
  }
});

// Get specific animal details
router.get("/animals/:animalId", (req, res) => {
  try {
    const { animalId } = req.params;
    const animal = DEMO_HERD.find((a) => a.id === animalId);

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: "الحيوان غير موجود",
      });
    }

    res.json({
      success: true,
      ...SIMULATED_PROVENANCE,
      data: animal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع ��يانات الحيوان",
      error: safeErrorMessage(error, "Unknown error"),
    });
  }
});

// Get health alerts
router.get("/health-alerts", (req, res) => {
  try {
    const alerts = generateHealthAlerts(DEMO_HERD);

    res.json({
      success: true,
      ...SIMULATED_PROVENANCE,
      data: alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
        highPriorityAlerts: alerts.filter((a) => a.severity === "high").length,
        unresolvedAlerts: alerts.filter((a) => !a.resolved).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع التنبيهات الصحية",
      error: safeErrorMessage(error, "Unknown error"),
    });
  }
});

// Get breeding schedule
router.get("/breeding-schedule", (req, res) => {
  try {
    const breedingAnimals = DEMO_HERD.filter(
      (a) => a.breedingStatus === "active",
    );

    const schedule = breedingAnimals.map((animal) => ({
      animalId: animal.id,
      earTag: animal.earTag,
      species: animal.species,
      breed: animal.breed,
      currentStatus: animal.breedingStatus,
      lastBreeding: animal.breedingHistory[0]?.matingDate,
      expectedDelivery: animal.breedingHistory[0]?.expectedDelivery,
      breedingRecommendation: calculateBreedingRecommendation(animal),
    }));

    res.json({
      success: true,
      ...SIMULATED_PROVENANCE,
      data: schedule,
      summary: {
        totalBreedingAnimals: breedingAnimals.length,
        pregnantAnimals: DEMO_HERD.filter(
          (a) => a.breedingStatus === "pregnant",
        ).length,
        upcomingDeliveries: schedule.filter((s) => s.expectedDelivery).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع جدول التناسل",
      error: safeErrorMessage(error, "Unknown error"),
    });
  }
});

function calculateBreedingRecommendation(animal: Animal): string {
  const age =
    (Date.now() - new Date(animal.birthDate).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);

  if (age < 1.5) return "صغير جداً للتناسل";
  if (age > 8) return "كبير في السن للتناسل الفعال";
  if (animal.healthStatus === "sick" || animal.healthStatus === "poor")
    return "تحسين الحالة الصحية أولاً";
  if (animal.breedingHistory.length === 0) return "جاهز للتناسل الأول";

  const lastBreeding = animal.breedingHistory[0];
  if (lastBreeding) {
    const lastDate = new Date(lastBreeding.matingDate);
    const monthsSince =
      (Date.now() - lastDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000);

    if (monthsSince < 12)
      return `انتظار ${Math.ceil(12 - monthsSince)} شهر للتناسل التالي`;
    return "جاهز للتناسل";
  }

  return "جاهز للتناسل";
}

// Get feed inventory
router.get("/feed-inventory", (req, res) => {
  try {
    const inventory = DEMO_FEED_INVENTORY;

    res.json({
      success: true,
      ...SIMULATED_PROVENANCE,
      data: inventory,
      summary: {
        totalFeedTypes: inventory.length,
        totalQuantity: inventory.reduce((sum, feed) => sum + feed.quantity, 0),
        totalValue: inventory.reduce(
          (sum, feed) => sum + feed.quantity * feed.unitCost,
          0,
        ),
        expiringItems: inventory.filter((feed) => {
          const expiryDate = new Date(feed.expiryDate);
          const daysUntilExpiry =
            (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
          return daysUntilExpiry <= 30;
        }).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع مخزون الأعلاف",
      error: safeErrorMessage(error, "Unknown error"),
    });
  }
});

// Get feed optimization recommendations
router.post("/feed-optimization", (req, res) => {
  try {
    const { targetCosts, nutritionalGoals } = req.body;
    const animals = DEMO_HERD;
    const inventory = DEMO_FEED_INVENTORY;

    const recommendations = animals.map((animal) => {
      const dailyNeeds = animal.nutritionalNeeds;
      const feedPlan = optimizeFeedPlan(dailyNeeds, inventory, targetCosts);

      return {
        animalId: animal.id,
        earTag: animal.earTag,
        currentWeight: animal.weight,
        dailyNeeds,
        recommendedFeeds: feedPlan.feeds,
        totalDailyCost: feedPlan.totalCost,
        nutritionalCoverage: feedPlan.coverage,
        costEfficiency: feedPlan.efficiency,
      };
    });

    res.json({
      success: true,
      ...SIMULATED_PROVENANCE,
      data: recommendations,
      summary: {
        totalAnimals: recommendations.length,
        averageDailyCost:
          recommendations.reduce((sum, r) => sum + r.totalDailyCost, 0) /
          recommendations.length,
        totalMonthlyCost:
          recommendations.reduce((sum, r) => sum + r.totalDailyCost, 0) * 30,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في تحليل تحسين الأعلاف",
      error: safeErrorMessage(error, "Unknown error"),
    });
  }
});

function optimizeFeedPlan(
  needs: NutritionalProfile,
  inventory: FeedInventory[],
  targetCosts?: any,
) {
  // Simplified feed optimization algorithm
  const selectedFeeds = inventory.slice(0, 2).map((feed) => ({
    feedType: feed.feedType,
    quantity: needs.dailyCalories / 4000, // Simplified calculation
    cost: (needs.dailyCalories / 4000) * feed.unitCost,
  }));

  const totalCost = selectedFeeds.reduce((sum, feed) => sum + feed.cost, 0);

  return {
    feeds: selectedFeeds,
    totalCost,
    // Coverage derived from the plan itself, not a random figure.
    coverage: {
      calories: Math.min(100, Math.round((needs.dailyCalories / 25000) * 100)),
      protein: Math.min(100, Math.round((needs.protein / 1200) * 100)),
      minerals: Math.min(100, Math.round((needs.minerals.calcium / 45) * 100)),
    },
    efficiency: Math.round((1 / totalCost) * 100),
  };
}

// Production analytics
router.get("/production-analytics", (req, res) => {
  try {
    const { period = "30" } = req.query;
    const animals = DEMO_HERD;

    const milkProducers = animals.filter((a) => a.milkProduction);
    const meatAnimals = animals.filter((a) => a.species !== "poultry");

    const milkAnalytics = {
      totalProducers: milkProducers.length,
      averageDailyYield:
        milkProducers.reduce((sum, a) => {
          const avgDaily =
            a.milkProduction?.reduce((s, record) => s + record.totalDaily, 0) ||
            0;
          return sum + avgDaily / (a.milkProduction?.length || 1);
        }, 0) / (milkProducers.length || 1),
      monthlyProduction: milkProducers.reduce((sum, a) => {
        const monthlyTotal =
          a.milkProduction?.reduce((s, record) => s + record.totalDaily, 0) ||
          0;
        return sum + monthlyTotal;
      }, 0),
      qualityMetrics: {
        averageFatContent: 3.6,
        averageProteinContent: 3.2,
        averageCellCount: 200000,
      },
    };

    const meatAnalytics = {
      totalAnimals: meatAnimals.length,
      totalLiveWeight: meatAnimals.reduce((sum, a) => sum + a.weight, 0),
      estimatedCarcassWeight: meatAnimals.reduce(
        (sum, a) => sum + a.weight * 0.6,
        0,
      ),
      estimatedValue: meatAnimals.reduce((sum, a) => sum + a.currentValue, 0),
    };

    res.json({
      success: true,
      ...SIMULATED_PROVENANCE,
      data: {
        period: `${period} يوم`,
        milk: milkAnalytics,
        meat: meatAnalytics,
        trends: generateProductionTrends(parseInt(period as string)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في تحليل الإنتاج",
      error: safeErrorMessage(error, "Unknown error"),
    });
  }
});

/**
 * Demo production series. Seeded so repeated requests return the same curve:
 * a "trend" that changes on every poll is not a trend, and the UI charts it.
 */
function generateProductionTrends(days: number) {
  const rng = createRng(0x5eed);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000);
    return {
      date: date.toISOString().split("T")[0],
      milkProduction: Math.round((180 + rng() * 40) * 10) / 10,
      feedCosts: Math.round((450 + rng() * 100) * 10) / 10,
      revenue: Math.round((800 + rng() * 200) * 10) / 10,
    };
  });
}

export default router;
