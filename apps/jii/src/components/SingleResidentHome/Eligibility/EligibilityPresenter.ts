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

import { ascending } from "d3-array";

import {
  EligibilityModuleConfig,
  IncarcerationOpportunityId,
} from "../../../configs/types";
import { eligibilityStatusEnum } from "../../../models/EligibilityReport/types";
import { OpportunityData } from "../../SingleResidentHydrator/context";

function getStatusSortOrder(d: OpportunityData) {
  // values are assumed to be sorted by priority in the enum
  return eligibilityStatusEnum.options.indexOf(
    d.eligibilityReport.status.value,
  );
}

export class EligibilityPresenter {
  constructor(
    private opportunityData: Array<OpportunityData>,
    private eligibilityConfig: EligibilityModuleConfig,
  ) {}

  get opportunities() {
    return this.opportunityData
      .filter((o) => o.eligibilityReport.status.value !== "NA")
      .sort((a, b) => ascending(getStatusSortOrder(a), getStatusSortOrder(b)));
  }

  private isOpportunityEnabled(id: IncarcerationOpportunityId) {
    return !!this.opportunities.find((o) => o.opportunityId === id);
  }

  get comparison() {
    // for now we are not worried about supporting multiple comparisons,
    // because there is no use case for it
    const comparisonConfig = this.eligibilityConfig.comparisons?.[0];
    if (
      comparisonConfig &&
      this.isOpportunityEnabled(comparisonConfig.opportunities[0]) &&
      this.isOpportunityEnabled(comparisonConfig.opportunities[1])
    ) {
      return comparisonConfig;
    }

    return;
  }
}
