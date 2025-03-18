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

import {
  MessageAttemptStatus,
  MessageType,
  PrismaClient,
} from "@prisma/jii-texting-server/client";
import {
  MessageInstance,
  MessageStatus,
} from "twilio/lib/rest/api/v2010/account/message";

import {
  MessageAttemptSelect,
  MessageSeriesWithAttemptsAndGroup,
  PersonWithMessageSeriesAndGroup,
  ScriptAction,
} from "~@jii-texting-server/utils";
import {
  MAX_ELIGIBILITY_TEXT_ATTEMPTS,
  MAX_INITIAL_TEXT_ATTEMPTS,
} from "~@jii-texting-server/utils/common/constants";
import { TwilioAPIClient } from "~twilio-api";

/**
 * Maps the external Twilio MessageStatus to an internal MessageAttemptStatus enum
 *
 * @param twilioStatus the Twilio status to get the internal status for
 * @returns the MessageAttemptStatus
 */
export function mapTwilioStatusToInternalStatus(
  twilioStatus: MessageStatus,
): MessageAttemptStatus {
  // Possible statuses listed here: https://help.twilio.com/articles/223134347-What-are-the-Possible-SMS-and-MMS-Message-Statuses-and-What-do-They-Mean-
  switch (twilioStatus) {
    case "accepted":
    case "scheduled":
    case "queued":
    case "sending":
      return MessageAttemptStatus.IN_PROGRESS;
    case "failed":
    case "undelivered":
      return MessageAttemptStatus.FAILURE;
    case "delivered":
    case "sent":
      return MessageAttemptStatus.SUCCESS;
    default:
      // DISCUSS: Newly added so that we persist the status
      console.log(`Received unexpected status: ${twilioStatus}`);
      return MessageAttemptStatus.UNKNOWN;
  }
}

/**
 * Takes in a MessageSeries[] and returns a list of flattened MessageAttempt objects
 * ordered by descending createdTimestamp across all of the MessageSeries objects.
 *
 * @param messageSeries List of MessageSeries with nested MessageAttempts
 * @returns The MessageAttempt objects with internal ID, twilioMessageSid, status, and date created, ordered by descending createdTimestamp
 */
export function getOrderedMessageAttempts(
  messageSeries: MessageSeriesWithAttemptsAndGroup[],
) {
  return messageSeries
    .flatMap((series) => series.messageAttempts)
    .sort(
      (a, b) => b.createdTimestamp.getTime() - a.createdTimestamp.getTime(),
    );
}

/**
 * Given a TwilioMessageSid, fetches the MessageInstance from Twilio and updates
 * the corresponding MessageAttempt in the DB with the information from Twilio
 * if the latest status does not match the existing status.
 *
 * @param prisma Prisma Client
 * @param twilio Twilio API Client
 * @param existingStatus The current status of the MessageAttempt
 * @param messageAttemptTwilioSid Twilio MessageSid of the message to fetch
 * @returns Latest status of the message
 */
export async function updateMessageAttempt(
  prisma: PrismaClient,
  twilio: TwilioAPIClient,
  existingStatus: MessageAttemptStatus,
  messageAttemptTwilioSid: string,
) {
  // Update the given MessageAttempt with the latest data from Twilio
  const twilioMessageInstance: MessageInstance = await twilio.getMessage(
    messageAttemptTwilioSid,
  );

  const latestStatus = mapTwilioStatusToInternalStatus(
    twilioMessageInstance.status,
  );

  if (latestStatus !== existingStatus) {
    await prisma.messageAttempt.update({
      where: {
        twilioMessageSid: messageAttemptTwilioSid,
      },
      data: {
        status: latestStatus,
        lastUpdatedTimestamp: new Date(),
        twilioSentTimestamp: twilioMessageInstance.dateSent,
        errorCode: twilioMessageInstance.errorCode,
        error: twilioMessageInstance.errorMessage,
      },
    });
  }

  return latestStatus;
}

/**
 * Creates/sends a message via the TwilioAPIClient and adds a new MessageSeries
 * with a nested MessageAttempt that contains the information returned by Twilio
 *
 * @param toPhoneNumber The phone number to send the message to
 * @param personExternalId The external ID of the JII that we're sending a message to
 * @param groupId The id of the Group that the JII belongs to
 * @param workflowExecutionId The ID of the current Workflow Execution that the message is being sent during
 * @param prisma Prisma Client
 * @param twilio Twilio API Client
 */
export async function sendInitialText(
  toPhoneNumber: string,
  personExternalId: string,
  groupId: string,
  workflowExecutionId: string,
  prisma: PrismaClient,
  twilio: TwilioAPIClient,
) {
  try {
    // TODO(#7566): Get the real copy from group or state-level
    const body = "This is an initial text";

    // Send message via Twilio client
    // TODO(#7574): Schedule send if the job is running at odd hours
    const initialMessage = await twilio.createMessage(body, toPhoneNumber);

    // Add the MessageSeries and nested MessageAttempt to the DB
    const initialMessageAttemptTimestamp = new Date();

    const messageSeries = await prisma.messageSeries.create({
      data: {
        messageType: MessageType.INITIAL_TEXT,
        personExternalId: personExternalId,
        groupId: groupId,
        messageAttempts: {
          create: [
            {
              twilioMessageSid: initialMessage.sid,
              body: body,
              phoneNumber: toPhoneNumber,
              status: mapTwilioStatusToInternalStatus(initialMessage.status),
              createdTimestamp: initialMessageAttemptTimestamp,
              workflowExecutionId: workflowExecutionId,
            },
          ],
        },
      },
    });
    return messageSeries;
  } catch (e) {
    console.log(`Error in sendInitialText for ${personExternalId}: ${e}`);
    return undefined;
  }
}

/**
 * Returns True if the person is in a terminal state, that is we should not try to
 * send them any more messages if:
 *  - we have sent them an eligibility text that is successful
 *  - we have sent them the max number of attempts and the latest status is not IN_PROGRESS
 *
 * @param latestMessageType The type of the last message that we sent to the JII
 * @param orderedMessageAttempts The list of MessageAttempts ordered descending
 */
export function personIsInTerminalState(
  latestMessageType: MessageType,
  orderedMessageAttempts: MessageAttemptSelect[],
) {
  // Get the status of the latest message we've sent them
  const latestMessageAttemptStatus = orderedMessageAttempts[0].status;

  // Check if we've sent the JII the maximum number of texts
  const sentMaxAttempts =
    orderedMessageAttempts.length ===
    MAX_INITIAL_TEXT_ATTEMPTS + MAX_ELIGIBILITY_TEXT_ATTEMPTS;

  if (
    (sentMaxAttempts &&
      latestMessageAttemptStatus !== MessageAttemptStatus.IN_PROGRESS) ||
    (latestMessageType === MessageType.ELIGIBILITY_TEXT &&
      latestMessageAttemptStatus === MessageAttemptStatus.SUCCESS)
  )
    return true;

  return false;
}

/**
 * Process the given JII for the given group to determine what action we need to take
 * for this JII, e.g. send an initial or eligibility text, or neither. If `dryRun=true`,
 * then we should not persist any information to the DB nor make requests to Twilio.
 *
 * @param jii The JII that we want to figure out how to process
 * @param workflowExecutionId The ID of the current Workflow Execution that the message is being sent during
 * @param prisma Prisma Client
 * @param twilio Twilio API Client
 */
export async function processIndividualJii(
  jii: PersonWithMessageSeriesAndGroup,
  workflowExecutionId: string,
  dryRun: boolean,
  prisma: PrismaClient,
  twilio: TwilioAPIClient,
): Promise<ScriptAction> {
  // TODO(#7573): Reevaluate when JII can be in multiple topics
  // Assumes that we only have one topic/group pairing per JII
  const group = jii.groups[0];

  // Get the relevant MessageSeries objects for the given group
  const messageSeriesList: MessageSeriesWithAttemptsAndGroup[] =
    jii.messageSeries.filter((series) => series.group.id === group.id);

  // If there are no MessageSeries entries for this group, we have never sent this JII a text for this group. Thus, send an initial text.
  // TODO(#7573): Reevaluate when there are multiple topics/state, e.g. will the topics share an initial text or will there be different ones?
  if (!messageSeriesList.length) {
    if (dryRun) {
      return ScriptAction.INITIAL_MESSAGE_SENT;
    }

    // TODO: check if topic/group are active?
    const message = await sendInitialText(
      jii.phoneNumber,
      jii.externalId,
      group.id,
      workflowExecutionId,
      prisma,
      twilio,
    );

    if (message) {
      return ScriptAction.INITIAL_MESSAGE_SENT;
    } else {
      return ScriptAction.ERROR;
    }
  }

  // Get MessageAttempt objects ordered by descending createdTimestamp
  const orderedMessageAttempts = getOrderedMessageAttempts(messageSeriesList);

  // Get the latestMessageType by finding the MessageSeries that contains the
  // messageAttempt with an ID equivalent to the latest MessageAttempt
  const latestMessageType = jii.messageSeries.find((series) =>
    series.messageAttempts
      .flatMap((attempt) => attempt.id)
      .includes(orderedMessageAttempts[0].id),
  )?.messageType;

  if (latestMessageType === undefined) return ScriptAction.ERROR;

  // If we've attempted to send the max attempts of each message and the
  // latest message is in a terminal state, skip this person.
  if (personIsInTerminalState(latestMessageType, orderedMessageAttempts)) {
    return ScriptAction.SKIPPED;
  }

  // Update message attempt status for the latest attempt by querying Twilio
  if (!dryRun) {
    await updateMessageAttempt(
      prisma,
      twilio,
      orderedMessageAttempts[0].status,
      orderedMessageAttempts[0].twilioMessageSid,
    );
  }

  return ScriptAction.SKIPPED;
}
