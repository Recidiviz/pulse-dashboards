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

// vi.hoisted ensures mockSdkMethods is initialized before vi.mock factories run
const mockSdkMethods = vi.hoisted(() => ({
  acquire_embed_cookieless_session: vi.fn(),
  generate_tokens_for_cookieless_session: vi.fn(),
}));

vi.mock("@looker/sdk-node", () => ({
  LookerNodeSDK: { init40: vi.fn().mockReturnValue(mockSdkMethods) },
  NodeSettings: vi.fn(),
}));
vi.mock("../../utils/isOfflineMode");
vi.mock("../../utils/getAppMetadata");

import { LookerNodeSDK } from "@looker/sdk-node";

import { getAppMetadata } from "../../utils/getAppMetadata";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { acquireSession, generateTokens } from "../lookerEmbed";

function makeRes() {
  const res = { status: vi.fn(), json: vi.fn(), set: vi.fn(), send: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function makeReq(stateCode = "us_xx", body = {}, headers = {}) {
  return { params: { stateCode }, body, headers };
}

beforeEach(() => {
  vi.clearAllMocks();
  LookerNodeSDK.init40.mockReturnValue(mockSdkMethods);
  isOfflineMode.mockReturnValue(false);
});

// ---------------------------------------------------------------------------
// acquireSession
// ---------------------------------------------------------------------------

describe("acquireSession", () => {
  describe("authorization", () => {
    it("returns 403 when user lacks director_dashboard route and is not recidiviz", async () => {
      getAppMetadata.mockReturnValue({
        state_code: "us_xx",
        routes: { director_dashboard: false },
      });

      const res = makeRes();
      await acquireSession(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("allows recidiviz users regardless of routes", async () => {
      getAppMetadata.mockReturnValue({ state_code: "recidiviz", routes: {} });
      mockSdkMethods.acquire_embed_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at",
          authentication_token_ttl: 30,
          navigation_token: "nt",
          navigation_token_ttl: 30,
          api_token: "apt",
          api_token_ttl: 3600,
          session_reference_token: "srt",
          session_reference_token_ttl: 604800,
        },
      });

      const res = makeRes();
      await acquireSession(makeReq(), res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ authentication_token: "at" }),
      );
    });

    it("allows users with director_dashboard route", async () => {
      getAppMetadata.mockReturnValue({
        state_code: "us_xx",
        routes: { director_dashboard: true },
      });
      mockSdkMethods.acquire_embed_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at",
          authentication_token_ttl: 30,
          navigation_token: "nt",
          navigation_token_ttl: 30,
          api_token: "apt",
          api_token_ttl: 3600,
          session_reference_token: "srt",
          session_reference_token_ttl: 604800,
        },
      });

      const res = makeRes();
      await acquireSession(makeReq(), res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ navigation_token: "nt" }),
      );
    });
  });

  describe("offline mode", () => {
    it("returns 503 without calling the SDK", async () => {
      isOfflineMode.mockReturnValue(true);
      getAppMetadata.mockReturnValue({});

      const res = makeRes();
      await acquireSession(makeReq(), res);

      expect(
        mockSdkMethods.acquire_embed_cookieless_session,
      ).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe("success", () => {
    beforeEach(() => {
      getAppMetadata.mockReturnValue({ state_code: "recidiviz", routes: {} });
    });

    it("returns tokens without session_reference_token", async () => {
      mockSdkMethods.acquire_embed_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at",
          authentication_token_ttl: 30,
          navigation_token: "nt",
          navigation_token_ttl: 30,
          api_token: "apt",
          api_token_ttl: 3600,
          session_reference_token: "srt",
          session_reference_token_ttl: 604800,
        },
      });

      const res = makeRes();
      await acquireSession(makeReq("us_nd"), res);

      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({
        session_key: expect.any(String),
        authentication_token: "at",
        authentication_token_ttl: 30,
        navigation_token: "nt",
        navigation_token_ttl: 30,
        api_token: "apt",
        api_token_ttl: 3600,
        session_reference_token_ttl: 604800,
      });
      expect(body).not.toHaveProperty("session_reference_token");
    });

    it("sets Cache-Control: no-store on the response", async () => {
      mockSdkMethods.acquire_embed_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at",
          authentication_token_ttl: 30,
          navigation_token: "nt",
          navigation_token_ttl: 30,
          api_token: "apt",
          api_token_ttl: 3600,
          session_reference_token: "srt",
          session_reference_token_ttl: 604800,
        },
      });

      const res = makeRes();
      await acquireSession(makeReq("us_nd"), res);

      expect(res.set).toHaveBeenCalledWith(
        "Cache-Control",
        "no-store, max-age=0",
      );
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      getAppMetadata.mockReturnValue({ state_code: "recidiviz", routes: {} });
    });

    it("rejects when the SDK returns a non-ok response", async () => {
      mockSdkMethods.acquire_embed_cookieless_session.mockResolvedValue({
        ok: false,
        error: { message: "Service Unavailable" },
      });

      await expect(acquireSession(makeReq(), makeRes())).rejects.toThrow(
        "Service Unavailable",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// generateTokens
// ---------------------------------------------------------------------------

describe("generateTokens", () => {
  describe("authorization", () => {
    it("returns 403 when user lacks director_dashboard route and is not recidiviz", async () => {
      getAppMetadata.mockReturnValue({
        state_code: "us_xx",
        routes: { director_dashboard: false },
      });

      const res = makeRes();
      await generateTokens(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("offline mode", () => {
    it("returns 503 without calling the SDK", async () => {
      isOfflineMode.mockReturnValue(true);
      getAppMetadata.mockReturnValue({});

      const res = makeRes();
      await generateTokens(makeReq(), res);

      expect(
        mockSdkMethods.generate_tokens_for_cookieless_session,
      ).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe("session reference token missing", () => {
    it("returns session_reference_token_ttl: 0 when there is no stored session for the state", async () => {
      getAppMetadata.mockReturnValue({ state_code: "recidiviz", routes: {} });

      const res = makeRes();
      await generateTokens(makeReq("us_zz"), res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ session_reference_token_ttl: 0 });
    });
  });

  describe("with an active session", () => {
    const stateCode = "us_nd";
    let sessionKey;

    beforeEach(async () => {
      // Seed the session store by calling acquireSession first
      getAppMetadata.mockReturnValue({ state_code: "recidiviz", routes: {} });
      mockSdkMethods.acquire_embed_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at-old",
          authentication_token_ttl: 30,
          navigation_token: "nt-old",
          navigation_token_ttl: 30,
          api_token: "apt-old",
          api_token_ttl: 3600,
          session_reference_token: "srt-seed",
          session_reference_token_ttl: 604800,
        },
      });
      const res = makeRes();
      await acquireSession(makeReq(stateCode), res);
      sessionKey = res.json.mock.calls[0][0].session_key;
    });

    it("returns refreshed tokens without session_reference_token", async () => {
      mockSdkMethods.generate_tokens_for_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at-new",
          authentication_token_ttl: 30,
          navigation_token: "nt-new",
          navigation_token_ttl: 30,
          api_token: "apt-new",
          api_token_ttl: 3600,
          session_reference_token: "srt-new",
          session_reference_token_ttl: 604800,
        },
      });

      const res = makeRes();
      await generateTokens(
        makeReq(stateCode, {
          session_key: sessionKey,
          api_token: "apt-old",
          navigation_token: "nt-old",
          authentication_token: "at-old",
        }),
        res,
      );

      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({
        navigation_token: "nt-new",
        navigation_token_ttl: 30,
        api_token: "apt-new",
        api_token_ttl: 3600,
        session_reference_token_ttl: 604800,
      });
      expect(body).not.toHaveProperty("session_reference_token");
    });

    it("sets Cache-Control: no-store on the response", async () => {
      mockSdkMethods.generate_tokens_for_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at-new",
          authentication_token_ttl: 30,
          navigation_token: "nt-new",
          navigation_token_ttl: 30,
          api_token: "apt-new",
          api_token_ttl: 3600,
          session_reference_token: "srt-new",
          session_reference_token_ttl: 604800,
        },
      });

      const res = makeRes();
      await generateTokens(
        makeReq(stateCode, { session_key: sessionKey }),
        res,
      );

      expect(res.set).toHaveBeenCalledWith(
        "Cache-Control",
        "no-store, max-age=0",
      );
    });

    it("stores the refreshed session_reference_token for subsequent calls", async () => {
      mockSdkMethods.generate_tokens_for_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at-new",
          authentication_token_ttl: 30,
          navigation_token: "nt-new",
          navigation_token_ttl: 30,
          api_token: "apt-new",
          api_token_ttl: 3600,
          session_reference_token: "srt-rotated",
          session_reference_token_ttl: 604800,
        },
      });

      await generateTokens(
        makeReq(stateCode, { session_key: sessionKey }),
        makeRes(),
      );

      // The next generateTokens call must forward the rotated token to Looker
      mockSdkMethods.generate_tokens_for_cookieless_session.mockResolvedValue({
        ok: true,
        value: {
          authentication_token: "at-2",
          authentication_token_ttl: 30,
          navigation_token: "nt-2",
          navigation_token_ttl: 30,
          api_token: "apt-2",
          api_token_ttl: 3600,
          session_reference_token: "srt-rotated-2",
          session_reference_token_ttl: 604800,
        },
      });
      await generateTokens(
        makeReq(stateCode, { session_key: sessionKey }),
        makeRes(),
      );

      const secondCallArgs =
        mockSdkMethods.generate_tokens_for_cookieless_session.mock.calls[1][0];
      expect(secondCallArgs).toMatchObject({
        session_reference_token: "srt-rotated",
      });
    });

    it("returns session_reference_token_ttl: 0 when Looker returns a non-ok response (e.g. 400 for invalid tokens)", async () => {
      mockSdkMethods.generate_tokens_for_cookieless_session.mockResolvedValue({
        ok: false,
        error: { message: "Invalid tokens" },
      });

      const res = makeRes();
      await generateTokens(
        makeReq(stateCode, { session_key: sessionKey }),
        res,
      );

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ session_reference_token_ttl: 0 });
    });

    it("rejects when the SDK throws unexpectedly", async () => {
      mockSdkMethods.generate_tokens_for_cookieless_session.mockRejectedValue(
        new Error("Network error"),
      );

      await expect(
        generateTokens(
          makeReq(stateCode, { session_key: sessionKey }),
          makeRes(),
        ),
      ).rejects.toThrow("Network error");
    });
  });
});
