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
  usMiAddInPersonSecurityClassificationCommitteeReviewV2Record,
  usMiAddInPersonSecurityClassificationCommitteeReviewV2Schema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMiSCCReviewV2Form } from "../../Forms/UsMiSCCReviewV2Form";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab, OpportunityTabGroup } from "../../types";

export class usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity extends OpportunityBase<
  Resident,
  usMiAddInPersonSecurityClassificationCommitteeReviewV2Record["output"]
> {
  form: UsMiSCCReviewV2Form;

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
      resident.rootStore,
      usMiAddInPersonSecurityClassificationCommitteeReviewV2Schema.parse(
        record,
      ),
    );

    this.form = new UsMiSCCReviewV2Form(this, resident.rootStore);
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    if (this.isSubmitted) return this.submittedTabTitle;
    if (this.denied) return this.deniedTabTitle;
    switch (this.record.metadata.tabName) {
      case "OVERDUE":
        return "Overdue";
      case "DUE":
      case "UPCOMING":
        return "Due";
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
