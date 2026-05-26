import { HDate, months } from '@hebcal/core';
import { describe, expect, it } from 'vitest';
import { calculateKorbanot } from './korbanot';

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
    const date = findDate((hdate) => hdate.getDate() === 1 && hdate.getMonth() !== months.TISHREI && hdate.getDay() !== 6);

    expect(calculateKorbanot(date).total).toBe(13);
  });

  it('counts Rosh Chodesh on Shabbat', () => {
    const date = findDate((hdate) => hdate.getDate() === 1 && hdate.getMonth() !== months.TISHREI && hdate.getDay() === 6);

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

  it('counts Shemini Atzeret', () => {
    const date = findDate(
      (hdate) => hdate.getMonth() === months.TISHREI && hdate.getDate() === 22 && hdate.getDay() !== 6,
    );

    expect(calculateKorbanot(date).total).toBe(12);
  });
});

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
