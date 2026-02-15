import { supabase } from '../lib/supabase';

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
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async getCropById(cropId: string) {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('id', cropId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getCropsByCategory(category: string) {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('category', category)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  static async searchCrops(searchTerm: string) {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  // Crop Recommendation operations
  static async createCropRecommendation(recommendation: Omit<CropRecommendation, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('crop_recommendations')
      .insert(recommendation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getCropRecommendationsByFieldId(fieldId: string) {
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
    const { data, error } = await supabase
      .from('market_prices')
      .select(`
        *,
        crop:crops(name, name_ar)
      `)
      .order('price_date', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data;
  }

  static async createMarketPrice(marketPrice: Omit<MarketPrice, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('market_prices')
      .insert(marketPrice)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getMarketPricesByLocation(location: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('market_prices')
      .select(`
        *,
        crop:crops(name, name_ar)
      `)
      .eq('market_location', location)
      .order('price_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getAverageMarketPrice(cropId: string, days: number = 30) {
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
