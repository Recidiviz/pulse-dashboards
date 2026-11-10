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

import { SEGMENT_CLOSE_AND_FLUSH_TIMEOUT_MS } from "../segment";

const captureExceptionMock = vi.hoisted(() => vi.fn());
const AnalyticsMock = vi.hoisted(() => vi.fn());
const analyticsTrackMock = vi.hoisted(() => vi.fn());

vi.mock("@sentry/node", () => ({ captureException: captureExceptionMock }));
vi.mock("@segment/analytics-node", () => ({ Analytics: AnalyticsMock }));
vi.mock("~@idaho-th/trpc/routes/common/serverConfig", () => ({
  serverConfig: { isDevelopment: false },
}));

const EVENT = "backend_idaho_th_application_override_recorded";
const PROPERTIES = {
  applicationId: "application-1",
  overriddenFieldCount: 1,
  staffPseudonymizedId: "staff-1",
};

/** The client is a module-level singleton, so reload it for each test. */
async function loadSegment() {
  vi.resetModules();
  return (await import("../segment")).segment;
}

beforeEach(() => {
  AnalyticsMock.mockImplementation(function () {
    return { on: vi.fn(), track: analyticsTrackMock };
  });
});

describe("segment without SEGMENT_WRITE_KEY", () => {
  beforeEach(() => {
    vi.stubEnv("SEGMENT_WRITE_KEY", "");
  });

  it("does not report the missing key at import", async () => {
    await loadSegment();

    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("reports the missing key once, on first track()", async () => {
    const segment = await loadSegment();

    segment.track(EVENT, PROPERTIES);
    segment.track(EVENT, PROPERTIES);

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      "SEGMENT_WRITE_KEY missing from environment",
    );
    expect(AnalyticsMock).not.toHaveBeenCalled();
  });
});

describe("segment with SEGMENT_WRITE_KEY", () => {
  beforeEach(() => {
    vi.stubEnv("SEGMENT_WRITE_KEY", "test-write-key");
  });

  it("creates the client on first track() and reuses it", async () => {
    const segment = await loadSegment();
    expect(AnalyticsMock).not.toHaveBeenCalled();

    segment.track(EVENT, PROPERTIES);
    segment.track(EVENT, PROPERTIES);

    expect(AnalyticsMock).toHaveBeenCalledTimes(1);
    expect(AnalyticsMock).toHaveBeenCalledWith({ writeKey: "test-write-key" });
    expect(analyticsTrackMock).toHaveBeenCalledTimes(2);
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("bounds the close flush to fit Cloud Run's SIGTERM window", async () => {
    const analyticsCloseAndFlushMock = vi.fn().mockResolvedValue(undefined);
    AnalyticsMock.mockImplementation(function () {
      return {
        on: vi.fn(),
        track: analyticsTrackMock,
        closeAndFlush: analyticsCloseAndFlushMock,
      };
    });
    const segment = await loadSegment();
    segment.track(EVENT, PROPERTIES);

    await segment.closeAndFlush();

    expect(analyticsCloseAndFlushMock).toHaveBeenCalledWith({
      timeout: SEGMENT_CLOSE_AND_FLUSH_TIMEOUT_MS,
    });
  });

  it("shares one SDK flush between concurrent closeAndFlush calls", async () => {
    let finishFlush: () => void = () => undefined;
    const analyticsCloseAndFlushMock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishFlush = resolve;
        }),
    );
    AnalyticsMock.mockImplementation(function () {
      return {
        on: vi.fn(),
        track: analyticsTrackMock,
        closeAndFlush: analyticsCloseAndFlushMock,
      };
    });
    const segment = await loadSegment();
    segment.track(EVENT, PROPERTIES);

    const first = segment.closeAndFlush();
    const second = segment.closeAndFlush();
    finishFlush();
    await Promise.all([first, second]);

    expect(analyticsCloseAndFlushMock).toHaveBeenCalledOnce();
  });

  it("does not create a client just to close it", async () => {
    const segment = await loadSegment();

    await segment.closeAndFlush();

    expect(AnalyticsMock).not.toHaveBeenCalled();
  });
});
