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

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",
  datasource: {
    // Read the env var directly instead of using env() from prisma/config,
    // which throws when it is unset. prisma generate runs without a
    // DATABASE_URL in CI and in the Docker builds.
    url: process.env["US_TN_RECLASSIFICATION__US_TN_DATABASE_URL"],
  },
});
