import type { RegulationRecord } from '../types';

export const REGULATION_RECORDS: RegulationRecord[] = [
  // ── Solothurn — patent_purchase ────────────────────────────────────────────
  {
    id: 'so-patent-purchase-2026',
    canton: 'SO',
    topic: 'patent_purchase',
    content:
      'Das Fischerpatent für Kanton Solothurn kann online über die offizielle Website des Amts für Wald, Jagd und Fischerei (AWJF) oder direkt am Schalter erworben werden. Jahres- und Tagespatente sind verfügbar.',
    sourceUrl:
      'https://so.ch/services/fischerpatent-beantragen/',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Solothurn — patent_types ───────────────────────────────────────────────
  {
    id: 'so-patent-types-2026',
    canton: 'SO',
    topic: 'patent_types',
    content:
      'Kanton Solothurn bietet Jahrespatente und Tagespatente an. Fischerei ist auf kantonalen Gewässern mit gültigem Patent erlaubt. Für Wanderfische (Lachs, Meerforelle) gelten besondere Bestimmungen.',
    sourceUrl:
      'https://so.ch/verwaltung/bau-und-justizdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Solothurn — minimum_sizes ─────────────────────────────────────────────
  {
    id: 'so-minimum-sizes-2026',
    canton: 'SO',
    topic: 'minimum_sizes',
    content:
      'Mindestmasse Kanton Solothurn (2026): Bachforelle / Seeforelle / Regenbogenforelle 25 cm, Hecht 40 cm, Äsche 30 cm, Zander 40 cm, Egli 18 cm. Fische unter Mindestmass sind unverzüglich zurückzusetzen.',
    sourceUrl:
      'https://so.ch/verwaltung/bau-und-justizdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Solothurn — closed_seasons ────────────────────────────────────────────
  {
    id: 'so-closed-seasons-2026',
    canton: 'SO',
    topic: 'closed_seasons',
    content:
      'Schonzeiten Kanton Solothurn (2026): Bachforelle 15. September – 15. März; Äsche 1. März – 30. April; Hecht 1. Februar – 31. März. Genaue Schonzeiten können je Gewässer abweichen — offizielle Quelle prüfen.',
    sourceUrl:
      'https://so.ch/verwaltung/bau-und-justizdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Solothurn — authority_contact ─────────────────────────────────────────
  {
    id: 'so-authority-contact-2026',
    canton: 'SO',
    topic: 'authority_contact',
    content:
      'Amt für Wald, Jagd und Fischerei (AWJF) Kanton Solothurn, Bau- und Justizdepartement. Adresse: Werkhofstrasse 59, 4509 Solothurn. Website: so.ch/awjf.',
    sourceUrl:
      'https://so.ch/verwaltung/bau-und-justizdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },

  // ── Bern — patent_purchase ─────────────────────────────────────────────────
  {
    id: 'be-patent-purchase-2026',
    canton: 'BE',
    topic: 'patent_purchase',
    content:
      'Das Fischerpatent für Kanton Bern (Fischereikarte) wird online über die WEU-Website oder an kantonalen Schaltern erworben. Verschiedene Patenttypen für Seen und Fliessgewässer sind erhältlich.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/fischerei/fischerpatent-kaufen.html',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Bern — patent_types ───────────────────────────────────────────────────
  {
    id: 'be-patent-types-2026',
    canton: 'BE',
    topic: 'patent_types',
    content:
      'Kanton Bern bietet Jahrespatente (Seen und Fliessgewässer getrennt), Tagespatente und kombinierte Patente an. Für den Bielersee, Thunersee und Brienzersee gelten eigene Regelungen.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/fischerei.html',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Bern — minimum_sizes ──────────────────────────────────────────────────
  {
    id: 'be-minimum-sizes-2026',
    canton: 'BE',
    topic: 'minimum_sizes',
    content:
      'Mindestmasse Kanton Bern (2026): Bachforelle / Seeforelle 25 cm, Hecht 45 cm, Äsche 35 cm, Seesaibling 25 cm, Felchen 20 cm, Egli 18 cm. Massgebend ist die gesetzliche Bestimmung — offizielle Quelle prüfen.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/fischerei.html',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Bern — closed_seasons ─────────────────────────────────────────────────
  {
    id: 'be-closed-seasons-2026',
    canton: 'BE',
    topic: 'closed_seasons',
    content:
      'Schonzeiten Kanton Bern (2026): Bachforelle 15. September – 15. März; Äsche 1. März – 30. April; Hecht 1. Februar – 31. März; Seesaibling 1. Oktober – 31. Dezember. Abweichungen je Gewässer möglich.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/fischerei.html',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
  // ── Bern — authority_contact ──────────────────────────────────────────────
  {
    id: 'be-authority-contact-2026',
    canton: 'BE',
    topic: 'authority_contact',
    content:
      'Amt für Landwirtschaft und Natur (LANAT) / Fischereibehörde Kanton Bern, Wirtschaft, Energie und Umwelt (WEU). Website: weu.be.ch/fischerei. Zuständig für Fischereipatente und -vorschriften.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/fischerei.html',
    extractedDate: '2026-04-15',
    effectiveYear: 2026,
    confidence: 'high',
  },
];

export function getRecordsByCanton(cantonCode: string): RegulationRecord[] {
  return REGULATION_RECORDS.filter((r) => r.canton === cantonCode);
}

export function getRecordsByCantonAndTopic(
  cantonCode: string,
  topic: RegulationRecord['topic'],
): RegulationRecord[] {
  return REGULATION_RECORDS.filter((r) => r.canton === cantonCode && r.topic === topic);
}
