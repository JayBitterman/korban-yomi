import './styles.css';
import { HDate } from '@hebcal/core';
import {
  ANIMAL_LABELS,
  type AnimalKey,
  type KorbanGroup,
  calculateKorbanot,
  clampHebrewDay,
  daysInHebrewMonth,
  formatHebrewNumber,
  getHebrewMonthName,
  getHebrewMonthsForYear,
  getJerusalemHebrewDate,
  shiftHebrewDate,
} from './korbanot';

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('Missing #app root');
}

const app: HTMLDivElement = appRoot;

const ANIMAL_IMAGE_FILES: Record<AnimalKey, string> = {
  bulls: 'bull.png',
  rams: 'ram.png',
  lambs: 'lamb.png',
  goats: 'goat.png',
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
  const densestGroupRows = Math.max(...visibleGroups.map((group) => group.rows.length));

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

      <section class="learning-board" data-groups="${visibleGroups.length}" data-density="${boardDensity(totalRows, densestGroupRows)}">
        ${visibleGroups.map(renderGroup).join('')}
      </section>
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

  app.querySelectorAll<HTMLImageElement>('img[data-fallback]').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.image-frame')?.classList.add('is-missing');
      image.remove();
    });
  });

  app.querySelectorAll<HTMLImageElement>('img[data-animal-image]').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.animal-icon')?.classList.add('is-missing');
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

function renderRow(row: ReturnType<typeof calculateKorbanot>['rows'][number], hideTitle = false): string {
  return `
    <article class="korban-line">
      <h3 class="${hideTitle ? 'visually-hidden' : ''}">${row.title}</h3>
      <div class="animal-counts">
        ${animalPills(row.counts)}
      </div>
    </article>
  `;
}

function animalPills(counts: Record<AnimalKey, number>): string {
  const pills = (Object.keys(ANIMAL_LABELS) as AnimalKey[])
    .filter((key) => counts[key] > 0)
    .map(
      (key) => `
        <span class="animal-count" aria-label="${ANIMAL_LABELS[key]} ${formatNumber(counts[key])}">
          ${animalIcon(key)}
          <span class="count-number">×${formatNumber(counts[key])}</span>
        </span>
      `,
    );

  return pills.length > 0 ? pills.join('') : '<span class="empty-state">אין</span>';
}

function animalIcon(key: AnimalKey): string {
  const label = ANIMAL_LABELS[key];
  const fileName = ANIMAL_IMAGE_FILES[key];

  return `
    <span class="animal-icon">
      <img data-animal-image src="${publicAsset(`images/${fileName}`)}" alt="${label}" />
      <span class="animal-letter" aria-hidden="true">${label.slice(0, 1)}</span>
    </span>
  `;
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

function groupTitle(
  group: KorbanGroup,
  rows: ReturnType<typeof calculateKorbanot>['rows'],
): string | null {
  if (group !== 'musaf' || rows.length === 0) {
    return null;
  }

  return rows.map((row) => row.title).join(' / ');
}

function boardDensity(totalRows: number, densestGroupRows: number): 'roomy' | 'normal' | 'busy' | 'packed' {
  if (totalRows >= 5 || densestGroupRows >= 3) {
    return 'packed';
  }

  if (totalRows >= 4 || densestGroupRows >= 2) {
    return 'busy';
  }

  return totalRows <= 1 ? 'roomy' : 'normal';
}
