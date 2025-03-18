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
      "This is an initial text",
      fakePersonOne.phoneNumber,
    );
  });

  test("validate Prisma write on Twilio createMessage success", async () => {
    vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
      sid: "twilio-message-sid",
      status: "queued",
    } as MessageInstance);

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

  test("MessageAttempt is updated", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-1",
      status: "sent",
    } as MessageInstance);

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

    expect(newMessageAttempt.status).toBe(MessageAttemptStatus.SUCCESS);
  });
});

describe("one person in DB with multiple initial text attempts", () => {
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

    expect(TwilioAPIClient.prototype.getMessage).toHaveBeenCalledOnce();
    expect(TwilioAPIClient.prototype.getMessage).toHaveBeenCalledWith(
      "message-sid-2",
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
