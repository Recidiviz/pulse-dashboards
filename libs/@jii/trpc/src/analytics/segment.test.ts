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

import { Analytics } from "@segment/analytics-node";

import { SegmentClient } from "./segment";

vi.mock("@segment/analytics-node");
vi.mock("@sentry/node");

const trackMock = vi.fn();

beforeEach(() => {
  vi.mocked(Analytics).prototype.track = trackMock;
  vi.mocked(Analytics).prototype.on = vi.fn();
  vi.stubEnv("SENTRY_ENV", "development");
});

describe("when no write key is configured", () => {
  let client: SegmentClient;

  beforeEach(() => {
    vi.stubEnv("SEGMENT_WRITE_KEY", "");
    client = new SegmentClient();
  });

  test("does not initialize Analytics", () => {
    expect(Analytics).not.toHaveBeenCalled();
  });

  test("trackAnonymousEvent logs instead of sending to Segment", () => {
    const consoleSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    client.trackAnonymousEvent(
      "backend_cre_search_query",
      "anon-123",
      { query: "housing", resultCount: 3 },
      { isRecidivizUser: false },
    );

    expect(trackMock).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("backend_cre_search_query"),
    );
  });
});

describe("when a write key is configured", () => {
  let client: SegmentClient;

  beforeEach(() => {
    vi.stubEnv("SEGMENT_WRITE_KEY", "test-key");
    client = new SegmentClient();
  });

  test("initializes Analytics with the write key", () => {
    expect(Analytics).toHaveBeenCalledExactlyOnceWith({
      writeKey: "test-key",
    });
  });

  describe("trackAnonymousEvent", () => {
    test("sends exactly event, anonymousId, and properties - no userId, no identity field", () => {
      client.trackAnonymousEvent(
        "backend_cre_search_query",
        "anon-123",
        { query: "housing", resultCount: 3 },
        { isRecidivizUser: false },
      );

      expect(trackMock).toHaveBeenCalledExactlyOnceWith({
        event: "backend_cre_search_query",
        anonymousId: "anon-123",
        properties: {
          query: "housing",
          resultCount: 3,
          isRecidivizUser: false,
        },
      });
    });

    test("stamps isRecidivizUser onto properties even if the caller didn't include it, as a failsafe", () => {
      client.trackAnonymousEvent(
        "backend_cre_search_query",
        "anon-123",
        { query: "housing" },
        { isRecidivizUser: false },
      );

      expect(trackMock.mock.calls[0]?.[0].properties).toMatchObject({
        isRecidivizUser: false,
      });
    });

    test("only uses the anonymousId passed in, never derives one", () => {
      client.trackAnonymousEvent(
        "backend_cre_search_query",
        "anon-abc",
        {},
        { isRecidivizUser: false },
      );

      const sentEvent = trackMock.mock.calls[0]?.[0];
      expect(sentEvent.anonymousId).toBe("anon-abc");
      expect(sentEvent).not.toHaveProperty("userId");
    });

    test("a real resident's event sends regardless of environment", () => {
      vi.stubEnv("DEPLOY_ENV", "production");

      client.trackAnonymousEvent(
        "backend_cre_search_query",
        "anon-123",
        {},
        { isRecidivizUser: false },
      );

      expect(trackMock).toHaveBeenCalledOnce();
    });

    test("a Recidiviz-internal user's event sends while testing in staging", () => {
      vi.stubEnv("DEPLOY_ENV", "staging");

      client.trackAnonymousEvent(
        "backend_cre_search_query",
        "anon-123",
        {},
        { isRecidivizUser: true },
      );

      expect(trackMock).toHaveBeenCalledOnce();
    });

    test("a Recidiviz-internal user's event is suppressed in production", () => {
      vi.stubEnv("DEPLOY_ENV", "production");
      const consoleSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => undefined);

      client.trackAnonymousEvent(
        "backend_cre_search_query",
        "anon-123",
        {},
        { isRecidivizUser: true },
      );

      expect(trackMock).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("backend_cre_search_query"),
      );
    });

    test("a Recidiviz-internal user's event is suppressed outside staging even without a DEPLOY_ENV set", () => {
      client.trackAnonymousEvent(
        "backend_cre_search_query",
        "anon-123",
        {},
        { isRecidivizUser: true },
      );

      expect(trackMock).not.toHaveBeenCalled();
    });
  });
});
