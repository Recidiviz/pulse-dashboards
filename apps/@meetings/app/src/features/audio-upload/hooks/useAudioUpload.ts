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

import { useCallback, useRef } from "react";

import { useUploadSegment } from "~@meetings/app/entities/upload-segment";
import { useCreateMeeting } from "~@meetings/app/hooks/useCreateMeeting";
import { useDiscardMeeting } from "~@meetings/app/hooks/useDiscardMeeting";
import { useEndMeeting } from "~@meetings/app/hooks/useEndMeeting";
import { AbortError, FileValidationError } from "~@meetings/app/shared/errors";
import { trpc } from "~@meetings/app/trpc/client";

import { useAudioUploadStore } from "../store";
import { RawFileInfo } from "../types";
import { deserializeFile } from "../utils/deserializeFile";

export function useAudioUpload() {
  const store = useAudioUploadStore();
  const person = useAudioUploadStore((s) => s.person);
  const uploadSegment = useUploadSegment();
  const endMeetingMutation = useEndMeeting();
  const discardMeetingMutation = useDiscardMeeting();
  const { mutateAsync: deleteRecordings } =
    trpc.v1.meeting.deleteRecordings.useMutation();
  const { createMeetingAsync } = useCreateMeeting({
    person,
    personType: store.personType,
    onSuccess: () => undefined,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const addFile = useCallback(
    async (rawFile: RawFileInfo) => {
      try {
        let meetingId = store.meetingId;

        if (!meetingId) {
          if (!person || !store.personType) {
            throw new Error("person and personType are required");
          }
          meetingId = await createMeetingAsync();
          store.setMeetingId(meetingId);
        } else {
          await deleteRecordings({ meetingId });
        }

        store.setFile(null);

        const file = deserializeFile(rawFile);

        store.setError(null);
        store.setFile(file);
        store.setStatus("uploading");
        store.setUploadProgress(0, file.size);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        await uploadSegment({
          uri: file.uri,
          meetingId,
          signal: abortController.signal,
          fileExtension: file.extension,
          contentType: file.contentType,
          onProgress: (loaded, total) => {
            store.setUploadProgress(loaded, total);
          },
        });

        store.setStatus("uploaded");
      } catch (error) {
        if (error instanceof AbortError) {
          store.setFile(null);
        } else if (error instanceof FileValidationError) {
          store.setError(error.message);
        } else if (error instanceof Error) {
          store.setError(error.message || "Upload failed. Please try again.");
        }

        store.setStatus("selecting");
        store.setUploadProgress(0, 0);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }

        console.error("Failed to add file:", error);
      }
    },
    [store, person, uploadSegment, deleteRecordings, createMeetingAsync],
  );

  const removeFile = useCallback(async () => {
    try {
      if (!store.meetingId) {
        throw new Error("meetingId is required");
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      await deleteRecordings({ meetingId: store.meetingId });

      store.setFile(null);
      store.setError(null);
      store.setUploadProgress(0, 0);
      store.setStatus("selecting");
    } catch (error) {
      if (error instanceof Error) {
        store.setError(error.message || "Removing failed. Please try again.");
      }
      console.error("Failed to remove file:", error);
    }
  }, [store, deleteRecordings]);

  const confirmUpload = useCallback(async () => {
    try {
      if (!store.meetingId || !store.person || !store.personType) {
        throw new Error("meetingId, personId, and personType are required");
      }
      await endMeetingMutation.mutateAsync({
        meetingId: store.meetingId,
        personId: store.person.personId,
        personType: store.personType,
      });
      store.setDialog("success");
    } catch (error) {
      store.setDialog("error");
      console.error("Failed to confirm uploading:", error);
    }
  }, [store, endMeetingMutation]);

  const discardUpload = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    try {
      if (!store.meetingId || !store.person || !store.personType) {
        throw new Error("meetingId, personId, and personType are required");
      }
      await deleteRecordings({ meetingId: store.meetingId });
      await discardMeetingMutation.mutateAsync({
        meetingId: store.meetingId,
        personId: store.person.personId,
        personType: store.personType,
      });
      store.reset();
    } catch (error) {
      console.error("Failed to discard meeting:", error);
    }
  }, [store, discardMeetingMutation, deleteRecordings]);

  const continueUpload = useCallback(() => {
    store.setDialog(null);
  }, [store]);

  const requestCancel = useCallback(() => {
    if (!store.meetingId) {
      return store.reset();
    }
    store.setDialog("cancel");
  }, [store]);

  const closeModal = useCallback(() => {
    store.reset();
  }, [store]);

  return {
    addFile,
    removeFile,

    confirmUpload,
    discardUpload,
    continueUpload,

    requestCancel,

    closeModal,
  };
}
