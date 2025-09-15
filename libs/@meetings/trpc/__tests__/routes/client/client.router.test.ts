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

import { faker } from "@faker-js/faker";

import { testTRPCClient } from "~@meetings/trpc/test/setup";
import { fakeClient } from "~@meetings/trpc/test/setup/seed";

describe("client router", () => {
  describe("createMeeting", () => {
    test("Creates a meeting", async () => {
      const startTime = faker.date.future();
      const endTime = faker.date.future({ refDate: startTime });
      const address = faker.location.streetAddress();

      const result = await testTRPCClient.client.createMeeting.mutate({
        clientId: fakeClient.personId,
        startTime,
        endTime,
        address,
      });

      expect(result).toEqual({
        startTime,
        endTime,
        address,
      });
    });
  });
});
