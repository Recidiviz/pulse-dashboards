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

import { DocumentData } from "firebase/firestore";

import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";

export abstract class UsTn2026ClassificationBase<
  ReferralRecord extends DocumentData,
> extends OpportunityBase<Resident, ReferralRecord> {
  // JII should remain in "pending" until the form is abandoned
  // or they are reassessed, which will invalidate the existing
  // record by changing the opportunityId
  get isCompleted() {
    return false;
  }

  // Use opportunityId to segment updates by the last time
  // the person was reassessed. This will invalidate any existing
  // updates so the user gets a fresh, unedited form the next
  // time this person comes up for reassessment.
  get opportunityId() {
    const { metadata } = this.person;

    if (metadata.stateCode !== "US_TN") return undefined;

    const { latestClassificationDate } = metadata;

    if (!latestClassificationDate) return "INITIAL";

    const year = latestClassificationDate.getFullYear();
    // Month is 0-indexed because of Java
    const month = (latestClassificationDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const day = latestClassificationDate.getDay().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}
