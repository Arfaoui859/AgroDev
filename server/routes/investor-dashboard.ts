import { Request, Response } from "express";

// Types for investor dashboard
interface InvestmentOpportunity {
  id: string;
  cropType: string;
  cropTypeArabic: string;
  region: string;
  regionArabic: string;
  area: number; // in hectares
  expectedYield: number; // tons per hectare
  investmentRequired: number; // in currency
  expectedReturn: number; // percentage
  riskLevel: "low" | "medium" | "high";
  duration: number; // in months
  farmerId: string;
  farmerRating: number; // 1-5 stars
  description: string;
  descriptionArabic: string;
  tags: string[];
  availableFrom: string;
  images: string[];
}

interface ProfitabilityAnalysis {
  cropType: string;
  cropTypeArabic: string;
  region: string;
  averageYield: number;
  averagePrice: number; // per ton
  averageCost: number; // per hectare
  averageProfit: number; // per hectare
  profitMargin: number; // percentage
  riskScore: number; // 1-10
  marketTrend: "increasing" | "stable" | "decreasing";
  seasonality: {
    bestMonths: number[];
    worstMonths: number[];
  };
}

interface MarketInsight {
  id: string;
  title: string;
  titleArabic: string;
  content: string;
  contentArabic: string;
  category: "market_trend" | "price_alert" | "opportunity" | "risk_warning";
  importance: "low" | "medium" | "high" | "critical";
  datePublished: string;
  relevantCrops: string[];
  relevantRegions: string[];
  source: string;
}

interface PortfolioItem {
  id: string;
  investmentId: string;
  cropType: string;
  cropTypeArabic: string;
  region: string;
  investmentAmount: number;
  currentValue: number;
  returns: number; // percentage
  status: "active" | "completed" | "failed";
  startDate: string;
  endDate?: string;
  progress: number; // percentage
}

interface InvestorMetrics {
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  completedInvestments: number;
  averageReturn: number;
  portfolioValue: number;
  monthlyGrowth: number;
  riskDiversification: {
    low: number;
    medium: number;
    high: number;
  };
  cropDiversification: Record<string, number>;
  regionDiversification: Record<string, number>;
}

// Mock data generation functions
function generateInvestmentOpportunities(): InvestmentOpportunity[] {
  const crops = [
    { en: "Wheat", ar: "القمح" },
    { en: "Tomatoes", ar: "الطماطم" },
    { en: "Olives", ar: "الزيتون" },
    { en: "Corn", ar: "الذرة" },
    { en: "Barley", ar: "الشعير" },
    { en: "Almonds", ar: "اللوز" },
    { en: "Dates", ar: "التمر" },
    { en: "Citrus", ar: "الحمضيات" },
  ];

  const regions = [
    { en: "North Tunisia", ar: "شمال تونس" },
    { en: "Central Tunisia", ar: "وسط تونس" },
    { en: "South Tunisia", ar: "جنوب تونس" },
    { en: "Coastal Plains", ar: "السهول الساحلية" },
    { en: "Mountain Regions", ar: "المناطق الجبلية" },
  ];

  const riskLevels: ("low" | "medium" | "high")[] = ["low", "medium", "high"];

  return Array.from({ length: 15 }, (_, i) => {
    const crop = crops[Math.floor(Math.random() * crops.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    const area = 5 + Math.random() * 45; // 5-50 hectares
    const expectedYield = 2 + Math.random() * 8; // 2-10 tons per hectare
    const investmentRequired = area * (1000 + Math.random() * 2000); // $1000-3000 per hectare
    const baseReturn =
      riskLevel === "low" ? 8 : riskLevel === "medium" ? 15 : 25;
    const expectedReturn = baseReturn + (Math.random() - 0.5) * 10;

    return {
      id: `inv_${i + 1}`,
      cropType: crop.en,
      cropTypeArabic: crop.ar,
      region: region.en,
      regionArabic: region.ar,
      area: Math.round(area * 10) / 10,
      expectedYield: Math.round(expectedYield * 10) / 10,
      investmentRequired: Math.round(investmentRequired),
      expectedReturn: Math.round(expectedReturn * 10) / 10,
      riskLevel,
      duration: 6 + Math.floor(Math.random() * 18), // 6-24 months
      farmerId: `farmer_${Math.floor(Math.random() * 100)}`,
      farmerRating: 3 + Math.random() * 2, // 3-5 stars
      description: `High-quality ${crop.en.toLowerCase()} farming opportunity in ${region.en}`,
      descriptionArabic: `فرصة زراعة ${crop.ar} عالية الجودة في ${region.ar}`,
      tags: ["organic", "sustainable", "high-yield"].slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      ),
      availableFrom: new Date(
        Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      images: [
        `/crop-images/${crop.en.toLowerCase()}-1.jpg`,
        `/crop-images/${crop.en.toLowerCase()}-2.jpg`,
      ],
    };
  });
}

function generateProfitabilityAnalysis(): ProfitabilityAnalysis[] {
  const crops = [
    { en: "Wheat", ar: "القمح" },
    { en: "Tomatoes", ar: "الطماطم" },
    { en: "Olives", ar: "الزيتون" },
    { en: "Corn", ar: "الذرة" },
    { en: "Barley", ar: "الشعير" },
  ];

  const regions = ["North Tunisia", "Central Tunisia", "South Tunisia"];
  const trends: ("increasing" | "stable" | "decreasing")[] = [
    "increasing",
    "stable",
    "decreasing",
  ];

  return crops.flatMap((crop) =>
    regions.map((region) => {
      const averageYield = 3 + Math.random() * 7; // 3-10 tons per hectare
      const averagePrice = 200 + Math.random() * 300; // $200-500 per ton
      const averageCost = 800 + Math.random() * 1200; // $800-2000 per hectare
      const averageProfit = averageYield * averagePrice - averageCost;
      const profitMargin =
        (averageProfit / (averageYield * averagePrice)) * 100;

      return {
        cropType: crop.en,
        cropTypeArabic: crop.ar,
        region,
        averageYield: Math.round(averageYield * 10) / 10,
        averagePrice: Math.round(averagePrice),
        averageCost: Math.round(averageCost),
        averageProfit: Math.round(averageProfit),
        profitMargin: Math.round(profitMargin * 10) / 10,
        riskScore: 1 + Math.random() * 9, // 1-10
        marketTrend: trends[Math.floor(Math.random() * trends.length)],
        seasonality: {
          bestMonths: [3, 4, 5].slice(0, Math.floor(Math.random() * 3) + 1),
          worstMonths: [11, 12, 1].slice(0, Math.floor(Math.random() * 3) + 1),
        },
      };
    }),
  );
}

function generateMarketInsights(): MarketInsight[] {
  const insights = [
    {
      title: "Wheat Prices Rising Due to Export Demand",
      titleArabic: "أسعار القمح ترتفع بسبب الطلب على التصدير",
      content:
        "International demand for wheat has increased, creating opportunities for local farmers.",
      contentArabic:
        "ازداد الطلب الدولي على القمح، مما يخلق فرصاً للمزارعين المحليين.",
      category: "market_trend" as const,
      relevantCrops: ["Wheat"],
    },
    {
      title: "Olive Oil Market Shows Strong Growth",
      titleArabic: "سوق زيت الزيتون يظهر نمواً قوياً",
      content:
        "Premium olive oil demand continues to grow in international markets.",
      contentArabic:
        "يستمر الطلب على زيت الزيتون الممتاز في النمو في الأسواق الدولية.",
      category: "opportunity" as const,
      relevantCrops: ["Olives"],
    },
    {
      title: "Weather Risks for Tomato Season",
      titleArabic: "مخاطر الطقس لموسم الطماطم",
      content: "Unusual weather patterns may affect tomato yields this season.",
      contentArabic:
        "قد تؤثر أنماط الطقس غير المعتادة على محصول الطماطم هذا الموسم.",
      category: "risk_warning" as const,
      relevantCrops: ["Tomatoes"],
    },
    {
      title: "New Technology Boosts Corn Productivity",
      titleArabic: "تقنية جديدة تعزز إنتاجية الذرة",
      content: "Latest farming technology shows 30% increase in corn yields.",
      contentArabic: "تظهر أحدث التقنيات الزراعية زيادة 30% في محصول الذرة.",
      category: "opportunity" as const,
      relevantCrops: ["Corn"],
    },
  ];

  return insights.map((insight, i) => ({
    id: `insight_${i + 1}`,
    ...insight,
    importance: (["low", "medium", "high", "critical"] as const)[
      Math.floor(Math.random() * 4)
    ],
    datePublished: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    relevantRegions: ["North Tunisia", "Central Tunisia"].slice(
      0,
      Math.floor(Math.random() * 2) + 1,
    ),
    source: "AgroGrowth Market Intelligence",
  }));
}

function generatePortfolioItems(): PortfolioItem[] {
  const crops = [
    { en: "Wheat", ar: "القمح" },
    { en: "Tomatoes", ar: "الطماطم" },
    { en: "Olives", ar: "الزيتون" },
    { en: "Corn", ar: "الذرة" },
  ];

  const regions = ["North Tunisia", "Central Tunisia", "South Tunisia"];
  const statuses: ("active" | "completed" | "failed")[] = [
    "active",
    "completed",
    "failed",
  ];

  return Array.from({ length: 8 }, (_, i) => {
    const crop = crops[Math.floor(Math.random() * crops.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const investmentAmount = 5000 + Math.random() * 45000;
    const returns =
      status === "failed" ? -20 + Math.random() * 10 : 5 + Math.random() * 25;
    const currentValue = investmentAmount * (1 + returns / 100);

    return {
      id: `portfolio_${i + 1}`,
      investmentId: `inv_${i + 1}`,
      cropType: crop.en,
      cropTypeArabic: crop.ar,
      region,
      investmentAmount: Math.round(investmentAmount),
      currentValue: Math.round(currentValue),
      returns: Math.round(returns * 10) / 10,
      status,
      startDate: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      endDate: status === "completed" ? new Date().toISOString() : undefined,
      progress:
        status === "active"
          ? Math.random() * 100
          : status === "completed"
            ? 100
            : Math.random() * 60,
    };
  });
}

function calculateInvestorMetrics(portfolio: PortfolioItem[]): InvestorMetrics {
  const totalInvested = portfolio.reduce(
    (sum, item) => sum + item.investmentAmount,
    0,
  );
  const totalReturns = portfolio.reduce(
    (sum, item) => sum + (item.currentValue - item.investmentAmount),
    0,
  );
  const activeInvestments = portfolio.filter(
    (item) => item.status === "active",
  ).length;
  const completedInvestments = portfolio.filter(
    (item) => item.status === "completed",
  ).length;
  const averageReturn =
    portfolio.length > 0
      ? portfolio.reduce((sum, item) => sum + item.returns, 0) /
        portfolio.length
      : 0;
  const portfolioValue = portfolio.reduce(
    (sum, item) => sum + item.currentValue,
    0,
  );

  // Risk diversification
  const riskCounts = { low: 0, medium: 0, high: 0 };
  // This would be calculated based on actual investment risk levels
  riskCounts.low = Math.floor(portfolio.length * 0.4);
  riskCounts.medium = Math.floor(portfolio.length * 0.4);
  riskCounts.high = portfolio.length - riskCounts.low - riskCounts.medium;

  // Crop diversification
  const cropDiversification: Record<string, number> = {};
  portfolio.forEach((item) => {
    cropDiversification[item.cropType] =
      (cropDiversification[item.cropType] || 0) + item.investmentAmount;
  });

  // Region diversification
  const regionDiversification: Record<string, number> = {};
  portfolio.forEach((item) => {
    regionDiversification[item.region] =
      (regionDiversification[item.region] || 0) + item.investmentAmount;
  });

  return {
    totalInvested: Math.round(totalInvested),
    totalReturns: Math.round(totalReturns),
    activeInvestments,
    completedInvestments,
    averageReturn: Math.round(averageReturn * 10) / 10,
    portfolioValue: Math.round(portfolioValue),
    monthlyGrowth: 2 + Math.random() * 8, // Mock monthly growth
    riskDiversification: riskCounts,
    cropDiversification,
    regionDiversification,
  };
}

// API Endpoints

export const getInvestmentOpportunities = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      cropType,
      region,
      riskLevel,
      minReturn,
      maxInvestment,
      sortBy = "expectedReturn",
      order = "desc",
      limit = 10,
      offset = 0,
    } = req.query;

    let opportunities = generateInvestmentOpportunities();

    // Apply filters
    if (cropType) {
      opportunities = opportunities.filter((opp) =>
        opp.cropType.toLowerCase().includes((cropType as string).toLowerCase()),
      );
    }

    if (region) {
      opportunities = opportunities.filter((opp) =>
        opp.region.toLowerCase().includes((region as string).toLowerCase()),
      );
    }

    if (riskLevel) {
      opportunities = opportunities.filter(
        (opp) => opp.riskLevel === riskLevel,
      );
    }

    if (minReturn) {
      opportunities = opportunities.filter(
        (opp) => opp.expectedReturn >= Number(minReturn),
      );
    }

    if (maxInvestment) {
      opportunities = opportunities.filter(
        (opp) => opp.investmentRequired <= Number(maxInvestment),
      );
    }

    // Sort
    opportunities.sort((a, b) => {
      const aValue = a[sortBy as keyof InvestmentOpportunity] as number;
      const bValue = b[sortBy as keyof InvestmentOpportunity] as number;
      return order === "desc" ? bValue - aValue : aValue - bValue;
    });

    // Paginate
    const paginatedOpportunities = opportunities.slice(
      Number(offset),
      Number(offset) + Number(limit),
    );

    res.json({
      success: true,
      data: {
        opportunities: paginatedOpportunities,
        total: opportunities.length,
        filters: {
          cropType,
          region,
          riskLevel,
          minReturn,
          maxInvestment,
        },
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: opportunities.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get investment opportunities",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProfitabilityAnalysis = async (req: Request, res: Response) => {
  try {
    const { cropType, region } = req.query;

    let analysis = generateProfitabilityAnalysis();

    if (cropType) {
      analysis = analysis.filter((item) =>
        item.cropType
          .toLowerCase()
          .includes((cropType as string).toLowerCase()),
      );
    }

    if (region) {
      analysis = analysis.filter((item) =>
        item.region.toLowerCase().includes((region as string).toLowerCase()),
      );
    }

    // Sort by profit margin (highest first)
    analysis.sort((a, b) => b.profitMargin - a.profitMargin);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get profitability analysis",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getMarketInsights = async (req: Request, res: Response) => {
  try {
    const { category, importance, limit = 10 } = req.query;

    let insights = generateMarketInsights();

    if (category) {
      insights = insights.filter((insight) => insight.category === category);
    }

    if (importance) {
      insights = insights.filter(
        (insight) => insight.importance === importance,
      );
    }

    // Sort by date (newest first)
    insights.sort(
      (a, b) =>
        new Date(b.datePublished).getTime() -
        new Date(a.datePublished).getTime(),
    );

    // Limit results
    insights = insights.slice(0, Number(limit));

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get market insights",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getInvestorPortfolio = async (req: Request, res: Response) => {
  try {
    const investorId = (req.query.investorId as string) || "demo-investor";

    const portfolio = generatePortfolioItems();
    const metrics = calculateInvestorMetrics(portfolio);

    res.json({
      success: true,
      data: {
        portfolio,
        metrics,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get investor portfolio",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getInvestorDashboard = async (req: Request, res: Response) => {
  try {
    const investorId = (req.query.investorId as string) || "demo-investor";

    // Get all data for dashboard
    const opportunities = generateInvestmentOpportunities().slice(0, 5); // Top 5
    const portfolio = generatePortfolioItems();
    const metrics = calculateInvestorMetrics(portfolio);
    const insights = generateMarketInsights().slice(0, 3); // Latest 3
    const profitability = generateProfitabilityAnalysis().slice(0, 5); // Top 5

    res.json({
      success: true,
      data: {
        overview: {
          metrics,
          recentActivity: portfolio.slice(0, 5),
          upcomingOpportunities: opportunities
            .filter((opp) => new Date(opp.availableFrom) > new Date())
            .slice(0, 3),
        },
        topOpportunities: opportunities,
        marketInsights: insights,
        profitabilityAnalysis: profitability,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get investor dashboard",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createInvestment = async (req: Request, res: Response) => {
  try {
    const {
      investorId = "demo-investor",
      opportunityId,
      amount,
      notes,
    } = req.body;

    // In a real app, this would create an investment record in the database
    const newInvestment = {
      id: `inv_${Date.now()}`,
      investorId,
      opportunityId,
      amount,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: newInvestment,
      message: "Investment created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create investment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
