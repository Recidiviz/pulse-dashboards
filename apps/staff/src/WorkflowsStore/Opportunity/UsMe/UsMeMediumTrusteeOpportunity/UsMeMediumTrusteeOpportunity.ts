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

import { UsMeMediumTrusteeRecord, usMeMediumTrusteeSchema } from "~datatypes";

import { Resident } from "../../../Resident";
import { UsMeMediumTrusteeForm } from "../../Forms/UsMeMediumTrusteeForm";
import { UsMeExternalSnoozeOpportunityBase } from "../UsMeExternalSnoozeOpportunityBase/UsMeExternalSnoozeOpportunityBase";

export class UsMeMediumTrusteeOpportunity extends UsMeExternalSnoozeOpportunityBase<
  Resident,
  UsMeMediumTrusteeRecord["output"]
> {
  form: UsMeMediumTrusteeForm;

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usMeMediumTrustee",
      resident.rootStore,
      usMeMediumTrusteeSchema.parse(record),
    );

    this.form = new UsMeMediumTrusteeForm(this, resident.rootStore);
  }
}
