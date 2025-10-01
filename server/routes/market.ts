import { RequestHandler } from "express";
import { CropService } from "../services/cropService";

export const getMarketData: RequestHandler = async (req, res) => {
  try {
    const { cropId } = req.params;

    // Get crop information
    const crop = await CropService.getCropById(cropId);
    if (!crop) {
      return res.status(404).json({
        status: "error",
        message: "المحصول غير موجود",
      });
    }

    // Get recent market prices
    const marketPrices = await CropService.getMarketPricesByCropId(cropId, 30);

    // Calculate statistics
    const currentPrice =
      marketPrices.length > 0 ? marketPrices[0].price_per_kg : 0;
    const averagePrice30Days = await CropService.getAverageMarketPrice(
      cropId,
      30,
    );
    const averagePrice7Days = await CropService.getAverageMarketPrice(
      cropId,
      7,
    );

    // Calculate trend
    const priceChange =
      averagePrice7Days && averagePrice30Days
        ? ((averagePrice7Days - averagePrice30Days) / averagePrice30Days) * 100
        : 0;

    const response = {
      crop: {
        id: crop.id,
        name: crop.name,
        nameAr: crop.name_ar,
        category: crop.category,
      },
      currentPrice: {
        value: currentPrice,
        currency: "TND",
        unit: "kg",
        lastUpdated:
          marketPrices.length > 0
            ? marketPrices[0].price_date
            : new Date().toISOString(),
      },
      priceHistory: marketPrices.map((price) => ({
        date: price.price_date,
        price: price.price_per_kg,
        location: price.market_location,
        quality: price.quality_grade,
      })),
      statistics: {
        averagePrice30Days: averagePrice30Days || 0,
        averagePrice7Days: averagePrice7Days || 0,
        priceChange: priceChange,
        trend:
          priceChange > 2 ? "ارتفاع" : priceChange < -2 ? "انخفاض" : "استقرار",
        volatility: calculateVolatility(marketPrices),
      },
      forecast: generatePriceForecast(marketPrices),
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      status: "success",
      data: response,
      message: "تم استرجاع بيانات السوق بنجاح",
    });
  } catch (error) {
    console.error("Error fetching market data:", error);
    res.status(500).json({
      status: "error",
      message: "فشل في استرجاع بيانات السوق",
      error: error.message,
    });
  }
};

export const getAllMarketData: RequestHandler = async (req, res) => {
  try {
    const latestPrices = await CropService.getLatestMarketPrices();

    // Group by crop
    const marketData = {};
    latestPrices.forEach((price) => {
      if (!marketData[price.crop_id]) {
        marketData[price.crop_id] = {
          crop: price.crop,
          prices: [],
          currentPrice: 0,
          averagePrice: 0,
        };
      }
      marketData[price.crop_id].prices.push(price);
    });

    // Calculate averages and current prices
    Object.keys(marketData).forEach((cropId) => {
      const data = marketData[cropId];
      data.currentPrice = data.prices[0]?.price_per_kg || 0;
      data.averagePrice =
        data.prices.reduce((sum, p) => sum + p.price_per_kg, 0) /
        data.prices.length;
    });

    const response = {
      marketOverview: Object.values(marketData),
      totalCrops: Object.keys(marketData).length,
      lastUpdated: new Date().toISOString(),
      summary: {
        highestPrice: Math.max(
          ...Object.values(marketData).map((d: any) => d.currentPrice),
        ),
        lowestPrice: Math.min(
          ...Object.values(marketData).map((d: any) => d.currentPrice),
        ),
        averagePrice:
          Object.values(marketData).reduce(
            (sum: number, d: any) => sum + d.currentPrice,
            0,
          ) / Object.keys(marketData).length,
      },
    };

    res.json({
      status: "success",
      data: response,
      message: "تم استرجاع جميع بيانات السوق بنجاح",
    });
  } catch (error) {
    console.error("Error fetching all market data:", error);
    res.status(500).json({
      status: "error",
      message: "فشل في استرجاع بيانات السوق",
      error: error.message,
    });
  }
};

export const getMarketTrends: RequestHandler = async (req, res) => {
  try {
    const { period = "30", location } = req.query;
    const days = parseInt(period as string);

    let marketPrices;
    if (location) {
      marketPrices = await CropService.getMarketPricesByLocation(
        location as string,
        100,
      );
    } else {
      marketPrices = await CropService.getLatestMarketPrices();
    }

    // Filter by date range
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const filteredPrices = marketPrices.filter(
      (price) => new Date(price.price_date) >= fromDate,
    );

    // Analyze trends
    const trends = analyzeTrends(filteredPrices);

    const response = {
      period: `${days} أيام`,
      location: location || "جميع المواقع",
      trends: trends,
      insights: generateMarketInsights(trends),
      recommendations: generateMarketRecommendations(trends),
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      status: "success",
      data: response,
      message: "تم استرجاع اتجاهات السوق بنجاح",
    });
  } catch (error) {
    console.error("Error fetching market trends:", error);
    res.status(500).json({
      status: "error",
      message: "فشل في استرجاع اتجاهات السوق",
      error: error.message,
    });
  }
};

export const getRegionalPrices: RequestHandler = async (req, res) => {
  try {
    const { cropId } = req.params;
    const { region } = req.query;

    const crop = await CropService.getCropById(cropId);
    if (!crop) {
      return res.status(404).json({
        status: "error",
        message: "المحصول غير موجود",
      });
    }

    const marketPrices = await CropService.getMarketPricesByCropId(cropId, 50);

    // Group by location
    const regionalData = {};
    marketPrices.forEach((price) => {
      if (!regionalData[price.market_location]) {
        regionalData[price.market_location] = {
          location: price.market_location,
          prices: [],
          currentPrice: 0,
          averagePrice: 0,
          priceChange: 0,
        };
      }
      regionalData[price.market_location].prices.push(price);
    });

    // Calculate regional statistics
    Object.keys(regionalData).forEach((location) => {
      const data = regionalData[location];
      const currentPrice = data.prices[0]?.price_per_kg || 0;
      const averagePrice =
        data.prices.reduce((sum, p) => sum + p.price_per_kg, 0) /
        data.prices.length;

      // Calculate price change
      let priceChange = 0;
      if (data.prices.length > 1) {
        const recent =
          data.prices.slice(0, 7).reduce((sum, p) => sum + p.price_per_kg, 0) /
          Math.min(7, data.prices.length);
        const older =
          data.prices.slice(7, 14).reduce((sum, p) => sum + p.price_per_kg, 0) /
          Math.min(7, data.prices.slice(7, 14).length);
        priceChange = older > 0 ? ((recent - older) / older) * 100 : 0;
      }

      // Update with complete price data
      Object.assign(data, createCompletePriceData(currentPrice, data.prices));
      data.averagePrice = averagePrice;
      data.priceChange = priceChange;
    });

    const response = {
      crop: {
        id: crop.id,
        name: crop.name,
        nameAr: crop.name_ar,
      },
      regionalPrices: Object.values(regionalData),
      bestPrice: Math.max(
        ...Object.values(regionalData).map((d: any) => d.currentPrice),
      ),
      worstPrice: Math.min(
        ...Object.values(regionalData).map((d: any) => d.currentPrice),
      ),
      averageNationalPrice:
        Object.values(regionalData).reduce(
          (sum: number, d: any) => sum + d.currentPrice,
          0,
        ) / Object.keys(regionalData).length,
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      status: "success",
      data: response,
      message: "تم استرجاع الأسعار الإقليمية بنجاح",
    });
  } catch (error) {
    console.error("Error fetching regional prices:", error);
    res.status(500).json({
      status: "error",
      message: "فشل في استرجاع الأسعار الإقليمية",
      error: error.message,
    });
  }
};

// Helper functions
function calculateVolatility(prices: any[]): number {
  if (prices.length < 2) return 0;

  const priceValues = prices.map((p) => p.price_per_kg);
  const mean =
    priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
  const variance =
    priceValues.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
    priceValues.length;

  return Math.sqrt(variance);
}

function generatePriceForecast(prices: any[]): any {
  if (prices.length < 7) {
    return {
      nextWeek: 0,
      nextMonth: 0,
      confidence: "منخفضة",
      method: "بيانات غير كافية",
    };
  }

  // Simple linear regression for forecasting
  const recentPrices = prices.slice(0, 14).reverse();
  const trend = calculateTrend(recentPrices);
  const currentPrice = prices[0].price_per_kg;

  return {
    nextWeek: currentPrice * (1 + trend * 0.1),
    nextMonth: currentPrice * (1 + trend * 0.3),
    confidence: prices.length > 20 ? "عالية" : "متوسطة",
    method: "الانحدار الخطي",
  };
}

function calculateTrend(prices: any[]): number {
  if (prices.length < 2) return 0;

  const n = prices.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = prices.reduce((sum, p) => sum + p.price_per_kg, 0);
  const sumXY = prices.reduce((sum, p, i) => sum + i * p.price_per_kg, 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

function createCompletePriceData(currentPrice: number, prices: any[] = []) {
  const priceValues = prices
    .map((p) => p.price_per_kg)
    .filter((p) => typeof p === "number");

  return {
    currentPrice,
    currency: "TND",
    unit: "kg",
    lastUpdated:
      prices.length > 0 ? prices[0].price_date : new Date().toISOString(),
    priceHistory: prices.map((price) => ({
      date: price.price_date,
      price: price.price_per_kg,
      volume: price.volume || 0,
    })),
    priceRange: {
      min: priceValues.length > 0 ? Math.min(...priceValues) : currentPrice,
      max: priceValues.length > 0 ? Math.max(...priceValues) : currentPrice,
      average:
        priceValues.length > 0
          ? priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length
          : currentPrice,
    },
  };
}

function analyzeTrends(prices: any[]): any {
  const pricesByDate = {};

  prices.forEach((price) => {
    const date = price.price_date.split("T")[0];
    if (!pricesByDate[date]) {
      pricesByDate[date] = [];
    }
    pricesByDate[date].push(price.price_per_kg);
  });

  const dailyAverages = Object.keys(pricesByDate)
    .map((date) => ({
      date,
      averagePrice:
        pricesByDate[date].reduce((sum, price) => sum + price, 0) /
        pricesByDate[date].length,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const trend = calculateTrend(dailyAverages);

  return {
    overallTrend: trend > 0.01 ? "صاعد" : trend < -0.01 ? "هابط" : "مستقر",
    trendStrength: Math.abs(trend),
    dailyAverages: dailyAverages,
    volatility: calculateVolatility(dailyAverages),
  };
}

function generateMarketInsights(trends: any): string[] {
  const insights = [];

  if (trends.overallTrend === "صاعد") {
    insights.push("الأسعار في ارتفاع مستمر خلال الفترة المحددة");
    insights.push("قد يكون الوقت مناسب للبيع");
  } else if (trends.overallTrend === "هابط") {
    insights.push("الأسعار في انخفاض خلال الفترة المحددة");
    insights.push("قد يكون الوقت مناسب للشراء");
  } else {
    insights.push("الأسعار مستقرة نسبياً");
  }

  if (trends.volatility > 1) {
    insights.push("السوق يشهد تقلبات عالية");
  } else {
    insights.push("السوق مستقر مع تقلبات منخفضة");
  }

  return insights;
}

function generateMarketRecommendations(trends: any): string[] {
  const recommendations = [];

  if (trends.overallTrend === "صاعد") {
    recommendations.push("فكر في بيع المخزون قبل انعكاس الاتجاه");
    recommendations.push("راقب مؤشرات السوق للتأكد من استمرار الارتفاع");
  } else if (trends.overallTrend === "هابط") {
    recommendations.push("انتظر استقرار الأسعار قبل البيع");
    recommendations.push("فكر في تأجيل المشتريات الكبيرة");
  }

  if (trends.volatility > 1) {
    recommendations.push("تجنب القرارات السريعة في هذه الفترة");
    recommendations.push("فكر في التحوط ضد تقلبات الأسعار");
  }

  return recommendations;
}
