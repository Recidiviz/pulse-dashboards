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

export type MicErrorType = "permission-denied" | "in-use" | "not-found";

export const MIC_ERROR_MESSAGES: Record<
  MicErrorType,
  { title: string; message: string }
> = {
  "permission-denied": {
    title: "Microphone access required",
    message:
      "Please allow microphone access in your browser or device settings, then try again.",
  },
  "in-use": {
    title: "Microphone is unavailable",
    message:
      "Your microphone is currently being used by another application or blocked by your device. Close any apps using the microphone and try again.",
  },
  "not-found": {
    title: "Microphone not detected",
    message:
      "Check your system preferences to ensure your microphone is on and connected.",
  },
};

export function getMicErrorType(error: unknown): MicErrorType {
  const name = error instanceof DOMException ? error.name : undefined;
  switch (name) {
    case "NotReadableError":
    case "TrackStartError":
      // The OS/another app has an exclusive lock on the mic.
      return "in-use";
    case "NotFoundError":
    case "DevicesNotFoundError":
      // No mic device is present at all — likely disabled or missing.
      return "not-found";
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
    default:
      // Treat anything unrecognized as a permission issue, since that's the
      // most common and most actionable case (check browser/OS settings).
      return "permission-denied";
  }
}
