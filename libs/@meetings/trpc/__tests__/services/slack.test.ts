// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { afterEach, describe, expect, test } from "vitest";

import env from "~@meetings/trpc/env";
import {
  buildMeetingCompletedMessage,
  buildMeetingUrl,
} from "~@meetings/trpc/services/slack";

const originalDeployEnv = env.DEPLOY_ENV;

afterEach(() => {
  env.DEPLOY_ENV = originalDeployEnv;
});

describe("buildMeetingUrl", () => {
  test.each([
    [
      "production",
      "client" as const,
      "https://meet.recidiviz.org/clients/123/meetings/abc?stateCode=US_ID",
    ],
    [
      "staging",
      "resident" as const,
      "https://meet-staging.recidiviz.org/residents/123/meetings/abc?stateCode=US_ID",
    ],
    ["unknown", "client" as const, null],
  ])("DEPLOY_ENV=%s, %s", (deployEnv, personType, expected) => {
    env.DEPLOY_ENV = deployEnv;

    expect(
      buildMeetingUrl({
        stateCode: "US_ID",
        personType,
        personId: "123",
        meetingId: "abc",
      }),
    ).toEqual(expected);
  });
});

describe("buildMeetingCompletedMessage", () => {
  const baseParams = {
    staffEmail: "staff@example.com",
    stateCode: "US_ID",
    personPseudoId: "pseudo-1",
    meetingId: "abc",
  };

  const baseMessage = [
    "Meeting completed",
    "• Staff: staff@example.com",
    "• State: US_ID",
    "• Client/Resident ID: pseudo-1",
    "• Meeting ID: abc",
  ].join("\n");

  test("without person info, message is unchanged", () => {
    env.DEPLOY_ENV = "production";

    expect(buildMeetingCompletedMessage(baseParams)).toEqual(baseMessage);
  });

  test("with person info, appends the meeting link", () => {
    env.DEPLOY_ENV = "production";

    expect(
      buildMeetingCompletedMessage({
        ...baseParams,
        personType: "client",
        personId: "123",
      }),
    ).toEqual(
      `${baseMessage}\n• <https://meet.recidiviz.org/clients/123/meetings/abc?stateCode=US_ID|View meeting>`,
    );
  });

  test("with person info but unmapped DEPLOY_ENV, omits the link", () => {
    env.DEPLOY_ENV = "dev";

    expect(
      buildMeetingCompletedMessage({
        ...baseParams,
        personType: "client",
        personId: "123",
      }),
    ).toEqual(baseMessage);
  });
});
