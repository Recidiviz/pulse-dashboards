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
  UsIdTransferToCRCLikeBedRecord,
  usIdTransferToCRCLikeBedSchema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { UsIdCRCOpportunityBase } from "../UsIdCRCOpportunityBase/UsIdCRCOpportunityBase";

export class UsIdTransferToCRCLikeBedOpportunity extends UsIdCRCOpportunityBase<
  UsIdTransferToCRCLikeBedRecord["output"]
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usIdTransferToCRCLikeBed",
      resident.rootStore,
      usIdTransferToCRCLikeBedSchema.parse(record),
    );
  }

  get subcategory() {
    if (this.isSubmitted) {
      if (this.submittedUpdate?.subcategory) {
        return this.submittedUpdate?.subcategory;
      }

      const submittedOptions =
        this.config.markSubmittedOptionsByTab?.[this.tabTitle()];
      // Return the last option in the array, if any
      return submittedOptions?.[submittedOptions.length - 1];
    }

    if (!(this.denied || this.isSubmitted)) {
      switch (this.record.metadata.criteriaSource) {
        case "A":
          return "ELIGIBLE_STANDARD";
        case "B":
          return "ELIGIBLE_MEDICAL_INELIGIBLE";
      }
      return "NONE";
    }
  }
}
