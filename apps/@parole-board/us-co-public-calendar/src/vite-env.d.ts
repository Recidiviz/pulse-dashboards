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

interface ViteTypeOptions {
  // Makes ImportMetaEnv strict, so an unknown key fails to typecheck.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  /** The Modules server's base URL, the same variable the staff app reads. */
  readonly VITE_MODULE_BACKEND_URL?: string;
  /** Segment's write key. Without it the page sends no page counts. */
  readonly VITE_US_CO_PUBLIC_CALENDAR_SEGMENT_WRITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
