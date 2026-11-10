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
  auditNumMessagesAttemptedChangeRatio,
  PERSON_WITH_CONTACTS_AND_MESSAGES,
  processIndividualJiiContactReminders,
  PROMISES_BATCH_SIZE,
  ScriptAction,
  throttlePromises,
  updateMessageStatuses,
} from "~@jii-texting/utils";
import { i18nInstance, initI18n } from "~@jii-texting/utils/common/i18n";
import { getTwilioClientForStateCode } from "~twilio-api";

// Prisma 7 loads each include with an "IN (...)" list of the parent IDs, and
// Postgres allows at most 32,766 bind parameters per query. Prisma splits some
// of these lists itself, but not the one for contacts, whose include has an
// orderBy, so people load in pages well below that limit.
const PERSON_PAGE_SIZE = 5000;

const PERSON_WITH_REMINDER_CONTACTS_INCLUDE = {
  ...PERSON_WITH_CONTACTS_AND_MESSAGES.include,
  contacts: {
    ...PERSON_WITH_CONTACTS_AND_MESSAGES.include.contacts,
    where: {
      NOT: {
        reminderType: null,
      },
    },
  },
};

export type processJiiArguments = {
  stateCode: StateCode;
  dryRun: boolean;
  workflowExecutionId: string;
  pageSize?: number;
};

export async function processJiiContactReminders({
  stateCode,
  dryRun,
  workflowExecutionId,
  pageSize = PERSON_PAGE_SIZE,
}: processJiiArguments) {
  console.log(
    `Starting the process-jii-contact-reminders job for ${stateCode}, where dry-run is ${dryRun}`,
  );

  // Instantiate the Twilio client
  const twilioClient = getTwilioClientForStateCode(stateCode);

  // Get Prisma client
  const prisma = getPrismaClientForStateCode(stateCode);

  // Instantiate i18Next
  await initI18n();

  // Get the latest statuses for in progress messages
  if (!dryRun) {
    await updateMessageStatuses(prisma, twilioClient);
  }

  const results: Record<ScriptAction, string[]> = {
    INITIAL_MESSAGE_SENT: [],
    ELIGIBILITY_MESSAGE_SENT: [],
    SKIPPED: [],
    ERROR: [],
    NOOP: [],
    REMINDER_TEXT_SENT: [],
  };

  let lastStableExternalId: string | undefined;

  for (;;) {
    // Each page's query needs the previous page's last ID, and finishing each
    // page before loading the next keeps only one page in memory.
    // eslint-disable-next-line no-await-in-loop
    const jiiToText = await prisma.person.findMany({
      where: lastStableExternalId
        ? { stableExternalId: { gt: lastStableExternalId } }
        : undefined,
      orderBy: { stableExternalId: "asc" },
      take: pageSize,
      include: PERSON_WITH_REMINDER_CONTACTS_INCLUDE,
    });

    const processPromiseFns = jiiToText.map((jii) => async () => {
      const actions = await processIndividualJiiContactReminders(
        jii,
        workflowExecutionId,
        dryRun,
        prisma,
        twilioClient,
        i18nInstance,
      );

      return {
        id: jii.pseudonymizedId,
        actions: actions as ScriptAction[],
      };
    });

    // TODO(#10425): Rather than batching promises, consider scoping out how to do batched writes
    // eslint-disable-next-line no-await-in-loop
    const pageResults = await throttlePromises(
      processPromiseFns,
      PROMISES_BATCH_SIZE,
    );

    for (const result of pageResults) {
      for (const action of result.actions) {
        if (results[action]) {
          results[action].push(result.id);
        }
      }
    }

    if (jiiToText.length < pageSize) break;
    lastStableExternalId = jiiToText[jiiToText.length - 1].stableExternalId;
  }

  for (const key in results) {
    console.log(`${key}: ${results[key as ScriptAction]}`);
  }

  await auditNumMessagesAttemptedChangeRatio(prisma, workflowExecutionId);

  await prisma.$disconnect();

  return results;
}
