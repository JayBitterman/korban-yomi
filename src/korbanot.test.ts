import { HDate, months } from '@hebcal/core';
import { describe, expect, it } from 'vitest';
import { calculateKorbanot, resolveNesachim, type KorbanAnimalLine } from './korbanot';

type KorbanDayView = ReturnType<typeof calculateKorbanot>;
type KorbanRowView = KorbanDayView['rows'][number];

describe('calculateKorbanot', () => {
  it('counts a regular weekday', () => {
    const date = findDate((hdate) => isRegular(hdate) && hdate.getDay() !== 6);

    expect(calculateKorbanot(date).total).toBe(2);
  });

  it('counts Shabbat', () => {
    const date = findDate((hdate) => isRegular(hdate) && hdate.getDay() === 6);

    expect(calculateKorbanot(date).total).toBe(4);
  });

  it('counts Rosh Chodesh on a weekday', () => {
    const date = findDate(
      (hdate) => hdate.getDate() === 1 && hdate.getMonth() !== months.TISHREI && hdate.getDay() !== 6,
    );

    expect(calculateKorbanot(date).total).toBe(13);
  });

  it('counts Rosh Chodesh on Shabbat', () => {
    const date = findDate(
      (hdate) => hdate.getDate() === 1 && hdate.getMonth() !== months.TISHREI && hdate.getDay() === 6,
    );

    expect(calculateKorbanot(date).total).toBe(15);
  });

  it('counts Pesach and the omer day', () => {
    const pesach = findDate(
      (hdate) => hdate.getMonth() === months.NISAN && hdate.getDate() === 15 && hdate.getDay() !== 6,
    );
    const omer = findDate(
      (hdate) => hdate.getMonth() === months.NISAN && hdate.getDate() === 16 && hdate.getDay() !== 6,
    );

    expect(calculateKorbanot(pesach).total).toBe(13);
    expect(calculateKorbanot(omer).total).toBe(14);
  });

  it('counts Shavuot', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.SIVAN && hdate.getDate() === 6 && hdate.getDay() !== 6,
    );

    expect(calculateKorbanot(date).total).toBe(26);
  });

  it('counts Rosh Hashanah', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.TISHREI && hdate.getDate() === 1 && hdate.getDay() !== 6,
    );

    expect(calculateKorbanot(date).total).toBe(23);
  });

  it('counts Yom Kippur with the fixed avodat hayom additions', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.TISHREI && hdate.getDate() === 10 && hdate.getDay() !== 6,
    );

    expect(calculateKorbanot(date).total).toBe(15);
  });

  it('counts Sukkot day one and day seven', () => {
    const firstDay = findDate(
      (hdate) => hdate.getMonth() === months.TISHREI && hdate.getDate() === 15 && hdate.getDay() !== 6,
    );
    const seventhDay = findDate(
      (hdate) => hdate.getMonth() === months.TISHREI && hdate.getDate() === 21 && hdate.getDay() !== 6,
    );

    expect(calculateKorbanot(firstDay).total).toBe(32);
    expect(calculateKorbanot(seventhDay).total).toBe(26);
  });

  it('counts Shemini Atzeret and treats its bull as par stam', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.TISHREI && hdate.getDate() === 22 && hdate.getDay() !== 6,
    );
    const day = calculateKorbanot(date);
    const bull = findAnimal(findRow(day, 'shemini-atzeret'), (animal) => animal.animal === 'bulls');

    expect(day.total).toBe(12);
    expect(bull.ageCategory).toBe('mature');
  });

  it('uses standard nesachim by animal type for olah and shelamim', () => {
    const date = findDate(
      (hdate) => hdate.getDate() === 1 && hdate.getMonth() !== months.TISHREI && hdate.getDay() !== 6,
    );
    const roshChodesh = findRow(calculateKorbanot(date), 'rosh-chodesh-musaf');

    expect(resolveNesachim(findAnimal(roshChodesh, (animal) => animal.animal === 'bulls'))).toEqual({
      solet: { label: 'שלושה עשרונים', scale: 3 },
      oil: { label: 'חצי ההין', scale: 2 },
      wine: { label: 'חצי ההין', scale: 2 },
    });
    expect(resolveNesachim(findAnimal(roshChodesh, (animal) => animal.animal === 'rams'))).toEqual({
      solet: { label: 'שני עשרונים', scale: 2 },
      oil: { label: 'שלישית ההין', scale: 4 / 3 },
      wine: { label: 'שלישית ההין', scale: 4 / 3 },
    });
    expect(resolveNesachim(findAnimal(roshChodesh, (animal) => animal.animal === 'lambs'))).toEqual({
      solet: { label: 'עשרון', scale: 1 },
      oil: { label: 'רביעית ההין', scale: 1 },
      wine: { label: 'רביעית ההין', scale: 1 },
    });
    expect(
      resolveNesachim({
        animal: 'goats',
        ageCategory: 'standard',
        korbanType: 'shelamim',
        quantity: 1,
      }),
    ).toEqual({
      solet: { label: 'עשרון', scale: 1 },
      oil: { label: 'רביעית ההין', scale: 1 },
      wine: { label: 'רביעית ההין', scale: 1 },
    });
  });

  it('uses the explicit Omer nesachim override', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.NISAN && hdate.getDate() === 16 && hdate.getDay() !== 6,
    );
    const omer = findAnimal(findRow(calculateKorbanot(date), 'omer'), (animal) => animal.animal === 'lambs');

    expect(resolveNesachim(omer)).toEqual({
      solet: { label: 'שני עשרונים', scale: 2 },
      oil: { label: 'שלישית ההין', scale: 4 / 3 },
      wine: { label: 'רביעית ההין', scale: 1 },
    });
  });

  it('does not resolve nesachim for current-scope chataot', () => {
    const date = findDate(
      (hdate) => hdate.getDate() === 1 && hdate.getMonth() !== months.TISHREI && hdate.getDay() !== 6,
    );
    const chataot = calculateKorbanot(date).rows.flatMap((row) =>
      row.animals.filter((animal) => animal.korbanType === 'chatas'),
    );

    expect(chataot.length).toBeGreaterThan(0);
    expect(chataot.map(resolveNesachim)).toEqual(chataot.map(() => null));
  });

  it('shows Korban Pesach as excluded on 14 Nisan without changing totals', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.NISAN && hdate.getDate() === 14 && hdate.getDay() !== 6,
    );
    const day = calculateKorbanot(date);

    expect(day.total).toBe(2);
    expect(day.excludedRows).toHaveLength(1);
    expect(day.excludedRows[0].id).toBe('korban-pesach');
    expect(day.excludedRows[0].animals[0].korbanType).toBe('pesach');
  });

  it('shows the Yom Kippur Azazel goat as excluded while total remains fixed', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.TISHREI && hdate.getDate() === 10 && hdate.getDay() !== 6,
    );
    const day = calculateKorbanot(date);

    expect(day.total).toBe(15);
    expect(day.excludedRows).toHaveLength(1);
    expect(day.excludedRows[0].id).toBe('yom-kippur-azazel');
    expect(day.excludedRows[0].animals[0].korbanType).toBe('azazel');
  });
});

function findRow(day: KorbanDayView, id: string): KorbanRowView {
  const row = day.rows.find((candidate) => candidate.id === id);

  if (!row) {
    throw new Error(`Missing row ${id}`);
  }

  return row;
}

function findAnimal(
  row: KorbanRowView,
  predicate: (animal: KorbanAnimalLine) => boolean,
): KorbanAnimalLine {
  const animal = row.animals.find(predicate);

  if (!animal) {
    throw new Error(`Missing animal in row ${row.id}`);
  }

  return animal;
}

function findDate(predicate: (hdate: HDate) => boolean): HDate {
  for (let year = 5780; year <= 5820; year += 1) {
    for (let abs = new HDate(1, months.TISHREI, year).abs(); abs <= new HDate(29, months.ELUL, year).abs(); abs += 1) {
      const hdate = new HDate(abs);

      if (predicate(hdate)) {
        return hdate;
      }
    }
  }

  throw new Error('No matching date found');
}

function isRegular(hdate: HDate): boolean {
  const month = hdate.getMonth();
  const day = hdate.getDate();

  if (day === 1 || day === 30) {
    return false;
  }

  if (month === months.NISAN && day >= 14 && day <= 21) {
    return false;
  }

  if (month === months.SIVAN && day === 6) {
    return false;
  }

  if (month === months.TISHREI && (day === 1 || day === 10 || (day >= 15 && day <= 22))) {
    return false;
  }

  return true;
}
