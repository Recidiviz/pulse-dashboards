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

// Intentionally empty: import from concrete modules under pdfSorter/ (e.g. prepare/preparePdfSafely).
//
// Every file under pdfSorter/ imports its pdfSorter-local dependencies via
// relative paths, not the `~@idaho-th/trpc/...` aliases used elsewhere in
// this repo. This is deliberate: pdfSorterWorker.ts (worker/pdfSorterWorker.ts)
// runs inside a spawned Piscina worker thread via tsx's loader, and tsx's
// alias resolution does not reliably cross the CJS/ESM boundary inside a
// worker thread (verified: `~` imports there threw MODULE_NOT_FOUND even
// though the exact same specifier resolved fine as a top-level import).
// Relative imports need no alias-resolution step, so they work everywhere
// this subtree runs: the main thread, the worker thread, and Vitest. Do not
// convert these back to `~` aliases.
