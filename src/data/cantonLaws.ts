import type { CantonLaw } from '../types';

export const CANTON_LAWS: Record<string, CantonLaw> = {
  ZH: {
    canton: 'Zürich',
    cantonCode: 'ZH',
    generalInfo:
      'Kanton Zürich requires a cantonal fishing permit. Fishing is regulated by the Fischereigesetz (FischG) of the Canton of Zurich.',
    permitInfo:
      'Annual fishing permit required (Fischereikarte). Available at Gemeindeverwaltungen or online at zh.ch.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Zürich',
        description:
          'Main cantonal fishing law regulating permits, closed seasons, and minimum sizes.',
        url: 'https://www.zh.ch/de/umwelt-tiere/tiere/fischerei.html',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description:
          'Federal fishing law applicable across Switzerland, forming the basis for all cantonal regulations.',
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
  },
  BE: {
    canton: 'Bern',
    cantonCode: 'BE',
    generalInfo:
      'Kanton Bern has extensive fishing waters including Lake Thun, Lake Brienz, and numerous rivers. Fishing is governed by the cantonal Fischereigesetz.',
    permitInfo:
      'Fishing permits (Fischereikarte) available at cantonal authorities. Different permits for lakes and rivers.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Bern (FiG)',
        description:
          'Cantonal law governing all fishing activities, permits, and species protection in Bern.',
        url: 'https://www.be.ch/de/start/dienstleistungen/sport-freizeit/jagen-und-fischen/fischerei.html',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law as basis for all regulations.',
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
  },
  LU: {
    canton: 'Luzern',
    cantonCode: 'LU',
    generalInfo:
      'Kanton Luzern offers fishing on Lake Lucerne (Vierwaldstättersee) and various rivers. Permits are managed by the cantonal authority.',
    permitInfo:
      'Annual fishing permit required. Available at Dienststelle Landwirtschaft und Wald (lawa).',
    laws: [
      {
        title: 'Fischereigesetz Kanton Luzern',
        description:
          'Cantonal fishing legislation covering permits, seasons, and protected species.',
        url: 'https://www.luzern.ch/themen/natur-umwelt/fischerei/',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal framework law for fishing in Switzerland.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Egli/Barsch (Perch)', sizeCm: 18 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
  },
  UR: {
    canton: 'Uri',
    cantonCode: 'UR',
    generalInfo:
      'Kanton Uri fishing is regulated primarily around Lake Uri and the Reuss river. The canton is part of the Vierwaldstättersee fishing zone.',
    permitInfo: 'Fishing permit required, available at the cantonal administration.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Uri',
        description: 'Cantonal fishing regulation for the waters of Uri.',
        url: 'https://www.ur.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal law governing fishing across Switzerland.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
  },
  SZ: {
    canton: 'Schwyz',
    cantonCode: 'SZ',
    generalInfo:
      'Kanton Schwyz includes Lake Lauerz, Lake Sihl, and portions of the Zugersee and Lauerzersee.',
    permitInfo: 'Fishing permits available from the Fischerei- und Jagdverwaltung Schwyz.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Schwyz',
        description: 'Cantonal fishing law for Schwyz waters.',
        url: 'https://www.sz.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law as basis for all cantonal regulations.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
  },
  OW: {
    canton: 'Obwalden',
    cantonCode: 'OW',
    generalInfo: 'Kanton Obwalden has the Sarnersee and Lungernersee as its main fishing waters.',
    permitInfo: 'Annual fishing license required, available at cantonal offices.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Obwalden',
        description: 'Fishing regulations for Obwalden canton.',
        url: 'https://www.ow.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
  },
  NW: {
    canton: 'Nidwalden',
    cantonCode: 'NW',
    generalInfo:
      'Kanton Nidwalden borders the Vierwaldstättersee (Lake Lucerne) and has the Stanserhorn region.',
    permitInfo: 'Fishing permit required, available at the cantonal administration in Stans.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Nidwalden',
        description: 'Cantonal fishing regulation for Nidwalden.',
        url: 'https://www.nw.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
    ],
  },
  GL: {
    canton: 'Glarus',
    cantonCode: 'GL',
    generalInfo:
      'Kanton Glarus offers fishing in the Klöntalersee and the Linth river system.',
    permitInfo: 'Fishing permits available at the cantonal forestry and fishing office.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Glarus',
        description: 'Cantonal fishing law for Glarus.',
        url: 'https://www.gl.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing regulation.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
  },
  ZG: {
    canton: 'Zug',
    cantonCode: 'ZG',
    generalInfo: 'Kanton Zug is home to the Zugersee, one of the cleaner Swiss lakes.',
    permitInfo: 'Annual fishing permit required. Available online and at the cantonal office.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Zug',
        description: 'Cantonal fishing law for Zug.',
        url: 'https://www.zg.ch/behoerden/baudirektion/amt-fuer-wald-und-wild',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal framework fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
      { species: 'Egli/Barsch (Perch)', sizeCm: 18 },
    ],
  },
  FR: {
    canton: 'Fribourg',
    cantonCode: 'FR',
    generalInfo:
      'Kanton Fribourg (Freiburg) has the Murten lake, Lac de la Gruyère, and the Saane river.',
    permitInfo:
      'Fishing license required (Fischerkarte/Patente de pêche). Available from the DIAF (Direction des institutions, de l\'agriculture et des forêts).',
    laws: [
      {
        title: 'Loi sur la pêche / Fischereigesetz Kanton Freiburg',
        description: 'Cantonal fishing law for Fribourg, available in French and German.',
        url: 'https://www.fr.ch/nature/peche',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Federal fishing law governing all Swiss waters.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite fario / Forelle (Trout)', sizeCm: 25 },
      { species: 'Brochet / Hecht (Pike)', sizeCm: 45 },
      { species: 'Ombre / Äsche (Grayling)', sizeCm: 30 },
    ],
  },
  SO: {
    canton: 'Solothurn',
    cantonCode: 'SO',
    generalInfo: 'Kanton Solothurn has fishing along the Aare river and several lakes.',
    permitInfo: 'Fishing permits available from the Amt für Wald, Jagd und Fischerei Solothurn.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Solothurn',
        description: 'Cantonal fishing legislation for Solothurn.',
        url: 'https://www.so.ch/verwaltung/bau-und-justizdepartement/amt-fuer-wald-jagd-und-fischerei/fischerei/',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
    ],
  },
  BS: {
    canton: 'Basel-Stadt',
    cantonCode: 'BS',
    generalInfo:
      'Kanton Basel-Stadt fishing is primarily on the Rhine river. Special regulations apply for the Rhine.',
    permitInfo:
      'Fishing permit required. Joint Rhine fishing regulations apply across Basel-Stadt and Basel-Landschaft.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Basel-Stadt',
        description: 'Cantonal fishing law for Basel-Stadt including Rhine fishing.',
        url: 'https://www.bs.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal law as basis for cantonal regulations.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Äsche (Grayling)', sizeCm: 35 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
  },
  BL: {
    canton: 'Basel-Landschaft',
    cantonCode: 'BL',
    generalInfo:
      'Kanton Basel-Landschaft offers fishing on the Ergolz, Birs rivers and portions of the Rhine.',
    permitInfo:
      'Annual fishing permit required. Available at the Amt für Raumplanung und Umweltschutz.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Basel-Landschaft',
        description: 'Fishing law for Basel-Landschaft waters.',
        url: 'https://www.baselland.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
    ],
  },
  SH: {
    canton: 'Schaffhausen',
    cantonCode: 'SH',
    generalInfo:
      'Kanton Schaffhausen is famous for the Rhine Falls and offers Rhine river fishing.',
    permitInfo: 'Fishing license required. Available at the Fischereibehörde Schaffhausen.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Schaffhausen',
        description: 'Cantonal fishing law for Schaffhausen including Rhine fishing.',
        url: 'https://www.sh.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
    ],
  },
  AR: {
    canton: 'Appenzell Ausserrhoden',
    cantonCode: 'AR',
    generalInfo: 'Kanton Appenzell Ausserrhoden has mountain streams and the Sitter river.',
    permitInfo: 'Fishing permits available at the cantonal administration.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Appenzell Ausserrhoden',
        description: 'Fishing regulations for AR.',
        url: 'https://www.ar.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [{ species: 'Forelle (Trout)', sizeCm: 25 }],
  },
  AI: {
    canton: 'Appenzell Innerrhoden',
    cantonCode: 'AI',
    generalInfo: 'Kanton Appenzell Innerrhoden offers pristine mountain stream fishing.',
    permitInfo: 'Fishing permits available at the Landeskanzlei AI.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Appenzell Innerrhoden',
        description: 'Fishing law for Appenzell Innerrhoden.',
        url: 'https://www.ai.ch',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [{ species: 'Forelle (Trout)', sizeCm: 25 }],
  },
  SG: {
    canton: 'St. Gallen',
    cantonCode: 'SG',
    generalInfo:
      'Kanton St. Gallen has the Walensee, Bodensee (Lake Constance), and the Thur river.',
    permitInfo:
      'Annual fishing permit required. Available online or at the Amt für Natur, Jagd und Fischerei.',
    laws: [
      {
        title: 'Fischereigesetz Kanton St. Gallen',
        description: 'Cantonal fishing law covering all St. Gallen waters.',
        url: 'https://www.sg.ch/umwelt-natur/natur/jagd-und-fischerei/fischerei.html',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
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
  },
  GR: {
    canton: 'Graubünden',
    cantonCode: 'GR',
    generalInfo:
      'Kanton Graubünden (Grisons) is the largest Swiss canton with extensive fishing waters including the Inn, Rhine, and many alpine lakes.',
    permitInfo:
      'Day and season fishing permits available. Purchase at Amt für Jagd und Fischerei Graubünden or online.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Graubünden (FG)',
        description: 'Main cantonal fishing law for Graubünden.',
        url: 'https://www.gr.ch/DE/institutionen/verwaltung/dvs/ajf/fischerei/Seiten/default.aspx',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 22 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Seesaibling (Arctic Char)', sizeCm: 22 },
    ],
  },
  AG: {
    canton: 'Aargau',
    cantonCode: 'AG',
    generalInfo:
      'Kanton Aargau has extensive river fishing along the Aare, Reuss, Limmat, and Rhine rivers.',
    permitInfo:
      'Fishing license (Fischereikarte) required. Available at Departement Bau, Verkehr und Umwelt.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Aargau (FG)',
        description: 'Cantonal fishing law for Aargau.',
        url: 'https://www.ag.ch/de/umwelt-natur-landschaft/jagd-fischerei/fischerei',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Hecht (Pike)', sizeCm: 40 },
      { species: 'Äsche (Grayling)', sizeCm: 30 },
      { species: 'Zander (Pike-perch)', sizeCm: 40 },
    ],
  },
  TG: {
    canton: 'Thurgau',
    cantonCode: 'TG',
    generalInfo:
      'Kanton Thurgau borders the Bodensee (Lake Constance) and has the Thur river.',
    permitInfo: 'Annual fishing permit required. Available at Fischereibehörde Thurgau.',
    laws: [
      {
        title: 'Fischereigesetz Kanton Thurgau',
        description: 'Cantonal fishing law for Thurgau including Bodensee regulations.',
        url: 'https://www.tg.ch/public/themen/20/70.html/21',
      },
      {
        title: 'Bundesgesetz über die Fischerei (BGF)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Hecht (Pike)', sizeCm: 45 },
      { species: 'Forelle (Trout)', sizeCm: 25 },
      { species: 'Felchen (Whitefish)', sizeCm: 22 },
      { species: 'Barsch (Perch)', sizeCm: 18 },
    ],
  },
  TI: {
    canton: 'Ticino',
    cantonCode: 'TI',
    generalInfo:
      'Kanton Ticino (Tessin) has the Lago Maggiore, Lago di Lugano, and the Ticino river. Italian fishing traditions apply.',
    permitInfo:
      'Annual fishing permit (patente di pesca) required. Available at Sezione della caccia e della pesca.',
    laws: [
      {
        title: 'Legge sulla pesca / Fischereigesetz Kanton Tessin',
        description: 'Cantonal fishing law for Ticino, primarily in Italian.',
        url: 'https://www.ti.ch/caccia-pesca',
      },
      {
        title: 'Legge federale sulla pesca (LFP)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Trota / Forelle (Trout)', sizeCm: 22 },
      { species: 'Luccio / Hecht (Pike)', sizeCm: 40 },
      { species: 'Persico / Barsch (Perch)', sizeCm: 15 },
      { species: 'Agone (Shad)', sizeCm: 14 },
    ],
  },
  VD: {
    canton: 'Vaud',
    cantonCode: 'VD',
    generalInfo:
      'Canton de Vaud borders Lac Léman (Lake Geneva) and has the Broye river. French-speaking fishing regulations apply.',
    permitInfo:
      'Annual fishing permit (patente de pêche) required. Available from the Direction générale de l\'environnement.',
    laws: [
      {
        title: 'Loi vaudoise sur la pêche (LVPêche)',
        description: 'Cantonal fishing law for Vaud, available in French.',
        url: 'https://www.vd.ch/themes/environnement/faune/peche/',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Federal fishing law.',
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
  },
  VS: {
    canton: 'Valais',
    cantonCode: 'VS',
    generalInfo:
      'Canton du Valais (Wallis) has the Rhône river and many alpine lakes. A paradise for trout fishing.',
    permitInfo:
      'Fishing permit required (patente de pêche/Fischereikarte). Available at Service de la chasse, de la pêche et de la faune.',
    laws: [
      {
        title: 'Loi sur la pêche / Fischereigesetz Wallis',
        description: 'Cantonal fishing law for Valais in French and German.',
        url: 'https://www.vs.ch/web/sfcpf/peche',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite / Forelle (Trout)', sizeCm: 20 },
      { species: 'Ombre / Äsche (Grayling)', sizeCm: 30 },
      { species: 'Brochet / Hecht (Pike)', sizeCm: 40 },
    ],
  },
  NE: {
    canton: 'Neuchâtel',
    cantonCode: 'NE',
    generalInfo:
      'Canton de Neuchâtel borders Lac de Neuchâtel and has the Doubs river on its border.',
    permitInfo:
      'Annual fishing permit required. Available at the Service de la faune, des forêts et de la nature.',
    laws: [
      {
        title: 'Loi sur la pêche du canton de Neuchâtel',
        description: 'Cantonal fishing law for Neuchâtel.',
        url: 'https://www.ne.ch/autorites/DDTE/SFPN/peche/Pages/accueil.aspx',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite (Trout)', sizeCm: 25 },
      { species: 'Brochet (Pike)', sizeCm: 50 },
      { species: 'Perche (Perch)', sizeCm: 18 },
    ],
  },
  GE: {
    canton: 'Genève',
    cantonCode: 'GE',
    generalInfo:
      'Canton de Genève is on Lac Léman (Lake Geneva). The Rhône river flows through Geneva. Strict urban fishing regulations apply.',
    permitInfo:
      'Fishing permit required. Available at the Direction générale de la nature et du paysage.',
    laws: [
      {
        title: 'Loi sur la pêche du canton de Genève',
        description: 'Cantonal fishing law for Geneva with specific Lake Geneva regulations.',
        url: 'https://www.ge.ch/peche',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite (Trout)', sizeCm: 25 },
      { species: 'Brochet (Pike)', sizeCm: 50 },
      { species: 'Perche (Perch)', sizeCm: 18 },
    ],
  },
  JU: {
    canton: 'Jura',
    cantonCode: 'JU',
    generalInfo:
      'Canton du Jura has the Doubs river and the Allaine. The Doubs is shared with France.',
    permitInfo:
      'Annual fishing permit required. Available at the Service de l\'environnement.',
    laws: [
      {
        title: 'Loi sur la pêche du canton du Jura',
        description: 'Cantonal fishing law for Jura.',
        url: 'https://www.jura.ch/DEN/SNP/Chasse-et-peche/Peche/Peche.html',
      },
      {
        title: 'Loi fédérale sur la pêche (LFP)',
        description: 'Federal fishing law.',
        url: 'https://www.fedlex.admin.ch/eli/cc/1993/1256_1256_1256/de',
      },
    ],
    minimumSizes: [
      { species: 'Truite (Trout)', sizeCm: 23 },
      { species: 'Ombre (Grayling)', sizeCm: 30 },
      { species: 'Brochet (Pike)', sizeCm: 45 },
    ],
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
