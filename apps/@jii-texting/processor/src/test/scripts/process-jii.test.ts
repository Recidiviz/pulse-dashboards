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
  StateCode,
} from "@prisma/jii-texting/client";
import { init } from "@sentry/node";
import moment from "moment";
import sentryTestkit from "sentry-testkit";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";

import { processJii } from "~@jii-texting/processor/scripts/process-jii";
import { testPrismaClient } from "~@jii-texting/processor/test/setup/index";
import { EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS } from "~@jii-texting/utils/common/constants";
import {
  fakeMissingDA,
  fakePersonOne,
  fakeWorkflowExecutionOne,
  fakeWorkflowExecutionThree,
  fakeWorkflowExecutionTwo,
} from "~@jii-texting/utils/test/constants";
import { TwilioAPIClient } from "~twilio-api";

vi.mock("~twilio-api");

vi.stubEnv("TWILIO_MESSAGING_SERVICE_SID_US_ID", "test-msg-service-sid");

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

beforeEach(() => {
  init({
    dsn: process.env["SENTRY_DSN"],
    transport: sentryTransport,
  });
});

afterEach(() => testkit.reset());

describe("one person in DB without prior messages, thus send initial text", () => {
  test("validate Twilio createMessage call", async () => {
    const spy = vi
      .spyOn(TwilioAPIClient.prototype, "createMessage")
      .mockResolvedValue({
        sid: "twilio-message-sid",
        status: "queued",
      } as MessageInstance);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "Hi Jane, we’re reaching out on behalf of the Idaho Department of Correction (IDOC). You’re now subscribed to receive updates about potential opportunities such as the Limited Supervision Unit (LSU), which offers a lower level of supervision.

      We’ll let you know by texting this number if you meet the criteria for specific programs. Receiving this message does not mean you’re already eligible for any opportunity.

      If you have questions, reach out to John Doe.

      Reply STOP to stop receiving these messages at any time. We’re unable to respond to messages sent to this number."
    `);
    expect(spy.mock.calls[0][1]).toBe(fakePersonOne.phoneNumber);
    expect(spy.mock.calls[0][2]).toBeUndefined();
  });

  test("validate Twilio createMessage for schedule send message", async () => {
    // Set the system time to be earlier than the earliest time we want to send the message
    vi.setSystemTime(
      new Date(
        Date.UTC(2025, 3, 1, EARLIEST_LSU_MESSAGE_SEND_UTC_HOURS - 1, 0, 0),
      ),
    );

    const spy = vi
      .spyOn(TwilioAPIClient.prototype, "createMessage")
      .mockResolvedValue({
        sid: "twilio-message-sid",
        status: "scheduled",
        body: "blah",
        phoneNumber: fakePersonOne.phoneNumber,
        dateCreated: new Date(),
        dateSend: new Date(),
      } as unknown as MessageInstance);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "Hi Jane, we’re reaching out on behalf of the Idaho Department of Correction (IDOC). You’re now subscribed to receive updates about potential opportunities such as the Limited Supervision Unit (LSU), which offers a lower level of supervision.

      We’ll let you know by texting this number if you meet the criteria for specific programs. Receiving this message does not mean you’re already eligible for any opportunity.

      If you have questions, reach out to John Doe.

      Reply STOP to stop receiving these messages at any time. We’re unable to respond to messages sent to this number."
    `);
    expect(spy.mock.calls[0][1]).toBe(fakePersonOne.phoneNumber);
    expect(spy.mock.calls[0][2]).toStrictEqual(
      new Date(`2025-04-01T18:00:00.000Z`),
    );

    const newMessage = await testPrismaClient.messageAttempt.findFirstOrThrow({
      where: { twilioMessageSid: "twilio-message-sid" },
    });

    expect(newMessage.status).toBe(MessageAttemptStatus.IN_PROGRESS);
    expect(newMessage.requestedSendTimestamp).toStrictEqual(
      new Date(`2025-04-01T18:00:00.000Z`),
    );
  });

  test("validate Prisma write on Twilio createMessage success", async () => {
    vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
      body: "message body",
      status: "queued",
      sid: "twilio-message-sid",
      dateCreated: new Date(),
      dateSent: new Date(),
      errorMessage: null,
      errorCode: null,
    } as unknown as MessageInstance);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    const messageSeries = await testPrismaClient.messageSeries.findMany({
      where: {
        personExternalId: fakePersonOne.externalId,
      },
      include: {
        messageAttempts: true,
      },
    });

    expect(messageSeries.length).toBe(1);
    expect(messageSeries[0].messageAttempts.length).toBe(1);
  });

  test("Twilio createMessage fails, no MessageSeries added", async () => {
    vi.mocked(TwilioAPIClient.prototype.createMessage).mockRejectedValueOnce(
      new Error("test"),
    );

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    const messageSeries = await testPrismaClient.messageSeries.findMany({
      where: {
        personExternalId: fakePersonOne.externalId,
      },
      include: {
        messageAttempts: true,
      },
    });

    expect(messageSeries.length).toBe(0);
  });
});

describe("one person in DB with initial text sent once", () => {
  beforeEach(async () => {
    const person = await testPrismaClient.person.findFirstOrThrow({
      where: { personId: fakePersonOne.personId },
      include: { groups: true },
    });

    const group = await testPrismaClient.group.findFirstOrThrow({
      where: {
        id: person?.groups[0].id,
      },
    });

    // Insert MessageSeries with single MessageAttempt
    await testPrismaClient.messageSeries.create({
      data: {
        messageType: MessageType.INITIAL_TEXT,
        group: { connect: { id: group.id } },
        person: { connect: { personId: person?.personId } },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-1",
              body: "Hello world",
              phoneNumber: person.phoneNumber,
              status: MessageAttemptStatus.IN_PROGRESS,
              createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionOne.id,
            },
          ],
        },
      },
    });
  });

  describe("person has opted out", () => {
    beforeEach(async () => {
      await testPrismaClient.person.update({
        where: {
          personId: fakePersonOne.personId,
        },
        data: {
          lastOptOutDate: new Date(),
        },
      });
    });

    test("Twilio getMessage not called", async () => {
      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      expect(TwilioAPIClient.prototype.getMessage).not.toBeCalled();
    });
  });

  test("validate Twilio getMessage call", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-1",
      status: "delivered",
    } as MessageInstance);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(
      TwilioAPIClient.prototype.getMessage,
    ).toHaveBeenCalledExactlyOnceWith("message-sid-1");
  });

  test("getMessage called with error", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockRejectedValueOnce(
      new Error("test"),
    );

    // Ensure test has correct setup with one existing MessageAttempt
    const currentMessageAttempt =
      await testPrismaClient.messageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-1" },
      });
    expect(currentMessageAttempt.status).toBe(MessageAttemptStatus.IN_PROGRESS);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    const newMessageAttempt =
      await testPrismaClient.messageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-1" },
      });

    // Ensure message has the same status
    expect(newMessageAttempt.status).toBe(MessageAttemptStatus.IN_PROGRESS);
  });

  describe("initial text sent successfully", () => {
    beforeEach(() => {
      vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
        sid: "message-sid-1",
        status: "delivered",
      } as MessageInstance);
    });

    test("MessageAttempt is updated", async () => {
      // Ensure test has correct setup with one existing MessageAttempt
      const currentMessageAttempt =
        await testPrismaClient.messageAttempt.findFirstOrThrow({
          where: { twilioMessageSid: "message-sid-1" },
        });
      expect(currentMessageAttempt.status).toBe(
        MessageAttemptStatus.IN_PROGRESS,
      );

      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      const newMessageAttempt =
        await testPrismaClient.messageAttempt.findFirstOrThrow({
          where: { twilioMessageSid: "message-sid-1" },
        });

      expect(newMessageAttempt.status).toBe(MessageAttemptStatus.SUCCESS);
    });

    test("eligibility text sent", async () => {
      vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
        body: "message body",
        status: "queued",
        sid: "twilio-message-sid",
        dateCreated: new Date(),
        dateSent: new Date(),
        errorMessage: null,
        errorCode: null,
      } as unknown as MessageInstance);

      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      const personWithMessageSeries =
        await testPrismaClient.person.findFirstOrThrow({
          where: {
            personId: fakePersonOne.personId,
          },
          include: {
            messageSeries: true,
          },
        });

      expect(personWithMessageSeries.messageSeries.length).toBe(2);
    });

    test("eligibility text sent even when person group changes", async () => {
      vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
        body: "message body",
        status: "queued",
        sid: "twilio-message-sid",
        dateCreated: new Date(),
        dateSent: new Date(),
        errorMessage: null,
        errorCode: null,
      } as unknown as MessageInstance);

      await testPrismaClient.person.update({
        where: {
          personId: fakePersonOne.personId,
        },
        data: {
          groups: { set: [] },
        },
      });

      const newGroup = await testPrismaClient.group.findFirstOrThrow({
        where: {
          groupName: fakeMissingDA.groupName,
        },
      });

      // Change the existing person's group in the setup
      await testPrismaClient.person.update({
        where: {
          personId: fakePersonOne.personId,
        },
        data: {
          groups: {
            connect: {
              id: newGroup.id,
            },
          },
        },
        select: { groups: true },
      });

      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      const personWithMessageSeries =
        await testPrismaClient.person.findFirstOrThrow({
          where: {
            personId: fakePersonOne.personId,
          },
          include: {
            messageSeries: true,
          },
        });

      expect(personWithMessageSeries.messageSeries.length).toBe(2);
    });
  });

  describe("initial text has failed status in Twilio", () => {
    beforeEach(() => {
      vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
        sid: "message-sid-1",
        status: "failed",
      } as MessageInstance);
    });

    test("MessageAttempt is updated", async () => {
      // Ensure test has correct setup with one existing MessageAttempt
      const currentMessageAttempt =
        await testPrismaClient.messageAttempt.findFirstOrThrow({
          where: { twilioMessageSid: "message-sid-1" },
        });
      expect(currentMessageAttempt.status).toBe(
        MessageAttemptStatus.IN_PROGRESS,
      );

      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      const newMessageAttempt =
        await testPrismaClient.messageAttempt.findFirstOrThrow({
          where: { twilioMessageSid: "message-sid-1" },
        });

      expect(newMessageAttempt.status).toBe(MessageAttemptStatus.FAILURE);
    });

    test("initial text is attempted again", async () => {
      // Ensure test is setup correctly
      const existingMessageAttempts =
        await testPrismaClient.messageAttempt.count({
          where: {
            phoneNumber: fakePersonOne.phoneNumber,
          },
        });

      expect(existingMessageAttempts).toBe(1);

      vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
        body: "message body",
        status: "queued",
        sid: "twilio-message-sid",
        dateCreated: new Date(),
        dateSent: new Date(),
        errorMessage: null,
        errorCode: null,
      } as unknown as MessageInstance);

      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      const messageAttempts = await testPrismaClient.messageAttempt.count({
        where: {
          phoneNumber: fakePersonOne.phoneNumber,
        },
      });

      expect(messageAttempts).toBe(2);
    });
  });
});

describe("one person in DB with three initial text attempts", () => {
  beforeEach(async () => {
    const person = await testPrismaClient.person.findFirstOrThrow({
      where: { personId: fakePersonOne.personId },
      include: { groups: true },
    });

    const group = await testPrismaClient.group.findFirstOrThrow({
      where: {
        id: person?.groups[0].id,
      },
    });

    // Insert MessageSeries with multiple MessageAttempt
    await testPrismaClient.messageSeries.create({
      data: {
        messageType: MessageType.INITIAL_TEXT,
        group: { connect: { id: group.id } },
        person: { connect: { personId: person?.personId } },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-1",
              body: "Hello world",
              phoneNumber: person.phoneNumber,
              status: MessageAttemptStatus.FAILURE,
              createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionOne.id,
            },
            {
              twilioMessageSid: "message-sid-2",
              body: "Hello world",
              status: MessageAttemptStatus.FAILURE,
              phoneNumber: person.phoneNumber,
              createdTimestamp: fakeWorkflowExecutionTwo.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionTwo.id,
            },
            {
              twilioMessageSid: "message-sid-3",
              body: "Hello world",
              status: MessageAttemptStatus.IN_PROGRESS,
              phoneNumber: person.phoneNumber,
              createdTimestamp:
                fakeWorkflowExecutionThree.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionThree.id,
            },
          ],
        },
      },
    });
  });

  describe("latest attempt is successful", () => {
    beforeEach(() => {
      vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
        sid: "message-sid-3",
        status: "delivered",
      } as MessageInstance);
    });

    test("validate Twilio getMessage call", async () => {
      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      expect(TwilioAPIClient.prototype.getMessage).toHaveBeenCalledOnce();
      expect(TwilioAPIClient.prototype.getMessage).toHaveBeenCalledWith(
        "message-sid-3",
      );
    });

    test("validate MessageAttempt is updated", async () => {
      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      const newMessageAttempt =
        await testPrismaClient.messageAttempt.findFirstOrThrow({
          where: { twilioMessageSid: "message-sid-3" },
        });

      expect(newMessageAttempt.status).toBe(MessageAttemptStatus.SUCCESS);
    });
  });

  describe("latest attempt is failure", () => {
    beforeEach(() => {
      vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
        sid: "message-sid-3",
        status: "failed",
      } as MessageInstance);
    });

    test("validate MessageAttempt is updated", async () => {
      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      const newMessageAttempt =
        await testPrismaClient.messageAttempt.findFirstOrThrow({
          where: { twilioMessageSid: "message-sid-3" },
        });

      expect(newMessageAttempt.status).toBe(MessageAttemptStatus.FAILURE);
    });

    test("validate createMessage is not called", async () => {
      await processJii({
        stateCode: StateCode.US_ID,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      });

      expect(TwilioAPIClient.prototype.createMessage).not.toBeCalled();
    });
  });
});

describe("one person with initial and eligibility message series with MANUAL group", () => {
  beforeEach(async () => {
    const topic = await testPrismaClient.topic.findFirstOrThrow();

    const group = await testPrismaClient.group.create({
      data: {
        groupName: "MANUAL",
        id: "group-id-1",
        topic: { connect: { id: topic.id } },
      },
    });

    const person = await testPrismaClient.person.findFirstOrThrow({
      where: { personId: fakePersonOne.personId },
      include: { groups: true },
    });

    // Insert first MessageSeries
    await testPrismaClient.messageSeries.create({
      data: {
        messageType: MessageType.INITIAL_TEXT,
        group: { connect: { id: group.id } },
        person: { connect: { personId: person?.personId } },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-1",
              body: "Hello world",
              phoneNumber: person.phoneNumber,
              status: MessageAttemptStatus.SUCCESS,
              createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionOne.id,
            },
          ],
        },
      },
    });

    // Insert second MessageSeries
    await testPrismaClient.messageSeries.create({
      data: {
        messageType: MessageType.ELIGIBILITY_TEXT,
        group: { connect: { id: group.id } },
        person: { connect: { personId: person?.personId } },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-2",
              body: "Hello world",
              status: MessageAttemptStatus.SUCCESS,
              phoneNumber: person.phoneNumber,
              createdTimestamp: fakeWorkflowExecutionTwo.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionTwo.id,
            },
          ],
        },
      },
    });

    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-2",
      status: "delivered",
    } as MessageInstance);
  });

  test("latest text sent within last 90 days", async () => {
    vi.useFakeTimers();
    const fiveDaysFromLatestMessageAttempt = moment(
      fakeWorkflowExecutionTwo.workflowExecutionTime,
    ).add(moment.duration({ days: 5 }));

    vi.setSystemTime(fiveDaysFromLatestMessageAttempt.toDate());

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    const personWithMessageSeries =
      await testPrismaClient.person.findFirstOrThrow({
        where: {
          personId: fakePersonOne.personId,
        },
        include: {
          messageSeries: true,
        },
      });

    expect(personWithMessageSeries.messageSeries.length).toBe(2);

    vi.useRealTimers();
  });

  test("latest text sent more than 90 days ago", async () => {
    vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
      body: "message body",
      status: "queued",
      sid: "twilio-message-sid",
      dateCreated: new Date(),
      dateSent: new Date(),
      errorMessage: null,
      errorCode: null,
    } as unknown as MessageInstance);

    vi.useFakeTimers();
    const over90DaysFromLatestMessageAttempt = moment(
      fakeWorkflowExecutionTwo.workflowExecutionTime,
    ).add(moment.duration({ days: 91 }));

    vi.setSystemTime(over90DaysFromLatestMessageAttempt.toDate());

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    const personWithMessageSeries =
      await testPrismaClient.person.findFirstOrThrow({
        where: {
          personId: fakePersonOne.personId,
        },
        include: {
          messageSeries: true,
        },
      });

    expect(personWithMessageSeries.messageSeries.length).toBe(3);

    vi.useRealTimers();
  });
});

describe("one person with initial and eligibility message series", () => {
  beforeEach(async () => {
    const person = await testPrismaClient.person.findFirstOrThrow({
      where: { personId: fakePersonOne.personId },
      include: { groups: true },
    });

    const group = await testPrismaClient.group.findFirstOrThrow({
      where: {
        id: person?.groups[0].id,
      },
    });

    // Insert first MessageSeries
    await testPrismaClient.messageSeries.create({
      data: {
        messageType: MessageType.INITIAL_TEXT,
        group: { connect: { id: group.id } },
        person: { connect: { personId: person?.personId } },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-1",
              body: "Hello world",
              phoneNumber: person.phoneNumber,
              status: MessageAttemptStatus.SUCCESS,
              createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionOne.id,
            },
          ],
        },
      },
    });

    // Insert second MessageSeries
    await testPrismaClient.messageSeries.create({
      data: {
        messageType: MessageType.ELIGIBILITY_TEXT,
        group: { connect: { id: group.id } },
        person: { connect: { personId: person?.personId } },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-2",
              body: "Hello world",
              status: MessageAttemptStatus.IN_PROGRESS,
              phoneNumber: person.phoneNumber,
              createdTimestamp: fakeWorkflowExecutionTwo.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionTwo.id,
            },
          ],
        },
      },
    });
  });

  test("validate Twilio getMessage call", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-2",
      status: "delivered",
    } as MessageInstance);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(TwilioAPIClient.prototype.getMessage).toHaveBeenCalledWith(
      "message-sid-2",
    );
    expect(TwilioAPIClient.prototype.getMessage).not.toHaveBeenCalledWith(
      "message-sid-1",
    );
  });

  test("validate MessageAttempt is updated", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-2",
      status: "delivered",
    } as MessageInstance);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    const newMessageAttempt =
      await testPrismaClient.messageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-2" },
      });

    expect(newMessageAttempt.status).toBe(MessageAttemptStatus.SUCCESS);
  });

  describe("eligiblity text is successful", () => {
    beforeEach(async () => {
      vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
        sid: "message-sid-2",
        status: "delivered",
      } as MessageInstance);
    });

    describe("group stays the same", () => {
      test("eligibility text not sent on run within 90 days", async () => {
        vi.useFakeTimers();
        const fiveDaysFromLatestMessageAttempt = moment(
          fakeWorkflowExecutionTwo.workflowExecutionTime,
        ).add(moment.duration({ days: 5 }));

        vi.setSystemTime(fiveDaysFromLatestMessageAttempt.toDate());

        await processJii({
          stateCode: StateCode.US_ID,
          dryRun: false,
          workflowExecutionId: fakeWorkflowExecutionOne.id,
        });

        const personWithMessageSeries =
          await testPrismaClient.person.findFirstOrThrow({
            where: {
              personId: fakePersonOne.personId,
            },
            include: {
              messageSeries: true,
            },
          });

        expect(personWithMessageSeries.messageSeries.length).toBe(2);

        // Ensure captureException not called
        const sentryReports = await testAndGetSentryReports(0);
        expect(sentryReports.length).toBe(0);

        vi.useRealTimers();
      });

      test("eligibility text sent if 90 days after", async () => {
        vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
          body: "message body",
          status: "queued",
          sid: "twilio-message-sid",
          dateCreated: new Date(),
          dateSent: new Date(),
          errorMessage: null,
          errorCode: null,
        } as unknown as MessageInstance);

        vi.useFakeTimers();
        const over90DaysFromLatestMessageAttempt = moment(
          fakeWorkflowExecutionTwo.workflowExecutionTime,
        ).add(moment.duration({ days: 91 }));

        vi.setSystemTime(over90DaysFromLatestMessageAttempt.toDate());

        await processJii({
          stateCode: StateCode.US_ID,
          dryRun: false,
          workflowExecutionId: fakeWorkflowExecutionOne.id,
        });

        const personWithMessageSeries =
          await testPrismaClient.person.findFirstOrThrow({
            where: {
              personId: fakePersonOne.personId,
            },
            include: {
              messageSeries: true,
            },
          });

        expect(personWithMessageSeries.messageSeries.length).toBe(3);

        // Ensure captureException not called
        const sentryReports = await testAndGetSentryReports(0);
        expect(sentryReports.length).toBe(0);

        vi.useRealTimers();
      });
    });

    describe("group changes", () => {
      beforeEach(async () => {
        await testPrismaClient.person.update({
          where: {
            personId: fakePersonOne.personId,
          },
          data: {
            groups: { set: [] },
          },
        });

        const newGroup = await testPrismaClient.group.findFirstOrThrow({
          where: {
            groupName: fakeMissingDA.groupName,
          },
        });

        // Change the existing person's group in the setup
        await testPrismaClient.person.update({
          where: {
            personId: fakePersonOne.personId,
          },
          data: {
            groups: {
              connect: {
                id: newGroup.id,
              },
            },
          },
          select: { groups: true },
        });
      });

      test("eligiblity text sent for new group", async () => {
        vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
          body: "message body",
          status: "queued",
          sid: "twilio-message-sid",
          dateCreated: new Date(),
          dateSent: new Date(),
          errorMessage: null,
          errorCode: null,
        } as unknown as MessageInstance);

        await processJii({
          stateCode: StateCode.US_ID,
          dryRun: false,
          workflowExecutionId: fakeWorkflowExecutionOne.id,
        });

        const personWithMessageSeries =
          await testPrismaClient.person.findFirstOrThrow({
            where: {
              personId: fakePersonOne.personId,
            },
            include: {
              messageSeries: true,
            },
          });

        expect(personWithMessageSeries.messageSeries.length).toBe(3);
      });
    });
  });
});

test.each([
  ["District 1", "FULLY_ELIGIBLE"],
  ["District 2", "MISSING_INCOME_VERIFICATION"],
  ["district 3", "MISSING_DA"],
  ["district 4", "TWO_MISSING_CRITERIA"],
  ["DISTRICT 5", "ELIGIBLE_MISSING_FINES_AND_FEES"],
  ["District 7", "MISSING_INCOME_VERIFICATION"],
])(
  "copy for person where district=%s and group=%s",
  async (district, groupName) => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-1",
      status: "delivered",
    } as MessageInstance);

    const group = await testPrismaClient.group.findFirstOrThrow({
      where: {
        groupName: groupName,
      },
    });

    await testPrismaClient.person.update({
      where: { personId: fakePersonOne.personId },
      data: {
        district: district,
        groups: {
          set: [{ id: group.id }],
        },
      },
    });

    // Insert MessageSeries with single MessageAttempt for the test group
    await testPrismaClient.messageSeries.create({
      data: {
        messageType: MessageType.INITIAL_TEXT,
        group: { connect: { id: group.id } },
        person: { connect: { personId: fakePersonOne?.personId } },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-1",
              body: "Hello world",
              phoneNumber: fakePersonOne.phoneNumber,
              status: MessageAttemptStatus.SUCCESS,
              createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionOne.id,
            },
          ],
        },
      },
    });

    const spy = vi
      .spyOn(TwilioAPIClient.prototype, "createMessage")
      .mockResolvedValue({
        body: "message body",
        status: "queued",
        sid: "twilio-message-sid",
        dateCreated: new Date(),
        dateSent: new Date(),
        errorMessage: null,
        errorCode: null,
      } as unknown as MessageInstance);

    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchSnapshot();
    expect(spy.mock.calls[0][1]).toBe(fakePersonOne.phoneNumber);
  },
);
