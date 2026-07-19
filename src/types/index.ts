export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy';
export type WaterClarity = 'clear' | 'slightly-murky' | 'murky';
export type WaterLevel = 'low' | 'normal' | 'high';
export type WaterCurrent = 'still' | 'slow' | 'moderate' | 'fast';

export const CURRENT_SESSION_SCHEMA_VERSION = 3;

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
  photoIds?: string[]; // IndexedDB photo references
  photos?: string[]; // base64 data URLs
  recognition?: CatchRecognitionMetadata;
  location?: FishingLocation; // optional per-catch location
}

export type CatchSpeciesSelectionSource = 'manual' | 'ai';

export type CatchRecognitionErrorCode =
  | 'unsupported_format'
  | 'image_too_large'
  | 'malformed_image'
  | 'processing_failed'
  | 'out_of_memory';

export interface SpeciesPrediction {
  species: string;
  confidence: number;
}

export interface CatchRecognitionMetadata {
  predictedSpecies: SpeciesPrediction[];
  selectedSpeciesSource: CatchSpeciesSelectionSource;
  selectedSpeciesConfidence?: number;
  modelVersion: string;
  recognizedAt: string;
  errorCode?: CatchRecognitionErrorCode;
}

export interface FishingLocation {
  lat: number;
  lng: number;
  canton?: string;
  cantonCode?: string;
  locationName?: string;
  country?: string;
  countryCode?: string;
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
  permitPurchaseUrl?: string;
  lastVerified?: string;   // ISO date string
  regulationYear?: number;
}

export type RegulationSourceType =
  | 'official_authority'
  | 'official_law_text'
  | 'official_pdf'
  | 'permit_portal'
  | 'aggregator'
  | 'news_blog'
  | 'forum';

export type RegulationTopic =
  | 'patent_types'
  | 'patent_purchase'
  | 'patent_price'
  | 'minimum_sizes'
  | 'closed_seasons'
  | 'method_restrictions'
  | 'protected_zones'
  | 'legal_basis'
  | 'authority_contact'
  | 'inter_cantonal';

export interface RegulationSource {
  canton: string;
  url: string;
  type: RegulationSourceType;
  language: 'de' | 'fr' | 'it' | 'en';
  trustLevel: 'high' | 'medium' | 'low';
  lastVerified: string;  // ISO date
  effectiveYear: number;
  description?: string;
  isPatentPurchase?: boolean;
}

export interface RegulationRecord {
  id: string;
  canton: string;
  topic: RegulationTopic;
  content: string;
  sourceUrl: string;
  extractedDate: string;  // ISO date
  effectiveYear: number;
  confidence: 'high' | 'medium' | 'low';
  isStale?: boolean;      // computed: age > staleness threshold
}
