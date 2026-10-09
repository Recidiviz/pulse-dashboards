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
import { Platform, View } from "react-native";

import { useEndMeeting } from "~@meetings/app/entities/meeting";
import { useUploadSegment } from "~@meetings/app/shared/api";
import { useErrorCapture } from "~@meetings/app/shared/lib/errors";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { AUDIO_FORMATS } from "~@meetings/config";

import { Button } from "../../../shared/ui/Button";
import Modal from "../../../shared/ui/Modal";
import { Typography } from "../../../shared/ui/Typography";
import { useActiveMeetingStore, useNewRecording } from "../model";
import { ModalConfirmationBackdrop } from "./ModalConfirmationBackdrop";

export function EndMeetingModal() {
  const {
    meetingId,
    person,
    personType,
    note,
    cleanup,
    setControlsDisabled,
    setShowEndModal,
    controlsDisabled,
  } = useActiveMeetingStore();
  const { finalizeRecording, resumeRecording } = useNewRecording();
  const endMeeting = useEndMeeting();
  const upload = useUploadSegment();
  const { showError, captureError } = useErrorCapture();
  const { isOnline } = useIsOnline();

  if (!person) return null;

  const onContinue = () => {
    setShowEndModal(false);
    resumeRecording();
  };

  const onFinishAndSave = async () => {
    if (!meetingId || !personType) {
      showError("Invalid meeting state.", {
        message: "meeting.end.error",
        error: new Error(
          `Invalid state when finishing a meeting: ${JSON.stringify({ meetingId, person: person?.personId, personType })}`,
        ),
        params: { meetingId },
      });
      return;
    }

    const endTime = new Date();
    let audioUri: string | undefined;
    // Web keeps the recording as a blob; native keeps a file URI.
    let audioBlob: Blob | undefined;
    // When the upload is skipped or fails, endMeeting queues the meeting and
    // its audio in the offline queue, which retries the upload later.
    let queueForRetry = false;
    try {
      setControlsDisabled(true);
      const audioUrl = await finalizeRecording();
      if (Platform.OS === "web") {
        audioBlob = await fetch(audioUrl).then((r) => r.blob());
      } else {
        audioUri = audioUrl;
      }

      if (isOnline) {
        try {
          Sentry.logger.info("upload.start", { meetingId });
          await upload({
            uri: audioUrl,
            meetingId,
            fileExtension: AUDIO_FORMATS.m4a.extension,
            contentType: AUDIO_FORMATS.m4a.contentType,
          });
          Sentry.logger.info("upload.done", { meetingId });
        } catch (error) {
          captureError({
            message: "upload.error",
            error,
            params: { meetingId },
          });
          queueForRetry = true;
        }
      }
    } catch (error) {
      captureError({
        message: "recording.finalize.error",
        error,
        params: { meetingId },
      });
      setControlsDisabled(false);
      return;
    }

    try {
      await endMeeting.mutateAsync({
        meetingId,
        personId: person.personId,
        personType,
        endTime,
        userNotepadNotes: note || undefined,
        audioUri,
        audioBlob,
        person,
        queueForRetry,
      });
      Sentry.logger.info("meeting.end", { meetingId });
    } catch (error) {
      showError("Failed to end the meeting. An error occured.", {
        message: "meeting.end.error",
        error,
        params: { meetingId },
      });
      return;
    } finally {
      setControlsDisabled(false);
    }

    cleanup();
  };

  return (
    <Modal
      visible={!controlsDisabled}
      transparent
      containerClassName="px-6 py-5 sm:max-w-[360px]"
      onClickOutside={onContinue}
      backdrop={ModalConfirmationBackdrop}
    >
      <Typography className="mb-3 text-center text-xl font-semibold text-primary">
        End this meeting?
      </Typography>
      <Typography className="mb-5 text-center text-base text-secondary">
        You’re about to finish the meeting with{" "}
        <Typography className="text-base font-bold text-primary">
          {person.fullName}
        </Typography>{" "}
        and save the notes for processing.
      </Typography>
      <View className="flex-row gap-2">
        <Button
          variant="tertiary"
          className="flex-1"
          onPress={onContinue}
          disabled={controlsDisabled}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onPress={onFinishAndSave}
          disabled={controlsDisabled}
        >
          Finish & Save
        </Button>
      </View>
    </Modal>
  );
}
