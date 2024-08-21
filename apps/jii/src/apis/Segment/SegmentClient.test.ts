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

import { AnalyticsBrowser } from "@segment/analytics-next";
import { v4 as uuidV4 } from "uuid";
import { MockInstance } from "vitest";

import { SegmentClient } from "./SegmentClient";

vi.mock("@segment/analytics-next");
vi.mock("uuid");

let client: SegmentClient;
let consoleSpy: MockInstance<{
  (...args: unknown[]): void;
}>;

const defaultExternals = {
  isRecidivizUser: false,
  stateCode: "US_XX",
};

function getAnalyticsStoreWithEnv(
  mode: string,
  writeKey: string | undefined,
  externalsOverrides?: Partial<typeof defaultExternals>,
) {
  vi.stubEnv("MODE", mode);
  writeKey && vi.stubEnv("VITE_SEGMENT_WRITE_KEY", writeKey);

  return new SegmentClient({ ...defaultExternals, ...externalsOverrides });
}

const identifyMock = vi.fn();
const pageMock = vi.fn();
const trackMock = vi.fn();
const loadMock = vi.fn();

beforeEach(() => {
  vi.mocked(AnalyticsBrowser).prototype.identify = identifyMock;
  vi.mocked(AnalyticsBrowser).prototype.page = pageMock;
  vi.mocked(AnalyticsBrowser).prototype.track = trackMock;
  vi.mocked(AnalyticsBrowser).prototype.load = loadMock;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  loadMock.mockImplementation((opts: any) => {
    if (opts.writeKey) {
      const instance = vi.mocked(AnalyticsBrowser).mock.instances.at(-1);
      // we are not going to interact with this directly, but it's expected to exist after load is called
      if (instance) {
        instance.instance = vi.fn() as any;
      }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  consoleSpy = vi.spyOn(console, "log");

  vi.mocked(uuidV4).mockReturnValue("mock-uuid");
});

describe("When no write key is configured", () => {
  beforeEach(() => {
    client = getAnalyticsStoreWithEnv("production", undefined);
  });

  it("does not initialize Segment", () => {
    expect(loadMock).not.toHaveBeenCalled();
  });

  it("disables analytics", () => {
    expect(client.isDisabled).toBeTrue();
  });

  it("does not call identify", () => {
    client.identify("test-id");
    expect(identifyMock).not.toHaveBeenCalled();
    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[Analytics] Identifying user: test-id, with traits: {"sessionId":"mock-uuid","stateCode":"US_XX","isRecidivizUser":false}",
      ]
    `);
  });

  it("does not call track", () => {
    client.track("frontend_event_type", {
      foo: "bar",
    });
    expect(trackMock).not.toHaveBeenCalled();
    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[Analytics] Tracking event name: frontend_event_type, with properties: {"sessionId":"mock-uuid","stateCode":"US_XX","isRecidivizUser":false,"foo":"bar"}",
      ]
    `);
  });

  it("does not call page", () => {
    client.page();
    expect(pageMock).not.toHaveBeenCalled();
    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[Analytics] Tracking pageview: http://localhost:3000/, with properties: {"sessionId":"mock-uuid","stateCode":"US_XX","isRecidivizUser":false}",
      ]
    `);
  });
});

describe("Staging mode", () => {
  beforeEach(() => {
    client = getAnalyticsStoreWithEnv("staging", "test-key");
  });

  it("does initialize Segment", () => {
    expect(loadMock).toHaveBeenCalledExactlyOnceWith({
      writeKey: "test-key",
    });
  });

  it("does not disable analytics", () => {
    expect(client.isDisabled).toBeFalse();
  });

  it("does call analytics to identify", () => {
    client.identify("test-id");
    expect(identifyMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "test-id",
        {
          "isRecidivizUser": false,
          "sessionId": "mock-uuid",
          "stateCode": "US_XX",
        },
      ]
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does call analytics to track", () => {
    client.track("frontend_staging_event", {
      foo: "bar",
    });

    expect(trackMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "frontend_staging_event",
        {
          "foo": "bar",
          "isRecidivizUser": false,
          "sessionId": "mock-uuid",
          "stateCode": "US_XX",
        },
      ]
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does call analytics for pageview", () => {
    client.page();
    expect(pageMock).toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

describe("Production environment", () => {
  beforeEach(() => {
    client = getAnalyticsStoreWithEnv("production", "test-key");
  });

  it("does initialize Segment", () => {
    expect(loadMock).toHaveBeenCalledExactlyOnceWith({
      writeKey: "test-key",
    });
  });

  it("does not disable analytics", () => {
    expect(client.isDisabled).toBeFalse();
  });

  it("does call analytics to identify", () => {
    client.identify("test-id");

    expect(identifyMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "test-id",
        {
          "isRecidivizUser": false,
          "sessionId": "mock-uuid",
          "stateCode": "US_XX",
        },
      ]
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does call analytics to track", () => {
    client.track("frontend_prod_event", {
      foo: "bar",
    });

    expect(trackMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "frontend_prod_event",
        {
          "foo": "bar",
          "isRecidivizUser": false,
          "sessionId": "mock-uuid",
          "stateCode": "US_XX",
        },
      ]
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does call analytics for pageview", () => {
    client.page();
    expect(pageMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "isRecidivizUser": false,
          "sessionId": "mock-uuid",
          "stateCode": "US_XX",
        },
      ]
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

describe("Recidiviz user in staging", () => {
  beforeEach(() => {
    client = getAnalyticsStoreWithEnv("staging", "test-key", {
      isRecidivizUser: true,
    });
  });

  it("does initialize Segment", () => {
    expect(loadMock).toHaveBeenCalledExactlyOnceWith({
      writeKey: "test-key",
    });
  });

  it("does not disable analytics", () => {
    expect(client.isDisabled).toBeFalse();
  });

  it("does call analytics to track", () => {
    client.track("frontend_staging_event", {
      foo: "bar",
    });

    expect(trackMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        "frontend_staging_event",
        {
          "foo": "bar",
          "isRecidivizUser": true,
          "sessionId": "mock-uuid",
          "stateCode": "US_XX",
        },
      ]
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does call analytics for pageview", () => {
    client.page();
    expect(pageMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "isRecidivizUser": true,
          "sessionId": "mock-uuid",
          "stateCode": "US_XX",
        },
      ]
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

describe("Recidiviz user in production", () => {
  beforeEach(() => {
    client = getAnalyticsStoreWithEnv("production", "test-key", {
      isRecidivizUser: true,
    });
  });

  it("does initialize Segment", () => {
    expect(loadMock).toHaveBeenCalledExactlyOnceWith({
      writeKey: "test-key",
    });
  });

  it("disables analytics", () => {
    expect(client.isDisabled).toBeTrue();
  });

  it("does not call identify", () => {
    client.identify("test-id");
    expect(identifyMock).not.toHaveBeenCalled();
    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[Analytics] Identifying user: test-id, with traits: {"sessionId":"mock-uuid","stateCode":"US_XX","isRecidivizUser":true}",
      ]
    `);
  });

  it("does not call track", () => {
    client.track("frontend_prod_event", {
      foo: "bar",
    });
    expect(trackMock).not.toHaveBeenCalled();
    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "[Analytics] Tracking event name: frontend_prod_event, with properties: {"sessionId":"mock-uuid","stateCode":"US_XX","isRecidivizUser":true,"foo":"bar"}",
      ]
    `);
  });

  it("does not call page", () => {
    client.page();
    expect(pageMock).not.toHaveBeenCalled();
  });
});

describe("test mode without write key", () => {
  beforeEach(() => {
    client = getAnalyticsStoreWithEnv("test", undefined);
  });

  it("does not initialize Segment", () => {
    expect(loadMock).not.toHaveBeenCalled();
  });

  it("disables analytics", () => {
    expect(client.isDisabled).toBeTrue();
  });

  it("does not call or log identify", () => {
    client.identify("test-id");
    expect(identifyMock).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does not call or log track", () => {
    client.track("frontend_event_type", {
      foo: "bar",
    });
    expect(trackMock).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does not call or log page", () => {
    client.page();
    expect(pageMock).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
