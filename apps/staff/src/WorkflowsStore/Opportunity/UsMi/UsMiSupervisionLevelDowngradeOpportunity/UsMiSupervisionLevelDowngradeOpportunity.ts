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
import { makeObservable, override } from "mobx";

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import {
  getValidator,
  UsMiSupervisionLevelDowngradeReferralRecord,
  usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "./UsMiSupervisionLevelDowngradeReferralRecord";

export class UsMiSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsMiSupervisionLevelDowngradeReferralRecord
> {
  constructor(client: Client, record: DocumentData) {
    const parsedRecord =
      usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
        (raw: string) =>
          client.rootStore.workflowsStore.formatSupervisionLevel(raw),
      ).parse(record);

    const validateRecord = getValidator(client);
    validateRecord(parsedRecord);

    super(
      client,
      "usMiSupervisionLevelDowngrade",
      client.rootStore,
      parsedRecord,
    );

    makeObservable(this, { requirementsMet: override });
  }

  readonly hideUnknownCaseNoteDates = true;

  get eligibilityDate(): Date | undefined {
    return this.record?.metadata.eligibleDate;
  }
}
