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

import { seed } from "./seed";
import { getPrismaClientForStateCode } from "./utils";

// Local `prisma-seed` entry point. It lives apart from seed.ts because the
// seed-db job bundles seed.ts into its own main.js, where a main-module check
// inside seed.ts is true and starts a second seed beside the job's own call.
seed()
  .catch((e) => {
    console.error("Housing Providers Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => getPrismaClientForStateCode("US_ID").$disconnect());
