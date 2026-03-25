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

import type { IntakeTenantOverride } from "../types";
import { US_NE_OVERRIDES } from "./US_NE";
import { US_UT_OVERRIDES } from "./US_UT";

export const INTAKE_TENANT_OVERRIDES: Record<string, IntakeTenantOverride> = {
  US_UT: US_UT_OVERRIDES,
  US_NE: US_NE_OVERRIDES,
};
