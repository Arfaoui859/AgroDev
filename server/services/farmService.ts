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
  name_ar?: string | null;
  size_hectares: number;
  soil_type: string;
  current_crop?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * The deployed Supabase schema has no `fields` table; a field is represented by
 * a `farm_sections` row. These two helpers translate between the API's `Field`
 * contract and the physical table, so the field routes work against the real
 * database instead of 500-ing on a missing relation.
 */
function sectionToField(row: any): Field {
  return {
    id: row.id,
    farm_id: row.farm_id,
    name: row.name,
    name_ar: row.name_ar ?? null,
    size_hectares: row.area_hectares,
    soil_type: row.soil_type,
    current_crop: row.current_crop ?? undefined,
    planting_date: row.planted_date ?? undefined,
    expected_harvest_date: row.expected_harvest_date ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function fieldToSection(field: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};
  if (field.farm_id !== undefined) row.farm_id = field.farm_id;
  if (field.name !== undefined) row.name = field.name;
  if (field.size_hectares !== undefined) row.area_hectares = field.size_hectares;
  if (field.soil_type !== undefined) row.soil_type = field.soil_type;
  if (field.current_crop !== undefined) row.current_crop = field.current_crop;
  if (field.planting_date !== undefined) row.planted_date = field.planting_date;
  if (field.expected_harvest_date !== undefined)
    row.expected_harvest_date = field.expected_harvest_date;
  return row;
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

  // Field operations. A "field" is a `farm_sections` row (see helpers above).
  static async getFieldsByFarmId(farmId: string) {
    const { data, error } = await supabase
      .from('farm_sections')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(sectionToField);
  }

  static async getFieldById(fieldId: string) {
    const { data, error } = await supabase
      .from('farm_sections')
      .select('*')
      .eq('id', fieldId)
      .maybeSingle();

    if (error) throw error;
    return data ? sectionToField(data) : null;
  }

  static async createField(field: Omit<Field, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('farm_sections')
      .insert(fieldToSection(field))
      .select()
      .single();

    if (error) throw error;
    return sectionToField(data);
  }

  static async updateField(fieldId: string, updates: Partial<Field>) {
    const { data, error } = await supabase
      .from('farm_sections')
      .update({ ...fieldToSection(updates), updated_at: new Date().toISOString() })
      .eq('id', fieldId)
      .select()
      .single();

    if (error) throw error;
    return sectionToField(data);
  }

  static async deleteField(fieldId: string) {
    const { error } = await supabase
      .from('farm_sections')
      .delete()
      .eq('id', fieldId);

    if (error) throw error;
  }

  // Soil data operations. The deployed schema stores measurements in
  // `soil_analyses` (there is no `soil_data` table), mapped onto SoilData.
  private static analysisToSoilData(row: any): SoilData {
    return {
      id: row.id,
      field_id: row.section_id ?? row.farm_id,
      ph: row.ph_level ?? 0,
      nitrogen: row.nitrogen_level ?? 0,
      phosphorus: row.phosphorus_level ?? 0,
      potassium: row.potassium_level ?? 0,
      organic_matter: row.organic_matter_percent ?? 0,
      moisture: row.moisture_percent ?? 0,
      temperature: row.temperature_celsius ?? 0,
      measured_at: row.analyzed_at,
      created_at: row.created_at ?? row.analyzed_at,
    };
  }

  static async getSoilDataByFieldId(fieldId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('soil_analyses')
      .select('*')
      .eq('section_id', fieldId)
      .order('analyzed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map(FarmService.analysisToSoilData);
  }

  static async createSoilData(soilData: Omit<SoilData, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('soil_analyses')
      .insert({
        section_id: soilData.field_id,
        analysis_type: 'sensor',
        sensor_data: {
          ph: soilData.ph,
          nitrogen: soilData.nitrogen,
          phosphorus: soilData.phosphorus,
          potassium: soilData.potassium,
          organic_matter: soilData.organic_matter,
          moisture: soilData.moisture,
          temperature: soilData.temperature,
        },
        ph_level: soilData.ph,
        nitrogen_level: soilData.nitrogen,
        phosphorus_level: soilData.phosphorus,
        potassium_level: soilData.potassium,
        organic_matter_percent: soilData.organic_matter,
        moisture_percent: soilData.moisture,
        temperature_celsius: soilData.temperature,
        analyzed_at: soilData.measured_at,
      })
      .select()
      .single();

    if (error) throw error;
    return FarmService.analysisToSoilData(data);
  }

  static async getLatestSoilData(fieldId: string) {
    const rows = await FarmService.getSoilDataByFieldId(fieldId, 1);
    return rows.length > 0 ? rows[0] : null;
  }
}
