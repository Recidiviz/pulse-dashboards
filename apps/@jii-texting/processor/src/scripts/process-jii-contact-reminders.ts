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

import { StateCode } from "@prisma/jii-texting/client";

import { getPrismaClientForStateCode } from "~@jii-texting/prisma";
import {
  auditNumMessagesAttemptedChangeRatio,
  PERSON_WITH_CONTACTS_AND_MESSAGES,
  processIndividualJiiContactReminders,
  PROMISES_BATCH_SIZE,
  ScriptAction,
  throttlePromises,
  updateMessageStatuses,
} from "~@jii-texting/utils";
import { getTwilioClientForStateCode } from "~twilio-api";

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
  const twilioClient = getTwilioClientForStateCode(stateCode);

  // Get Prisma client
  const prisma = getPrismaClientForStateCode(stateCode);

  // Get the latest statuses for in progress messages
  if (!dryRun) {
    await updateMessageStatuses(prisma, twilioClient);
  }

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

  const processPromiseFns = jiiToText.map((jii) =>
    async () => {
      const actions = await processIndividualJiiContactReminders(
        jii,
        workflowExecutionId,
        dryRun,
        prisma,
        twilioClient,
      );

      return {
        id: jii.pseudonymizedId,
        actions: actions as ScriptAction[],
      };
    },
  );

  // TODO(#10425): Rather than batching promises, consider scoping out how to do batched writes
  const allProcessedResults = await throttlePromises(
    processPromiseFns,
    PROMISES_BATCH_SIZE,
  );

  for (const result of allProcessedResults) {
    for (const action of result.actions) {
      if (results[action]) {
        results[action].push(result.id);
      }
    }
  }

  for (const key in results) {
    console.log(`${key}: ${results[key as ScriptAction]}`);
  }

  await auditNumMessagesAttemptedChangeRatio(prisma, workflowExecutionId);

  await prisma.$disconnect();

  return results;
}
