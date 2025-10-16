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
  Prisma,
  PrismaClient,
  StateCode,
  Status,
} from "@prisma/jii-texting/client";
import { flush, init } from "@sentry/node";
import sentryTestkit from "sentry-testkit";
import {
  MessageInstance,
  MessageStatus,
} from "twilio/lib/rest/api/v2010/account/message";

import { getPrismaClientForStateCode } from "~@jii-texting/prisma";
import {
  auditNumMessagesAttemptedChangeRatio,
  getOrderedMessageAttempts,
  mapTwilioStatusToInternalStatus,
  MessageSeriesWithAttemptsAndGroup,
  updateMessageStatuses,
} from "~@jii-texting/utils";
import {
  fakeContactOne,
  fakeUsTxPersonOne,
  fakeWorkflowExecutionOne,
  fakeWorkflowExecutionTwo,
} from "~@jii-texting/utils/test/constants";
import { TwilioAPIClient } from "~twilio-api";

vi.mock("~twilio-api");
const testUsTxPrismaClient = getPrismaClientForStateCode(StateCode.US_TX);
const testTwilioClient = new TwilioAPIClient(
  "account-sid",
  "token",
  "subaccount",
);

const PRISMA_TABLES = Prisma.dmmf.datamodel.models
  .map((model) => model.name)
  .filter((table) => table);

async function resetDb(prismaClient: PrismaClient) {
  await prismaClient.$transaction(
    PRISMA_TABLES.map((table) =>
      prismaClient.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

// Sentry test setup
const { testkit, sentryTransport } = sentryTestkit();

export async function testAndGetSentryReports(expectedLength = 1) {
  // Use waitFor because sentry-testkit can be async
  const sentryReports = await vi.waitFor(async () => {
    const reports = testkit.reports();
    expect(reports).toHaveLength(expectedLength);

    return reports;
  });

  return sentryReports;
}

beforeEach(async () => {
  await resetDb(testUsTxPrismaClient);
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  testkit.reset();
});

test.each([
  ["accepted", MessageAttemptStatus.IN_PROGRESS],
  ["failed", MessageAttemptStatus.FAILURE],
  ["delivered", MessageAttemptStatus.SUCCESS],
  ["receiving", MessageAttemptStatus.UNKNOWN],
])("mapTwilioStatusToInternalStatus %s returns %s", (input, expected) => {
  expect(mapTwilioStatusToInternalStatus(input as MessageStatus)).toBe(
    expected,
  );
});

describe("getOrderedMessageAttemptFromMessageSeries", () => {
  test("one MessageSeries", async () => {
    const messageSeries: MessageSeriesWithAttemptsAndGroup = {
      messageType: MessageType.INITIAL_TEXT,
      id: "message-series-id",
      personExternalId: "person-ext-id-1",
      groupId: "group-id-1",
      messageAttempts: [
        {
          id: "attempt-id-1",
          twilioMessageSid: "initial-msg-id-1",
          status: MessageAttemptStatus.IN_PROGRESS,
          createdTimestamp: new Date("2025-03-04"),
        },
      ],
      group: {
        id: "group-id-1",
        topicId: "topic-id",
        status: Status.ACTIVE,
        messageCopyTemplate: "Template",
        groupName: "GROUP_ONE",
      },
    };

    const result = getOrderedMessageAttempts(messageSeries);
    expect(result[0].id).toBe("attempt-id-1");
  });

  test("one MessageSeries with multiple attempts", async () => {
    const messageSeries: MessageSeriesWithAttemptsAndGroup = {
      messageType: MessageType.INITIAL_TEXT,
      id: "message-series-id",
      personExternalId: "person-ext-id-1",
      groupId: "group-id-1",
      messageAttempts: [
        {
          id: "attempt-id-1",
          twilioMessageSid: "initial-msg-id-1",
          status: MessageAttemptStatus.IN_PROGRESS,
          createdTimestamp: new Date("2025-03-04"),
        },
        {
          id: "attempt-id-2",
          twilioMessageSid: "initial-msg-id-1",
          status: MessageAttemptStatus.IN_PROGRESS,
          createdTimestamp: new Date("2025-03-05"),
        },
      ],
      group: {
        id: "group-id-1",
        topicId: "topic-id",
        status: Status.ACTIVE,
        messageCopyTemplate: "Template",
        groupName: "GROUP_ONE",
      },
    };

    const result = getOrderedMessageAttempts(messageSeries);
    expect(
      result.map(
        (attempt: {
          id: string;
          twilioMessageSid: string;
          status: MessageAttemptStatus;
          createdTimestamp: Date;
        }) => attempt.id,
      ),
    ).toEqual(["attempt-id-2", "attempt-id-1"]);
  });
});

describe("updateMessageStatuses", () => {
  beforeEach(async () => {
    console.log(`Initializing Texas database...`);

    await testUsTxPrismaClient.workflowExecution.createMany({
      data: [fakeWorkflowExecutionOne],
    });

    // Create a person with one contact
    await testUsTxPrismaClient.person.create({
      data: {
        ...fakeUsTxPersonOne,
        contacts: {
          create: {
            ...fakeContactOne,
          },
        },
      },
    });
  });

  test("no in-progress messages", async () => {
    await updateMessageStatuses(testUsTxPrismaClient, testTwilioClient);
    expect(TwilioAPIClient.prototype.getMessage).not.toBeCalled();
  });

  describe("person has messages", () => {
    beforeEach(async () => {
      // Add welcome message
      await testUsTxPrismaClient.welcomeMessageSeries.create({
        data: {
          person: { connect: { personId: fakeUsTxPersonOne?.personId } },
          messageAttempts: {
            create: [
              {
                twilioMessageSid: "welcome-message-sid",
                body: "Hello world",
                phoneNumber: fakeUsTxPersonOne.phoneNumber,
                status: MessageAttemptStatus.IN_PROGRESS,
                createdTimestamp:
                  fakeWorkflowExecutionOne.workflowExecutionTime,
                workflowExecutionId: fakeWorkflowExecutionOne.id,
              },
            ],
          },
        },
      });
    });

    test("message succeeded, status updated", async () => {
      vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
        sid: "welcome-message-sid",
        status: "delivered",
      } as MessageInstance);

      await updateMessageStatuses(testUsTxPrismaClient, testTwilioClient);
      expect(TwilioAPIClient.prototype.getMessage).toHaveBeenCalledWith(
        "welcome-message-sid",
      );

      const messageAttempt =
        await testUsTxPrismaClient.welcomeMessageAttempt.findUniqueOrThrow({
          where: { twilioMessageSid: "welcome-message-sid" },
        });
      expect(messageAttempt.status).toBe(MessageAttemptStatus.SUCCESS);
    });

    test("message is not in-progress", async () => {
      // Setup
      await testUsTxPrismaClient.welcomeMessageAttempt.update({
        where: {
          twilioMessageSid: "welcome-message-sid",
        },
        data: {
          status: MessageAttemptStatus.SUCCESS,
        },
      });

      await updateMessageStatuses(testUsTxPrismaClient, testTwilioClient);
      expect(TwilioAPIClient.prototype.getMessage).not.toBeCalled();
    });

    describe("person has multiple in progress messages", () => {
      beforeEach(async () => {
        // Add contact reminder message
        await testUsTxPrismaClient.contactReminderMessageSeries.create({
          data: {
            contact: { connect: { externalId: fakeContactOne.externalId } },
            person: { connect: { personId: fakeUsTxPersonOne?.personId } },
            reminderType: "WITHIN_ONE_DAY",
            messageAttempts: {
              create: [
                {
                  twilioMessageSid: "reminder-message-sid",
                  body: "Hello world",
                  phoneNumber: fakeUsTxPersonOne.phoneNumber,
                  status: MessageAttemptStatus.IN_PROGRESS,
                  createdTimestamp:
                    fakeWorkflowExecutionOne.workflowExecutionTime,
                  workflowExecutionId: fakeWorkflowExecutionOne.id,
                },
              ],
            },
          },
        });
      });

      test("Twilio API called twice successfully", async () => {
        vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
          sid: "message-sid",
          status: "delivered",
        } as MessageInstance);

        await updateMessageStatuses(testUsTxPrismaClient, testTwilioClient);
        expect(TwilioAPIClient.prototype.getMessage).toBeCalledTimes(2);

        const welcomeMessageAttempt =
          await testUsTxPrismaClient.welcomeMessageAttempt.findUniqueOrThrow({
            where: { twilioMessageSid: "welcome-message-sid" },
          });
        expect(welcomeMessageAttempt.status).toBe(MessageAttemptStatus.SUCCESS);

        const reminderMessageAttempt =
          await testUsTxPrismaClient.contactReminderMessageAttempt.findUniqueOrThrow(
            {
              where: { twilioMessageSid: "reminder-message-sid" },
            },
          );
        expect(reminderMessageAttempt.status).toBe(
          MessageAttemptStatus.SUCCESS,
        );
      });

      test("Twilio API errors for less than 75% success", async () => {
        vi.mocked(TwilioAPIClient.prototype.getMessage).mockRejectedValue(
          new Error("test"),
        );

        await expect(
          updateMessageStatuses(testUsTxPrismaClient, testTwilioClient),
        ).rejects.toThrow(
          `Less than 75% of in-progress messages were successfully updated`,
        );
      });
    });
  });
});

describe("getNumMessagesSentChangeRatio", () => {
  describe("previous executions exist", () => {
    beforeEach(async () => {
      console.log(`Initializing Texas database...`);

      await testUsTxPrismaClient.workflowExecution.createMany({
        data: [fakeWorkflowExecutionOne, fakeWorkflowExecutionTwo],
      });

      // Create a person with one welcome message in earlier execution
      const series = await testUsTxPrismaClient.welcomeMessageSeries.create({
        data: {
          person: { create: { ...fakeUsTxPersonOne } },
          messageAttempts: {
            create: [
              {
                twilioMessageSid: "welcome-message-sid-1",
                body: "Hello world",
                phoneNumber: fakeUsTxPersonOne.phoneNumber,
                status: MessageAttemptStatus.IN_PROGRESS,
                createdTimestamp:
                  fakeWorkflowExecutionOne.workflowExecutionTime,
                workflowExecutionId: fakeWorkflowExecutionOne.id,
              },
            ],
          },
        },
      });

      // Add a message in the latest execution
      await testUsTxPrismaClient.welcomeMessageAttempt.create({
        data: {
          messageSeriesId: series.id,
          twilioMessageSid: "welcome-message-sid-2",
          body: "Hello world",
          phoneNumber: fakeUsTxPersonOne.phoneNumber,
          status: MessageAttemptStatus.IN_PROGRESS,
          createdTimestamp: fakeWorkflowExecutionTwo.workflowExecutionTime,
          workflowExecutionId: fakeWorkflowExecutionTwo.id,
        },
      });
    });

    test("change ratio <= 0.5", async () => {
      const changeRatio = await auditNumMessagesAttemptedChangeRatio(
        testUsTxPrismaClient,
        fakeWorkflowExecutionTwo.id,
      );

      expect(changeRatio).toBe(0);
    });

    test("change ratio > 0.5", async () => {
      // Add two additional messages to the latest execution
      const series =
        await testUsTxPrismaClient.welcomeMessageSeries.findUniqueOrThrow({
          where: { personExternalId: fakeUsTxPersonOne.stableExternalId },
        });

      await testUsTxPrismaClient.welcomeMessageAttempt.createMany({
        data: [
          {
            twilioMessageSid: "welcome-message-sid-3",
            body: "Hello world",
            phoneNumber: fakeUsTxPersonOne.phoneNumber,
            status: MessageAttemptStatus.IN_PROGRESS,
            createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
            workflowExecutionId: fakeWorkflowExecutionTwo.id,
            messageSeriesId: series.id,
          },
          {
            twilioMessageSid: "welcome-message-sid-4",
            body: "Hello world",
            phoneNumber: fakeUsTxPersonOne.phoneNumber,
            status: MessageAttemptStatus.IN_PROGRESS,
            createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
            workflowExecutionId: fakeWorkflowExecutionTwo.id,
            messageSeriesId: series.id,
          },
        ],
      });

      const changeRatio = await auditNumMessagesAttemptedChangeRatio(
        testUsTxPrismaClient,
        fakeWorkflowExecutionTwo.id,
      );

      expect(changeRatio).toBe(2);

      await flush();

      // Ensure captureException called
      const sentryReports = await testAndGetSentryReports(1);
      expect(sentryReports.length).toBe(1);
    });
  });
});
