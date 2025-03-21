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

import { DocumentData } from "firebase/firestore";

import {
  usMiSecurityClassificationCommitteeReviewRecord,
  usMiSecurityClassificationCommitteeReviewSchema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMiSCCReviewForm } from "../../Forms/UsMiSCCReviewForm";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab, OpportunityTabGroup } from "../../types";

export class usMiSecurityClassificationCommitteeReviewOpportunity extends OpportunityBase<
  Resident,
  usMiSecurityClassificationCommitteeReviewRecord["output"]
> {
  form: UsMiSCCReviewForm;

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMiSecurityClassificationCommitteeReview",
      resident.rootStore,
      usMiSecurityClassificationCommitteeReviewSchema.parse(record),
    );

    this.form = new UsMiSCCReviewForm(this, resident.rootStore);
  }

  get almostEligibleStatusMessage(): string | undefined {
    if (!this.almostEligible) return;
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
