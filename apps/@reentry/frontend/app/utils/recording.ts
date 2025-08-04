// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

/**
 * Recording utilities
 */

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const validateRecordingCapabilities = (
  selectedMicrophone: string,
  isRecordingSupported: boolean,
  supportedFormat: string | null,
): void => {
  if (!selectedMicrophone) {
    throw new Error("Please select a microphone first");
  }

  if (!isRecordingSupported || !supportedFormat) {
    throw new Error("Audio recording not supported on this device");
  }
};

export const cleanupMediaResources = (
  stream: MediaStream | null,
  interval: NodeJS.Timeout | null = null,
): void => {
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  if (interval) {
    clearInterval(interval);
  }
};

// ====== RESUME UTILITIES ======

/**
 * Check if this is a within-session resume (MediaRecorder still exists and valid)
 * vs cross-session resume (need new MediaRecorder + dummy chunk)
 */
export const isWithinSessionResume = (
  mediaRecorder: MediaRecorder | null,
): boolean => {
  return mediaRecorder !== null && mediaRecorder.state === "paused";
};

/**
 * Restore chunk counter from backend session data
 * Used when recovering from cross-session pause
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const restoreChunkCounter = (sessionData: any): number => {
  console.log("Attempting to restore chunk counter from:", sessionData);

  // Try different possible property names
  const chunkCount =
    sessionData?.chunk_count ??
    sessionData?.chunkCount ??
    sessionData?.chunks ??
    sessionData?.total_chunks;

  if (typeof chunkCount === "number" && chunkCount >= 0) {
    console.log(`Restoring chunk counter to: ${chunkCount}`);
    return chunkCount;
  }

  // Log available properties for debugging
  if (sessionData && typeof sessionData === "object") {
    console.warn(
      "Available properties in session data:",
      Object.keys(sessionData),
    );
  }

  console.warn("No valid chunk count in session data, starting from 0");
  return 0;
};
