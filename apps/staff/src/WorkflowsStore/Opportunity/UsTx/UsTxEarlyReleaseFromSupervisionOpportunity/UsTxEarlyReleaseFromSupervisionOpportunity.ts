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

import { DocumentData } from "@google-cloud/firestore";

import {
  UsTxEarlyReleaseFromSupervisionRecord,
  usTxEarlyReleaseFromSupervisionSchema,
} from "~datatypes";

import { OpportunityUpdateWithForm } from "../../../../FirestoreStore";
import { Client } from "../../../Client";
import { UsTxEarlyReleaseFromSupervisionForm } from "../../Forms/UsTxEarlyReleaseFromSupervisionForm/UsTxEarlyReleaseFromSupervisionForm";
import { OpportunityBase } from "../../OpportunityBase";
import { getDynamicCaseNoteHeaders } from "../UsTxArsErsSharedUtils";
import type { UsTxEarlyReleaseFromSupervisionDraftData } from "../UsTxDraftData";

// TODO OBT-32657 Clean up V1 opp
export class UsTxEarlyReleaseFromSupervisionOpportunity extends OpportunityBase<
  Client,
  UsTxEarlyReleaseFromSupervisionRecord["output"],
  OpportunityUpdateWithForm<UsTxEarlyReleaseFromSupervisionDraftData>
> {
  form: UsTxEarlyReleaseFromSupervisionForm;

  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usTxEarlyReleaseFromSupervision",
      client.rootStore,
      usTxEarlyReleaseFromSupervisionSchema.parse(record),
    );

    this.form = new UsTxEarlyReleaseFromSupervisionForm(this, this.rootStore);
  }

  // TODO(#8429): Add caseNoteHeaders field to the admin panel config
  get caseNoteHeaders(): string[] {
    return getDynamicCaseNoteHeaders(this);
  }
}
