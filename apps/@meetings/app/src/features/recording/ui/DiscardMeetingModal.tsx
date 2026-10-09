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
import { useEffect, useState } from "react";
import { View } from "react-native";

import { useDiscardMeeting } from "~@meetings/app/entities/meeting";
import { useErrorCapture } from "~@meetings/app/shared/lib/errors";

import { Button } from "../../../shared/ui/Button";
import Modal from "../../../shared/ui/Modal";
import { Typography } from "../../../shared/ui/Typography";
import { useActiveMeetingStore, useNewRecording } from "../model";
import { ModalConfirmationBackdrop } from "./ModalConfirmationBackdrop";

export function DiscardMeetingModal() {
  const {
    meetingId,
    person,
    personType,
    cleanup,
    setControlsDisabled,
    setShowDiscardModal,
    controlsDisabled,
  } = useActiveMeetingStore();
  const { discardRecording, resumeRecording } = useNewRecording();
  const discard = useDiscardMeeting();
  const { captureError } = useErrorCapture();
  const [discardCountdown, setDiscardCountdown] = useState(3);

  useEffect(() => {
    setDiscardCountdown(3);

    const interval = setInterval(() => {
      setDiscardCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!person) return null;

  const onContinue = () => {
    setShowDiscardModal(false);
    resumeRecording();
  };

  const onDiscard = async () => {
    if (!meetingId || !personType) return;

    try {
      setControlsDisabled(true);
      await discardRecording();
      await discard.mutateAsync({
        meetingId,
        personId: person.personId,
        personType,
      });
      Sentry.logger.info("meeting.discard", { meetingId });
    } catch (error) {
      captureError({
        message: "meeting.discard.error",
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
      containerClassName="px-6 py-5 max-w-[360px]"
      onClickOutside={onContinue}
      backdrop={ModalConfirmationBackdrop}
    >
      <Typography className="mb-3 text-center text-xl font-semibold text-primary">
        Discard meeting?
      </Typography>
      <Typography className="mb-5 text-center text-base text-secondary">
        You’re about to discard the meeting with{" "}
        <Typography className="text-base font-bold text-primary">
          {person.fullName}.
        </Typography>{" "}
        Notes and transcript won't be saved.
      </Typography>
      <View className="flex-row gap-2">
        <Button variant="tertiary" className="flex-1" onPress={onContinue}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onPress={onDiscard}
          disabled={discardCountdown > 0 || controlsDisabled}
        >
          {discardCountdown > 0
            ? `Discard (0:${discardCountdown.toString().padStart(2, "0")})`
            : "Discard"}
        </Button>
      </View>
    </Modal>
  );
}
