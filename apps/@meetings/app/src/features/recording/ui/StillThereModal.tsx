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

import { useAudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { Platform, View } from "react-native";

import pingSound from "~@meetings/app/shared/assets/sounds/ping.wav";
import { formatDurationHoursMinutes } from "~@meetings/app/shared/lib/format";
import { Button } from "~@meetings/app/shared/ui/Button";
import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useActiveMeetingStore, useNewRecording } from "../model";
import { ModalConfirmationBackdrop } from "./ModalConfirmationBackdrop";

export function StillThereModal() {
  const { setShowStillThereModal, setShowEndModal, markActivity } =
    useActiveMeetingStore();
  const { durationMs, pauseRecording } = useNewRecording();
  const ping = useAudioPlayer(pingSound);

  useEffect(() => {
    ping.play();
    return () => {
      // on mobile platforms the player is removed automatically
      if (Platform.OS === "web") ping.remove();
    };
  }, [ping]);

  const onKeepRecording = () => {
    setShowStillThereModal(false);
    markActivity();
  };

  const onStopRecording = () => {
    setShowStillThereModal(false);
    pauseRecording();
    setShowEndModal(true);
  };

  return (
    <Modal
      visible
      transparent
      containerClassName="px-6 py-5 max-w-[360px]"
      onClickOutside={onKeepRecording}
      backdrop={ModalConfirmationBackdrop}
    >
      <Typography className="mb-3 text-center text-xl font-semibold text-primary">
        Are you still there?
      </Typography>
      <Typography className="mb-5 text-center text-base text-secondary">
        We’re still recording, but we noticed it’s been{" "}
        <Typography className="rounded bg-secondary px-1 font-roboto-mono text-base text-secondary">
          {formatDurationHoursMinutes(durationMs)}
        </Typography>{" "}
        since you started this meeting.
      </Typography>
      <View className="flex-row gap-2">
        <Button variant="tertiary" className="flex-1" onPress={onKeepRecording}>
          Yes, keep recording
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onPress={onStopRecording}
        >
          Stop recording
        </Button>
      </View>
    </Modal>
  );
}
