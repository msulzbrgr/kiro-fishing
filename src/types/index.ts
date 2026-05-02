export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy';
export type WaterClarity = 'clear' | 'slightly-murky' | 'murky';
export type WaterLevel = 'low' | 'normal' | 'high';
export type WaterCurrent = 'still' | 'slow' | 'moderate' | 'fast';

export const CURRENT_SESSION_SCHEMA_VERSION = 1;

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
  photos?: string[]; // base64 data URLs
}

export interface FishingLocation {
  lat: number;
  lng: number;
  canton?: string;
  cantonCode?: string;
  locationName?: string;
}

export type RegulationDataStatus = 'available' | 'missing' | 'stale' | 'conflicting';

export type RegulationReviewMode = 'information' | 'strict';

export type SessionRegulationState =
  | 'active_current'
  | 'active_needs_review'
  | 'active_confirmed_uncertain'
  | 'paused_due_to_regulation_change';

export interface RegulationSnapshot {
  location: FishingLocation;
  jurisdiction?: string;
  cantonCode?: string;
  status: RegulationDataStatus;
  sourceUrls: string[];
  sourceTitles: string[];
  capturedAt: string;
  userConfirmedUncertain: boolean;
  reviewMode: RegulationReviewMode;
}

export type RegulationCheckpointReason =
  | 'canton_changed'
  | 'location_changed'
  | 'missing_regulation';

export interface RegulationCheckpoint {
  id: string;
  previousJurisdiction?: string;
  newJurisdiction?: string;
  detectedAt: string;
  detectedLocation: FishingLocation;
  previousSnapshot?: RegulationSnapshot;
  newSnapshot: RegulationSnapshot;
  userConfirmed: boolean;
  requiresConfirmation: boolean;
  reason: RegulationCheckpointReason;
}

export interface FishingSession {
  schemaVersion: number;
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: FishingLocation;
  weather: WeatherConditions;
  water: WaterConditions;
  catches: Catch[];
  notes?: string;
  regulationSnapshot?: RegulationSnapshot;
  regulationState?: SessionRegulationState;
  regulationCheckpoints?: RegulationCheckpoint[];
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
