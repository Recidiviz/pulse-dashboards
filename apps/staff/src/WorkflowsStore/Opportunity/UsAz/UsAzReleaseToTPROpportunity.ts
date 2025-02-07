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

import { UsAzResidentMetadata } from "../../../FirestoreStore/types/residentMetadata";
import { Resident } from "../../Resident";
import { UsAzReleaseToTransitionProgramForm } from "../Forms/UsAzReleaseToTransitionProgramForm";
import {
  UsAzReleaseToTransitionProgramReferralRecord,
  usAzReleaseToTransitionProgramSchemaBase,
} from "./UsAzReleaseToTransitionProgramBaseSchema";
import {
  UsAzReleaseToTPRUpdateRecord,
  UsAzReleaseToTransitionProgramOpportunityBase,
} from "./UsAzReleaseToTransitionProgramOpportunityBase";

export class UsAzReleaseToTPROpportunity extends UsAzReleaseToTransitionProgramOpportunityBase<
  UsAzReleaseToTransitionProgramReferralRecord,
  UsAzReleaseToTPRUpdateRecord
> {
  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usAzReleaseToTPR",
      resident.rootStore,
      usAzReleaseToTransitionProgramSchemaBase.parse(record),
    );

    // The agreement form can only be uploaded to the OMS if the resident has a TPR date
    if (!record.metadata.tabName.startsWith("ALMOST_ELIGIBLE")) {
      this.form = new UsAzReleaseToTransitionProgramForm(
        this,
        resident.rootStore,
      );
    }
  }

  get eligibilityDate(): Date {
    const metadata = this.person.metadata as UsAzResidentMetadata;
    return new Date(metadata.acisTprDate ?? metadata.projectedTprDate);
  }
}
