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

import { getPrismaClientForStateCode } from "~@jii-texting/prisma";
import { StateCode } from "~@jii-texting/prisma/client";
import {
  PERSON_WITH_CONTACTS_AND_MESSAGES,
  processIndividualJiiContactReminders,
  ScriptAction,
} from "~@jii-texting/utils";
import { TwilioAPIClient } from "~twilio-api";

export type processJiiArguments = {
  stateCode: StateCode;
  dryRun: boolean;
  workflowExecutionId: string;
};

export async function processJiiContactReminders({
  stateCode,
  dryRun,
  workflowExecutionId,
}: processJiiArguments) {
  console.log(
    `Starting the process-jii-contact-reminders job for ${stateCode}, where dry-run is ${dryRun}`,
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

  const jiiToText = await prisma.person.findMany({
    include: {
      ...PERSON_WITH_CONTACTS_AND_MESSAGES.include,
      contacts: {
        ...PERSON_WITH_CONTACTS_AND_MESSAGES.include.contacts,
        where: {
          NOT: {
            reminderType: null,
          },
        },
      },
    },
  });

  const results: Record<ScriptAction, string[]> = {
    INITIAL_MESSAGE_SENT: [],
    ELIGIBILITY_MESSAGE_SENT: [],
    SKIPPED: [],
    ERROR: [],
    NOOP: [],
    REMINDER_TEXT_SENT: [],
  };

  await Promise.all(
    jiiToText.map(async (jii) => {
      const actions = await processIndividualJiiContactReminders(
        jii,
        workflowExecutionId,
        dryRun,
        prisma,
        twilioClient,
      );

      actions.forEach((action) => {
        results[action as ScriptAction].push(jii.pseudonymizedId);
      });
    }),
  );

  for (const key in results) {
    console.log(`${key}: ${results[key as ScriptAction]}`);
  }

  return results;
}
