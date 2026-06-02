# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small Hebrew, right-to-left static site (`dir="rtl"`, `lang="he"`) that shows how many fixed communal animal offerings (קרבנות ציבור) were brought in the Temple on any given Hebrew date. All user-facing copy is in Hebrew. There is no backend — it's a Vite + TypeScript single-page app deployed to GitHub Pages.

## Commands

```bash
npm run dev        # Vite dev server on 127.0.0.1
npm test           # vitest run (single pass, no watch)
npm run build      # tsc typecheck, then vite build
npm run preview    # preview a production build
```

Run a single test by name: `npx vitest run -t "counts Shabbat"`.

The CI workflow (`.github/workflows/deploy.yml`) runs `npm test` then `npm run build` with `GITHUB_PAGES=true` on every push to `main`, deploying `dist/` to GitHub Pages. The `GITHUB_PAGES` env var switches Vite's `base` to `/korban-yomi/` so asset paths resolve under the Pages subpath — always reference public assets through `import.meta.env.BASE_URL` (see `publicAsset()` in `main.ts`), never with a bare `/`.

## Architecture

Two source files do the real work:

- **`src/korbanot.ts`** — pure domain logic, fully unit-tested, no DOM. `calculateKorbanot(hdate)` takes a `@hebcal/core` `HDate` and returns a `KorbanDay`: the offerings brought that day, grouped into rows (`tamid` / `musaf` / `special`), plus `excludedRows`, `totals`, and the grand `total`. The calendar rules (Shabbat, Rosh Chodesh, the festivals, Sukkot's descending bull count, etc.) live here as a sequence of `if` checks appending rows. Date math, Hebrew month/number formatting, and nesachim resolution are also here.
- **`src/main.ts`** — all DOM/UI. Holds the only mutable state (`selectedDate`, `dateDrawerOpen`), re-renders the whole `#app` innerHTML on every change, then re-attaches event listeners. No framework, no virtual DOM — `render()` is the single source of truth and is called after every state mutation.

### Key domain concepts (don't break these invariants)

- **The `total` counts only animals that are offered on the altar.** Offerings that are mentioned but not counted — Korban Pesach (14 Nisan, count varies per group) and the Yom Kippur Azazel goat (sent away, not offered) — go in `excludedRows` and must NOT affect `totals`/`total`. Tests enforce this.
- **Nesachim (libations) are display-only and never add to the animal count.** `resolveNesachim()` returns standard amounts by animal type for `olah`/`shelamim`, `null` for `chatas`, and respects explicit per-line overrides (`nesachim: null` to suppress, or a custom object like the Omer lamb).
- Each `KorbanAnimalLine` carries an `ageCategory` (e.g. Shemini Atzeret's bull is `mature`/par stam, festival musaf bulls are `young`) that drives both the displayed label and which image is shown.

### Adding or changing a day's offerings

Edit the relevant `if` block in `calculateKorbanot`, building rows with the `createRow` helper and lines with the `olah` / `chatas` / `shelamim` / `line` helpers (these set sensible nesachim defaults). `createRow` derives `counts` automatically. Then add/adjust an expected-total test in `src/korbanot.test.ts` — its `findDate(predicate)` helper scans Hebrew years 5780–5820 to find a date matching a condition (e.g. a weekday Rosh Chodesh), so assert against `.total` rather than hardcoding dates.

### Assets

Animal images live in `public/images/` (`bull.png`, `young-bull.png`, `ram.png`, `lamb.png`, `goat.png`). If an image is missing, `main.ts` wires an `error` handler that drops the `<img>` and falls back to a single-letter glyph — so a missing image degrades gracefully rather than breaking the layout.

## Test environment

Vitest runs in the `node` environment (configured in `vite.config.ts`) because all tested logic is pure and DOM-free. `globals` are enabled via tsconfig types, but tests import `describe`/`it`/`expect` explicitly.
