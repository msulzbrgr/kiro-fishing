import type { CantonLaw } from '../types';

export const CANTON_LAWS: Record<string, CantonLaw> = {
  ZH: {
    canton: 'Zürich',
    cantonCode: 'ZH',
    generalInfo:
      'Kanton Zürich verlangt ein kantonales Fischereipatent. Die Fischerei wird durch das Fischereigesetz (FischG) des Kantons Zürich geregelt.',
    permitInfo:
      'Jährliches Fischereipatent erforderlich (Fischereikarte). Erhältlich bei Gemeindeverwaltungen oder online unter zh.ch.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Zürich',
        description:
          'Kantonales Hauptfischereigesetz mit Regelungen zu Patenten, Schonzeiten und Mindestmassen.',
        url: 'https://www.zh.ch/de/umwelt-tiere/tiere/fischerei.html',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description:
          'Bundesgesetz über die Fischerei, gültig für die gesamte Schweiz und Grundlage aller kantonalen Vorschriften.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
      { species: 'Zander (Pike-perch)', sizeCm: 40 },
      { species: 'Barsch (Perch)', sizeCm: 18 },
    ],
    permitPurchaseUrl: 'https://www.zh.ch/de/umwelt-tiere/tiere/fischerei.html',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  BE: {
    canton: 'Bern',
    cantonCode: 'BE',
    generalInfo:
      'Kanton Bern bietet Fischerei auf grossen Seen und Fliessgewässern. Für Freizeitfischer sind Patentpflicht, Schonzeiten, Mindestmasse und gewässerspezifische Regeln zentral.',
    permitInfo:
      'Fischerpatente (Tages- und Jahrespatente) sind für Bern obligatorisch. Für Seen und Fliessgewässer gelten unterschiedliche Patentkategorien; Kauf erfolgt über die offizielle WEU-Plattform.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Bern (FiG)',
        description:
          'Kantonales Gesetz für sämtliche Fischereiaktivitäten, Patente und Artenschutz in Bern.',
        url: 'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei.html',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei als Grundlage aller Vorschriften.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 45 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Äsche (Grayling)', sizeCm: 35 },
      { species: 'Seesaibling (Arctic Char)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 20 },
    ],
    permitPurchaseUrl:
      'https://www.weu.be.ch/de/start/themen/jagd-fischerei/fischerei/fischerpatent-kaufen.html',
    lastVerified: '2026-04-15',
    regulationYear: 2026,
  },
  LU: {
    canton: 'Luzern',
    cantonCode: 'LU',
    generalInfo:
      'Kanton Luzern bietet Fischerei auf dem Vierwaldstättersee und verschiedenen Flüssen. Die Patente werden von der kantonalen Behörde verwaltet.',
    permitInfo:
      'Jährliches Fischereipatent erforderlich. Erhältlich bei der Dienststelle Landwirtschaft und Wald (lawa).',
    laws: [
      {
        title: 'Fischereigesetz Kanton Luzern',
        description:
          'Kantonales Fischereigesetz mit Regelungen zu Patenten, Schonzeiten und geschützten Arten.',
        url: 'https://www.luzern.ch/themen/natur-umwelt/fischerei/',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesrahmengesetz für die Fischerei in der Schweiz.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Egli/Barsch (Perch)', sizeCm: 18 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
    permitPurchaseUrl: 'https://lawa.lu.ch/themen_lawa/jagd_fischerei/fischerei_jf',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  UR: {
    canton: 'Uri',
    cantonCode: 'UR',
    generalInfo:
      'Die Fischerei in Kanton Uri ist hauptsächlich rund um den Urnersee und die Reuss geregelt. Uri gehört zur Fischereizone des Vierwaldstättersees.',
    permitInfo: 'Fischereipatent erforderlich, erhältlich bei der kantonalen Verwaltung.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Uri',
        description: 'Kantonale Fischereivorschriften für die Gewässer Uris.',
        url: 'https://www.ur.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei, gültig für die gesamte Schweiz.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
    permitPurchaseUrl: 'https://www.ur.ch/dienstleistungen/3394',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  SZ: {
    canton: 'Schwyz',
    cantonCode: 'SZ',
    generalInfo:
      'Kanton Schwyz umfasst den Lauerzersee, den Sihlsee sowie Teile des Zugersees.',
    permitInfo: 'Fischereipatente erhältlich bei der Fischerei- und Jagdverwaltung Schwyz.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Schwyz',
        description: 'Kantonales Fischereigesetz für die Schwyzer Gewässer.',
        url: 'https://www.sz.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei als Grundlage aller kantonalen Vorschriften.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
    permitPurchaseUrl: 'https://www.sz.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  OW: {
    canton: 'Obwalden',
    cantonCode: 'OW',
    generalInfo: 'Kanton Obwalden verfügt mit dem Sarnersee und dem Lungernersee über die wichtigsten Fischereigewässer.',
    permitInfo: 'Jährliche Fischereilizenz erforderlich, erhältlich bei kantonalen Behörden.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Obwalden',
        description: 'Fischereivorschriften für den Kanton Obwalden.',
        url: 'https://www.ow.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
    permitPurchaseUrl: 'https://www.ow.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  NW: {
    canton: 'Nidwalden',
    cantonCode: 'NW',
    generalInfo:
      'Kanton Nidwalden grenzt an den Vierwaldstättersee und liegt in der Region Stanserhorn.',
    permitInfo: 'Fischereipatent erforderlich, erhältlich bei der kantonalen Verwaltung in Stans.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Nidwalden',
        description: 'Kantonale Fischereivorschriften für Nidwalden.',
        url: 'https://www.nw.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
    permitPurchaseUrl: 'https://www.nw.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  GL: {
    canton: 'Glarus',
    cantonCode: 'GL',
    generalInfo:
      'Kanton Glarus bietet Fischerei im Klöntalersee und im Linthflusssystem.',
    permitInfo: 'Fischereipatente erhältlich beim kantonalen Wald- und Fischereiamt.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Glarus',
        description: 'Kantonales Fischereigesetz für Glarus.',
        url: 'https://www.gl.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
    permitPurchaseUrl: 'https://www.gl.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  ZG: {
    canton: 'Zug',
    cantonCode: 'ZG',
    generalInfo: 'Kanton Zug beheimatet den Zugersee, einen der saubersten Schweizer Seen.',
    permitInfo: 'Jährliches Fischereipatent erforderlich. Online und beim kantonalen Amt erhältlich.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Zug',
        description: 'Kantonales Fischereigesetz für Zug.',
        url: 'https://www.zg.ch/behoerden/baudirektion/amt-fuer-wald-und-wild',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesrahmengesetz für die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
      { species: 'Egli/Barsch (Perch)', sizeCm: 18 },
    ],
    permitPurchaseUrl: 'https://www.zg.ch/behoerden/baudirektion/amt-fuer-wald-und-wild',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  FR: {
    canton: 'Fribourg',
    cantonCode: 'FR',
    generalInfo:
      'Kanton Freiburg (Fribourg) verfügt über den Murtensee, den Lac de la Gruyère und die Saane. Zweisprachig Deutsch/Französisch.',
    permitInfo:
      'Fischereilizenz erforderlich (Fischerkarte/Patente de pêche). Erhältlich bei der DIAF (Direction des institutions, de l\'agriculture et des forêts).',
    laws: [
      {
        title: 'Loi sur la pêche / Fischereigesetz Kanton Freiburg',
        description: 'Kantonales Fischereigesetz für Freiburg, zweisprachig verfügbar.',
        url: 'https://www.fr.ch/nature/peche',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Bundesgesetz über die Fischerei für alle Schweizer Gewässer.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite fario / Forelle (Trout)', sizeCm: 25 },
      { species: 'Brochet / Hecht (Pike)', sizeCm: 45 },
      { species: 'Ombre / Äsche (Grayling)', sizeCm: 30 },
    ],
    permitPurchaseUrl: 'https://www.fr.ch/nature/peche',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  SO: {
    canton: 'Solothurn',
    cantonCode: 'SO',
    generalInfo: 'Kanton Solothurn verfügt über Fischereigewässer entlang der Aare und verschiedenen Seen.',
    permitInfo: 'Fischereipatente erhältlich beim Amt für Wald, Jagd und Fischerei (AWJF) Solothurn.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Solothurn',
        description: 'Kantonales Fischereigesetz für Solothurn.',
        url: 'https://www.so.ch/verwaltung/bau-und-justizdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
    ],
    permitPurchaseUrl: 'https://so.ch/services/fischerpatent-beantragen/',
    lastVerified: '2026-04-15',
    regulationYear: 2026,
  },
  BS: {
    canton: 'Basel-Stadt',
    cantonCode: 'BS',
    generalInfo:
      'Die Fischerei in Kanton Basel-Stadt findet hauptsächlich am Rhein statt. Für den Rhein gelten besondere Regelungen.',
    permitInfo:
      'Fischereipatent erforderlich. Gemeinsame Rhein-Fischereivorschriften gelten für Basel-Stadt und Basel-Landschaft.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Basel-Stadt',
        description: 'Kantonales Fischereigesetz für Basel-Stadt, einschliesslich Rheinfischerei.',
        url: 'https://www.bs.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz als Grundlage der kantonalen Vorschriften.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Äsche (Grayling)', sizeCm: 35 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
    permitPurchaseUrl: 'https://www.bs.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  BL: {
    canton: 'Basel-Landschaft',
    cantonCode: 'BL',
    generalInfo:
      'Kanton Basel-Landschaft bietet Fischerei an Ergolz, Birs und Teilen des Rheins.',
    permitInfo:
      'Jährliches Fischereipatent erforderlich. Erhältlich beim Amt für Raumplanung und Umweltschutz.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Basel-Landschaft',
        description: 'Fischereigesetz für die Gewässer von Basel-Landschaft.',
        url: 'https://www.baselland.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
    ],
    permitPurchaseUrl: 'https://www.baselland.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  SH: {
    canton: 'Schaffhausen',
    cantonCode: 'SH',
    generalInfo:
      'Kanton Schaffhausen ist bekannt für den Rheinfall und bietet Rheinfischerei.',
    permitInfo: 'Fischereilizenz erforderlich. Erhältlich bei der Fischereibehörde Schaffhausen.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Schaffhausen',
        description: 'Kantonales Fischereigesetz für Schaffhausen, einschliesslich Rheinfischerei.',
        url: 'https://www.sh.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
    permitPurchaseUrl: 'https://www.sh.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  AR: {
    canton: 'Appenzell Ausserrhoden',
    cantonCode: 'AR',
    generalInfo: 'Kanton Appenzell Ausserrhoden verfügt über Gebirgsflüsse und die Sitter.',
    permitInfo: 'Fischereipatente erhältlich bei der kantonalen Verwaltung.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Appenzell Ausserrhoden',
        description: 'Fischereivorschriften für Appenzell Ausserrhoden.',
        url: 'https://www.ar.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [{ species: 'Forelle (Trout)', sizeCm: 25 }],
    permitPurchaseUrl: 'https://www.ar.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  AI: {
    canton: 'Appenzell Innerrhoden',
    cantonCode: 'AI',
    generalInfo: 'Kanton Appenzell Innerrhoden bietet unberührte Gebirgsflüsse.',
    permitInfo: 'Fischereipatente erhältlich bei der Landeskanzlei AI.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Appenzell Innerrhoden',
        description: 'Fischereigesetz für Appenzell Innerrhoden.',
        url: 'https://www.ai.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [{ species: 'Forelle (Trout)', sizeCm: 25 }],
    permitPurchaseUrl: 'https://www.ai.ch',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  SG: {
    canton: 'St. Gallen',
    cantonCode: 'SG',
    generalInfo:
      'Kanton St. Gallen verfügt über den Walensee, den Bodensee und den Thur.',
    permitInfo:
      'Jährliches Fischereipatent erforderlich. Online oder beim Amt für Natur, Jagd und Fischerei erhältlich.',
    laws: [
      {
        title: 'Fischereigesetz Kanton St. Gallen',
        description: 'Kantonales Fischereigesetz für alle St. Galler Gewässer.',
        url: 'https://www.sg.ch/umwelt-natur/natur/jagd-und-fischerei/fischerei.html',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 45 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Äsche (Grayling)', sizeCm: 35 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
      { species: 'Egli/Barsch (Perch)', sizeCm: 18 },
    ],
    permitPurchaseUrl: 'https://www.sg.ch/umwelt-natur/natur/jagd-und-fischerei/fischerei.html',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  GR: {
    canton: 'Graubünden',
    cantonCode: 'GR',
    generalInfo:
      'Kanton Graubünden ist der grösste Schweizer Kanton mit ausgedehnten Fischereigewässern, darunter Inn, Rhein und zahlreiche Alpenseen.',
    permitInfo:
      'Tages- und Saisonpatente erhältlich. Erhältlich beim Amt für Jagd und Fischerei Graubünden oder online.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Graubünden (FG)',
        description: 'Hauptkantonales Fischereigesetz für Graubünden.',
        url: 'https://www.gr.ch/DE/institutionen/verwaltung/dvs/ajf/fischerei/Seiten/default.aspx',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 22 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Seesaibling (Arctic Char)', sizeCm: 22 },
    ],
    permitPurchaseUrl: 'https://www.gr.ch/DE/institutionen/verwaltung/dvs/ajf/fischerei/Seiten/default.aspx',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  AG: {
    canton: 'Aargau',
    cantonCode: 'AG',
    generalInfo:
      'Kanton Aargau verfügt über ausgedehnte Flussfischerei entlang Aare, Reuss, Limmat und Rhein.',
    permitInfo:
      'Fischereikarte erforderlich. Erhältlich beim Departement Bau, Verkehr und Umwelt.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Aargau (FG)',
        description: 'Kantonales Fischereigesetz für Aargau.',
        url: 'https://www.ag.ch/de/umwelt-natur-landschaft/jagd-fischerei/fischerei',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
      { species: 'Zander (Pike-perch)', sizeCm: 40 },
    ],
    permitPurchaseUrl: 'https://www.ag.ch/de/umwelt-natur-landschaft/jagd-fischerei/fischerei',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  TG: {
    canton: 'Thurgau',
    cantonCode: 'TG',
    generalInfo:
      'Kanton Thurgau grenzt an den Bodensee und verfügt über den Thur.',
    permitInfo: 'Jährliches Fischereipatent erforderlich. Erhältlich bei der Fischereibehörde Thurgau.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Thurgau',
        description: 'Kantonales Fischereigesetz für Thurgau, einschliesslich Bodenseevorschriften.',
        url: 'https://www.tg.ch/public/themen/20/70.html/21',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 45 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
      { species: 'Barsch (Perch)', sizeCm: 18 },
    ],
    permitPurchaseUrl: 'https://www.tg.ch/public/themen/20/70.html/21',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  TI: {
    canton: 'Ticino',
    cantonCode: 'TI',
    generalInfo:
      'Il Canton Ticino dispone del Lago Maggiore, del Lago di Lugano e del fiume Ticino. Si applicano le tradizioni di pesca italiane.',
    permitInfo:
      'È richiesta la patente di pesca annuale. Disponibile presso la Sezione della caccia e della pesca.',
    laws: [
      {
        title: 'Legge sulla pesca / Fischereigesetz Kanton Tessin',
        description: 'Legge cantonale sulla pesca per il Ticino, principalmente in italiano.',
        url: 'https://www.ti.ch/caccia-pesca',
      },
      {
        title: 'Legge federale sulla pesca (LFP)',
        description: 'Legge federale sulla pesca (LFP).',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Trota / Forelle (Trout)', sizeCm: 22 },
      { species: 'Luccio / Hecht (Pike)', sizeCm: 40 },
      { species: 'Persico / Barsch (Perch)', sizeCm: 15 },
      { species: 'Agone (Shad)', sizeCm: 14 },
    ],
    permitPurchaseUrl: 'https://www4.ti.ch/dfe/de/caccia-pesca/home/',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  VD: {
    canton: 'Vaud',
    cantonCode: 'VD',
    generalInfo:
      'Le canton de Vaud borde le Lac Léman et dispose de la Broye. Les réglementations de pêche sont en français.',
    permitInfo:
      'Patente de pêche annuelle requise. Disponible auprès de la Direction générale de l\'environnement.',
    laws: [
      {
        title: 'Loi vaudoise sur la pêche (LVPêche)',
        description: 'Loi cantonale sur la pêche pour Vaud, disponible en français.',
        url: 'https://www.vd.ch/themes/environnement/faune/peche/',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Loi fédérale sur la pêche (LFP).',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite fario (Brown Trout)', sizeCm: 25 },
      { species: 'Brochet (Pike)', sizeCm: 50 },
      { species: 'Omble chevalier (Arctic Char)', sizeCm: 25 },
      { species: 'Perche (Perch)', sizeCm: 18 },
      { species: 'Féra/Palée (Whitefish)', sizeCm: 22 },
    ],
    permitPurchaseUrl: 'https://www.vd.ch/themes/environnement/faune/peche/',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  VS: {
    canton: 'Valais',
    cantonCode: 'VS',
    generalInfo:
      'Le canton du Valais (Wallis) possède le Rhône et de nombreux lacs alpins — un paradis pour la pêche à la truite. / Kanton Wallis verfügt über die Rhône und viele Alpenseen.',
    permitInfo:
      'Patente de pêche/Fischereikarte requise. Disponible au Service de la chasse, de la pêche et de la faune.',
    laws: [
      {
        title: 'Loi sur la pêche / Fischereigesetz Wallis',
        description: 'Loi cantonale sur la pêche pour le Valais, disponible en français et en allemand.',
        url: 'https://www.vs.ch/web/sfcpf/peche',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Loi fédérale sur la pêche / Bundesgesetz über die Fischerei.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite / Forelle (Trout)', sizeCm: 20 },
      { species: 'Ombre / Äsche (Grayling)', sizeCm: 30 },
      { species: 'Brochet / Hecht (Pike)', sizeCm: 40 },
    ],
    permitPurchaseUrl: 'https://www.vs.ch/web/sfcpf/peche',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  NE: {
    canton: 'Neuchâtel',
    cantonCode: 'NE',
    generalInfo:
      'Le canton de Neuchâtel borde le Lac de Neuchâtel et dispose du Doubs à sa frontière.',
    permitInfo:
      'Patente de pêche annuelle requise. Disponible au Service de la faune, des forêts et de la nature.',
    laws: [
      {
        title: 'Loi sur la pêche du canton de Neuchâtel',
        description: 'Loi cantonale sur la pêche pour Neuchâtel.',
        url: 'https://www.ne.ch/autorites/DDTE/SFPN/peche/Pages/accueil.aspx',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Loi fédérale sur la pêche (LFP).',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite (Trout)', sizeCm: 25 },
      { species: 'Brochet (Pike)', sizeCm: 50 },
      { species: 'Perche (Perch)', sizeCm: 18 },
    ],
    permitPurchaseUrl: 'https://www.ne.ch/autorites/DDTE/SFPN/peche/Pages/accueil.aspx',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  GE: {
    canton: 'Genève',
    cantonCode: 'GE',
    generalInfo:
      'Le canton de Genève est situé sur le Lac Léman. Le Rhône traverse Genève. Des réglementations de pêche urbaines strictes s\'appliquent.',
    permitInfo:
      'Patente de pêche requise. Disponible à la Direction générale de la nature et du paysage.',
    laws: [
      {
        title: 'Loi sur la pêche du canton de Genève',
        description: 'Loi cantonale sur la pêche pour Genève, avec des réglementations spécifiques au Lac Léman.',
        url: 'https://www.ge.ch/peche',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Loi fédérale sur la pêche (LFP).',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite (Trout)', sizeCm: 25 },
      { species: 'Brochet (Pike)', sizeCm: 50 },
      { species: 'Perche (Perch)', sizeCm: 18 },
    ],
    permitPurchaseUrl: 'https://www.ge.ch/peche',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
  },
  JU: {
    canton: 'Jura',
    cantonCode: 'JU',
    generalInfo:
      'Le canton du Jura dispose du Doubs et de l\'Allaine. Le Doubs est partagé avec la France.',
    permitInfo:
      'Patente de pêche annuelle requise. Disponible au Service de l\'environnement.',
    laws: [
      {
        title: 'Loi sur la pêche du canton du Jura',
        description: 'Loi cantonale sur la pêche pour le Jura.',
        url: 'https://www.jura.ch/DEN/SNP/Chasse-et-peche/Peche/Peche.html',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Loi fédérale sur la pêche (LFP).',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite (Trout)', sizeCm: 23 },
      { species: 'Ombre (Grayling)', sizeCm: 30 },
      { species: 'Brochet (Pike)', sizeCm: 45 },
    ],
    permitPurchaseUrl: 'https://www.jura.ch/DEN/SNP/Chasse-et-peche/Peche/Peche.html',
    lastVerified: '2024-01-01',
    regulationYear: 2024,
},
};

// Mapping from Nominatim state names to canton codes
export const STATE_TO_CANTON_CODE: Record<string, string> = {
  'Zürich': 'ZH',
  'Zurich': 'ZH',
  'Bern': 'BE',
  'Berne': 'BE',
  'Luzern': 'LU',
  'Lucerne': 'LU',
  'Uri': 'UR',
  'Schwyz': 'SZ',
  'Obwalden': 'OW',
  'Nidwalden': 'NW',
  'Glarus': 'GL',
  'Zug': 'ZG',
  'Fribourg': 'FR',
  'Freiburg': 'FR',
  'Solothurn': 'SO',
  'Basel-Stadt': 'BS',
  'Basel-Landschaft': 'BL',
  'Schaffhausen': 'SH',
  'Appenzell Ausserrhoden': 'AR',
  'Appenzell Innerrhoden': 'AI',
  'St. Gallen': 'SG',
  'Saint-Gall': 'SG',
  'Graubünden': 'GR',
  'Grisons': 'GR',
  'Grigioni': 'GR',
  'Aargau': 'AG',
  'Argovia': 'AG',
  'Thurgau': 'TG',
  'Thurgovie': 'TG',
  'Ticino': 'TI',
  'Tessin': 'TI',
  'Vaud': 'VD',
  'Valais': 'VS',
  'Wallis': 'VS',
  'Neuchâtel': 'NE',
  'Neuenburg': 'NE',
  'Genève': 'GE',
  'Geneva': 'GE',
  'Genf': 'GE',
  'Jura': 'JU',
};

export const COMMON_FISH_SPECIES = [
  'Forelle (Brown Trout)',
  'Regenbogenforelle (Rainbow Trout)',
  'Bachforelle (Brook Trout)',
  'Seeforelle (Lake Trout)',
  'Seesaibling (Arctic Char)',
  'Äsche (Grayling)',
  'Hecht (Pike)',
  'Zander (Pike-perch)',
  'Egli/Barsch (Perch)',
  'Rotauge (Roach)',
  'Rotfeder (Rudd)',
  'Karpfen (Carp)',
  'Wels (Catfish)',
  'Aal (Eel)',
  'Felchen (Whitefish)',
  'Brachse/Blei (Bream)',
  'Hasel (Chub)',
  'Nase (Nase)',
  'Andere (Other)',
];
