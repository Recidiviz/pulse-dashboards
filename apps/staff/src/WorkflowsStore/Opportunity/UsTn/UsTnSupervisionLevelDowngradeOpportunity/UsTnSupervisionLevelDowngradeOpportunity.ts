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

import { captureException } from "@sentry/react";
import { DocumentData } from "firebase/firestore";

import { OpportunityValidationError } from "../../../../errors";
import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import {
  getSLDValidator,
  UsTnSupervisionLevelDowngradeReferralRecord,
  usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "./UsTnSupervisionLevelDowngradeReferralRecord";

export class UsTnSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsTnSupervisionLevelDowngradeReferralRecord
> {
  // TODO(#6707) move to configuration
  readonly caseNotesTitle = "Relevant Contact Codes";

  constructor(client: Client, record: DocumentData) {
    const parsedRecord =
      usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
        (raw) => client.rootStore.workflowsStore.formatSupervisionLevel(raw),
      ).parse(record);

    if (parsedRecord !== undefined) {
      try {
        const validateRecord = getSLDValidator(client);
        validateRecord(parsedRecord);
      } catch (e) {
        if (e instanceof OpportunityValidationError) {
          // If the opportunity record and client supervision levels differ, capture it in
          // sentry and update the opportunity with the client's formatted supervision level
          captureException(e);
          parsedRecord.eligibleCriteria.supervisionLevelHigherThanAssessmentLevel.supervisionLevel =
            client.supervisionLevel;
        } else {
          // If there's some other kind of error, abort creating this opportunity
          throw e;
        }
      }
    }

    super(client, "supervisionLevelDowngrade", client.rootStore, parsedRecord);
  }
}
