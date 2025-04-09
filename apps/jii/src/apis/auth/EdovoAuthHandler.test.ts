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
import { TokenAuthResponse } from "~auth0-jii";

import { EdovoAuthHandler } from "./EdovoAuthHandler";

vi.hoisted(() => {
  vi.stubEnv("VITE_API_URL_BASE", "http://localhost:9999");
});

test("constructor requires token in URL", () => {
  expect(() => new EdovoAuthHandler()).toThrowErrorMatchingInlineSnapshot(
    `[Error: Edovo token cannot be found in the current URL]`,
  );
});

describe("with url token", () => {
  const testToken = "token.adfafgasdgasdfs";
  let handler: EdovoAuthHandler;

  const mockResponse: TokenAuthResponse = {
    firebaseToken: "adfafasdfasdfasdfsdaf",
    user: { stateCode: "US_XX" },
  };

  beforeEach(() => {
    vi.stubGlobal("location", {
      pathname: `/edovo/${testToken}`,
    });

    handler = new EdovoAuthHandler();

    fetchMock.mockResponse(JSON.stringify(mockResponse));
  });

  test("hydration", async () => {
    expect(handler.hydrationState).toEqual({
      status: "needs hydration",
    });

    await handler.hydrate();

    expect(fetchMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "http://localhost:9999/auth/edovo",
        {
          "headers": {
            "Authorization": "Bearer token.adfafgasdgasdfs",
          },
        },
      ]
    `);

    expect(handler.hydrationState).toEqual({
      status: "hydrated",
    });
  });

  test("cannot get firebase token before hydration", async () => {
    await expect(
      handler.getFirebaseToken,
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Authorization required]`,
    );
  });

  test("token is available after hydration", async () => {
    await handler.hydrate();
    expect(await handler.getFirebaseToken()).toBe(mockResponse.firebaseToken);
  });

  test("user profile is available after hydration", async () => {
    expect(handler.userProfile).toBeUndefined();
    await handler.hydrate();
    expect(handler.userProfile).toEqual(mockResponse.user);
  });
});
