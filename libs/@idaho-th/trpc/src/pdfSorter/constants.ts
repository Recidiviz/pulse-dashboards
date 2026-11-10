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

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const RENDER_DPI = 200;
export const IMAGE_COMPRESSION_JPEG_QUALITY = 80;
export const IMAGE_COMPRESSION_DPI_TRIGGER_MULTIPLIER = 1.15;
export const MAX_OCR_WORKERS = 4;
export const MAX_PDF_SORTER_POOL_THREADS = intFromEnv(
  "IDAHO_TH_PDF_SORTER_POOL_THREADS",
  2,
);

export const PDF_SORTER_JOB_TIMEOUT_MS = intFromEnv(
  "IDAHO_TH_PDF_SORTER_JOB_TIMEOUT_MS",
  30_000,
);

export const PDF_SORTER_QUEUE_MAX = intFromEnv(
  "IDAHO_TH_PDF_SORTER_QUEUE_MAX",
  20,
);

export const PDF_SORTER_QUEUE_WAIT_TIMEOUT_MS = intFromEnv(
  "IDAHO_TH_PDF_SORTER_QUEUE_WAIT_TIMEOUT_MS",
  60_000,
);

export const PDF_SORTER_MEMORY_BUDGET_MB = intFromEnv(
  "IDAHO_TH_PDF_SORTER_MEMORY_BUDGET_MB",
  768,
);

export const PDF_SORTER_IDLE_TIMEOUT_MS = intFromEnv(
  "IDAHO_TH_PDF_SORTER_IDLE_TIMEOUT_MS",
  60_000,
);

export const STRIP_STRATEGIES: ReadonlyArray<readonly [boolean, number]> = [
  [false, 0.9],
  [true, 0.9],
  [false, 0.85],
  [true, 0.85],
  [false, 0.75],
  [true, 0.75],
  [false, 0.8],
  [true, 0.8],
];

export const FALLBACK_STRATEGY = "FALLBACK (physical order)";
export const VERIFICATION_STRIP_RATIO = 0.8;
export const DEFAULT_TOTAL_PAGES = 4;

export const MAX_ORDERING_PAGE_COUNT = 5;

export const PDF_OUTPUT_MODE = {
  PER_PAGE: "perPage",
  COMBINED: "combined",
  BOTH: "both",
} as const;

export type PdfOutputMode =
  (typeof PDF_OUTPUT_MODE)[keyof typeof PDF_OUTPUT_MODE];

export const PDF_OUTPUT_MODE_ZOD_VALUES = Object.values(PDF_OUTPUT_MODE) as [
  PdfOutputMode,
  PdfOutputMode,
  PdfOutputMode,
];
