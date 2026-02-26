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

import { createTRPCClient, httpLink } from "@trpc/client";

import { TokenAuthResponse } from "~@jii/auth";

import type { TranslationStore } from "../../datastores/TranslationStore";
import { EdovoAuthHandler } from "./EdovoAuthHandler";

vi.mock("@trpc/client");

// mocking this to avoid side effects from i18next that we don't care about here
const mockTranslationStore = {
  i18n: { changeLanguage: vi.fn() },
} as unknown as TranslationStore;

const mockTrpcQuery = vi.fn();

test("constructor requires token in URL", () => {
  expect(
    () => new EdovoAuthHandler(mockTranslationStore),
  ).toThrowErrorMatchingInlineSnapshot(
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

    handler = new EdovoAuthHandler(mockTranslationStore);

    // @ts-expect-error minimal stub
    vi.mocked(createTRPCClient).mockReturnValue({
      auth: { edovoToken: { query: mockTrpcQuery } },
    });
    mockTrpcQuery.mockResolvedValue(mockResponse);
  });

  test("hydration", async () => {
    expect(handler.hydrationState).toEqual({
      status: "needs hydration",
    });

    await handler.hydrate();

    const httpLinkOpts = vi.mocked(httpLink).mock.lastCall?.[0];
    expect(httpLinkOpts?.url).toMatchInlineSnapshot(`"/api/trpc"`);
    // @ts-expect-error headers should not be missing, and we want test to fail if it is
    expect(await httpLinkOpts.headers()).toEqual({
      Authorization: `Bearer ${testToken}`,
    });

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

  describe("language handling", () => {
    test("calls i18next.changeLanguage when language is provided", async () => {
      const mockResponseWithLanguageAndTranslatorPermission = {
        ...mockResponse,
        language: "es",
      };

      mockTrpcQuery.mockResolvedValue(
        mockResponseWithLanguageAndTranslatorPermission,
      );

      await handler.hydrate();

      expect(mockTranslationStore.i18n.changeLanguage).toHaveBeenCalledWith(
        "es",
      );
    });

    test("does not call i18next.changeLanguage when no language or translator permission provided", async () => {
      // mockResponse has no language field
      await handler.hydrate();

      expect(mockTranslationStore.i18n.changeLanguage).not.toHaveBeenCalled();
    });
  });
});
