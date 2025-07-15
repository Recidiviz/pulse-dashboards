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
import { Resident } from "../../../Resident";
import { UsTnReclassificationReviewForm } from "../../Forms/UsTnReclassificationReviewForm";
import { OpportunityBase } from "../../OpportunityBase";
import { NO_RELEASE_DATE_TEXT } from "../UsTnAnnualReclassificationReviewOpportunity";
import { UsTnSharedReclassificationDraftData } from "../UsTnSharedCriteria";
import {
  UsTnInitialClassificationReferralRecord,
  usTnInitialClassificationSchema,
} from "./UsTnInitialClassificationReferralRecord";

export class UsTnInitialClassificationOpportunity extends OpportunityBase<
  Resident,
  UsTnInitialClassificationReferralRecord,
  OpportunityUpdateWithForm<UsTnSharedReclassificationDraftData>
> {
  form: UsTnReclassificationReviewForm;

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usTnInitialClassification",
      resident.rootStore,
      usTnInitialClassificationSchema.parse(record),
    );

    this.form = new UsTnReclassificationReviewForm(this, resident.rootStore);
  }

  get previewBannerText() {
    if (!this.person.releaseDate) {
      return NO_RELEASE_DATE_TEXT;
    }
  }
}
