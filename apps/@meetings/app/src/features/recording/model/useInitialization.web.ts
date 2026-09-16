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

import { useCallback, useEffect, useRef } from "react";

import { useUploadSegment } from "~@meetings/app/shared/api";
import { AUDIO_FORMATS } from "~@meetings/config";

import { getBlobDurationMs } from "../lib/getBlobDurationMs.web";
import { hasEBMLHeader } from "../lib/hasEBMLHeader.web";
import { clearRecordedChunks, getAllChunks } from "../lib/webRecorderDb.web";
import { Status } from ".";

type Params = {
  status: Status;
  hasHydrated: boolean;
  persistedDurationMs: number;
  meetingId: string | null;
  setStatus: (status: Status) => void;
  setInitialDuration: (initialDurationMs: number) => void;
  setPersistedDurationMs: (durationMs: number) => void;
  onError: (error: unknown) => void;
};

export function useInitialization({
  status,
  hasHydrated,
  persistedDurationMs,
  meetingId,
  setStatus,
  setInitialDuration,
  setPersistedDurationMs,
  onError,
}: Params) {
  const isInitialized = useRef(false);
  const uploadSegment = useUploadSegment();

  const initialize = useCallback(async () => {
    const restoredStatus = status;
    const { contentType, extension } = AUDIO_FORMATS.webm;
    setStatus("uploading");

    try {
      const chunks = await getAllChunks();
      const blob = chunks.length
        ? new Blob(chunks, { type: contentType })
        : null;

      if (!blob) {
        // No pending chunks: still seed the timer, or it resets to 0 instead
        // of reflecting the duration already persisted from prior segments.
        setInitialDuration(persistedDurationMs);
        setPersistedDurationMs(persistedDurationMs);
        return;
      }

      // STEP 1: save audio blob (even if it's corrupted we can try to recover)
      const uriToUpload = URL.createObjectURL(blob);
      if (meetingId) {
        await uploadSegment({
          uri: uriToUpload,
          meetingId,
          contentType,
          fileExtension: extension,
        });
      } else {
        throw new Error("Missing meetingId during recording initialization");
      }

      // STEP 2: clear persisted chunks after uploading
      await clearRecordedChunks();
      URL.revokeObjectURL(uriToUpload);

      // STEP 3: Save duration from persisted chunks
      const blobDurationMs = await getBlobDurationMs(blob);
      const result = blobDurationMs + persistedDurationMs;
      setInitialDuration(result);
      setPersistedDurationMs(result);

      // STEP 4: Check for corruption
      const isValidWebM = await hasEBMLHeader(blob);

      if (!isValidWebM) {
        throw new Error(
          "Persisted recording chunks are missing or have an invalid WebM header",
        );
      }
    } catch (error) {
      onError(error);
    } finally {
      // STEP 5: set initial status
      switch (restoredStatus) {
        case "idle":
        case "paused":
          setStatus(restoredStatus);
          break;
        default:
          setStatus("paused");
      }
    }
  }, [
    status,
    meetingId,
    setStatus,
    uploadSegment,
    setInitialDuration,
    persistedDurationMs,
    setPersistedDurationMs,
    onError,
  ]);

  useEffect(() => {
    if (!hasHydrated || isInitialized.current) return;

    initialize();
    isInitialized.current = true;
  }, [hasHydrated, initialize]);
}
