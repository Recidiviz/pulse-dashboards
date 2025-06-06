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

import { Resident } from "../../../Resident";
import { FormBase } from "../../Forms/FormBase";
import { UsArInstitutionalWorkerStatusOpportunityForm } from "../../Forms/UsArInstitutionalWorkerStatusOpportunityForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsArInstitutionalWorkerStatusReferralRecord,
  usArInstitutionalWorkerStatusSchema,
} from "./UsArInstitutionalWorkerStatusReferralRecord";

export class UsArInstitutionalWorkerStatusOpportunity extends OpportunityBase<
  Resident,
  UsArInstitutionalWorkerStatusReferralRecord
> {
  directDownloadForm: FormBase<any, any>;

  constructor(resident: Resident, record: DocumentData) {
    super(
      resident,
      "usArInstitutionalWorkerStatus",
      resident.rootStore,
      usArInstitutionalWorkerStatusSchema.parse(record),
    );

    this.directDownloadForm = new UsArInstitutionalWorkerStatusOpportunityForm(
      this,
      resident.rootStore,
    );
  }

  numVisitors(): number {
    return this.record.approvedVisitors?.length ?? 0;
  }
}
