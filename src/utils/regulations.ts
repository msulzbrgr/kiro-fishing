import type {
  FishingLocation,
  RegulationCheckpoint,
  RegulationCheckpointReason,
  RegulationSnapshot,
  RegulationReviewMode,
  SessionRegulationState,
} from '../types';
import { CANTON_LAWS } from '../data/cantonLaws';
import { generateId } from './storage';

export const STALENESS_THRESHOLD_DAYS = 180;
const REVALIDATION_DISTANCE_KM = 0.5;

export function isRegulationStale(
  lastVerified: string,
  thresholdDays = STALENESS_THRESHOLD_DAYS,
): boolean {
  const verified = new Date(lastVerified).getTime();
  const now = Date.now();
  const diffDays = (now - verified) / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

export function isOutsideSwitzerland(location: Pick<FishingLocation, 'countryCode' | 'cantonCode'>): boolean {
  const countryCode = location.countryCode?.toLowerCase();
  return Boolean(countryCode && countryCode !== 'ch' && !location.cantonCode);
}

export function createRegulationSnapshot(
  location: FishingLocation,
  userConfirmedUncertain = false,
  reviewMode: RegulationReviewMode = 'information',
): RegulationSnapshot {
  const cantonLaw = location.cantonCode ? CANTON_LAWS[location.cantonCode] : undefined;
  const status = cantonLaw ? 'stale' : 'missing';

  return {
    location,
    jurisdiction: location.canton ?? location.country ?? cantonLaw?.canton,
    cantonCode: location.cantonCode ?? cantonLaw?.cantonCode,
    status,
    sourceUrls: cantonLaw?.laws.flatMap((law) => (law.url ? [law.url] : [])) ?? [],
    sourceTitles: cantonLaw?.laws.map((law) => law.title) ?? [],
    capturedAt: new Date().toISOString(),
    userConfirmedUncertain,
    reviewMode,
  };
}

export function isRegulationUncertain(snapshot: RegulationSnapshot): boolean {
  return snapshot.status === 'missing' || snapshot.status === 'stale' || snapshot.status === 'conflicting';
}

export function getRegulationStateAfterConfirmation(
  snapshot: RegulationSnapshot,
): SessionRegulationState {
  return snapshot.reviewMode === 'strict' && isRegulationUncertain(snapshot)
    ? 'active_confirmed_uncertain'
    : 'active_current';
}

export function distanceKm(a: FishingLocation, b: FishingLocation): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function getRegulationChangeReason(
  previousLocation: FishingLocation,
  nextLocation: FishingLocation,
): RegulationCheckpointReason | null {
  if (previousLocation.cantonCode !== nextLocation.cantonCode) {
    return nextLocation.cantonCode ? 'canton_changed' : 'missing_regulation';
  }

  return distanceKm(previousLocation, nextLocation) >= REVALIDATION_DISTANCE_KM
    ? 'location_changed'
    : null;
}

export function createRegulationCheckpoint(
  previousSnapshot: RegulationSnapshot,
  newSnapshot: RegulationSnapshot,
  reason: RegulationCheckpointReason,
): RegulationCheckpoint {
  const requiresConfirmation = newSnapshot.reviewMode === 'strict';

  return {
    id: generateId(),
    previousJurisdiction: previousSnapshot.jurisdiction,
    newJurisdiction: newSnapshot.jurisdiction,
    detectedAt: new Date().toISOString(),
    detectedLocation: newSnapshot.location,
    previousSnapshot,
    newSnapshot,
    userConfirmed: false,
    requiresConfirmation,
    reason,
  };
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
