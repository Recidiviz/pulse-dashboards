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

import path from "path";
import { fileURLToPath } from "url";

// Paths are rooted at the project root (libs/search-benchmark),
// not src/, so they land next to project.json regardless of which script runs.
const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const AUTH_STATE_PATH = path.join(PROJECT_ROOT, "auth-state.json");
export const RESULTS_DIR = path.join(PROJECT_ROOT, "results");
export const DEFAULT_BASE_URL = "https://dashboard-staging.recidiviz.org";
