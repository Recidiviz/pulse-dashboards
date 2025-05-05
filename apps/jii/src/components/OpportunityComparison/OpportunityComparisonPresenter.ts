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

import { EligibilityModuleConfig } from "../../configs/types";
import { opportunitySlugToIdOrThrow } from "../../configs/US_ME/residents/utils";
import { IdTuple } from "./types";
import { findMatchingComparisonConfig } from "./utils";

export class OpportunityComparisonPresenter {
  constructor(
    public opportunitySlugs: [string, string],
    private eligibilityConfig: EligibilityModuleConfig,
  ) {}

  private get opportunityIds() {
    return <IdTuple>(
      this.opportunitySlugs.map((s) =>
        opportunitySlugToIdOrThrow(s, this.eligibilityConfig),
      )
    );
  }

  private get comparisonConfig() {
    const match = findMatchingComparisonConfig(
      this.eligibilityConfig,
      this.opportunityIds,
    );

    if (!match) {
      throw new Error(
        `No comparison page found for ${this.opportunitySlugs.join(" and ")}`,
      );
    }

    return match;
  }

  private get tableHeadings() {
    // important that these follow the same order as they are used in the config,
    // because the table contents are ordered
    return this.comparisonConfig.opportunities.map((id) => {
      const config = this.eligibilityConfig.incarcerationOpportunities[id];
      // if we got to this point the config should never be undefined,
      // since it was checked in this.opportunityIds
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return config!.shortName;
    });
  }

  get pageContents() {
    return {
      ...this.comparisonConfig.fullPage,
      tableHeadings: this.tableHeadings,
    };
  }
}
