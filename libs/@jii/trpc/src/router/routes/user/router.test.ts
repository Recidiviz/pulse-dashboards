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

import { userId } from "../../../test/context";
import { testPrismaClient } from "../../../test/prisma";
import { userRouter } from "./router";

vi.mock("../../../procedures/firebaseAuth");

// we are mocking the procedure's context so it doesn't really matter what we pass here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const c = userRouter.createCaller({ req: {} as any });

describe("get properties for user in auth token", () => {
  test("no result", async () => {
    expect(await c.getProperties()).toBeNull();
  });

  test("result", async () => {
    await testPrismaClient.userProperties.create({
      data: { id: userId, hasSeenOnboarding: new Date(2025, 11, 10, 11, 14) },
    });

    expect(await c.getProperties()).toMatchInlineSnapshot(`
      {
        "hasSeenOnboarding": 2025-12-10T11:14:00.000Z,
      }
    `);
  });
});

test("set properties for user in auth token", async () => {
  const result = await c.setProperties({
    hasSeenOnboarding: new Date(2025, 11, 10, 11, 43),
  });
  expect(result).toMatchInlineSnapshot(`
    {
      "hasSeenOnboarding": 2025-12-10T11:43:00.000Z,
      "id": "abc123",
    }
  `);
  expect(await testPrismaClient.userProperties.findMany()).toEqual([result]);
});
