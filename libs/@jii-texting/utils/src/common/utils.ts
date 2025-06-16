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
} from "@prisma/jii-texting/client";
import { captureException } from "@sentry/node";
import moment from "moment";
import {
  MessageInstance,
  MessageStatus,
} from "twilio/lib/rest/api/v2010/account/message";

import {
  MessageAttemptSelect,
  MessageSeriesWithAttemptsAndGroup,
  PersonDataForMessage,
  PersonWithMessageSeriesAndGroup,
  ScriptAction,
} from "~@jii-texting/utils";
import {
  EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS,
  MAX_RETRY_ATTEMPTS,
  US_ID_LSU_LEARN_MORE,
  US_ID_LSU_VISIT_LINK,
} from "~@jii-texting/utils/common/constants";
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
    case "sent":
      return MessageAttemptStatus.IN_PROGRESS;
    case "failed":
    case "undelivered":
      return MessageAttemptStatus.FAILURE;
    case "delivered":
    case "read":
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
  messageSeries: MessageSeriesWithAttemptsAndGroup,
) {
  return messageSeries.messageAttempts.sort(
    messageAttemptSortByCreatedTimestampDesc,
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
 * Returns additional contact information based on the district provided. This
 * is currently specific to Idaho LSU.
 *
 * @param district The district the recipient of a message is assigned to
 * @returns Text to add for additional contact information in the message body
 */
function getAdditionalContactForIdahoLSU(district: string) {
  const districtIdentifier = district.split(" ")[1];
  switch (districtIdentifier) {
    case "1":
      return "or email D1Connect@idoc.idaho.gov";
    case "2":
      return "or contact a specialist at district2Admin@idoc.idaho.gov";
    case "3":
      return "or a specialist at specialistsd3@idoc.idaho.gov or (208) 454-7601";
    case "4":
      return "or a specialist at d4ppspecialists@idoc.idaho.gov or 208-327-7008";
    case "5":
      return "or a specialist at D5general@idoc.idaho.gov or 208-644-7268";
    case "7":
      return "or a specialist at d7.pp.specialist@idoc.idaho.gov or (208) 701-7130";
    default:
      return undefined;
  }
}

/**
 * Returns the message body for a text to send to JII based on the message type
 * and the group name. This is currently specific to Idaho LSU texting work and should
 * be reworked in #7745.
 *
 * @param givenName The first name of the person we're sending a text to
 * @param poName The full name of the person's supervising officer
 * @param district The district the person is assigned to
 * @param groupName The name of the group the person belongs to. Should match the values in the `group` column of the `jii_to_text` BQ product view
 * @returns The full text to send the person
 */
function getIdahoLSUMessageBody(
  { givenName, poName, district }: PersonDataForMessage,
  messageType: MessageType,
  groupName: string,
) {
  const additionalContactSuffix = getAdditionalContactForIdahoLSU(district);
  const contactAddendum =
    additionalContactSuffix !== undefined ? ` ${additionalContactSuffix}` : "";

  const givenNameToUse =
    givenName.charAt(0).toUpperCase() + givenName.slice(1).toLowerCase();

  const poNameToUse = poName
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  let body = "";

  if (messageType === MessageType.INITIAL_TEXT) {
    body += `Hi ${givenNameToUse}, we’re reaching out on behalf of the Idaho Department of Correction (IDOC). You’re now subscribed to receive updates about potential opportunities such as the Limited Supervision Unit (LSU), which offers a lower level of supervision.\n\nWe’ll let you know by texting this number if you meet the criteria for specific programs. Receiving this message does not mean you’re already eligible for any opportunity.\n\nIf you have questions, reach out to ${poNameToUse}.`;
  } else {
    // Otherwise, we're sending a message, where messageType=ELIGIBILITY_TEXT
    if (groupName === "FULLY_ELIGIBLE") {
      body += `Hi ${givenNameToUse}, IDOC records show that you have met most of the requirements to be considered for the Limited Supervision Unit (LSU). LSU is a lower level of supervision with monthly online check-ins for those in good standing (for example, no new misdemeanors).\n\nThis message does not mean that you have already been transferred to LSU. To fully qualify, your PO will need to check that:\n1. You have no active no-contact orders.\n2. You have made payments towards your fines/fees at least 3 months in a row (even small payments count).\n\nYou may also be required to provide your PO with a negative urine analysis test.\n\nIf you believe you meet these conditions or have questions, please contact ${poNameToUse}${contactAddendum}; they can confirm your eligibility and help you apply. Approval for LSU is not guaranteed.`;
      body += US_ID_LSU_LEARN_MORE;
    } else if (groupName === "ELIGIBLE_MISSING_FINES_AND_FEES") {
      body += `Hi ${givenNameToUse}, IDOC records show you meet most requirements but have a remaining step to be considered for the Limited Supervision Unit (LSU). If you make fine/fee payments for 3 months in a row (even small payments count), you may qualify.\n\nLSU is a lower level of supervision with monthly online check-ins for those in good standing (for example, no active no-contact orders, and no new misdemeanors). It reduces your monthly supervision fee from $60 to $40. LSU is optional, and this message does not mean you have already been transferred.\n\nYou can reach out to ${poNameToUse}${contactAddendum} to make payments or with questions about LSU. They must verify that you are in compliance with your conditions of supervision. If you are, they can help you apply.`;
      body += US_ID_LSU_LEARN_MORE;
    } else if (groupName === "MISSING_INCOME_VERIFICATION") {
      body += `Hi ${givenNameToUse}, IDOC records show you may soon be eligible to apply for the Limited Supervision Unit (LSU), a lower level of supervision for those meeting all their required conditions. This message does not mean you are already eligible.\n\nLSU is optional but offers benefits like monthly online check-ins and reduced supervision fees ($40 vs. $60/month).\n\nTo qualify, you’ll need to provide your PO with documents like pay-stubs proving you have full-time employment, are a student, or other income sources like a pension.\n\nYou must also have paid towards your fines/fees at least 3 months in a row (even small payments count).\n\nIf interested, contact ${poNameToUse}${contactAddendum}. They must first confirm your eligibility, then can help you apply.`;
      body += US_ID_LSU_VISIT_LINK;
    } else if (groupName === "MISSING_DA") {
      body += `Hi ${givenNameToUse}, IDOC records show you may soon be eligible to apply for the Limited Supervision Unit (LSU), a lower level of supervision for those meeting all their required conditions. This message does not mean you are already eligible.\n\nLSU is optional but offers benefits like monthly online check-ins and reduced supervision fees ($40 instead of $60/month).\n\nTo qualify, you’ll need to provide your PO with a negative urine analysis test.\n\nAdditionally, you must have paid towards your fines/fees at least 3 months in a row (even small payments count).\n\nIf interested, contact ${poNameToUse}${contactAddendum}. They must verify that you are in compliance with your conditions of supervision. If you are, they can help you apply.`;
      body += US_ID_LSU_VISIT_LINK;
    } else if (groupName === "TWO_MISSING_CRITERIA") {
      body += `Hi ${givenNameToUse}, IDOC records show you may soon be eligible to apply for the Limited Supervision Unit (LSU), a lower level of supervision for those meeting all their required conditions.\n\nLSU is optional but offers benefits like monthly online check-ins and reduced supervision fees ($40 instead of $60/month).\n\nTo qualify, you’ll need to provide your PO with:\n1. Documents like pay-stubs proving you have full-time employment, are a student, or other income sources like a pension, and\n2. A negative urine analysis test.\n\nAdditionally, you must have paid towards your fines/fees at least 3 months in a row (even small payments count).\n\nIf interested, contact ${poNameToUse}${contactAddendum}. They must first confirm your eligibility, then can help you apply.`;
      body += US_ID_LSU_VISIT_LINK;
    } else {
      throw new Error(`Received unexpected group name: ${groupName}`);
    }
  }

  body += `\n\nReply STOP to stop receiving these messages at any time. We’re unable to respond to messages sent to this number.`;

  return body;
}

/**
 * Creates/sends a message via the TwilioAPIClient and persists the message in the DB.
 * If the messageSeriesId is provided, then create a new MessageAttempt object that
 * will be connected to an existing MessageSeries, where id = messageSeriesId. If
 * the messageSeriesId is not provided, then create a new MessageSeries object with
 * a nested MessageAttempt for the given messageType
 *
 * @param messageType The type of message we're sending
 * @param personMetadata Metadata about the person we're sending a text to
 * @param groupName The name of the group the person belongs to. Should match the values in the `group` column of the `jii_to_text` BQ product view
 * @param groupId The id of the Group that the JII belongs to
 * @param workflowExecutionId The ID of the current Workflow Execution that the message is being sent during
 * @param prisma Prisma Client
 * @param twilio Twilio API Client
 * @param messageSeriesId The id of the MessageSeries to connect the new MessageAttempt to
 */
export async function sendText(
  messageType: MessageType,
  personMetadata: PersonDataForMessage,
  groupName: string,
  groupId: string,
  workflowExecutionId: string,
  prisma: PrismaClient,
  twilio: TwilioAPIClient,
  messageSeriesId?: string,
) {
  const { phoneNumber, externalId, pseudonymizedId } = personMetadata;

  try {
    // TODO(#7745): Get the copy from group table or state-level
    const messageBody = getIdahoLSUMessageBody(
      personMetadata,
      messageType,
      groupName,
    );

    // If it's currently earlier than EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS, schedule send the message for later
    const nowUTC = new Date();
    const nowUTCHour = nowUTC.getUTCHours();

    let sendAt: Date | undefined = undefined;

    // TODO(#8153): Revisit desired time when adding a new state, topic, or group
    if (nowUTCHour < EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS) {
      // Change the Date() by setting the UTC hours to the desired UTC hours for Idaho
      nowUTC.setUTCHours(EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS);
      sendAt = nowUTC;
    }

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
    } = await twilio.createMessage(messageBody, phoneNumber, sendAt);

    console.log(
      `Created ${messageType} via Twilio client for ${personMetadata.pseudonymizedId}`,
    );

    const messageStatus = mapTwilioStatusToInternalStatus(status);
    // Note: the timezone we get from Twilio doesn't matter because Prisma converts
    // to UTC under the hood on creation of dates
    if (messageSeriesId) {
      // If the messageSeriesId exists, connect this MessageAttempt to the MessageSeries
      await prisma.messageAttempt.create({
        data: {
          twilioMessageSid: sid,
          body: body,
          phoneNumber: phoneNumber,
          status: messageStatus,
          createdTimestamp: dateCreated,
          twilioSentTimestamp: dateSent,
          lastUpdatedTimestamp: dateCreated,
          workflowExecutionId: workflowExecutionId,
          messageSeriesId: messageSeriesId,
          error: errorMessage,
          errorCode: errorCode,
          ...(sendAt === undefined ? {} : { requestedSendTimestamp: sendAt }),
        },
      });
    } else {
      // If no messageSeriesId is provided, then create a new MessageSeries object
      await prisma.messageSeries.create({
        data: {
          messageType: messageType,
          personExternalId: externalId,
          groupId: groupId,
          messageAttempts: {
            create: [
              {
                twilioMessageSid: sid,
                body: body,
                phoneNumber: phoneNumber,
                status: messageStatus,
                createdTimestamp: dateCreated,
                workflowExecutionId: workflowExecutionId,
                twilioSentTimestamp: dateSent,
                lastUpdatedTimestamp: dateCreated,
                error: errorMessage,
                errorCode: errorCode,
                ...(sendAt === undefined
                  ? {}
                  : { requestedSendTimestamp: sendAt }),
              },
            ],
          },
        },
      });
    }

    console.log(
      `Persisted ${messageType} message in DB for ${personMetadata.pseudonymizedId}`,
    );
    return sid;
  } catch (e) {
    console.log(
      `Encountered error in sending ${messageType} to ${personMetadata.pseudonymizedId}`,
    );
    captureException(`Error in sendText for ${pseudonymizedId}: ${e}`);
    return undefined;
  }
}

/**
 * Returns True if we have sent the max number of attempts for a MessageSeries
 * and the latest attempt has status=FAILURE, which implies
 * the other MessageAttempts are also failures
 *
 * @param messageSeries A MessageSeries object for a given JII
 * @returns True if all associated MessageAttempts in the series have failed
 */
function allTextAttemptsForSeriesFailed(
  messageSeries: MessageSeriesWithAttemptsAndGroup,
) {
  const messageAttempts = messageSeries.messageAttempts.sort(
    messageAttemptSortByCreatedTimestampDesc,
  );

  if (
    messageAttempts.length >= MAX_RETRY_ATTEMPTS &&
    messageAttempts[0].status === MessageAttemptStatus.FAILURE
  ) {
    return true;
  }

  return false;
}

/**
 * Returns the action taken given the provided input when the latest message
 * sent is an initial text.
 *
 * @param prisma Prisma client used to query the DB
 * @param twilio Twilio client used to send messages
 * @param workflowExecutionId WorkflowExecution id to associate message attempts with
 * @param personMetadata Information needed when sending a text to a given person
 * @param groupName Name of the person's current group
 * @param groupId Id of the person's current group
 * @param latestMessageAttemptStatus Status of the latest MessageAttempt that was sent to this person
 * @param shouldRetry Whether or not the message should be retried
 * @param dryRun Whether or not to make request to Twilio
 * @param latestMessageSeriesId If provided, the MessageSeries that any new MessageAttempts should be associated with
 * @returns ScriptAction that is taken for this person
 */
async function handleLatestMessageTypeIsInitialText(
  prisma: PrismaClient,
  twilio: TwilioAPIClient,
  workflowExecutionId: string,
  personMetadata: PersonDataForMessage,
  groupName: string,
  groupId: string,
  latestMessageAttemptStatus: MessageAttemptStatus,
  shouldRetry: boolean,
  dryRun = true,
  latestMessageSeriesId?: string,
): Promise<ScriptAction> {
  const { pseudonymizedId } = personMetadata;
  console.log(
    `Processing handleLatestMessageTypeIsInitialText for ${pseudonymizedId}`,
  );
  // If the last message we sent was a sucessfully delivered initial text,
  // then send an eligibility text.
  if (latestMessageAttemptStatus === MessageAttemptStatus.SUCCESS) {
    if (dryRun) {
      console.log(`Skipped sending eligibility message for ${pseudonymizedId}`);
      return ScriptAction.ELIGIBILITY_MESSAGE_SENT;
    }

    const message = await sendText(
      MessageType.ELIGIBILITY_TEXT,
      personMetadata,
      groupName,
      groupId,
      workflowExecutionId,
      prisma,
      twilio,
    );

    console.log(
      `Executed sendText logic for eligibility text to ${pseudonymizedId}`,
    );

    if (message) {
      return ScriptAction.ELIGIBILITY_MESSAGE_SENT;
    } else {
      return ScriptAction.ERROR;
    }
  }

  // Retry the message and add an attempt to the existing series by
  // passing the latestMessageSeriesId to sendText
  if (
    latestMessageAttemptStatus === MessageAttemptStatus.FAILURE &&
    shouldRetry
  ) {
    if (dryRun) {
      console.log(`Skipped resending initial message for ${pseudonymizedId}`);
      return ScriptAction.INITIAL_MESSAGE_SENT;
    }

    const message = await sendText(
      MessageType.INITIAL_TEXT,
      personMetadata,
      groupName,
      groupId,
      workflowExecutionId,
      prisma,
      twilio,
      latestMessageSeriesId,
    );

    console.log(
      `Executed sendText logic for resending initial text to ${pseudonymizedId}`,
    );

    if (message) {
      return ScriptAction.INITIAL_MESSAGE_SENT;
    } else {
      return ScriptAction.ERROR;
    }
  }

  return ScriptAction.NOOP;
}

/**
 * Returns the action taken given the provided input when the latest message
 * sent is an eligibility text.
 *
 * @param prisma Prisma client used to query the DB
 * @param twilio Twilio client used to send messages
 * @param workflowExecutionId WorkflowExecution id to associate message attempts with
 * @param personMetadata Information needed when sending a text to a given person
 * @param currentGroupName Name of the person's current group
 * @param currentGroupId Id of the person's current group
 * @param previousGroupId Id of the group that the person was in when the latest MessageAttempt was sent
 * @param latestMessageAttemptStatus Status of the latest MessageAttempt that was sent to this person
 * @param shouldRetry Whether or not the message should be retried
 * @param dryRun Whether or not to make request to Twilio
 * @param latestMessageSeriesId If provided, the MessageSeries that any new MessageAttempts should be associated with
 * @returns ScriptAction that is taken for this person
 */
async function handleLatestMessageTypeIsEligibilityText(
  prisma: PrismaClient,
  twilio: TwilioAPIClient,
  workflowExecutionId: string,
  personMetadata: PersonDataForMessage,
  currentGroupName: string,
  currentGroupId: string,
  previousGroupId: string,
  latestMessageAttemptStatus: MessageAttemptStatus,
  shouldRetry: boolean,
  daysSinceLastMessageAttempt: number,
  dryRun = true,
  latestMessageSeriesId?: string,
): Promise<ScriptAction> {
  const { pseudonymizedId } = personMetadata;
  console.log(
    `Processing handleLatestMessageTypeIsEligibilityText for ${pseudonymizedId}`,
  );
  // If the latest eligibility text succeeded, but the person's group is different,
  // then send a new eligibility text
  if (
    latestMessageAttemptStatus === MessageAttemptStatus.SUCCESS &&
    (currentGroupId !== previousGroupId || daysSinceLastMessageAttempt >= 90)
  ) {
    if (dryRun) {
      console.log(
        `Skipped sending eligibility message for new group for ${pseudonymizedId}`,
      );
      return ScriptAction.ELIGIBILITY_MESSAGE_SENT;
    }

    const message = await sendText(
      MessageType.ELIGIBILITY_TEXT,
      personMetadata,
      currentGroupName,
      currentGroupId,
      workflowExecutionId,
      prisma,
      twilio,
    );

    console.log(
      `Executed sendText logic for sending eligibility text for new group to ${pseudonymizedId}`,
    );

    if (message) {
      return ScriptAction.ELIGIBILITY_MESSAGE_SENT;
    } else {
      return ScriptAction.ERROR;
    }
  }

  // Retry the message and add an attempt to the existing series by
  // passing the latestMessageSeriesId to sendText
  if (
    latestMessageAttemptStatus === MessageAttemptStatus.FAILURE &&
    shouldRetry
  ) {
    if (dryRun) {
      console.log(`Skipped resending initial message for ${pseudonymizedId}`);
      return ScriptAction.ELIGIBILITY_MESSAGE_SENT;
    }

    const message = await sendText(
      MessageType.ELIGIBILITY_TEXT,
      personMetadata,
      currentGroupName,
      currentGroupId,
      workflowExecutionId,
      prisma,
      twilio,
      latestMessageSeriesId,
    );

    console.log(
      `Executed sendText logic for resending eligibility text to ${pseudonymizedId}`,
    );

    if (message) {
      return ScriptAction.ELIGIBILITY_MESSAGE_SENT;
    } else {
      return ScriptAction.ERROR;
    }
  }

  return ScriptAction.NOOP;
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
 * Returns the difference in days between dateOne and dateTwo.
 * This will be done like dateOne minus dateTwo, so dateOne < dateTwo, then the result will be negative
 *
 * @param dateOne
 * @param dateTwo
 * @returns number of days between the two dates
 */
function diffInDays(dateOne: Date, dateTwo: Date) {
  return moment(dateOne).diff(moment(dateTwo), "days");
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
  const currentGroup = jii.groups[0];
  console.log(
    `Processing ${jii.pseudonymizedId} in ${currentGroup.groupName} where dryRun is ${dryRun}`,
  );

  const personMetadata: PersonDataForMessage = {
    givenName: jii.givenName,
    phoneNumber: jii.phoneNumber,
    externalId: jii.externalId,
    poName: jii.poName,
    district: jii.district,
    pseudonymizedId: jii.pseudonymizedId,
  };

  if (personHasOptedOut(jii)) return ScriptAction.SKIPPED;

  // Get the relevant MessageSeries objects for the given group
  // TODO(#7573): Reevaluate when there are multiple topics/state, e.g. do we need to filter by group?
  const messageSeriesList = jii.messageSeries;

  // If there are no MessageSeries entries, we have never sent this JII a text. Thus, send an initial text.
  // TODO(#7573): Reevaluate when there are multiple topics/state, e.g. will the topics share an initial text or will there be different ones?
  if (!messageSeriesList.length) {
    if (dryRun) {
      // Don't send requests to Twilio on a dry run, but omit the action that would've been taken
      console.log(`Skipped sending initial message for ${jii.pseudonymizedId}`);
      return ScriptAction.INITIAL_MESSAGE_SENT;
    }

    // TODO(#7636): Check if topic/group are active
    const message = await sendText(
      MessageType.INITIAL_TEXT,
      personMetadata,
      currentGroup.groupName,
      currentGroup.id,
      workflowExecutionId,
      prisma,
      twilio,
    );

    console.log(
      `Executed sendText logic for sending initial text to ${jii.pseudonymizedId}`,
    );

    if (message) {
      return ScriptAction.INITIAL_MESSAGE_SENT;
    } else {
      return ScriptAction.ERROR;
    }
  }

  // Get the latest MessageSeries and the latestMessageAttempt of that series
  const {
    series: latestMessageSeries,
    latestAttemptForSeries: latestMessageAttempt,
  } = messageSeriesList
    .map((series) => {
      // Get the latest attempt for each series
      const orderedMessageAttempts = getOrderedMessageAttempts(series);
      const latestMessageAttempt = orderedMessageAttempts[0];

      return { series: series, latestAttemptForSeries: latestMessageAttempt };
    })
    .sort(
      ({ latestAttemptForSeries: a }, { latestAttemptForSeries: b }) =>
        b.createdTimestamp.getTime() - a.createdTimestamp.getTime(),
    )[0];

  if (latestMessageSeries === undefined) return ScriptAction.ERROR;

  const {
    group: { groupName: latestMessageGroupName, id: latestMessageGroupId },
    messageType: latestMessageType,
  } = latestMessageSeries;

  const daysSinceLatestMessageAttempt = diffInDays(
    new Date(),
    latestMessageAttempt.createdTimestamp,
  );

  // TODO(#8136): Remove once it's been 90 days since the April manual launch
  if (
    latestMessageGroupName === "MANUAL" &&
    daysSinceLatestMessageAttempt >= 0 &&
    daysSinceLatestMessageAttempt < 90
  ) {
    return ScriptAction.SKIPPED;
  }

  if (
    allTextAttemptsForSeriesFailed(latestMessageSeries) ||
    (latestMessageType === MessageType.ELIGIBILITY_TEXT &&
      latestMessageGroupId === currentGroup.id &&
      latestMessageAttempt.status === MessageAttemptStatus.SUCCESS &&
      daysSinceLatestMessageAttempt >= 0 &&
      daysSinceLatestMessageAttempt < 90)
  )
    return ScriptAction.SKIPPED;

  let updatedMessageAttemptStatus: MessageAttemptStatus;
  if (dryRun) {
    updatedMessageAttemptStatus = latestMessageAttempt.status;
  } else {
    try {
      // Update status for the latest message attempt by querying Twilio
      updatedMessageAttemptStatus = await updateMessageAttempt(
        prisma,
        twilio,
        latestMessageAttempt.status,
        latestMessageAttempt.twilioMessageSid,
      );
    } catch (error) {
      console.log(
        `Encountered error updating latest message status for ${jii.pseudonymizedId}`,
      );
      captureException(
        `Error in sendText for ${jii.pseudonymizedId}: ${error}`,
      );
      return ScriptAction.ERROR;
    }
  }

  const shouldRetry =
    latestMessageSeries.messageAttempts.length < MAX_RETRY_ATTEMPTS;

  if (latestMessageType === MessageType.INITIAL_TEXT) {
    return await handleLatestMessageTypeIsInitialText(
      prisma,
      twilio,
      workflowExecutionId,
      personMetadata,
      currentGroup.groupName,
      currentGroup.id,
      updatedMessageAttemptStatus,
      shouldRetry,
      dryRun,
      latestMessageSeries.id,
    );
  }

  if (latestMessageType === MessageType.ELIGIBILITY_TEXT) {
    return await handleLatestMessageTypeIsEligibilityText(
      prisma,
      twilio,
      workflowExecutionId,
      personMetadata,
      currentGroup.groupName,
      currentGroup.id,
      latestMessageGroupId,
      updatedMessageAttemptStatus,
      shouldRetry,
      daysSinceLatestMessageAttempt,
      dryRun,
      latestMessageSeries.id,
    );
  }

  return ScriptAction.NOOP;
}
