import './styles.css';
import { HDate } from '@hebcal/core';
import {
  ANIMAL_AGE_LABELS,
  ANIMAL_TILE_LABELS,
  KORBAN_TYPE_LABELS,
  type AnimalAgeCategory,
  type AnimalKey,
  type KorbanAnimalLine,
  type KorbanGroup,
  calculateKorbanot,
  clampHebrewDay,
  daysInHebrewMonth,
  formatHebrewNumber,
  getHebrewMonthName,
  getHebrewMonthsForYear,
  getJerusalemHebrewDate,
  resolveNesachim,
  rowTotal,
  shiftHebrewDate,
} from './korbanot';

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('Missing #app root');
}

const app: HTMLDivElement = appRoot;

type KorbanDayView = ReturnType<typeof calculateKorbanot>;
type KorbanRowView = KorbanDayView['rows'][number];
type ExcludedKorbanRowView = KorbanDayView['excludedRows'][number];

const ANIMAL_IMAGE_FILES: Record<AnimalKey, string> = {
  bulls: 'bull.png',
  rams: 'ram.png',
  lambs: 'lamb.png',
  goats: 'goat.png',
};

const CATTLE_AGE_IMAGE_FILES: Partial<Record<AnimalAgeCategory, string>> = {
  young: 'young-bull.png',
  mature: 'bull.png',
  calf: 'calf.png',
};

const GROUPS: Array<{ group: KorbanGroup; title: string }> = [
  { group: 'tamid', title: 'תמיד' },
  { group: 'musaf', title: 'מוסף' },
  { group: 'special', title: 'עוד היום' },
];

let selectedDate = getJerusalemHebrewDate();
let dateDrawerOpen = false;
const today = () => getJerusalemHebrewDate();

document.addEventListener('click', (event) => {
  if (!dateDrawerOpen || !(event.target instanceof Element)) {
    return;
  }

  if (!event.target.closest('.date-drawer')) {
    dateDrawerOpen = false;
    render();
  }
});

render();

function render(): void {
  const day = calculateKorbanot(selectedDate);
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const selectedDay = selectedDate.getDate();
  const monthOptions = getHebrewMonthsForYear(selectedYear)
    .map(
      (month) =>
        `<option value="${month}" ${month === selectedMonth ? 'selected' : ''}>${getHebrewMonthName(month, selectedYear)}</option>`,
    )
    .join('');
  const dayOptions = Array.from(
    { length: daysInHebrewMonth(selectedMonth, selectedYear) },
    (_, index) => index + 1,
  )
    .map(
      (value) =>
        `<option value="${value}" ${value === selectedDay ? 'selected' : ''}>${formatHebrewNumber(value)}</option>`,
    )
    .join('');
  const yearOptions = Array.from({ length: 17 }, (_, index) => selectedYear - 8 + index)
    .map(
      (year) =>
        `<option value="${year}" ${year === selectedYear ? 'selected' : ''}>${formatHebrewNumber(year)}</option>`,
    )
    .join('');
  const visibleGroups = GROUPS.map(({ group, title }) => ({
    group,
    title,
    rows: day.rows.filter((row) => row.group === group),
  })).filter(({ rows }) => rows.length > 0);
  const totalRows = visibleGroups.reduce((sum, group) => sum + group.rows.length, 0);
  const excludedTileCount = day.excludedRows.reduce(
    (sum, row) => sum + row.animals.reduce((rowSum, animal) => rowSum + animal.quantity, 0),
    0,
  );
  const totalTileCount = day.total + excludedTileCount;
  const densestRowTiles = Math.max(
    1,
    ...day.rows.map(rowTotal),
    ...day.excludedRows.map((row) => row.animals.reduce((sum, animal) => sum + animal.quantity, 0)),
  );

  app.innerHTML = `
    <main class="site-shell">
      <header class="top-line" aria-labelledby="main-title">
        <div>
          <p class="date-title">${day.titleDate}</p>
          <h1 id="main-title">מנין הקרבנות</h1>
        </div>
        <div class="total-badge" aria-label="סך הכל קרבנות ציבור">
          <span class="total-number">${formatNumber(day.total)}</span>
          <span class="total-label">סך הכל</span>
        </div>
        <div class="date-drawer ${dateDrawerOpen ? 'is-open' : ''}">
          <button
            class="date-toggle"
            type="button"
            data-action="toggle-date"
            aria-expanded="${dateDrawerOpen}"
            aria-controls="date-toolbar"
          >
            תאריך
          </button>
          <section id="date-toolbar" class="date-toolbar" aria-label="בחירת תאריך עברי" ${dateDrawerOpen ? '' : 'hidden'}>
            <button class="icon-button" type="button" data-action="previous-day" aria-label="היום הקודם" title="היום הקודם">
              <span aria-hidden="true">‹</span>
            </button>
            <label>
              <span>יום</span>
              <select data-field="day">${dayOptions}</select>
            </label>
            <label>
              <span>חודש</span>
              <select data-field="month">${monthOptions}</select>
            </label>
            <label>
              <span>שנה</span>
              <select data-field="year">${yearOptions}</select>
            </label>
            <button class="today-button" type="button" data-action="today">היום</button>
            <button class="icon-button" type="button" data-action="next-day" aria-label="היום הבא" title="היום הבא">
              <span aria-hidden="true">›</span>
            </button>
          </section>
        </div>
      </header>

      <section class="learning-board" data-groups="${visibleGroups.length}" data-density="${boardDensity(totalTileCount, densestRowTiles, totalRows)}">
        ${visibleGroups.map(renderGroup).join('')}
      </section>

      ${day.excludedRows.length > 0 ? renderExcludedBoard(day.excludedRows) : ''}
    </main>
  `;

  function renderGroup({ group, title, rows }: (typeof visibleGroups)[number]): string {
    const hideSingleMusafRowTitle = group === 'musaf' && rows.length === 1;
    const titleText = groupTitle(group, rows);

    return `
      <section class="korban-group" data-group="${group}" data-rows="${rows.length}" ${
        titleText ? `aria-labelledby="${group}-title"` : `aria-label="${title}"`
      }>
        ${titleText ? `<h2 id="${group}-title">${titleText}</h2>` : ''}
        <div class="korban-lines">${rows.map((row) => renderRow(row, hideSingleMusafRowTitle)).join('')}</div>
      </section>
    `;
  }

  app.querySelectorAll<HTMLImageElement>('img[data-animal-image]').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.animal-art')?.classList.add('is-missing');
      image.remove();
    });
  });

  app.querySelector<HTMLButtonElement>('[data-action="toggle-date"]')?.addEventListener('click', () => {
    dateDrawerOpen = !dateDrawerOpen;
    render();
  });

  app.querySelector<HTMLButtonElement>('[data-action="today"]')?.addEventListener('click', () => {
    selectedDate = today();
    render();
  });

  app.querySelector<HTMLButtonElement>('[data-action="previous-day"]')?.addEventListener('click', () => {
    selectedDate = shiftHebrewDate(selectedDate, -1);
    render();
  });

  app.querySelector<HTMLButtonElement>('[data-action="next-day"]')?.addEventListener('click', () => {
    selectedDate = shiftHebrewDate(selectedDate, 1);
    render();
  });

  app.querySelectorAll<HTMLSelectElement>('select[data-field]').forEach((select) => {
    select.addEventListener('change', () => {
      const nextYear = readSelect('year');
      const nextMonth = readSelect('month');
      const nextDay = clampHebrewDay(readSelect('day'), nextMonth, nextYear);
      selectedDate = new HDate(nextDay, nextMonth, nextYear);
      render();
    });
  });
}

function renderRow(row: KorbanRowView, hideTitle = false): string {
  return `
    <article class="korban-line">
      <h3 class="${hideTitle ? 'visually-hidden' : ''}">${row.title}</h3>
      <div class="animal-grid">
        ${animalTiles(row.animals)}
      </div>
    </article>
  `;
}

function renderExcludedBoard(rows: ExcludedKorbanRowView[]): string {
  return `
    <section class="excluded-board" aria-labelledby="excluded-title">
      <h2 id="excluded-title">נזכר ואינו במנין</h2>
      <div class="excluded-lines">
        ${rows.map(renderExcludedRow).join('')}
      </div>
    </section>
  `;
}

function renderExcludedRow(row: ExcludedKorbanRowView): string {
  return `
    <article class="excluded-line">
      <div>
        <h3>${row.title}</h3>
        <p class="excluded-subtitle">${row.subtitle}</p>
      </div>
      <div class="animal-grid animal-grid-excluded">
        ${animalTiles(row.animals, { excluded: true })}
      </div>
    </article>
  `;
}

function animalTiles(animals: KorbanAnimalLine[], options: { excluded?: boolean } = {}): string {
  const tiles = animals.flatMap((animal) =>
    Array.from({ length: animal.quantity }, () => renderAnimalTile(animal, options)),
  );

  return tiles.length > 0 ? tiles.join('') : '<span class="empty-state">אין</span>';
}

function renderAnimalTile(animal: KorbanAnimalLine, { excluded = false }: { excluded?: boolean } = {}): string {
  const ageLabel = ANIMAL_AGE_LABELS[animal.ageCategory];
  const korbanType = KORBAN_TYPE_LABELS[animal.korbanType];

  return `
    <article class="animal-tile ${excluded ? 'is-excluded' : ''}" data-korban-type="${animal.korbanType}" aria-label="${animalAriaLabel(animal, excluded)}">
      ${animalIcon(animal)}
      <div class="animal-copy">
        <span class="korban-type">${korbanType}</span>
        <span class="animal-name">${animalDisplayName(animal)}</span>
        ${ageLabel ? `<span class="animal-age">${ageLabel}</span>` : ''}
        ${excluded ? '<span class="excluded-chip">לא במנין</span>' : ''}
      </div>
      ${excluded ? '' : renderNesachim(animal)}
    </article>
  `;
}

function renderNesachim(animal: KorbanAnimalLine): string {
  const nesachim = resolveNesachim(animal);

  if (!nesachim) {
    return '';
  }

  return `
    <div class="nesachim" aria-label="נסכים">
      <span class="nesach-row">${nesachIcon('wine')}<span>יין ${nesachim.wine}</span></span>
      <span class="nesach-row">${nesachIcon('oil')}<span>שמן ${nesachim.oil}</span></span>
      <span class="nesach-row">${nesachIcon('solet')}<span>סולת ${nesachim.solet}</span></span>
    </div>
  `;
}

function animalIcon(animal: KorbanAnimalLine): string {
  const label = animalDisplayName(animal);
  const fileName = animalImageFile(animal);

  return `
    <span class="animal-art">
      <img data-animal-image src="${publicAsset(`images/${fileName}`)}" alt="${label}" />
      <span class="animal-letter" aria-hidden="true">${label.slice(0, 1)}</span>
    </span>
  `;
}

function nesachIcon(type: 'wine' | 'oil' | 'solet'): string {
  if (type === 'wine') {
    return `
      <svg class="nesach-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3h8l-1 8a3 3 0 0 1-6 0L8 3Z" />
        <path d="M12 14v5" />
        <path d="M9 21h6" />
      </svg>
    `;
  }

  if (type === 'oil') {
    return `
      <svg class="nesach-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10Z" />
      </svg>
    `;
  }

  return `
    <svg class="nesach-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 17c3 3 11 3 14 0" />
      <path d="M7 17l2-8" />
      <path d="M12 17V6" />
      <path d="M17 17l-2-8" />
      <path d="M8 10c2 1 6 1 8 0" />
    </svg>
  `;
}

function animalImageFile(animal: KorbanAnimalLine): string {
  if (animal.animal === 'bulls') {
    return CATTLE_AGE_IMAGE_FILES[animal.ageCategory] ?? ANIMAL_IMAGE_FILES.bulls;
  }

  return ANIMAL_IMAGE_FILES[animal.animal];
}

function animalDisplayName(animal: KorbanAnimalLine): string {
  return animal.label ?? ANIMAL_TILE_LABELS[animal.animal];
}

function animalAriaLabel(animal: KorbanAnimalLine, excluded: boolean): string {
  const nesachim = resolveNesachim(animal);
  const ageLabel = ANIMAL_AGE_LABELS[animal.ageCategory];
  const agePart = ageLabel ? ` ${ageLabel}` : '';
  const nesachimPart = nesachim
    ? `, יין ${nesachim.wine}, שמן ${nesachim.oil}, סולת ${nesachim.solet}`
    : '';
  const excludedPart = excluded ? ', לא במנין' : '';

  return `${animalDisplayName(animal)}${agePart}, ${KORBAN_TYPE_LABELS[animal.korbanType]}${nesachimPart}${excludedPart}`;
}

function readSelect(field: 'day' | 'month' | 'year'): number {
  const select = app.querySelector<HTMLSelectElement>(`select[data-field="${field}"]`);

  if (!select) {
    throw new Error(`Missing ${field} select`);
  }

  return Number(select.value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('he-IL').format(value);
}

function publicAsset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

function groupTitle(group: KorbanGroup, rows: KorbanRowView[]): string | null {
  if (group !== 'musaf' || rows.length === 0) {
    return null;
  }

  return rows.map((row) => row.title).join(' / ');
}

function boardDensity(totalTiles: number, densestRowTiles: number, totalRows: number): 'roomy' | 'normal' | 'busy' | 'packed' {
  if (totalTiles >= 28 || densestRowTiles >= 18 || totalRows >= 5) {
    return 'packed';
  }

  if (totalTiles >= 14 || densestRowTiles >= 10 || totalRows >= 4) {
    return 'busy';
  }

  return totalRows <= 1 ? 'roomy' : 'normal';
}
