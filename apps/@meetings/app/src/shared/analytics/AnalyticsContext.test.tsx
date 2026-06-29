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

import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import * as segmentModule from "~@meetings/app/shared/lib/segment";

import { AnalyticsProvider, useAnalytics } from "./AnalyticsProvider";

jest.mock("~@meetings/app/shared/lib/segment", () => ({
  segmentClient: {
    identify: jest.fn(),
    track: jest.fn(),
  },
}));

// The factory returns a plain object. We grab the same reference via require() below
// so mutations in tests are visible to AnalyticsProvider via `import env`.
jest.mock("~@meetings/app/shared/config/env", () => ({
  env: { EXPO_PUBLIC_DEPLOY_ENV: "production" },
}));
const mockEnv = require("~@meetings/app/shared/config/env").env as {
  EXPO_PUBLIC_DEPLOY_ENV: string;
};

// User identity is injected into the provider as props; tests set this before rendering.
let user: { email?: string; isSkipAuthUser: boolean } = {
  email: undefined,
  isSkipAuthUser: false,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AnalyticsProvider email={user.email} isSkipAuthUser={user.isSkipAuthUser}>
    {children}
  </AnalyticsProvider>
);

describe("AnalyticsContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.EXPO_PUBLIC_DEPLOY_ENV = "production";
  });

  describe("useAnalytics", () => {
    it("throws when used outside of provider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useAnalytics());
      }).toThrow("useAnalytics must be used within an AnalyticsProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("identify", () => {
    it("calls segmentClient.identify on mount for authenticated external users", async () => {
      user = { email: "officer@example.gov", isSkipAuthUser: false };

      renderHook(() => useAnalytics(), { wrapper });

      await waitFor(() => {
        expect(segmentModule.segmentClient.identify).toHaveBeenCalledWith(
          "officer@example.gov",
          { isInternalUser: false },
        );
      });
    });

    it("does not call segmentClient.identify for skip-auth users", () => {
      user = { email: undefined, isSkipAuthUser: true };

      renderHook(() => useAnalytics(), { wrapper });

      expect(segmentModule.segmentClient.identify).not.toHaveBeenCalled();
    });

    it("does not write to segment for internal users in production", () => {
      user = { email: "internal@recidiviz.org", isSkipAuthUser: false };

      renderHook(() => useAnalytics(), { wrapper });

      expect(segmentModule.segmentClient.identify).not.toHaveBeenCalled();
    });

    it("writes to segment for internal users in staging", async () => {
      mockEnv.EXPO_PUBLIC_DEPLOY_ENV = "staging";
      user = { email: "internal@recidiviz.org", isSkipAuthUser: false };

      renderHook(() => useAnalytics(), { wrapper });

      await waitFor(() => {
        expect(segmentModule.segmentClient.identify).toHaveBeenCalledWith(
          "internal@recidiviz.org",
          { isInternalUser: true },
        );
      });
    });
  });

  describe("track", () => {
    it("prefixes event name with frontend_meetings_ and writes to segment", () => {
      user = { email: "officer@example.gov", isSkipAuthUser: false };

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track("meeting_started", { meetingId: "abc123" });

      expect(segmentModule.segmentClient.track).toHaveBeenCalledWith(
        "frontend_meetings_meeting_started",
        { meetingId: "abc123", isInternalUser: false },
      );
    });

    it("does not write to segment in development", () => {
      mockEnv.EXPO_PUBLIC_DEPLOY_ENV = "development";
      user = { email: "officer@example.gov", isSkipAuthUser: false };

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track("meeting_started");

      expect(segmentModule.segmentClient.track).not.toHaveBeenCalled();
    });

    it("does not write to segment for internal users in production", () => {
      user = { email: "internal@recidiviz.org", isSkipAuthUser: false };

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track("meeting_started");

      expect(segmentModule.segmentClient.track).not.toHaveBeenCalled();
    });

    it("writes to segment for internal users in staging", () => {
      mockEnv.EXPO_PUBLIC_DEPLOY_ENV = "staging";
      user = { email: "internal@recidiviz.org", isSkipAuthUser: false };

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track("meeting_started");

      expect(segmentModule.segmentClient.track).toHaveBeenCalledWith(
        "frontend_meetings_meeting_started",
        { isInternalUser: true },
      );
    });

    it("includes extra metadata alongside default properties", () => {
      user = { email: "officer@example.gov", isSkipAuthUser: false };

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track("meeting_started", {
        meetingId: "abc123",
        personType: "client",
      });

      expect(segmentModule.segmentClient.track).toHaveBeenCalledWith(
        "frontend_meetings_meeting_started",
        { meetingId: "abc123", personType: "client", isInternalUser: false },
      );
    });

    it("logs to console in development", () => {
      mockEnv.EXPO_PUBLIC_DEPLOY_ENV = "development";
      user = { email: "officer@example.gov", isSkipAuthUser: false };
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.track("meeting_started");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("meeting_started"),
      );
    });
  });
});
