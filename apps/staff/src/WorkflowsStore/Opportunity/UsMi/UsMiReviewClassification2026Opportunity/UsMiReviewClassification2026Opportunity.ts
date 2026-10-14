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

import {
  UsMiReviewClassificationRecord,
  usMiReviewClassificationSchema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMiReviewClassificationForm } from "../../Forms/UsMiReviewClassification2026Form";
import { OpportunityBase } from "../../OpportunityBase";

export class UsMiReviewClassification2026Opportunity extends OpportunityBase<
  Resident,
  UsMiReviewClassificationRecord["output"]
> {
  form: UsMiReviewClassificationForm;
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMiAnnualClassificationReview2026Policy",
      resident.rootStore,
      usMiReviewClassificationSchema.parse(record),
    );
    this.form = new UsMiReviewClassificationForm(this, resident.rootStore);
  }
}
