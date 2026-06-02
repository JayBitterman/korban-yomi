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
  type NesachKey,
  type NesachQuantity,
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
};

const NESACH_IMAGE_FILES: Record<NesachKey, string> = {
  wine: 'wine.png',
  oil: 'oil.png',
  solet: 'flour.png',
};

// Base width (px) for the smallest standard nesach amount; larger amounts scale up.
const NESACH_BASE_PX = 24;

const GROUPS: Array<{ group: KorbanGroup; title: string }> = [
  { group: 'tamid', title: 'תמיד' },
  { group: 'musaf', title: 'מוסף' },
  { group: 'special', title: 'עוד היום' },
];

let selectedDate = getJerusalemHebrewDate();
let dateDrawerOpen = false;
// When true the board tracks the live Jerusalem date and rolls itself over at
// sunset; any manual date navigation pins a specific day and clears the flag.
let followToday = true;
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

// Roll the board to the new day when the live Jerusalem date crosses sunset.
// The Hebrew day begins at sunset, so this can fire in the evening, not at
// civil midnight. Only re-renders when the date actually changes.
window.setInterval(() => {
  if (!followToday) {
    return;
  }

  const liveToday = today();

  if (liveToday.abs() !== selectedDate.abs()) {
    selectedDate = liveToday;
    render();
  }
}, 30_000);

// Re-fit after the webfont swaps in (text metrics shift) and on any resize.
document.fonts?.ready.then(fitToViewport).catch(() => {});

let fitScheduled = false;
window.addEventListener('resize', () => {
  if (fitScheduled) {
    return;
  }

  fitScheduled = true;
  requestAnimationFrame(() => {
    fitScheduled = false;
    fitToViewport();
  });
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
      <header class="top-line" aria-label="מנין הקרבנות">
        <div class="date-drawer ${dateDrawerOpen ? 'is-open' : ''}">
          <div class="date-head">
            <p class="date-title">${day.titleDate}</p>
            <button
              class="date-toggle"
              type="button"
              data-action="toggle-date"
              aria-expanded="${dateDrawerOpen}"
              aria-controls="date-toolbar"
            >
              תאריך
            </button>
          </div>
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
        <div class="total-badge" aria-label="סך הכל קרבנות ציבור">
          <span class="total-number">${formatNumber(day.total)}</span>
          <span class="total-label">סך הכל</span>
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
    // Width weight: a column grows in proportion to how many tiles it holds, so a
    // sparse category (2 tamidim) stays narrow and hands the freed space to a
    // denser neighbour (musaf) instead of every column claiming an equal share.
    const groupWeight = Math.max(1, rows.reduce((sum, row) => sum + rowTotal(row), 0));

    return `
      <section class="korban-group" data-group="${group}" data-rows="${rows.length}" style="--group-weight:${groupWeight}" ${
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

  app.querySelectorAll<HTMLImageElement>('img[data-nesach-image]').forEach((image) => {
    image.addEventListener('error', () => {
      image.closest('.nesach-art')?.remove();
      fitToViewport();
    });
    // A loaded libation icon changes the tile's height, so re-fit once it lands.
    image.addEventListener('load', fitToViewport);
  });

  app.querySelector<HTMLButtonElement>('[data-action="toggle-date"]')?.addEventListener('click', () => {
    dateDrawerOpen = !dateDrawerOpen;
    render();
  });

  app.querySelector<HTMLButtonElement>('[data-action="today"]')?.addEventListener('click', () => {
    followToday = true;
    selectedDate = today();
    render();
  });

  app.querySelector<HTMLButtonElement>('[data-action="previous-day"]')?.addEventListener('click', () => {
    followToday = false;
    selectedDate = shiftHebrewDate(selectedDate, -1);
    render();
  });

  app.querySelector<HTMLButtonElement>('[data-action="next-day"]')?.addEventListener('click', () => {
    followToday = false;
    selectedDate = shiftHebrewDate(selectedDate, 1);
    render();
  });

  app.querySelectorAll<HTMLSelectElement>('select[data-field]').forEach((select) => {
    select.addEventListener('change', () => {
      followToday = false;
      const nextYear = readSelect('year');
      const nextMonth = readSelect('month');
      const nextDay = clampHebrewDay(readSelect('day'), nextMonth, nextYear);
      selectedDate = new HDate(nextDay, nextMonth, nextYear);
      render();
    });
  });

  fitToViewport();
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
      <span class="korban-type">${korbanType}</span>
      ${animalIcon(animal)}
      <div class="animal-copy">
        <span class="animal-identity">
          <span class="animal-name">${animalDisplayName(animal)}</span>
          ${ageLabel ? `<span class="animal-age">${ageLabel}</span>` : ''}
        </span>
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
      <span class="nesach-row">${nesachImage('wine', nesachim.wine)}<span>יין ${nesachim.wine.label}</span></span>
      <span class="nesach-row">${nesachImage('oil', nesachim.oil)}<span>שמן ${nesachim.oil.label}</span></span>
      <span class="nesach-row">${nesachImage('solet', nesachim.solet)}<span>סולת ${nesachim.solet.label}</span></span>
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

function nesachImage(type: NesachKey, quantity: NesachQuantity): string {
  const fileName = NESACH_IMAGE_FILES[type];
  // Square-root scaling: the picture grows with the amount but softly, so the
  // largest offering reads as bigger without dwarfing the smallest.
  const size = (NESACH_BASE_PX * Math.sqrt(quantity.scale)).toFixed(1);

  return `
    <span class="nesach-art" style="--nesach-size:${size}px">
      <img data-nesach-image src="${publicAsset(`images/${fileName}`)}" alt="" />
    </span>
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
    ? `, יין ${nesachim.wine.label}, שמן ${nesachim.oil.label}, סולת ${nesachim.solet.label}`
    : '';
  const excludedPart = excluded ? ', לא במנין' : '';

  return `${animalDisplayName(animal)}${agePart}, ${KORBAN_TYPE_LABELS[animal.korbanType]}${nesachimPart}${excludedPart}`;
}

// Scale the whole board down until it fits the viewport height, so a TV (which
// cannot scroll) shows the entire day at once. Only shrinks — never enlarges
// past the density-tuned layout — and stays out of the way on narrow/portrait
// screens where natural scrolling is the right behaviour.
function fitToViewport(): void {
  const shell = app.querySelector<HTMLElement>('.site-shell');

  if (!shell) {
    return;
  }

  const enableFit = window.innerWidth >= 900 && window.innerWidth >= window.innerHeight;
  app.classList.toggle('fit-active', enableFit);
  shell.style.transform = '';
  shell.style.width = '';

  if (!enableFit) {
    return;
  }

  // Measure unscaled (transform was just cleared), then find the narrowest
  // pre-scaled layout that still fills the screen width after fitting height.
  const availableWidth = Math.max(320, window.innerWidth - 40);
  const availableHeight = window.innerHeight;
  const maxLayoutWidth = Math.min(12000, availableWidth * 4);

  type FitMeasurement = {
    scale: number;
    visualHeight: number;
  };

  const measure = (layoutWidth: number): FitMeasurement => {
    shell.style.width = `${Math.ceil(layoutWidth)}px`;
    const naturalHeight = shell.scrollHeight;
    const scale = Math.min(1, availableWidth / layoutWidth);

    return {
      scale,
      visualHeight: naturalHeight * scale,
    };
  };

  const naturalFit = measure(availableWidth);

  if (naturalFit.visualHeight <= availableHeight) {
    shell.style.width = '';
    return;
  }

  let low = availableWidth;
  let high = Math.min(maxLayoutWidth, availableWidth / Math.max(0.1, availableHeight / shell.scrollHeight));
  let highFit = measure(high);

  while (highFit.visualHeight > availableHeight && high < maxLayoutWidth) {
    low = high;
    high = Math.min(maxLayoutWidth, high * 1.35);
    highFit = measure(high);
  }

  if (highFit.visualHeight <= availableHeight) {
    for (let index = 0; index < 10; index += 1) {
      const mid = (low + high) / 2;
      const midFit = measure(mid);

      if (midFit.visualHeight <= availableHeight) {
        high = mid;
        highFit = midFit;
      } else {
        low = mid;
      }
    }
  }

  shell.style.width = `${Math.ceil(high)}px`;
  const scale = highFit.visualHeight <= availableHeight
    ? highFit.scale
    : Math.min(highFit.scale, availableHeight / shell.scrollHeight);
  shell.style.transform = scale < 1 ? `scale(${scale})` : '';
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

  return totalTiles <= 6 ? 'roomy' : 'normal';
}
