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
  Status,
} from "@prisma/jii-texting-server/client";
import { MessageStatus } from "twilio/lib/rest/api/v2010/account/message";

import {
  getOrderedMessageAttempts,
  mapTwilioStatusToInternalStatus,
  MessageSeriesWithAttemptsAndGroup,
} from "~@jii-texting-server/utils";

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
      },
    };

    const result = getOrderedMessageAttempts([messageSeries]);
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
      },
    };

    const result = getOrderedMessageAttempts([messageSeries]);
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

  test("multiple MessageSeries with multiple attempts", async () => {
    const messageSeriesOne: MessageSeriesWithAttemptsAndGroup = {
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
          status: MessageAttemptStatus.SUCCESS,
          createdTimestamp: new Date("2025-03-05"),
        },
      ],
      group: {
        id: "group-id-1",
        topicId: "topic-id",
        status: Status.ACTIVE,
        messageCopyTemplate: "Template",
      },
    };

    const messageSeriesTwo: MessageSeriesWithAttemptsAndGroup = {
      messageType: MessageType.ELIGIBILITY_TEXT,
      id: "message-series-id-2",
      personExternalId: "person-ext-id-1",
      groupId: "group-id-1",
      messageAttempts: [
        {
          id: "eligibility-attempt-id-1",
          twilioMessageSid: "eligibility-msg-id-1",
          status: MessageAttemptStatus.FAILURE,
          createdTimestamp: new Date("2025-03-06"),
        },
        {
          id: "eligibility-attempt-id-2",
          twilioMessageSid: "eligibility-msg-id-2",
          status: MessageAttemptStatus.FAILURE,
          createdTimestamp: new Date("2025-03-07"),
        },
      ],
      group: {
        id: "group-id-1",
        topicId: "topic-id",
        status: Status.ACTIVE,
        messageCopyTemplate: "Template",
      },
    };

    const result = getOrderedMessageAttempts([
      messageSeriesOne,
      messageSeriesTwo,
    ]);
    expect(
      result.map(
        (attempt: {
          id: string;
          twilioMessageSid: string;
          status: MessageAttemptStatus;
          createdTimestamp: Date;
        }) => attempt.id,
      ),
    ).toEqual([
      "eligibility-attempt-id-2",
      "eligibility-attempt-id-1",
      "attempt-id-2",
      "attempt-id-1",
    ]);
  });
});
