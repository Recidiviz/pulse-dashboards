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
import { MAX_RETRY_ATTEMPTS } from "~@jii-texting-server/utils/common/constants";
import { TwilioAPIClient } from "~twilio-api";

function messageAttemptSortByCreatedTimestampDesc(
  attemptOne: MessageAttemptSelect,
  attemptTwo: MessageAttemptSelect,
) {
  return (
    attemptTwo.createdTimestamp.getTime() -
    attemptOne.createdTimestamp.getTime()
  );
}

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
    .sort(messageAttemptSortByCreatedTimestampDesc);
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
 * Creates/sends a message via the TwilioAPIClient and persists the message in the DB.
 * If the messageSeriesId is provided, then create a new MessageAttempt object that
 * will be connected to an existing MessageSeries, where id = messageSeriesId. If
 * the messageSeriesId is not provided, then create a new MessageSeries object with
 * a nested MessageAttempt for the given messageType
 *
 * @param messageType The type of message we're sending
 * @param toPhoneNumber The phone number to send the message to
 * @param personExternalId The external ID of the JII that we're sending a message to
 * @param groupId The id of the Group that the JII belongs to
 * @param workflowExecutionId The ID of the current Workflow Execution that the message is being sent during
 * @param prisma Prisma Client
 * @param twilio Twilio API Client
 * @param messageSeriesId The id of the MessageSeries to connect the new MessageAttempt to
 */
export async function sendText(
  messageType: MessageType,
  toPhoneNumber: string,
  personExternalId: string,
  groupId: string,
  workflowExecutionId: string,
  prisma: PrismaClient,
  twilio: TwilioAPIClient,
  messageSeriesId?: string,
) {
  try {
    // TODO(#7566): Get the real copy from group or state-level
    const messageBody = "This is the message body";

    // Send message via Twilio client
    // TODO(#7574): Schedule send if the job is running at odd hours
    const {
      body,
      status,
      sid,
      dateCreated,
      dateSent,
      errorMessage,
      errorCode,
    } = await twilio.createMessage(messageBody, toPhoneNumber);
    const messageStatus = mapTwilioStatusToInternalStatus(status);
    // Note: the timezone we get from Twilio doesn't matter because Prisma converts
    // to UTC under the hood on creation of dates
    if (messageSeriesId) {
      // If the messageSeriesId exists, connect this MessageAttempt to the MessageSeries
      await prisma.messageAttempt.create({
        data: {
          twilioMessageSid: sid,
          body: body,
          phoneNumber: toPhoneNumber,
          status: messageStatus,
          createdTimestamp: dateCreated,
          twilioSentTimestamp: dateSent,
          lastUpdatedTimestamp: dateCreated,
          workflowExecutionId: workflowExecutionId,
          messageSeriesId: messageSeriesId,
          error: errorMessage,
          errorCode: errorCode,
        },
      });
    } else {
      // If no messageSeriesId is provided, then create a new MessageSeries object
      await prisma.messageSeries.create({
        data: {
          messageType: messageType,
          personExternalId: personExternalId,
          groupId: groupId,
          messageAttempts: {
            create: [
              {
                twilioMessageSid: sid,
                body: body,
                phoneNumber: toPhoneNumber,
                status: messageStatus,
                createdTimestamp: dateCreated,
                workflowExecutionId: workflowExecutionId,
                twilioSentTimestamp: dateSent,
                lastUpdatedTimestamp: dateCreated,
                error: errorMessage,
                errorCode: errorCode,
              },
            ],
          },
        },
      });
    }

    return sid;
  } catch (e) {
    console.log(`Error in sendText for ${personExternalId}: ${e}`);
    return undefined;
  }
}

/**
 * Returns True if we have sent the max number of attempts for a MessageSeries of
 * the provided messageType and the latest attempt has status=FAILURE, which implies
 * the other MessageAttempts are also failures
 *
 * @param messageSeriesList A list of MessageSeries objects for a given JII
 * @param messageType The MessageType of the MessageSeries we care about
 * @returns True if all associated MessageAttempts in the series have failed
 */
function allTextAttemptsForSeriesFailed(
  messageType: MessageType,
  messageSeriesList: MessageSeriesWithAttemptsAndGroup[],
) {
  const messageSeries = messageSeriesList.find(
    (series) => series.messageType === messageType,
  );

  if (messageSeries) {
    const messageAttempts = messageSeries.messageAttempts.sort(
      messageAttemptSortByCreatedTimestampDesc,
    );

    if (
      messageAttempts.length === MAX_RETRY_ATTEMPTS &&
      messageAttempts[0].status === MessageAttemptStatus.FAILURE
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Returns True if there is a successful MessageAttempt for the eligibility text
 * MessageSeries
 *
 * @param messageSeriesList A list of MessageSeries objects for a given JII
 * @returns True if there is a successful MessageAttempt in a MessageSeries where messageType=ELIGIBIILTY_TEXT
 */
function eligibilityTextSucceeded(
  messageSeriesList: MessageSeriesWithAttemptsAndGroup[],
) {
  const eligibilityTextMessageSeries = messageSeriesList.find(
    (series) => series.messageType === MessageType.ELIGIBILITY_TEXT,
  );

  if (eligibilityTextMessageSeries) {
    const messageAttempts = eligibilityTextMessageSeries.messageAttempts.sort(
      messageAttemptSortByCreatedTimestampDesc,
    );

    if (messageAttempts[0].status === MessageAttemptStatus.SUCCESS) return true;
  }

  return false;
}

/**
 * Returns True if the person has opted-out from receiving messages
 *
 * @param jii The person in question
 * @returns True if the lastOptOutDate is set on the person
 */
function personHasOptedOut(jii: PersonWithMessageSeriesAndGroup) {
  return jii.lastOptOutDate != null;
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
    const message = await sendText(
      MessageType.INITIAL_TEXT,
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

  // TODO(#7742): Revisit the eligibility text succeeded logic to potentially
  // resend if it's been 90 days since the last text
  if (
    allTextAttemptsForSeriesFailed(
      MessageType.INITIAL_TEXT,
      messageSeriesList,
    ) ||
    allTextAttemptsForSeriesFailed(
      MessageType.ELIGIBILITY_TEXT,
      messageSeriesList,
    ) ||
    eligibilityTextSucceeded(messageSeriesList) ||
    personHasOptedOut(jii)
  ) {
    return ScriptAction.SKIPPED;
  }

  // Get MessageAttempt objects ordered by descending createdTimestamp
  const orderedMessageAttempts = getOrderedMessageAttempts(messageSeriesList);
  const latestMessageAttempt = orderedMessageAttempts[0];

  let latestMessageAttemptStatus: MessageAttemptStatus;
  if (!dryRun) {
    // Update status for the latest message attempt by querying Twilio
    latestMessageAttemptStatus = await updateMessageAttempt(
      prisma,
      twilio,
      latestMessageAttempt.status,
      latestMessageAttempt.twilioMessageSid,
    );
  } else {
    latestMessageAttemptStatus = latestMessageAttempt.status;
  }

  // Get the latest MessageSeries by finding the one that contains the
  // messageAttempt with an ID equivalent to the latest MessageAttempt
  const latestMessageSeries = jii.messageSeries.find((series) =>
    series.messageAttempts
      .flatMap((attempt) => attempt.id)
      .includes(latestMessageAttempt.id),
  );

  if (latestMessageSeries === undefined) return ScriptAction.ERROR;

  // If the last message we sent was a sucessfully delivered initial text,
  // then send an eligibility text.
  if (
    latestMessageSeries.messageType === MessageType.INITIAL_TEXT &&
    latestMessageAttemptStatus === MessageAttemptStatus.SUCCESS
  ) {
    if (dryRun) return ScriptAction.ELIGIBILITY_MESSAGE_SENT;

    const message = await sendText(
      MessageType.ELIGIBILITY_TEXT,
      jii.phoneNumber,
      jii.externalId,
      group.id,
      workflowExecutionId,
      prisma,
      twilio,
    );

    if (message) {
      return ScriptAction.ELIGIBILITY_MESSAGE_SENT;
    } else {
      return ScriptAction.ERROR;
    }
  }

  // If we've made MAX_RETRY_ATTEMPTS for a given message series,
  // skip any other actions.
  if (latestMessageSeries.messageAttempts.length === MAX_RETRY_ATTEMPTS) {
    return ScriptAction.SKIPPED;
  }

  // If we've made less than the maximum retry attempts and the latest attempt was a failure,
  // send the message again
  if (
    latestMessageSeries.messageAttempts.length < MAX_RETRY_ATTEMPTS &&
    latestMessageAttemptStatus === MessageAttemptStatus.FAILURE
  ) {
    const scriptAction =
      latestMessageSeries.messageType === MessageType.INITIAL_TEXT
        ? ScriptAction.INITIAL_MESSAGE_SENT
        : ScriptAction.ELIGIBILITY_MESSAGE_SENT;

    if (dryRun) return scriptAction;

    // Otherwise, send the message again
    // TODO(#7703): Incorporate buffers between retries
    const message = await sendText(
      latestMessageSeries.messageType,
      jii.phoneNumber,
      jii.externalId,
      group.id,
      workflowExecutionId,
      prisma,
      twilio,
      latestMessageSeries.id,
    );

    if (message) {
      return scriptAction;
    } else {
      return ScriptAction.ERROR;
    }
  }

  return ScriptAction.NOOP;
}
