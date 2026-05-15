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
      'Das Fischerpatent für Bern kann online über die offizielle WEU-Seite „Fischer Patent kaufen“ gelöst werden. Zusätzlich sind kantonale Ausgabestellen verfügbar; je nach Gewässer werden unterschiedliche Patentarten angeboten.',
    sourceUrl:
      'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischerpatent-kaufen.html',
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
      'Für Bern sind je nach Gewässer Tages- und Jahrespatente verfügbar. Die offiziellen Informationen unterscheiden zwischen Seen, Fliessgewässern und Spezialregelungen einzelner Reviere.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei.html',
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
      'Für Bern gelten artspezifische Mindestmasse (z. B. Forellen, Hecht, Äsche). Für die Praxis sind die jeweils aktuell publizierten kantonalen Tabellen und Gewässerbestimmungen massgebend.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei.html',
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
      'Schonzeiten und Fangverbote sind in Bern je Art und Gewässer definiert. Vor jedem Angelausflug sollten die aktuellen kantonalen Zeitfenster und Revierhinweise geprüft werden.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei.html',
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
      'Zuständige Stelle ist die Fischereibehörde des Kantons Bern (WEU / LANAT). Auf der offiziellen Fischerei-Seite finden Fischer Vorschriften, Kontakte und weiterführende Dokumente.',
    sourceUrl: 'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei.html',
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
