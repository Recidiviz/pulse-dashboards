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

import { differenceInMonths } from "date-fns";
import { DocumentData } from "firebase/firestore";

import { FeatureGateError } from "../../../../errors";
import { Resident } from "../../../Resident";
import { UsMeFurloughReleaseForm } from "../../Forms/UsMeFurloughReleaseForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsMeFurloughReleaseReferralRecord,
  usMeFurloughReleaseSchema,
} from "./UsMeFurloughReleaseReferralRecord";

export class UsMeFurloughReleaseOpportunity extends OpportunityBase<
  Resident,
  UsMeFurloughReleaseReferralRecord
> {
  readonly hideUnknownCaseNoteDates = true;

  form: UsMeFurloughReleaseForm;

  readonly portionServedRequirement = ["1/2"];

  criteriaFormatters = {
    monthsRemaining: ({ eligibleDate }: Record<string, any>) => {
      return (differenceInMonths(eligibleDate, new Date()) + 36).toString();
    },
  };

  constructor(resident: Resident, record: DocumentData) {
    const parsedRecord = usMeFurloughReleaseSchema.parse(record);

    const {
      eligibleCriteria: { usMeServedHalfOfSentence },
    } = record;
    if (!usMeServedHalfOfSentence) {
      throw new FeatureGateError(
        "UsMeFurloughReleaseOpportunity doesn't yet support Almost Eligible",
      );
    }

    super(resident, "usMeFurloughRelease", resident.rootStore, parsedRecord);

    this.form = new UsMeFurloughReleaseForm(this, resident.rootStore);
  }
}
