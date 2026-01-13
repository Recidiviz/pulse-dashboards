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

import { MessageAttemptStatus, StateCode } from "@prisma/jii-texting/client";
import { init } from "@sentry/node";
import sentryTestkit from "sentry-testkit";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";

import { processJiiContactReminders } from "~@jii-texting/processor/scripts/process-jii-contact-reminders";
import { testUsTxPrismaClient } from "~@jii-texting/processor/test/setup";
import {
  ScriptAction,
  US_TX_EARLIEST_MESSAGE_SEND_UTC_HOURS,
} from "~@jii-texting/utils";
import {
  fakeContactOne,
  fakePersonOne,
  fakeWorkflowExecutionOne,
  fakeWorkflowExecutionThree,
  fakeWorkflowExecutionTwo,
} from "~@jii-texting/utils/test/constants";
import { TwilioAPIClient } from "~twilio-api";

vi.mock("~twilio-api");

vi.stubEnv("TWILIO_MESSAGING_SERVICE_SID_US_TX", "test-msg-service-sid");

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

describe("one person in DB without prior messages", () => {
  test("sends welcome text", async () => {
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

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Validates the request to the createMessage API
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "Hi Jane, we’re reaching out on behalf of the Texas Department of Criminal Justice (TDCJ). You’re now subscribed to receive updates about appointments and other items related to your parole.

      If you have questions, reach out to Officer John Doe at 9879879879. Please note each appointment reminder will specify if you are meeting with your primary officer or another officer.

      Reply STOP to stop receiving these messages at any time. We’re unable to respond to messages sent to this number."
    `);
    expect(spy.mock.calls[0][1]).toBe(fakePersonOne.phoneNumber);
    expect(spy.mock.calls[0][2]).toBeUndefined();

    // Validates the WelcomeMessageSeries is persisted
    const welcomeMessageSeries =
      await testUsTxPrismaClient.welcomeMessageSeries.findMany({
        where: {
          personExternalId: fakePersonOne.stableExternalId,
        },
        include: {
          messageAttempts: true,
        },
      });

    expect(welcomeMessageSeries.length).toBe(1);
    expect(welcomeMessageSeries[0].messageAttempts.length).toBe(1);
  });

  test("doesn't welcome text after desired hours", async () => {
    // Set the system time to be later than the latest time we want to send the message
    vi.setSystemTime(
      new Date(
        Date.UTC(2025, 3, 1, 4, 30, 0), // the fourth argument is the hours in UTC, which is equivalent to 22 in CDT
      ),
    );

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

    const results = await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Validates no request made to the createMessage API
    expect(spy).not.toBeCalled();
    expect(results).toEqual(
      expect.objectContaining({
        [ScriptAction.SKIPPED]: [fakePersonOne.pseudonymizedId],
      }),
    );

    // Validates no WelcomeMessageSeries is persisted
    const welcomeMessageSeries =
      await testUsTxPrismaClient.welcomeMessageSeries.findMany({
        where: {
          personExternalId: fakePersonOne.stableExternalId,
        },
        include: {
          messageAttempts: true,
        },
      });

    expect(welcomeMessageSeries.length).toBe(0);
  });

  test("createMessage fails on first message, welcomeMessageSeries is not persisted", async () => {
    vi.mocked(TwilioAPIClient.prototype.createMessage).mockRejectedValueOnce(
      new Error("test"),
    );

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    const messageSeries =
      await testUsTxPrismaClient.welcomeMessageSeries.findMany({
        where: {
          personExternalId: fakePersonOne.stableExternalId,
        },
        include: {
          messageAttempts: true,
        },
      });

    expect(messageSeries.length).toBe(0);
  });

  test("welcome text is scheduled for a later time", async () => {
    // Set the system time to be earlier than the earliest time we want to send the message
    vi.setSystemTime(
      new Date(
        Date.UTC(2025, 3, 1, US_TX_EARLIEST_MESSAGE_SEND_UTC_HOURS - 1, 0, 0),
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

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Validates arguments to Twilio's createMessage
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "Hi Jane, we’re reaching out on behalf of the Texas Department of Criminal Justice (TDCJ). You’re now subscribed to receive updates about appointments and other items related to your parole.

      If you have questions, reach out to Officer John Doe at 9879879879. Please note each appointment reminder will specify if you are meeting with your primary officer or another officer.

      Reply STOP to stop receiving these messages at any time. We’re unable to respond to messages sent to this number."
    `);
    expect(spy.mock.calls[0][1]).toBe(fakePersonOne.phoneNumber);
    expect(spy.mock.calls[0][2]).toStrictEqual(
      new Date(`2025-04-01T15:00:00.000Z`),
    );

    // Validates the WelcomeMessageAttempt is persisted
    const welcomeMessageAttempt =
      await testUsTxPrismaClient.welcomeMessageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "twilio-message-sid" },
      });

    expect(welcomeMessageAttempt.status).toBe(MessageAttemptStatus.IN_PROGRESS);
    expect(welcomeMessageAttempt.requestedSendTimestamp).toStrictEqual(
      new Date(`2025-04-01T15:00:00.000Z`),
    );
  });
});

describe("one person in DB with welcome text in progress", () => {
  beforeEach(async () => {
    const person = await testUsTxPrismaClient.person.findFirstOrThrow({
      where: { personId: fakePersonOne.personId },
    });

    // Insert MessageSeries with single MessageAttempt
    await testUsTxPrismaClient.welcomeMessageSeries.create({
      data: {
        person: { connect: { stableExternalId: person.stableExternalId } },
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
      status: "delivered",
    } as MessageInstance);

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(
      TwilioAPIClient.prototype.getMessage,
    ).toHaveBeenCalledExactlyOnceWith("message-sid-1");
  });

  test("getMessage called with error", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockRejectedValue(
      new Error("test"),
    );

    // Ensure test has correct setup with one existing MessageAttempt
    const currentMessageAttempt =
      await testUsTxPrismaClient.welcomeMessageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-1" },
      });
    expect(currentMessageAttempt.status).toBe(MessageAttemptStatus.IN_PROGRESS);

    // Ensure error is thrown from the script when message statuses updates fail
    await expect(
      processJiiContactReminders({
        stateCode: StateCode.US_TX,
        dryRun: false,
        workflowExecutionId: fakeWorkflowExecutionOne.id,
      }),
    ).rejects.toThrow(
      "Less than 75% of in-progress messages were successfully updated",
    );

    const newMessageAttempt =
      await testUsTxPrismaClient.welcomeMessageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-1" },
      });

    // Ensure message has the same status
    expect(newMessageAttempt.status).toBe(MessageAttemptStatus.IN_PROGRESS);
  });

  test("welcome text is sent successfully -> reminder text is sent", async () => {
    // Ensure test has correct setup with one existing MessageAttempt
    const currentMessageAttempt =
      await testUsTxPrismaClient.welcomeMessageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-1" },
      });
    expect(currentMessageAttempt.status).toBe(MessageAttemptStatus.IN_PROGRESS);

    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-1",
      status: "delivered",
    } as MessageInstance);

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

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Validate welcome message status is updated
    const newMessageAttempt =
      await testUsTxPrismaClient.welcomeMessageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-1" },
      });
    expect(newMessageAttempt.status).toBe(MessageAttemptStatus.SUCCESS);

    const personWithMessageSeries =
      await testUsTxPrismaClient.person.findFirstOrThrow({
        where: {
          personId: fakePersonOne.personId,
        },
        include: {
          contactReminderMessageSeries: {
            include: { messageAttempts: true },
          },
        },
      });

    // Validate person.receivedWelcomeText is updated
    expect(personWithMessageSeries.receivedWelcomeText).toBeTrue();

    // Validate contact reminder message series is created
    expect(personWithMessageSeries.contactReminderMessageSeries).toEqual([
      expect.objectContaining({
        reminderType: "WITHIN_ONE_DAY",
        messageAttempts: [
          expect.objectContaining({
            twilioMessageSid: "twilio-message-sid",
          }),
        ],
      }),
    ]);

    // Validate createMessage arguments
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchInlineSnapshot(`
      "Hi Jane, this is a reminder that you have an upcoming home contact tomorrow.

      Date: 4/14/25

      Time: Approximately 7:00 AM CDT

      Location: Your home

      Be aware that the officer may arrive within 2 hours before or after the time listed above.

      Need to reschedule or have questions? Contact Officer John Doe

      Reply STOP to stop receiving these messages at any time. We’re unable to respond to messages sent to this number."
    `);

    // Validate person is updated
    expect(personWithMessageSeries.receivedWelcomeText).toBeTrue();
  });

  test("welcome text was not successful", async () => {
    // Ensure test has correct setup with one existing MessageAttempt
    const existingAttempts =
      await testUsTxPrismaClient.welcomeMessageAttempt.count({
        where: {
          phoneNumber: fakePersonOne.phoneNumber,
        },
      });

    expect(existingAttempts).toBe(1);

    // Set up mocks
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-1",
      status: "failed",
    } as MessageInstance);

    vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
      body: "message body",
      status: "queued",
      sid: "twilio-message-sid",
      dateCreated: new Date(),
      dateSent: new Date(),
      errorMessage: null,
      errorCode: null,
    } as unknown as MessageInstance);

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Validate that MessageAttempt is updated
    const newMessageAttempt =
      await testUsTxPrismaClient.welcomeMessageAttempt.findFirstOrThrow({
        where: { twilioMessageSid: "message-sid-1" },
      });

    expect(newMessageAttempt.status).toBe(MessageAttemptStatus.FAILURE);

    // Validate the initial text is attempted again
    const messageAttempts =
      await testUsTxPrismaClient.welcomeMessageAttempt.count({
        where: {
          phoneNumber: fakePersonOne.phoneNumber,
        },
      });

    expect(messageAttempts).toBe(2);
  });
});

describe("one person in DB with three initial text attempts", () => {
  test("twilio apis are not called again", async () => {
    // Insert MessageSeries with multiple MessageAttempt
    await testUsTxPrismaClient.welcomeMessageSeries.create({
      data: {
        person: {
          connect: { stableExternalId: fakePersonOne.stableExternalId },
        },
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "message-sid-1",
              body: "Hello world",
              phoneNumber: fakePersonOne.phoneNumber,
              status: MessageAttemptStatus.FAILURE,
              createdTimestamp: fakeWorkflowExecutionOne.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionOne.id,
            },
            {
              twilioMessageSid: "message-sid-2",
              body: "Hello world",
              status: MessageAttemptStatus.FAILURE,
              phoneNumber: fakePersonOne.phoneNumber,
              createdTimestamp: fakeWorkflowExecutionTwo.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionTwo.id,
            },
            {
              twilioMessageSid: "message-sid-3",
              body: "Hello world",
              status: MessageAttemptStatus.FAILURE,
              phoneNumber: fakePersonOne.phoneNumber,
              createdTimestamp:
                fakeWorkflowExecutionThree.workflowExecutionTime,
              workflowExecutionId: fakeWorkflowExecutionThree.id,
            },
          ],
        },
      },
    });

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(TwilioAPIClient.prototype.getMessage).not.toBeCalled();
    expect(TwilioAPIClient.prototype.createMessage).not.toBeCalled();
  });
});

describe("one person received welcome text and reminder message attempted", () => {
  beforeEach(async () => {
    const person = await testUsTxPrismaClient.person.update({
      where: { personId: fakePersonOne.personId },
      data: {
        receivedWelcomeText: true,
      },
    });

    // Insert MessageSeries for reminder text attempt
    await testUsTxPrismaClient.contactReminderMessageSeries.create({
      data: {
        contact: { connect: { externalId: fakeContactOne.externalId } },
        person: { connect: { personId: person?.personId } },
        reminderType: "WITHIN_ONE_DAY",
        messageAttempts: {
          create: [
            {
              twilioMessageSid: "reminder-message-sid",
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

  test("reminder text is successful", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "reminder-message-sid",
      status: "delivered",
    } as MessageInstance);

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Validate Twilio getMessage API is called for reminder text
    expect(TwilioAPIClient.prototype.getMessage).toHaveBeenCalledWith(
      "reminder-message-sid",
    );

    // Ensure captureException not called
    const sentryReports = await testAndGetSentryReports(0);
    expect(sentryReports.length).toBe(0);

    // Validate Twilio createMessage API is not called again
    expect(TwilioAPIClient.prototype.createMessage).not.toHaveBeenCalled();

    // Validate person only has one reminder message attempt that is successful
    const personWithMessageSeries =
      await testUsTxPrismaClient.person.findFirstOrThrow({
        where: {
          personId: fakePersonOne.personId,
        },
        include: {
          contactReminderMessageSeries: {
            include: {
              messageAttempts: true,
            },
          },
        },
      });

    const { contactReminderMessageSeries } = personWithMessageSeries;

    expect(contactReminderMessageSeries.length).toBe(1);
    expect(contactReminderMessageSeries[0]).toEqual(
      expect.objectContaining({
        reminderType: "WITHIN_ONE_DAY",
        messageAttempts: [
          expect.objectContaining({
            status: MessageAttemptStatus.SUCCESS,
          }),
        ],
      }),
    );
  });

  test("twilio APIs not called if already successful", async () => {
    // Test setup
    await testUsTxPrismaClient.contactReminderMessageAttempt.update({
      where: {
        twilioMessageSid: "reminder-message-sid",
      },
      data: {
        status: MessageAttemptStatus.SUCCESS,
      },
    });

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Ensure captureException not called
    const sentryReports = await testAndGetSentryReports(0);
    expect(sentryReports.length).toBe(0);

    expect(TwilioAPIClient.prototype.createMessage).not.toBeCalled();
    expect(TwilioAPIClient.prototype.getMessage).not.toBeCalled();
  });

  test("reminder text failed and is attempted again", async () => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-2",
      status: "failed",
    } as MessageInstance);

    vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
      body: "message body",
      status: "queued",
      sid: "twilio-message-sid",
      dateCreated: new Date(),
      dateSent: new Date(),
      errorMessage: null,
      errorCode: null,
    } as unknown as MessageInstance);

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    // Validate the reminder message series has two attempts
    const updatedReminderMessageSeries =
      await testUsTxPrismaClient.contactReminderMessageSeries.findFirstOrThrow({
        where: {
          personExternalId: fakePersonOne.stableExternalId,
          reminderType: "WITHIN_ONE_DAY",
        },
        include: {
          messageAttempts: true,
        },
      });

    expect(updatedReminderMessageSeries.messageAttempts.length).toBe(2);
    expect(updatedReminderMessageSeries.messageAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: MessageAttemptStatus.FAILURE,
        }),
        expect.objectContaining({
          status: MessageAttemptStatus.IN_PROGRESS,
        }),
      ]),
    );
  });
});

test("ensure only connected contacts are processed", async () => {
  vi.mocked(TwilioAPIClient.prototype.createMessage).mockResolvedValue({
    body: "message body",
    status: "queued",
    sid: "twilio-message-sid",
    dateCreated: new Date(),
    dateSent: new Date(),
    errorMessage: null,
    errorCode: null,
  } as unknown as MessageInstance);

  // Add another contact for person one that has no reminder type
  await testUsTxPrismaClient.contact.create({
    data: {
      ...fakeContactOne,
      externalId: "null-reminder-type-contact-id",
      reminderType: null,
      person: { connect: { stableExternalId: fakePersonOne.stableExternalId } },
    },
  });

  const existingPerson = await testUsTxPrismaClient.person.findFirstOrThrow({
    where: { stableExternalId: fakePersonOne.stableExternalId },
    include: { contacts: true },
  });

  // Validate setup where person has two connected contacts
  expect(existingPerson.contacts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        externalId: "null-reminder-type-contact-id",
        reminderType: null,
      }),
      expect.objectContaining({
        externalId: fakeContactOne.externalId,
        reminderType: fakeContactOne.reminderType,
      }),
    ]),
  );

  // Set up so that the person has already received a welcome text
  await testUsTxPrismaClient.person.update({
    where: { stableExternalId: fakePersonOne.stableExternalId },
    data: {
      receivedWelcomeText: true,
    },
  });

  await processJiiContactReminders({
    stateCode: StateCode.US_TX,
    dryRun: false,
    workflowExecutionId: fakeWorkflowExecutionOne.id,
  });

  const messageSeriesList =
    await testUsTxPrismaClient.contactReminderMessageSeries.findMany({
      where: {
        personExternalId: fakePersonOne.stableExternalId,
      },
    });

  // Validate we only attempted to send the message for the fakeContactOne
  expect(messageSeriesList.length).toBe(1);
  expect(messageSeriesList).toEqual([
    expect.objectContaining({
      contactId: fakeContactOne.externalId,
      reminderType: fakeContactOne.reminderType,
    }),
  ]);
});

test.each([
  { locationType: "HOME", method: "IN_PERSON" },
  { locationType: "HOME", method: "VIRTUAL" },
  { locationType: "OFFICE", method: "IN_PERSON" },
  { locationType: "OFFICE", method: "VIRTUAL" },
  { locationType: "FIELD", method: "IN_PERSON" },
  { locationType: "FIELD", method: "VIRTUAL" },
  { locationType: "EMPLOYMENT", method: "IN_PERSON" },
  { locationType: "EMPLOYMENT", method: "VIRTUAL" },
])(
  "copy for person where locationType=$locationType and method=$method",
  async ({ locationType, method }) => {
    vi.mocked(TwilioAPIClient.prototype.getMessage).mockResolvedValue({
      sid: "message-sid-1",
      status: "delivered",
    } as MessageInstance);

    await testUsTxPrismaClient.contact.update({
      where: { externalId: fakeContactOne.externalId },
      data: {
        locationType: locationType,
        method: method,
      },
    });

    await testUsTxPrismaClient.person.update({
      where: {
        stableExternalId: fakePersonOne.stableExternalId,
      },
      data: {
        receivedWelcomeText: true,
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

    await processJiiContactReminders({
      stateCode: StateCode.US_TX,
      dryRun: false,
      workflowExecutionId: fakeWorkflowExecutionOne.id,
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchSnapshot();
    expect(spy.mock.calls[0][1]).toBe(fakePersonOne.phoneNumber);
  },
);
