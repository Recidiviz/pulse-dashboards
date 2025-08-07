// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { DocumentData } from "@google-cloud/firestore";

import { OpportunityType } from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMoWorkReleaseForm } from "../../Forms/UsMoWorkReleaseForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsMoWorkReleaseReferralRecord,
  usMoWorkReleaseSchema,
} from "./UsMoWorkReleaseReferralRecord";

export class UsMoWorkReleaseOpportunity extends OpportunityBase<
  Resident,
  UsMoWorkReleaseReferralRecord
> {
  constructor(
    resident: Resident,
    record: DocumentData,
    opportunityType: OpportunityType,
  ) {
    super(
      resident,
      opportunityType,
      resident.rootStore,
      usMoWorkReleaseSchema.parse(record),
    );

    this.form = new UsMoWorkReleaseForm(this, resident.rootStore);
  }
}
