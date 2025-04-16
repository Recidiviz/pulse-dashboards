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

import { StateCode } from "@prisma/jii-texting-server/client";

import { getPrismaClientForStateCode } from "~@jii-texting-server/prisma";
import {
  PERSON_INCLUDE_MESSAGE_SERIES_AND_GROUP,
  PersonWithMessageSeriesAndGroup,
  processIndividualJii,
  ScriptAction,
} from "~@jii-texting-server/utils";
import { TwilioAPIClient } from "~twilio-api";

export type processJiiArguments = {
  stateCode: StateCode;
  dryRun: boolean;
  workflowExecutionId: string;
};

export async function processJii({
  stateCode,
  dryRun = true,
  workflowExecutionId,
}: processJiiArguments) {
  console.log(
    `Starting the process-jii job for ${stateCode}, where dry-run is ${dryRun}`,
  );

  // Instantiate the Twilio client
  const twilioAccountSid = process.env["TWILIO_ACCOUNT_SID"] ?? "";
  const twilioAuthToken = process.env["TWILIO_AUTH_TOKEN"] ?? "";
  const twilioSubaccountSid =
    process.env[`TWILIO_MESSAGING_SERVICE_SID_${stateCode.toUpperCase()}`];

  const twilioClient = new TwilioAPIClient(
    twilioAccountSid,
    twilioAuthToken,
    twilioSubaccountSid,
  );

  // Get Prisma client
  const prisma = getPrismaClientForStateCode(stateCode);

  // Get all JII who should receive a text, that is people who have the `groups` field hydrated
  // Currently, it's not possible to flatten the results (see https://stackoverflow.com/questions/71445312/for-prisma-client-join-queries-is-it-possible-to-move-deeply-nested-fields-to-to)
  const jiiToText: PersonWithMessageSeriesAndGroup[] =
    await prisma.person.findMany({
      // Filter for people where the `groups` relation is not empty (see https://github.com/prisma/prisma/issues/3888)
      // Also see https://www.prisma.io/docs/orm/reference/prisma-client-reference#none
      where: {
        NOT: {
          groups: {
            none: {},
          },
        },
      },
      ...PERSON_INCLUDE_MESSAGE_SERIES_AND_GROUP,
    });

  const results: Record<ScriptAction, string[]> = {
    INITIAL_MESSAGE_SENT: [],
    ELIGIBILITY_MESSAGE_SENT: [],
    SKIPPED: [],
    ERROR: [],
    NOOP: [],
  };

  await Promise.all(
    jiiToText.map(async (jii) => {
      const action = await processIndividualJii(
        jii,
        workflowExecutionId,
        dryRun,
        prisma,
        twilioClient,
      );
      results[action as ScriptAction].push(jii.pseudonymizedId);
    }),
  );

  for (const key in results) {
    console.log(`${key}: ${results[key as ScriptAction]}`);
  }

  return results;
}
