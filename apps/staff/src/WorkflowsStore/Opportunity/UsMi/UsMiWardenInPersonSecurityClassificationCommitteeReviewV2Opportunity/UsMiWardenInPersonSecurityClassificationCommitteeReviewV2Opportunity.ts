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
import { DocumentData } from "firebase/firestore";

import {
  usMiWardenInPersonSecurityClassificationCommitteeReviewV2Record,
  usMiWardenInPersonSecurityClassificationCommitteeReviewV2Schema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMiSCCReviewForm } from "../../Forms/UsMiSCCReviewForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab, OpportunityTabGroup } from "../../types";

export class usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity extends OpportunityBase<
  Resident,
  usMiWardenInPersonSecurityClassificationCommitteeReviewV2Record["output"]
> {
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

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
      resident.rootStore,
      usMiWardenInPersonSecurityClassificationCommitteeReviewV2Schema.parse(
        record,
      ),
    );

    this.form = new UsMiSCCReviewForm(this, resident.rootStore);
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.denied) return this.deniedTabTitle;
    switch (this.record.metadata.tabName) {
      case "OVERDUE":
        return "Overdue";
      case "DUE":
        return "Due";
      case "UPCOMING":
        return "Upcoming";
      case "NOT_DUE":
        return "Not Due";
      default:
        return "Other";
    }
  }
  eligibilityStatusLabel(_?: boolean) {
    return this.tabTitle();
  }
}
