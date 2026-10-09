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

import { TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { MeetingTypeTag } from "~@meetings/app/entities/meeting-type";

import MaximizeSvg from "../../../shared/assets/icons/arrows-poin-outting-in.svg";
import PauseSvg from "../../../shared/assets/icons/pause.svg";
import PlaySvg from "../../../shared/assets/icons/play.svg";
import StopSvg from "../../../shared/assets/icons/stop.svg";
import { formatDurationNumeric } from "../../../shared/lib/format";
import { FloatingCard } from "../../../shared/ui/FloatingCard";
import LinearProgressBar from "../../../shared/ui/LinearProgressBar";
import { RecordingIndicator } from "../../../shared/ui/RecordingIndicator";
import { Typography } from "../../../shared/ui/Typography";
import { useActiveMeetingStore, useNewRecording } from "../model";

export function MeetingMinimizedModal() {
  const {
    meetingType,
    meetingTypeCategory,
    person,
    setIsMinimized,
    setShowEndModal,
    setShowDiscardModal,
    controlsDisabled,
  } = useActiveMeetingStore();

  const {
    durationMs,
    pauseRecording,
    resumeRecording,
    state: recorderState,
  } = useNewRecording();

  const onEnd = () => {
    pauseRecording();
    setShowEndModal(true);
  };

  const onDiscard = () => {
    pauseRecording();
    setShowDiscardModal(true);
  };

  if (!person) return null;

  return (
    <FloatingCard position="bottom-right" className="h-[150px] w-[360px]">
      <View className="grow">
        <View className="mb-1 w-full flex-row justify-between">
          <Typography className="flex flex-row items-center gap-2 text-lg font-medium text-primary">
            {person.fullName}{" "}
            <MeetingTypeTag
              type={meetingType}
              typeCategory={meetingTypeCategory}
            />
          </Typography>
          <TouchableOpacity
            className="relative -right-1 -top-1"
            onPress={() => setIsMinimized(false)}
          >
            <MaximizeSvg className="size-5 text-secondary" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-2">
          <RecordingIndicator isRecording={recorderState === "recording"} />
          <Typography className="font-medium text-primary">
            {recorderState === "recording" ? "Recording in progress" : "Paused"}
          </Typography>
          <Typography className="font-semibold text-tertiary">
            {formatDurationNumeric(durationMs)}
          </Typography>
        </View>
        <View className="mt-auto w-full flex-row justify-around">
          {recorderState === "recording" ? (
            <TouchableOpacity
              className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-screen aria-disabled:opacity-40"
              onPress={pauseRecording}
              disabled={controlsDisabled}
            >
              <PauseSvg className="size-6 fill-primary" />
              <Typography className="ml-2 text-base font-semibold text-primary">
                Pause
              </Typography>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-brand aria-disabled:opacity-40"
              onPress={resumeRecording}
              disabled={controlsDisabled}
            >
              <PlaySvg className="size-4 fill-on-brand" />
              <Typography className="ml-2 text-base font-semibold text-on-brand">
                Resume
              </Typography>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-attention aria-disabled:opacity-40"
            onPress={onEnd}
            disabled={controlsDisabled}
          >
            <StopSvg className="size-6 fill-on-brand" />
            <Typography className="ml-2 text-base font-semibold text-on-brand">
              Stop
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            className="size-[44px] items-center justify-center rounded-full bg-screen aria-disabled:opacity-40"
            onPress={onDiscard}
            disabled={controlsDisabled}
          >
            <XIcon className="size-5 stroke-secondary" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-1">
        {controlsDisabled && recorderState === "idle" && <LinearProgressBar />}
      </View>
    </FloatingCard>
  );
}
