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

import { act, renderHook } from "@testing-library/react-native";

import { useOfflineQueueDrainer } from "./useOfflineQueueDrainer";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockEvent = { type: "v1.client.createMeeting" };
const mockQueue = {
  head: jest.fn(() => mockEvent),
  dequeue: jest.fn(),
  events: [mockEvent],
};
const mockProcessEvent = jest.fn();
const mockShowSnackbarCalls = jest.fn();

jest.mock("~@meetings/app/entities/meeting", () => ({
  useMeetingEventQueue: () => mockQueue,
  useProcessOfflineEvent: () => ({ processEvent: mockProcessEvent }),
}));

jest.mock("react-native-auth0", () => {
  const clearSession = jest.fn();
  return { useAuth0: () => ({ clearSession }) };
});

// Like the real SnackbarProvider, showSnackbar gets a new identity whenever
// the snackbar shows or hides.
jest.mock("~@meetings/app/shared/ui/Snackbar", () => {
  const { useCallback, useState } = require("react");
  return {
    useSnackbar: () => {
      const [isShowing, setIsShowing] = useState(false);
      const showSnackbar = useCallback(
        (text: string) => {
          mockShowSnackbarCalls(text);
          if (!isShowing) setIsShowing(true);
          setTimeout(() => setIsShowing(false), 3000);
        },
        [isShowing],
      );
      return { showSnackbar };
    },
  };
});

describe("useOfflineQueueDrainer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockProcessEvent.mockResolvedValue({
      status: "error",
      error: new Error("Record to update not found."),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // Regression test for MM-624: an event that kept failing was drained again
  // each time the failure snackbar showed or hid, so it retried forever.
  it("stops after RETRY_MAX + 1 attempts on an event that always fails", async () => {
    renderHook(() => useOfflineQueueDrainer({ isOnline: true }));

    // Advance in steps so React re-renders between them, as it would in the
    // app; a single act() holds every render until it finishes.
    for (let i = 0; i < 40; i++) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await jest.advanceTimersByTimeAsync(500);
      });
    }

    expect(mockProcessEvent).toHaveBeenCalledTimes(4);
    expect(mockShowSnackbarCalls).toHaveBeenCalledTimes(1);
    expect(mockQueue.dequeue).not.toHaveBeenCalled();
  });
});
