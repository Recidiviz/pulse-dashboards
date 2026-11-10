// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import type { MuPdfModule } from "./mupdf.types";

// Lazy mupdf loader. WORKER-SIDE ONLY — the pdfSorter Piscina worker
// (worker/pdfSorterWorker.ts) calls loadMupdf() once per worker thread
// before handling any task; the synchronous helpers throughout pdfSorter/pdf/*
// then use getMupdf() per call. Lazy rather than a top-level await import so
// merely importing a module that touches mupdf (e.g. from main-thread code,
// by mistake) doesn't silently load a second copy of mupdf's WASM heap
// (up to ~512 MB) outside the worker — getMupdf() throws instead.
let mupdfModule: MuPdfModule | null = null;

export async function loadMupdf(): Promise<MuPdfModule> {
  if (!mupdfModule) {
    // mupdf is ESM with top-level await; must use import(), not require().
    // @ts-expect-error mupdf does not publish TypeScript declarations.
    const loaded = (await import("mupdf")) as {
      default: MuPdfModule;
    } & MuPdfModule;
    mupdfModule = loaded.default ?? loaded;
  }
  return mupdfModule;
}

export function getMupdf(): MuPdfModule {
  if (!mupdfModule) {
    throw new Error(
      "mupdf is not loaded — call loadMupdf() first (the pdfSorter worker's " +
        "boot path does this; main-thread code must run inside the worker instead)",
    );
  }
  return mupdfModule;
}
