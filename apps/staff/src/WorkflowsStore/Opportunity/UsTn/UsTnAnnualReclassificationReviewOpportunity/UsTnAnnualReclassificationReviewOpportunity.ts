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

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { formatDate } from "../../../../utils/formatStrings";
import { Resident } from "../../../Resident";
import { UsTnReclassificationReviewForm } from "../../Forms/UsTnReclassificationReviewForm";
import { OpportunityBase } from "../../OpportunityBase";
import { UsTnSharedReclassificationDraftData } from "../UsTnSharedCriteria";
import {
  UsTnAnnualReclassificationReviewReferralRecord,
  usTnAnnualReclassificationReviewSchema,
} from "./UsTnAnnualReclassificationReviewReferralRecord";

export class UsTnAnnualReclassificationReviewOpportunity extends OpportunityBase<
  Resident,
  UsTnAnnualReclassificationReviewReferralRecord,
  OpportunityUpdateWithForm<UsTnSharedReclassificationDraftData>
> {
  // TODO(#6707) move to configuration
  readonly caseNotesTitle = "Relevant Information For Classification";

  form: UsTnReclassificationReviewForm;

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usTnAnnualReclassification",
      resident.rootStore,
      usTnAnnualReclassificationReviewSchema.parse(record),
    );

    this.form = new UsTnReclassificationReviewForm(this, resident.rootStore);
  }

  get eligibilityDate() {
    return this.record?.formReclassificationDueDate;
  }

  showEligibilityStatus(): boolean {
    return true;
  }

  get eligibleStatusMessage() {
    if (this.eligibilityDate) {
      return `Due ${formatDate(this.eligibilityDate)}`;
    }
    return "Not Yet Classified";
  }
}
