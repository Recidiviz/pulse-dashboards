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

import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

import { useHaptic } from "./useHaptic";

const mockNotificationAsync = jest.fn(
  (_type: string): Promise<void> => Promise.resolve(),
);
const mockSelectionAsync = jest.fn((): Promise<void> => Promise.resolve());

jest.mock("expo-haptics", () => ({
  notificationAsync: (type: string) => mockNotificationAsync(type),
  selectionAsync: () => mockSelectionAsync(),
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

function renderUseHaptic(os: (typeof Platform)["OS"]) {
  Platform.OS = os;
  return renderHook(() => useHaptic()).result.current;
}

describe("useHaptic", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  describe.each(["ios", "android"] as const)("on %s", (os) => {
    it("maps success/warning/error to the matching notification feedback", () => {
      const haptic = renderUseHaptic(os);

      haptic.success();
      expect(mockNotificationAsync).toHaveBeenCalledWith("success");

      haptic.warning();
      expect(mockNotificationAsync).toHaveBeenCalledWith("warning");

      haptic.error();
      expect(mockNotificationAsync).toHaveBeenCalledWith("error");
    });

    it("maps neutral to selection feedback", () => {
      renderUseHaptic(os).neutral();

      expect(mockSelectionAsync).toHaveBeenCalledTimes(1);
      expect(mockNotificationAsync).not.toHaveBeenCalled();
    });

    it("triggers by type", () => {
      renderUseHaptic(os).trigger("success");

      expect(mockNotificationAsync).toHaveBeenCalledWith("success");
    });

    it("swallows failures from devices without haptics", async () => {
      mockNotificationAsync.mockRejectedValueOnce(new Error("no vibrator"));

      expect(() => renderUseHaptic(os).success()).not.toThrow();
      await Promise.resolve();
    });

    it("swallows synchronous throws from an unlinked native module", () => {
      mockNotificationAsync.mockImplementationOnce(() => {
        throw new TypeError("notificationAsync is not a function");
      });

      expect(() => renderUseHaptic(os).success()).not.toThrow();
    });
  });

  describe("on web", () => {
    it("does nothing", () => {
      const haptic = renderUseHaptic("web");

      haptic.success();
      haptic.neutral();
      haptic.warning();
      haptic.error();

      expect(mockNotificationAsync).not.toHaveBeenCalled();
      expect(mockSelectionAsync).not.toHaveBeenCalled();
    });
  });
});
