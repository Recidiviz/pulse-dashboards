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
  UsTnReclassification2026ReferralRecord,
  usTnReclassification2026Schema,
} from "~datatypes";

import { Resident } from "../../../../Resident";
import { UsTnReclassification2026FormV2 } from "../../../Forms/UsTnReclassification2026FormV2";
import { UsTn2026ClassificationBase } from "../UsTn2026ClassificationBase";

export class UsTnBiAnnualOtherReclassificationV2Opportunity extends UsTn2026ClassificationBase<
  UsTnReclassification2026ReferralRecord["output"]
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usTnBiannualOtherV2",
      resident.rootStore,
      usTnReclassification2026Schema.parse(record),
    );

    this.form = new UsTnReclassification2026FormV2(this, resident.rootStore);
  }

  get isEligible() {
    return false;
  }

  get isIneligible() {
    return true;
  }
}
