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

import {
  OpportunityType,
  UsNeGoodTimeRestorationRecord,
  usNeGoodTimeRestorationSchema,
} from "~datatypes";

import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";

// This stub class exists because we switch on the usNeGoodTimeRestoration
// opportunityType in OpportunityPersonListPresenter and elsewhere, so we want
// it to be in OpportunityType.
export class UsNeGoodTimeRestorationOpportunity extends OpportunityBase<
  Resident,
  UsNeGoodTimeRestorationRecord["output"]
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
      usNeGoodTimeRestorationSchema.parse(record),
    );
  }
}
