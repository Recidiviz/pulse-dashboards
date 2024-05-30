// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { addDays, differenceInMonths } from "date-fns";

import {
  usMiWardenInPersonSecurityClassificationCommitteeReviewRecord,
  usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMiSCCReviewForm } from "../../Forms/UsMiSCCReviewForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab, OpportunityTabGroup } from "../../types";

export class usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity extends OpportunityBase<
  Resident,
  usMiWardenInPersonSecurityClassificationCommitteeReviewRecord["output"]
> {
  resident: Resident;
  form: UsMiSCCReviewForm;

  criteriaFormatters = {
    monthsInRH: ({ record }: Record<string, any>) => {
      const now = new Date();
      const startDate = addDays(
        now,
        -record.metadata.daysInCollapsedSolitarySession,
      );
      return differenceInMonths(now, startDate).toString();
    },
  };

  constructor(resident: Resident) {
    super(
      resident,
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
      resident.rootStore,
      usMiWardenInPersonSecurityClassificationCommitteeReviewSchema.parse,
    );

    this.resident = resident;
    this.form = new UsMiSCCReviewForm(this, resident.rootStore);
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }

  get almostEligibleStatusMessage(): string | undefined {
    return "Upcoming";
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (!this.record) return "Other";
    if (this.denied) return this.deniedTabTitle;
    if (this.record.isOverdue) return "Overdue";
    if (this.almostEligible) return "Upcoming";
    return "Due now";
  }
}
