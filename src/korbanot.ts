import { HDate, Location, Zmanim, gematriya, months } from '@hebcal/core';

export type AnimalKey = 'bulls' | 'rams' | 'lambs' | 'goats';
export type KorbanGroup = 'tamid' | 'musaf' | 'special';

export interface AnimalCounts {
  bulls: number;
  rams: number;
  lambs: number;
  goats: number;
}

export interface KorbanRow {
  id: string;
  group: KorbanGroup;
  title: string;
  subtitle: string;
  counts: AnimalCounts;
  notes?: string[];
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface KorbanDay {
  hdate: HDate;
  titleDate: string;
  weekdayName: string;
  gregorianLabel: string;
  rows: KorbanRow[];
  notes: string[];
  sources: SourceLink[];
  totals: AnimalCounts;
  total: number;
}

export const ANIMAL_LABELS: Record<AnimalKey, string> = {
  bulls: 'פרים',
  rams: 'אילים',
  lambs: 'כבשים',
  goats: 'שעירים',
};

export const EMPTY_COUNTS: AnimalCounts = {
  bulls: 0,
  rams: 0,
  lambs: 0,
  goats: 0,
};

export const SOURCE_LINKS: SourceLink[] = [
  {
    label: 'במדבר כ״ח',
    url: 'https://www.sefaria.org/Numbers.28?lang=he',
  },
  {
    label: 'במדבר כ״ט',
    url: 'https://www.sefaria.org/Numbers.29?lang=he',
  },
  {
    label: 'רמב״ם תמידין ומוספין',
    url: 'https://www.chabad.org/library/article_cdo/aid/1013253/jewish/Temidin-uMusafim-Chapter-1.htm',
  },
  {
    label: 'Hebcal',
    url: 'https://hebcal.github.io/api/core/',
  },
  {
    label: 'דעת - קרבנות ציבור',
    url: 'https://www.daat.ac.il/daat/multi/korbanot/23.html',
  },
];

const JERUSALEM = getJerusalemLocation();

const WEEKDAYS_HE = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'שבת קודש',
] as const;

const GREGORIAN_MONTHS_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
] as const;

export function getJerusalemHebrewDate(now = new Date()): HDate {
  return Zmanim.makeSunsetAwareHDate(JERUSALEM, now, false);
}

export function calculateKorbanot(hdate: HDate): KorbanDay {
  const date = new HDate(hdate);
  const rows: KorbanRow[] = [
    createRow({
      id: 'tamid',
      group: 'tamid',
      title: 'תמידין',
      subtitle: 'תמיד של שחר ותמיד של בין הערבים',
      counts: { ...EMPTY_COUNTS, lambs: 2 },
      notes: ['המנחות והנסכים של התמידין אינם בכלל המנין.'],
    }),
  ];

  const notes: string[] = [
    'המנין כולל קרבנות ציבור קבועים מן הבהמה בלבד.',
    'מנחות, נסכים, קטורת, לחם הפנים וקרבנות יחיד אינם נכנסים בחשבון.',
  ];

  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 6) {
    rows.push(
      createRow({
        id: 'shabbat-musaf',
        group: 'musaf',
        title: 'מוסף שבת',
        subtitle: 'שני כבשים בני שנה',
        counts: { ...EMPTY_COUNTS, lambs: 2 },
        notes: ['לחם הפנים אינו בכלל מנין הקרבנות.'],
      }),
    );
  }

  if (isRoshChodesh(date)) {
    rows.push(
      createRow({
        id: 'rosh-chodesh-musaf',
        group: 'musaf',
        title: 'מוסף ראש חודש',
        subtitle: 'שני פרים, איל אחד, שבעה כבשים ושעיר אחד',
        counts: { bulls: 2, rams: 1, lambs: 7, goats: 1 },
      }),
    );
  }

  if (isPesach(month, day)) {
    rows.push(
      createRow({
        id: 'pesach-musaf',
        group: 'musaf',
        title: 'מוסף פסח',
        subtitle: 'שני פרים, איל אחד, שבעה כבשים ושעיר אחד',
        counts: { bulls: 2, rams: 1, lambs: 7, goats: 1 },
      }),
    );
    notes.push('קרבן פסח אינו נכנס לחשבון, כי מנינו תלוי בכל חבורה וחבורה.');
  }

  if (month === months.NISAN && day === 16) {
    rows.push(
      createRow({
        id: 'omer',
        group: 'special',
        title: 'קרבן העומר',
        subtitle: 'כבש אחד לעולה',
        counts: { ...EMPTY_COUNTS, lambs: 1 },
        notes: ['מנחת העומר אינה בכלל מנין הבהמות.'],
      }),
    );
  }

  if (month === months.NISAN && day === 14) {
    notes.push('בי״ד בניסן קרבן פסח אינו בכלל המנין, כי מספרו תלוי במקריבים.');
  }

  if (month === months.SIVAN && day === 6) {
    rows.push(
      createRow({
        id: 'shavuot-musaf',
        group: 'musaf',
        title: 'מוסף עצרת',
        subtitle: 'שני פרים, איל אחד, שבעה כבשים ושעיר אחד',
        counts: { bulls: 2, rams: 1, lambs: 7, goats: 1 },
      }),
      createRow({
        id: 'shtei-halechem',
        group: 'special',
        title: 'הבאים עם שתי הלחם',
        subtitle: 'פר, שני אילים, שבעה כבשים ושעיר',
        counts: { bulls: 1, rams: 2, lambs: 7, goats: 1 },
        notes: ['אלו באים עם שתי הלחם מלבד מוספי היום, ואינם כפילות.'],
      }),
      createRow({
        id: 'shtei-halechem-shelamim',
        group: 'special',
        title: 'כבשי שלמי ציבור',
        subtitle: 'שני כבשים שלמים',
        counts: { ...EMPTY_COUNTS, lambs: 2 },
      }),
    );
  }

  if (month === months.TISHREI && day === 1) {
    rows.push(
      createRow({
        id: 'rosh-hashanah-musaf',
        group: 'musaf',
        title: 'מוסף ראש השנה',
        subtitle: 'פר אחד, איל אחד, שבעה כבשים ושעיר אחד',
        counts: { bulls: 1, rams: 1, lambs: 7, goats: 1 },
      }),
    );
  }

  if (month === months.TISHREI && day === 10) {
    rows.push(
      createRow({
        id: 'yom-kippur-musaf',
        group: 'musaf',
        title: 'מוסף יום הכיפורים',
        subtitle: 'פר אחד, איל אחד, שבעה כבשים ושעיר אחד',
        counts: { bulls: 1, rams: 1, lambs: 7, goats: 1 },
      }),
      createRow({
        id: 'yom-kippur-avodah',
        group: 'special',
        title: 'עבודת יום הכיפורים',
        subtitle: 'שעיר חטאת נוסף, פר כהן גדול ואיל לעולה',
        counts: { bulls: 1, rams: 1, lambs: 0, goats: 1 },
        notes: ['שעיר המשתלח נזכר כהערה ואינו בכלל הקרב על המזבח.'],
      }),
    );
    notes.push('שעיר המשתלח אינו בכלל המנין, מפני שאינו קרב על המזבח.');
  }

  if (isSukkot(month, day)) {
    const bulls = 28 - day;
    rows.push(
      createRow({
        id: `sukkot-${day}`,
        group: 'musaf',
        title: `מוסף חג הסוכות - יום ${formatHebrewNumber(day - 14)}`,
        subtitle: `${formatCount(bulls, 'פר', 'פרים')}, שני אילים, ארבעה עשר כבשים ושעיר אחד`,
        counts: { bulls, rams: 2, lambs: 14, goats: 1 },
      }),
    );
  }

  if (month === months.TISHREI && day === 22) {
    rows.push(
      createRow({
        id: 'shemini-atzeret',
        group: 'musaf',
        title: 'מוסף שמיני עצרת',
        subtitle: 'פר אחד, איל אחד, שבעה כבשים ושעיר אחד',
        counts: { bulls: 1, rams: 1, lambs: 7, goats: 1 },
      }),
    );
  }

  const totals = sumRows(rows);

  return {
    hdate: date,
    titleDate: formatHebrewDate(date),
    weekdayName: WEEKDAYS_HE[dayOfWeek],
    gregorianLabel: formatGregorianDate(date.greg()),
    rows,
    notes,
    sources: SOURCE_LINKS,
    totals,
    total: totalAnimals(totals),
  };
}

export function getHebrewMonthName(month: number, year: number): string {
  switch (month) {
    case months.NISAN:
      return 'ניסן';
    case months.IYYAR:
      return 'אייר';
    case months.SIVAN:
      return 'סיון';
    case months.TAMUZ:
      return 'תמוז';
    case months.AV:
      return 'אב';
    case months.ELUL:
      return 'אלול';
    case months.TISHREI:
      return 'תשרי';
    case months.CHESHVAN:
      return 'חשוון';
    case months.KISLEV:
      return 'כסלו';
    case months.TEVET:
      return 'טבת';
    case months.SHVAT:
      return 'שבט';
    case months.ADAR_I:
      return HDate.isLeapYear(year) ? 'אדר א׳' : 'אדר';
    case months.ADAR_II:
      return 'אדר ב׳';
    default:
      return String(month);
  }
}

export function getHebrewMonthsForYear(year: number): number[] {
  const baseMonths = [
    months.TISHREI,
    months.CHESHVAN,
    months.KISLEV,
    months.TEVET,
    months.SHVAT,
    months.ADAR_I,
    months.NISAN,
    months.IYYAR,
    months.SIVAN,
    months.TAMUZ,
    months.AV,
    months.ELUL,
  ];

  if (!HDate.isLeapYear(year)) {
    return baseMonths;
  }

  return [
    months.TISHREI,
    months.CHESHVAN,
    months.KISLEV,
    months.TEVET,
    months.SHVAT,
    months.ADAR_I,
    months.ADAR_II,
    months.NISAN,
    months.IYYAR,
    months.SIVAN,
    months.TAMUZ,
    months.AV,
    months.ELUL,
  ];
}

export function daysInHebrewMonth(month: number, year: number): number {
  return HDate.daysInMonth(month, year);
}

export function clampHebrewDay(day: number, month: number, year: number): number {
  return Math.min(day, daysInHebrewMonth(month, year));
}

export function shiftHebrewDate(hdate: HDate, days: number): HDate {
  return new HDate(hdate.abs() + days);
}

export function formatHebrewNumber(value: number): string {
  return gematriya(value).replace(/^טו$/, 'ט״ו').replace(/^טז$/, 'ט״ז');
}

export function rowTotal(row: KorbanRow): number {
  return totalAnimals(row.counts);
}

function createRow(row: KorbanRow): KorbanRow {
  return row;
}

function isRoshChodesh(date: HDate): boolean {
  return date.getDate() === 1 || date.getDate() === 30;
}

function isPesach(month: number, day: number): boolean {
  return month === months.NISAN && day >= 15 && day <= 21;
}

function isSukkot(month: number, day: number): boolean {
  return month === months.TISHREI && day >= 15 && day <= 21;
}

function sumRows(rows: KorbanRow[]): AnimalCounts {
  return rows.reduce<AnimalCounts>(
    (totals, row) => ({
      bulls: totals.bulls + row.counts.bulls,
      rams: totals.rams + row.counts.rams,
      lambs: totals.lambs + row.counts.lambs,
      goats: totals.goats + row.counts.goats,
    }),
    { ...EMPTY_COUNTS },
  );
}

function totalAnimals(counts: AnimalCounts): number {
  return counts.bulls + counts.rams + counts.lambs + counts.goats;
}

function formatHebrewDate(hdate: HDate): string {
  return hdate.renderGematriya(true);
}

function formatGregorianDate(date: Date): string {
  const day = date.getDate();
  const month = GREGORIAN_MONTHS_HE[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

function formatCount(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : `${formatHebrewNumber(count)} ${plural}`;
}

function getJerusalemLocation() {
  const location = Location.lookup('Jerusalem');

  if (!location) {
    throw new Error('Hebcal Jerusalem location is unavailable');
  }

  return location;
}
