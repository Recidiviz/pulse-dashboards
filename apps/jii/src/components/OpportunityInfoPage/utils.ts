// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { OpportunityConfig } from "../../configs/types";

export function findPageConfig(
  opportunityConfig: OpportunityConfig,
  pageSlug: string,
) {
  const config = [
    opportunityConfig.requirements,
    ...opportunityConfig.sections,
  ].find((s) => s.fullPage?.urlSlug === pageSlug);

  // in practice we don't really expect this to happen, mostly for type safety
  if (!config || !config.fullPage) {
    throw new Error(`No contents found for page ${pageSlug}`);
  }
  return config.fullPage;
}
