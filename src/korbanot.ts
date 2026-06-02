import { HDate, Location, Zmanim, gematriya, months } from '@hebcal/core';

export type AnimalKey = 'bulls' | 'rams' | 'lambs' | 'goats';
export type AnimalAgeCategory = 'standard' | 'young' | 'mature' | 'yearling' | 'two-year';
export type KorbanGroup = 'tamid' | 'musaf' | 'special';
export type KorbanType = 'olah' | 'chatas' | 'shelamim' | 'pesach' | 'azazel';

export interface AnimalCounts {
  bulls: number;
  rams: number;
  lambs: number;
  goats: number;
}

export type NesachKey = 'solet' | 'oil' | 'wine';

export interface NesachQuantity {
  /** Display wording, e.g. 'חצי ההין' or 'שלושה עשרונים'. */
  label: string;
  /** Relative magnitude for sizing the picture; 1 = smallest standard amount. */
  scale: number;
}

export interface NesachimAmounts {
  solet: NesachQuantity;
  oil: NesachQuantity;
  wine: NesachQuantity;
}

export interface KorbanAnimalLine {
  animal: AnimalKey;
  ageCategory: AnimalAgeCategory;
  korbanType: KorbanType;
  quantity: number;
  label?: string;
  nesachim?: NesachimAmounts | null;
}

export interface KorbanRow {
  id: string;
  group: KorbanGroup;
  title: string;
  subtitle: string;
  animals: KorbanAnimalLine[];
  counts: AnimalCounts;
  notes?: string[];
}

export interface ExcludedKorbanRow {
  id: string;
  title: string;
  subtitle: string;
  animals: KorbanAnimalLine[];
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
  excludedRows: ExcludedKorbanRow[];
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

export const ANIMAL_TILE_LABELS: Record<AnimalKey, string> = {
  bulls: 'פר',
  rams: 'איל',
  lambs: 'כבש',
  goats: 'שעיר',
};

export const ANIMAL_AGE_LABELS: Record<AnimalAgeCategory, string> = {
  standard: '',
  young: 'בן שתיים-שלוש שנים',
  mature: 'בוגר',
  yearling: 'בן שנה',
  'two-year': 'בן שנתיים',
};

// The age an animal carries when a line doesn't specify one: a par ben bakar is
// two-to-three years, an ayil is in its second year, and lambs and goats are all
// within their first year.
const NATURAL_AGE: Record<AnimalKey, AnimalAgeCategory> = {
  bulls: 'young',
  rams: 'two-year',
  lambs: 'yearling',
  goats: 'yearling',
};

export const KORBAN_TYPE_LABELS: Record<KorbanType, string> = {
  olah: 'עולה',
  chatas: 'חטאת',
  shelamim: 'שלמים',
  pesach: 'פסח',
  azazel: 'משתלח',
};

export const EMPTY_COUNTS: AnimalCounts = {
  bulls: 0,
  rams: 0,
  lambs: 0,
  goats: 0,
};

// Wine/oil scale is the hin fraction normalised so רביעית (1/4) = 1.
// Solet scale is simply the number of esronim. Both types share a base of 1
// at the smallest standard amount, so a single sizing curve fits all pictures.
export const STANDARD_NESACHIM: Record<AnimalKey, NesachimAmounts> = {
  bulls: {
    solet: { label: 'שלושה עשרונים', scale: 3 },
    oil: { label: 'חצי ההין', scale: 2 },
    wine: { label: 'חצי ההין', scale: 2 },
  },
  rams: {
    solet: { label: 'שני עשרונים', scale: 2 },
    oil: { label: 'שלישית ההין', scale: 4 / 3 },
    wine: { label: 'שלישית ההין', scale: 4 / 3 },
  },
  lambs: {
    solet: { label: 'עשרון', scale: 1 },
    oil: { label: 'רביעית ההין', scale: 1 },
    wine: { label: 'רביעית ההין', scale: 1 },
  },
  goats: {
    solet: { label: 'עשרון', scale: 1 },
    oil: { label: 'רביעית ההין', scale: 1 },
    wine: { label: 'רביעית ההין', scale: 1 },
  },
};

export const OMER_LAMB_NESACHIM: NesachimAmounts = {
  solet: { label: 'שני עשרונים', scale: 2 },
  oil: { label: 'שלישית ההין', scale: 4 / 3 },
  wine: { label: 'רביעית ההין', scale: 1 },
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

type KorbanRowInput = Omit<KorbanRow, 'counts'>;

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
      animals: [olah('lambs', 2, 'yearling')],
      notes: ['הנסכים מוצגים לכל כבש, ואינם מוסיפים למנין הבהמות.'],
    }),
  ];
  const excludedRows: ExcludedKorbanRow[] = [];

  const notes: string[] = [
    'המנין כולל קרבנות ציבור קבועים מן הבהמה בלבד.',
    'מנחות, נסכים, קטורת, לחם הפנים וקרבנות יחיד אינם נכנסים בחשבון הבהמות.',
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
        animals: [olah('lambs', 2, 'yearling')],
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
        subtitle: 'שני פרים בני בקר, איל אחד, שבעה כבשים ושעיר אחד',
        animals: musafAnimals({ bulls: 2, rams: 1, lambs: 7 }),
      }),
    );
  }

  if (isPesach(month, day)) {
    rows.push(
      createRow({
        id: 'pesach-musaf',
        group: 'musaf',
        title: 'מוסף פסח',
        subtitle: 'שני פרים בני בקר, איל אחד, שבעה כבשים ושעיר אחד',
        animals: musafAnimals({ bulls: 2, rams: 1, lambs: 7 }),
      }),
    );
    notes.push('קרבן פסח אינו במוספי החג, ומנינו תלוי בכל חבורה וחבורה.');
  }

  if (month === months.NISAN && day === 16) {
    rows.push(
      createRow({
        id: 'omer',
        group: 'special',
        title: 'קרבן העומר',
        subtitle: 'כבש אחד לעולה',
        animals: [olah('lambs', 1, 'yearling', { nesachim: OMER_LAMB_NESACHIM })],
        notes: ['מנחת העומר עצמה אינה בכלל מנין הבהמות.'],
      }),
    );
  }

  if (month === months.NISAN && day === 14) {
    excludedRows.push({
      id: 'korban-pesach',
      title: 'קרבן פסח',
      subtitle: 'כבש או גדי לכל חבורה - משתנה לפי המקריבים',
      animals: [
        line('lambs', 'pesach', 1, 'yearling', {
          label: 'כבש או גדי',
          nesachim: null,
        }),
      ],
    });
    notes.push('בי״ד בניסן קרבן פסח אינו בכלל המנין, כי מספרו תלוי במקריבים.');
  }

  if (month === months.SIVAN && day === 6) {
    rows.push(
      createRow({
        id: 'shavuot-musaf',
        group: 'musaf',
        title: 'מוסף עצרת',
        subtitle: 'שני פרים בני בקר, איל אחד, שבעה כבשים ושעיר אחד',
        animals: musafAnimals({ bulls: 2, rams: 1, lambs: 7 }),
      }),
      createRow({
        id: 'shtei-halechem',
        group: 'special',
        title: 'הבאים עם שתי הלחם',
        subtitle: 'פר בן בקר, שני אילים, שבעה כבשים ושעיר',
        animals: [
          olah('bulls', 1, 'young'),
          olah('rams', 2),
          olah('lambs', 7, 'yearling'),
          chatas('goats', 1),
        ],
        notes: ['אלו באים עם שתי הלחם מלבד מוספי היום, ואינם כפילות.'],
      }),
      createRow({
        id: 'shtei-halechem-shelamim',
        group: 'special',
        title: 'כבשי שלמי ציבור',
        subtitle: 'שני כבשים שלמים',
        animals: [shelamim('lambs', 2, 'yearling')],
      }),
    );
  }

  if (month === months.TISHREI && day === 1) {
    rows.push(
      createRow({
        id: 'rosh-hashanah-musaf',
        group: 'musaf',
        title: 'מוסף ראש השנה',
        subtitle: 'פר בן בקר, איל אחד, שבעה כבשים ושעיר אחד',
        animals: musafAnimals({ bulls: 1, rams: 1, lambs: 7 }),
      }),
    );
  }

  if (month === months.TISHREI && day === 10) {
    rows.push(
      createRow({
        id: 'yom-kippur-musaf',
        group: 'musaf',
        title: 'מוסף יום הכיפורים',
        subtitle: 'פר בן בקר, איל אחד, שבעה כבשים ושעיר אחד',
        animals: musafAnimals({ bulls: 1, rams: 1, lambs: 7 }),
      }),
      createRow({
        id: 'yom-kippur-avodah',
        group: 'special',
        title: 'עבודת יום הכיפורים',
        subtitle: 'פר כהן גדול לחטאת, אילו לעולה, ושעיר לה׳ לחטאת',
        animals: [chatas('bulls', 1, 'young'), olah('rams', 1), chatas('goats', 1)],
        notes: ['שעיר המשתלח נזכר למטה ואינו בכלל הקרב על המזבח.'],
      }),
    );
    excludedRows.push({
      id: 'yom-kippur-azazel',
      title: 'שעיר המשתלח',
      subtitle: 'נשלח לעזאזל ואינו קרב על המזבח',
      animals: [
        line('goats', 'azazel', 1, 'standard', {
          label: 'שעיר לעזאזל',
          nesachim: null,
        }),
      ],
    });
    notes.push('שעיר המשתלח אינו בכלל המנין, מפני שאינו קרב על המזבח.');
  }

  if (isSukkot(month, day)) {
    const bulls = 28 - day;
    rows.push(
      createRow({
        id: `sukkot-${day}`,
        group: 'musaf',
        title: `מוסף חג הסוכות - יום ${formatHebrewNumber(day - 14)}`,
        subtitle: `${formatCount(bulls, 'פר בן בקר', 'פרים בני בקר')}, שני אילים, ארבעה עשר כבשים ושעיר אחד`,
        animals: musafAnimals({ bulls, rams: 2, lambs: 14 }),
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
        animals: musafAnimals({ bulls: 1, rams: 1, lambs: 7, bullAge: 'mature' }),
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
    excludedRows,
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

export function resolveNesachim(animal: KorbanAnimalLine): NesachimAmounts | null {
  if (animal.nesachim !== undefined) {
    return animal.nesachim;
  }

  if (animal.korbanType !== 'olah' && animal.korbanType !== 'shelamim') {
    return null;
  }

  return STANDARD_NESACHIM[animal.animal];
}

export function rowTotal(row: KorbanRow): number {
  return row.animals.reduce((sum, animal) => sum + animal.quantity, 0);
}

function createRow(row: KorbanRowInput): KorbanRow {
  return {
    ...row,
    counts: animalCountsFromLines(row.animals),
  };
}

function olah(
  animal: AnimalKey,
  quantity: number,
  ageCategory?: AnimalAgeCategory,
  options: Partial<Pick<KorbanAnimalLine, 'label' | 'nesachim'>> = {},
): KorbanAnimalLine {
  return line(animal, 'olah', quantity, ageCategory, options);
}

function chatas(
  animal: AnimalKey,
  quantity: number,
  ageCategory?: AnimalAgeCategory,
  options: Partial<Pick<KorbanAnimalLine, 'label' | 'nesachim'>> = {},
): KorbanAnimalLine {
  return line(animal, 'chatas', quantity, ageCategory, { nesachim: null, ...options });
}

function shelamim(
  animal: AnimalKey,
  quantity: number,
  ageCategory?: AnimalAgeCategory,
  options: Partial<Pick<KorbanAnimalLine, 'label' | 'nesachim'>> = {},
): KorbanAnimalLine {
  return line(animal, 'shelamim', quantity, ageCategory, options);
}

function line(
  animal: AnimalKey,
  korbanType: KorbanType,
  quantity: number,
  ageCategory: AnimalAgeCategory | undefined,
  options: Partial<Pick<KorbanAnimalLine, 'label' | 'nesachim'>> = {},
): KorbanAnimalLine {
  return {
    animal,
    ageCategory: ageCategory ?? NATURAL_AGE[animal],
    korbanType,
    quantity,
    ...options,
  };
}

function musafAnimals({
  bulls,
  rams,
  lambs,
  bullAge = 'young',
}: {
  bulls: number;
  rams: number;
  lambs: number;
  bullAge?: AnimalAgeCategory;
}): KorbanAnimalLine[] {
  return [
    olah('bulls', bulls, bullAge),
    olah('rams', rams),
    olah('lambs', lambs, 'yearling'),
    chatas('goats', 1),
  ].filter((animal) => animal.quantity > 0);
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

function animalCountsFromLines(animals: KorbanAnimalLine[]): AnimalCounts {
  return animals.reduce<AnimalCounts>(
    (counts, animal) => ({
      ...counts,
      [animal.animal]: counts[animal.animal] + animal.quantity,
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
