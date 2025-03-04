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

import {
  ExternalRequestUpdate,
  ExternalSystemRequestStatus,
  UsTnContactNote,
  UsTnExpirationOpportunityUpdate,
} from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { UsTnExpirationForm } from "../../Forms/UsTnExpirationForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  getUsTnExpirationValidator,
  UsTnExpirationReferralRecord,
  usTnExpirationSchema,
} from "./UsTnExpirationReferralRecord";

export class UsTnExpirationOpportunity extends OpportunityBase<
  Client,
  UsTnExpirationReferralRecord,
  UsTnExpirationOpportunityUpdate
> {
  readonly supportsExternalRequest = true;

  readonly externalRequestStatusMessage = "TEPE note submitted on";

  form: UsTnExpirationForm;

  constructor(client: Client, record: DocumentData) {
    const parsedRecord = usTnExpirationSchema.parse(record);

    if (parsedRecord !== undefined) {
      const validateRecord = getUsTnExpirationValidator(client);
      validateRecord(parsedRecord);
    }

    super(client, "usTnExpiration", client.rootStore, parsedRecord);

    this.form = new UsTnExpirationForm(this, client.rootStore);
  }

  get eligibilityDate(): Date | undefined {
    return this.record?.eligibleCriteria?.supervisionPastFullTermCompletionDate
      ?.eligibleDate;
  }

  get externalRequestData():
    | ExternalRequestUpdate<UsTnContactNote>
    | undefined {
    return this.updates?.contactNote;
  }

  get externalRequestStatus(): ExternalSystemRequestStatus | undefined {
    return this.externalRequestData?.status;
  }

  get isNoteLoading(): boolean {
    return (
      this.externalRequestStatus === "PENDING" ||
      this.externalRequestStatus === "IN_PROGRESS"
    );
  }
}
