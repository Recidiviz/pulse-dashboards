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

import { useUploadSegment } from "~@meetings/app/entities/upload-segment";
import { AUDIO_FORMATS } from "~@meetings/config";

import { Status } from "../model";
import { getBlobDurationMs } from "../utils/getBlobDurationMs.web";
import { clearRecordedChunks, getAllChunks } from "../utils/webRecorderDb.web";

type Params = {
  status: Status;
  hasHydrated: boolean;
  persistedDurationMs: number;
  meetingId: string | null;
  setStatus: (status: Status) => void;
  setInitialDuration: (initialDurationMs: number) => void;
  setPersistedDurationMs: (durationMs: number) => void;
};

export function useInitialization({
  status,
  hasHydrated,
  persistedDurationMs,
  meetingId,
  setStatus,
  setInitialDuration,
  setPersistedDurationMs,
}: Params) {
  const isInitialized = useRef(false);
  const uploadSegment = useUploadSegment();

  const initialize = useCallback(async () => {
    const restoredStatus = status;
    const { contentType, extension } = AUDIO_FORMATS.webm;
    setStatus("uploading");

    try {
      // STEP 1: save duration from persisted chunks
      const chunks = await getAllChunks();
      const blob = chunks.length
        ? new Blob(chunks, { type: contentType })
        : null;
      const blobDurationMs = blob ? await getBlobDurationMs(blob) : 0;
      const result = blobDurationMs + persistedDurationMs;
      setInitialDuration(result);
      setPersistedDurationMs(result);

      // STEP 2: upload and clear persisted chunks
      if (blob && meetingId) {
        const uriToUpload = URL.createObjectURL(blob);
        await uploadSegment({
          uri: uriToUpload,
          meetingId,
          contentType,
          fileExtension: extension,
        });
        await clearRecordedChunks();
        URL.revokeObjectURL(uriToUpload);
      }
    } catch (error) {
      console.error(error);
    } finally {
      // STEP 3: set initial status
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
  ]);

  useEffect(() => {
    if (!hasHydrated || isInitialized.current) return;

    initialize();
    isInitialized.current = true;
  }, [hasHydrated, initialize]);
}
