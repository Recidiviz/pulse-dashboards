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
} from "@prisma/jii-texting-server/client";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";

import {
  fakePersonOne,
  fakeWorkflowExecutionOne,
  fakeWorkflowExecutionThree,
  fakeWorkflowExecutionTwo,
} from "~@jii-texting-server/utils/test/constants";
import { processJii } from "~jii-texting-jobs/scripts/process-jii";
import { testPrismaClient } from "~jii-texting-jobs/test/setup/index";
import { TwilioAPIClient } from "~twilio-api";

vi.mock("~twilio-api");

vi.stubEnv("TWILIO_MESSAGING_SERVICE_SID_US_ID", "");

describe("one person in DB without prior messages, thus send initial text", () => {
  test("validate Twilio createMessage call", async () => {
    await processJii({
      stateCode: StateCode.US_ID,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(
      TwilioAPIClient.prototype.createMessage,
    ).toHaveBeenCalledExactlyOnceWith(
      // TODO(#7566): Get the real copy from group or state-level
      "This is the message body",
      fakePersonOne.phoneNumber,
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
      status: "sent",
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

  describe("initial text sent successfully", () => {
    beforeEach(() => {
      vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
        sid: "message-sid-1",
        status: "sent",
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
        status: "sent",
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
      status: "sent",
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
      status: "sent",
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
});
