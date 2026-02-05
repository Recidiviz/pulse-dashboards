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

import { DocumentData } from "firebase/firestore";

import {
  UsTnInitialClassification2026ReferralRecord,
  usTnInitialClassification2026Schema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsTnDiagnosticClassification2026Form } from "../../Forms/UsTnDiagnosticClassification2026Form";
import { OpportunityBase } from "../../OpportunityBase";

export class UsTnInitialClassification2026Opportunity extends OpportunityBase<
  Resident,
  UsTnInitialClassification2026ReferralRecord["output"]
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usTnInitialClassification2026Policy",
      resident.rootStore,
      usTnInitialClassification2026Schema.parse(record),
    );

    this.form = new UsTnDiagnosticClassification2026Form(
      this,
      resident.rootStore,
    );
  }
}
