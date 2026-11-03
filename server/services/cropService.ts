import { supabase, assertDbAvailable } from '../lib/supabase';
import { CROP_REFERENCE } from './ai/cropAdvisor';

/**
 * The deployed schema has no `crops` table (PGRST205). Crop *metadata* is
 * static reference data for Tunisian agriculture, so serve it from the bundled
 * dataset instead of failing every request that needs a crop name.
 */
const MISSING_TABLE = /PGRST205|Could not find the table/i;

function referenceCrop(id: string) {
  const ref = CROP_REFERENCE.find(
    (c) => c.crop === id || c.nameAr === id || c.crop.toLowerCase() === id.toLowerCase(),
  );
  if (!ref) return null;
  return {
    id: ref.crop,
    name: ref.crop,
    name_ar: ref.nameAr,
    category: ref.category,
    growing_season: ref.seasons.join('، '),
    water_requirements: ref.waterNeed,
    soil_requirements: `pH ${ref.phRange[0]}–${ref.phRange[1]}`,
    climate_requirements: `${ref.tempRange[0]}–${ref.tempRange[1]}°C`,
    planting_depth_cm: 0,
    spacing_cm: 0,
    days_to_maturity: 0,
    optimal_ph_min: ref.phRange[0],
    optimal_ph_max: ref.phRange[1],
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    dataSource: 'reference-dataset',
  };
}

export interface Crop {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  growing_season: string;
  water_requirements: string;
  soil_requirements: string;
  climate_requirements: string;
  planting_depth_cm: number;
  spacing_cm: number;
  days_to_maturity: number;
  optimal_ph_min: number;
  optimal_ph_max: number;
  created_at: string;
  updated_at: string;
}

export interface CropRecommendation {
  id: string;
  field_id: string;
  crop_id: string;
  recommendation_date: string;
  confidence_score: number;
  expected_yield_tons_per_hectare: number;
  estimated_profit_per_hectare: number;
  planting_recommendation: string;
  harvest_recommendation: string;
  risk_factors: string[];
  created_at: string;
}

export interface MarketPrice {
  id: string;
  crop_id: string;
  price_per_kg: number;
  market_location: string;
  price_date: string;
  quality_grade: string;
  source: string;
  created_at: string;
}

export class CropService {
  // Crop operations
  static async getAllCrops() {
    if (!supabase) return CROP_REFERENCE.map((c) => referenceCrop(c.crop));
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('name');
    
    if (error) {
      if (MISSING_TABLE.test(error.message ?? '')) {
        return CROP_REFERENCE.map((c) => referenceCrop(c.crop));
      }
      throw error;
    }
    return data;
  }

  static async getCropById(cropId: string) {
    if (!supabase) return referenceCrop(cropId);
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('id', cropId)
      .maybeSingle();
    
    if (error) {
      if (MISSING_TABLE.test(error.message ?? '')) return referenceCrop(cropId);
      throw error;
    }
    return data ?? referenceCrop(cropId);
  }

  static async getCropsByCategory(category: string) {
    if (!supabase) {
      return CROP_REFERENCE.filter((c) => c.category === category).map((c) =>
        referenceCrop(c.crop),
      );
    }
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('category', category)
      .order('name');
    
    if (error) {
      if (MISSING_TABLE.test(error.message ?? '')) {
        return CROP_REFERENCE.filter((c) => c.category === category).map((c) =>
          referenceCrop(c.crop),
        );
      }
      throw error;
    }
    return data;
  }

  static async searchCrops(searchTerm: string) {
    if (!supabase) {
      const term = searchTerm.toLowerCase();
      return CROP_REFERENCE.filter(
        (c) => c.crop.toLowerCase().includes(term) || c.nameAr.includes(searchTerm),
      ).map((c) => referenceCrop(c.crop));
    }
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) {
      if (MISSING_TABLE.test(error.message ?? '')) {
        const term = searchTerm.toLowerCase();
        return CROP_REFERENCE.filter(
          (c) => c.crop.toLowerCase().includes(term) || c.nameAr.includes(searchTerm),
        ).map((c) => referenceCrop(c.crop));
      }
      throw error;
    }
    return data;
  }

  // Crop Recommendation operations
  static async createCropRecommendation(recommendation: Omit<CropRecommendation, 'id' | 'created_at'>) {
    assertDbAvailable();
    const { data, error } = await supabase
      .from('crop_recommendations')
      .insert(recommendation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getCropRecommendationsByFieldId(fieldId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('crop_recommendations')
      .select(`
        *,
        crop:crops(*)
      `)
      .eq('field_id', fieldId)
      .order('recommendation_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getLatestCropRecommendation(fieldId: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('crop_recommendations')
      .select(`
        *,
        crop:crops(*)
      `)
      .eq('field_id', fieldId)
      .order('recommendation_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Market Price operations
  static async getMarketPricesByCropId(cropId: string, limit: number = 30) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .eq('crop_id', cropId)
      .order('price_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getLatestMarketPrices() {
    if (!supabase) return [];
    // No embedded `crops(...)` join: the deployed schema has no foreign key
    // from market_prices.crop_id to crops.id, so PostgREST rejects the
    // relationship (PGRST200). Callers attach crop names via a separate lookup.
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .order('price_date', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data;
  }

  static async createMarketPrice(marketPrice: Omit<MarketPrice, 'id' | 'created_at'>) {
    assertDbAvailable();
    const { data, error } = await supabase
      .from('market_prices')
      .insert(marketPrice)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getMarketPricesByLocation(location: string, limit: number = 50) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .eq('market_location', location)
      .order('price_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getAverageMarketPrice(cropId: string, days: number = 30) {
    if (!supabase) return null;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('market_prices')
      .select('price_per_kg')
      .eq('crop_id', cropId)
      .gte('price_date', fromDate.toISOString());
    
    if (error) throw error;
    
    if (!data || data.length === 0) return null;
    
    const average = data.reduce((sum, price) => sum + price.price_per_kg, 0) / data.length;
    return average;
  }
}
