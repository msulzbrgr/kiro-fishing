import type { RegulationSource } from '../types';

export const REGULATION_SOURCES: RegulationSource[] = [
  // ── Solothurn ──────────────────────────────────────────────────────────────
  {
    canton: 'SO',
    url: 'https://so.ch/verwaltung/bau-und-justizdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
    type: 'official_authority',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-04-15',
    effectiveYear: 2026,
    description: 'Amt für Wald, Jagd und Fischerei Solothurn — offizielle Fischereibehörde',
    isPatentPurchase: false,
  },
  {
    canton: 'SO',
    url: 'https://so.ch/services/fischerpatent-beantragen/',
    type: 'permit_portal',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-04-15',
    effectiveYear: 2026,
    description: 'Fischerpatent Solothurn online kaufen',
    isPatentPurchase: true,
  },
  {
    canton: 'SO',
    url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
    type: 'official_law_text',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-04-15',
    effectiveYear: 2026,
    description: 'Bundesgesetz über die Fischerei (BGF) SR 923.0',
    isPatentPurchase: false,
  },

  // ── Bern ───────────────────────────────────────────────────────────────────
  {
    canton: 'BE',
    url: 'https://www.weu.be.ch/de/start/themen/fischerei.html',
    type: 'official_authority',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-04-15',
    effectiveYear: 2026,
    description: 'Fischereibehörde Kanton Bern — WEU Bern',
    isPatentPurchase: false,
  },
  {
    canton: 'BE',
    url: 'https://www.weu.be.ch/de/start/themen/fischerei/fischerpatent-kaufen.html',
    type: 'permit_portal',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-04-15',
    effectiveYear: 2026,
    description: 'Fischerpatent Kanton Bern kaufen',
    isPatentPurchase: true,
  },
  {
    canton: 'BE',
    url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
    type: 'official_law_text',
    language: 'de',
    trustLevel: 'high',
    lastVerified: '2026-04-15',
    effectiveYear: 2026,
    description: 'Bundesgesetz über die Fischerei (BGF) SR 923.0',
    isPatentPurchase: false,
  },
];

export function getSourcesByCanton(cantonCode: string): RegulationSource[] {
  return REGULATION_SOURCES.filter((s) => s.canton === cantonCode);
}

export function getPatentPurchaseSource(cantonCode: string): RegulationSource | undefined {
  return REGULATION_SOURCES.find((s) => s.canton === cantonCode && s.isPatentPurchase === true);
}
