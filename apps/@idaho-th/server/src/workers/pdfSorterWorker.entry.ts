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

// Thin build entry point. Kept under the app's own src/ (like src/sentry/index.ts)
// so esbuild's additionalEntryPoints output stays flat alongside main.js instead
// of preserving a libs/ path prefix. The actual worker logic lives in the
// library so it stays unit-testable there.
export { default } from "~@idaho-th/trpc/pdfSorter/worker/pdfSorterWorker";
