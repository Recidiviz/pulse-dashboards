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

import { setAudioModeAsync } from "expo-audio";
import { Platform } from "react-native";

import { configureAudioMode } from "./audioMode";
import { requestNotificationPermissions } from "./notifications";

jest.mock("expo-audio", () => ({
  setAudioModeAsync: jest.fn(),
}));

jest.mock("./notifications");

describe("configureAudioMode", () => {
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    (setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
    (requestNotificationPermissions as jest.Mock).mockResolvedValue("granted");
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  it("enables background recording when notifications are granted", async () => {
    const { allowsBackgroundRecording } = await configureAudioMode();

    expect(allowsBackgroundRecording).toBe(true);
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      allowsRecording: true,
      shouldPlayInBackground: true,
      allowsBackgroundRecording: true,
    });
  });

  it("falls back to foreground-only recording when Android notifications are denied", async () => {
    Platform.OS = "android";
    (requestNotificationPermissions as jest.Mock).mockResolvedValue("denied");

    const { allowsBackgroundRecording } = await configureAudioMode();

    expect(allowsBackgroundRecording).toBe(false);
    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsBackgroundRecording: false }),
    );
  });

  it("keeps background recording on iOS regardless of notification permissions", async () => {
    Platform.OS = "ios";
    (requestNotificationPermissions as jest.Mock).mockResolvedValue("denied");

    const { allowsBackgroundRecording } = await configureAudioMode();

    expect(allowsBackgroundRecording).toBe(true);
  });
});
