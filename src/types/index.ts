export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy';
export type WaterClarity = 'clear' | 'slightly-murky' | 'murky';
export type WaterLevel = 'low' | 'normal' | 'high';
export type WaterCurrent = 'still' | 'slow' | 'moderate' | 'fast';

export interface WeatherConditions {
  temperature?: number;
  windSpeed?: number;
  condition?: WeatherCondition;
  humidity?: number;
}

export interface WaterConditions {
  temperature?: number;
  clarity?: WaterClarity;
  level?: WaterLevel;
  current?: WaterCurrent;
}

export interface Catch {
  id: string;
  species: string;
  weight?: number; // grams
  length?: number; // cm
  time: string;
  released: boolean;
  notes?: string;
}

export interface FishingLocation {
  lat: number;
  lng: number;
  canton?: string;
  cantonCode?: string;
  locationName?: string;
}

export interface FishingSession {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: FishingLocation;
  weather: WeatherConditions;
  water: WaterConditions;
  catches: Catch[];
  notes?: string;
}

export interface CantonLawEntry {
  title: string;
  description: string;
  url?: string;
}

export interface MinimumSize {
  species: string;
  sizeCm: number;
}

export interface CantonLaw {
  canton: string;
  cantonCode: string;
  laws: CantonLawEntry[];
  permitInfo?: string;
  minimumSizes?: MinimumSize[];
  generalInfo?: string;
}
