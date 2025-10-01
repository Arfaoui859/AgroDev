import { supabase } from '../lib/supabase';

export interface Farm {
  id: string;
  name: string;
  name_ar: string;
  location: string;
  size_hectares: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  name_ar: string;
  size_hectares: number;
  soil_type: string;
  current_crop?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SoilData {
  id: string;
  field_id: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  moisture: number;
  temperature: number;
  measured_at: string;
  created_at: string;
}

export class FarmService {
  // Farm operations
  static async getAllFarms() {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getFarmById(farmId: string) {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createFarm(farm: Omit<Farm, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('farms')
      .insert(farm)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateFarm(farmId: string, updates: Partial<Farm>) {
    const { data, error } = await supabase
      .from('farms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', farmId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteFarm(farmId: string) {
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', farmId);
    
    if (error) throw error;
  }

  // Field operations
  static async getFieldsByFarmId(farmId: string) {
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getFieldById(fieldId: string) {
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createField(field: Omit<Field, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('fields')
      .insert(field)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateField(fieldId: string, updates: Partial<Field>) {
    const { data, error } = await supabase
      .from('fields')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', fieldId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteField(fieldId: string) {
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', fieldId);
    
    if (error) throw error;
  }

  // Soil data operations
  static async getSoilDataByFieldId(fieldId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('soil_data')
      .select('*')
      .eq('field_id', fieldId)
      .order('measured_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async createSoilData(soilData: Omit<SoilData, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('soil_data')
      .insert(soilData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getLatestSoilData(fieldId: string) {
    const { data, error } = await supabase
      .from('soil_data')
      .select('*')
      .eq('field_id', fieldId)
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  }
}
