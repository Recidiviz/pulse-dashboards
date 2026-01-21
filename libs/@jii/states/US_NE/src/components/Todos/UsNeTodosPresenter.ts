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

import { OpportunityData } from "~@jii/data";
import { ResidentRecord, UsNeGoodTimeRestorationRecord } from "~datatypes";

import { UsNeCopy } from "../../configs/copy";

export class UsNeTodosPresenter {
  constructor(
    private readonly resident: ResidentRecord,
    private readonly opportunities: OpportunityData[],
  ) {}

  get residentMetadata() {
    const { metadata } = this.resident;

    if (metadata.stateCode !== "US_NE") {
      throw new Error(
        `Unexpected state code for UsNeTodosPresenter ${metadata.stateCode}`,
      );
    }

    return metadata;
  }

  /**
   * Determines if the resident should see the reentry checklist.
   * Only show if the resident is not serving a life sentence or a sentence for more than 75 years.
   */
  get shouldShowReentryChecklist(): boolean {
    const years = this.residentMetadata.maximumSentenceYears;
    if (years === null) {
      return false;
    }
    return years <= 75;
  }

  /**
   * Which Good Time Restoration todo should be shown? Null if none should be shown.
   */
  get goodTimeRestorationStatus():
    | keyof UsNeCopy["home"]["todos"]["goodTimeRestoration"]
    | null {
    type GoodTimeOpportunity = OpportunityData & {
      opportunityRecord: UsNeGoodTimeRestorationRecord["output"];
    };

    if (this.residentMetadata.isInGoodTimeRestorationAlertPilot !== true) {
      return null;
    }

    const goodTimeOpportunity = this.opportunities.find(
      // This type guard only asserts what OpportunityData guarantees (that opportunityRecord's
      // type matches the opportunityId) but TypeScript is unable to deduce on its own.
      (opp): opp is GoodTimeOpportunity =>
        opp.opportunityId === "usNeGoodTimeRestoration",
    );

    if (!goodTimeOpportunity) {
      return null;
    }

    const {
      isEligible,
      isAlmostEligible,
      metadata: { numberOfDaysEligibleFor },
    } = goodTimeOpportunity.opportunityRecord;

    if (numberOfDaysEligibleFor > 30) {
      return "eligibleForMoreThan30Days";
    } else if (isEligible) {
      return "eligible";
    } else if (isAlmostEligible) {
      return "almostEligible";
    }
    return null;
  }

  get shouldShowTodos(): boolean {
    return this.shouldShowReentryChecklist || !!this.goodTimeRestorationStatus;
  }
}
