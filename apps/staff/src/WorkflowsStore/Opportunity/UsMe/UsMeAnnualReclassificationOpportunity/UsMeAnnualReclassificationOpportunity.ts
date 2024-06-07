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

import {
  UsMeAnnualReclassificationRecord,
  usMeAnnualReclassificationSchema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMeAnnualReclassificationReviewForm } from "../../Forms/UsMeAnnualReclassificationReviewForm";
import { OpportunityBase } from "../../OpportunityBase";

export class UsMeAnnualReclassificationOpportunity extends OpportunityBase<
  Resident,
  UsMeAnnualReclassificationRecord["output"]
> {
  resident: Resident;

  form: UsMeAnnualReclassificationReviewForm;

  constructor(resident: Resident) {
    super(
      resident,
      "usMeReclassificationReview",
      resident.rootStore,
      usMeAnnualReclassificationSchema.parse,
    );

    this.resident = resident;

    this.form = new UsMeAnnualReclassificationReviewForm(
      this,
      this.resident.rootStore,
    );
  }

  get almostEligible(): boolean {
    return Object.keys(this.record?.ineligibleCriteria ?? {}).length > 0;
  }
}
