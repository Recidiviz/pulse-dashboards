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

import * as Sentry from "@sentry/react-native";
import { act, renderHook } from "@testing-library/react-native";

import { useActiveMeetingStore } from "../activeMeetingStore";
import { useScreenWakeLock } from "../useScreenWakeLock.web";

jest.mock("@sentry/react-native", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
  setTag: jest.fn(),
}));

class FakeSentinel extends EventTarget {
  released = false;

  release = jest.fn(async () => {
    if (this.released) return;
    this.released = true;
    this.dispatchEvent(new Event("release"));
  });
}

class FakeDocument extends EventTarget {
  visibilityState: DocumentVisibilityState = "visible";
}

let fakeDocument: FakeDocument;
const sentinels: FakeSentinel[] = [];
const mockRequest = jest.fn(async () => {
  const sentinel = new FakeSentinel();
  sentinels.push(sentinel);
  return sentinel;
});

const latestSentinel = () => sentinels[sentinels.length - 1];

function setVisibility(state: DocumentVisibilityState) {
  fakeDocument.visibilityState = state;
  fakeDocument.dispatchEvent(new Event("visibilitychange"));
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function renderEnabled() {
  const hook = renderHook(
    ({ enabled }: { enabled: boolean }) => useScreenWakeLock(enabled),
    { initialProps: { enabled: true } },
  );
  await flush();
  return hook;
}

describe("useScreenWakeLock (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sentinels.length = 0;
    fakeDocument = new FakeDocument();
    Object.defineProperty(global, "document", {
      configurable: true,
      value: fakeDocument,
    });
    Object.defineProperty(global.navigator, "wakeLock", {
      configurable: true,
      value: { request: mockRequest },
    });
    useActiveMeetingStore.setState({ meetingId: "meeting-1" });
  });

  afterEach(() => {
    delete (global.navigator as { wakeLock?: unknown }).wakeLock;
  });

  it("does nothing while disabled", async () => {
    renderHook(() => useScreenWakeLock(false));
    await flush();

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("acquires a screen lock when enabled and logs it with the meeting ID", async () => {
    await renderEnabled();

    expect(mockRequest).toHaveBeenCalledWith("screen");
    expect(Sentry.logger.info).toHaveBeenCalledWith(
      "recording.wake_lock.acquired",
      { meetingId: "meeting-1" },
    );
  });

  it("releases the lock when disabled", async () => {
    const hook = await renderEnabled();
    const sentinel = latestSentinel();

    hook.rerender({ enabled: false });
    await flush();

    expect(sentinel.release).toHaveBeenCalled();
    expect(Sentry.logger.info).toHaveBeenCalledWith(
      "recording.wake_lock.released",
      { meetingId: "meeting-1", visibilityState: "visible" },
    );
  });

  it("re-acquires the lock when the tab becomes visible again", async () => {
    await renderEnabled();

    // The browser drops the lock on its own when the tab is hidden
    fakeDocument.visibilityState = "hidden";
    await act(() => latestSentinel().release());
    expect(Sentry.logger.info).toHaveBeenCalledWith(
      "recording.wake_lock.released",
      { meetingId: "meeting-1", visibilityState: "hidden" },
    );

    setVisibility("visible");
    await flush();

    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("doesn't request again while the lock is still held", async () => {
    await renderEnabled();

    setVisibility("visible");
    await flush();

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("stops listening for visibility changes once disabled", async () => {
    const hook = await renderEnabled();
    hook.rerender({ enabled: false });
    await flush();

    setVisibility("visible");
    await flush();

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("releases a lock that resolves after the hook was disabled", async () => {
    let resolveRequest: (sentinel: FakeSentinel) => void = () => undefined;
    mockRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const hook = renderHook(
      ({ enabled }: { enabled: boolean }) => useScreenWakeLock(enabled),
      { initialProps: { enabled: true } },
    );
    hook.rerender({ enabled: false });

    const sentinel = new FakeSentinel();
    resolveRequest(sentinel);
    await flush();

    expect(sentinel.release).toHaveBeenCalled();
    expect(Sentry.logger.info).not.toHaveBeenCalledWith(
      "recording.wake_lock.acquired",
      expect.anything(),
    );
  });

  it("logs when the browser refuses the lock", async () => {
    mockRequest.mockRejectedValueOnce(new Error("NotAllowedError"));

    await renderEnabled();

    expect(Sentry.logger.warn).toHaveBeenCalledWith(
      "recording.wake_lock.refused",
      { meetingId: "meeting-1", error: "Error: NotAllowedError" },
    );
  });

  it("logs when the browser doesn't support wake locks", async () => {
    delete (global.navigator as { wakeLock?: unknown }).wakeLock;

    await renderEnabled();

    expect(Sentry.logger.warn).toHaveBeenCalledWith(
      "recording.wake_lock.unsupported",
      { meetingId: "meeting-1" },
    );
  });
});
