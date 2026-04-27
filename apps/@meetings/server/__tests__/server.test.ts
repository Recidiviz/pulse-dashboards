// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { createTRPCClient, httpBatchLink, TRPCClient } from "@trpc/client";
import superjson from "superjson";
import { beforeAll, describe } from "vitest";

import { testServer } from "~@meetings/server/test/setup";
import {
  fakeClient,
  fakeMeeting,
  fakeStaff,
} from "~@meetings/server/test/setup/seed";
import { AppRouter } from "~@meetings/trpc";

const testPort = process.env["PORT"] ? Number(process.env["PORT"]) : 3003;
const testHost = process.env["HOST"] ?? "localhost";

let testTRPCClient: TRPCClient<AppRouter>;

beforeAll(async () => {
  // Start listening.
  testServer.listen({ port: testPort, host: testHost }, (err: unknown) => {
    if (err) {
      testServer.log.error(err);
      process.exit(1);
    } else {
      console.log(`[ ready ] http://${testHost}:${testPort}`);
    }
  });

  testTRPCClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `http://${testHost}:${testPort}`,
        headers() {
          return {
            Authorization: "Bearer test-token",
            StateCode: "US_NE",
          };
        },
        // Required to get Date objects to serialize correctly.
        transformer: superjson,
      }),
    ],
  });
});

describe("server", () => {
  test("should include trpc routes", async () => {
    // If the trpc routes are not properly set up, this query will fail.
    const returnedClients = await testTRPCClient.v1.client.list.query();

    expect(returnedClients).toEqual([
      {
        personId: fakeClient.personId,
        givenNames: fakeClient.givenNames,
        surname: fakeClient.surname,
        displayPersonExternalId: fakeClient.displayPersonExternalId,
        activeMeetingId: fakeMeeting.id,
        supervisionType: fakeClient.supervisionType,
        meetingDetails: {
          id: null,
          caseNote: null,
          lastCompletedMeetingTime: null,
          validationErrorType: null,
          staffEmail: null,
        },
        staffEmails: [fakeStaff.email],
      },
    ]);
  });
});
