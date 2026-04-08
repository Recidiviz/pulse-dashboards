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

import clsx from "clsx";
import React from "react";
import { TouchableOpacity, View } from "react-native";

import PauseSvg from "../assets/icons/pause.svg";
import PlaySvg from "../assets/icons/play.svg";
import StopSvg from "../assets/icons/stop.svg";
import { Person } from "../common/types";
import { useRecording } from "../features/recording";
import { RecordingIndicator } from "../shared/ui/RecordingIndicator";
import { Typography } from "../shared/ui/Typography";

type MeetingInProgressBarProps = {
  recordingState: string;
  startTime: Date;
  endTime: Date | null;
  person: Person;
  meetingId: string;
  className?: string;
};

const formatDuration = (diffMs: number) => {
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
};

const MeetingInProgressBar = ({
  recordingState,
  className = "",
}: MeetingInProgressBarProps) => {
  const isPaused = recordingState === "paused";

  const { durationMs, stopRecording, togglePauseResume, status } =
    useRecording<"native">();

  return (
    <View
      className={clsx(
        "flex-row items-center justify-between rounded-xl bg-secondary px-3 py-2",
        className,
      )}
    >
      <View className="flex flex-row items-center gap-1">
        <RecordingIndicator status={status} />
        <Typography className="text-sm font-medium leading-4 text-primary">
          Recording
        </Typography>
        <Typography className="text-sm leading-4 text-secondary">
          {formatDuration(durationMs)}
        </Typography>
      </View>
      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          className={clsx(
            "rounded-full px-3 py-1.5",
            isPaused
              ? "border border-brand bg-brand"
              : "border border-subtle bg-transparent",
          )}
          onPress={togglePauseResume}
        >
          <View className="flex-row items-center">
            {isPaused ? (
              <PlaySvg className="!size-4 fill-on-brand" />
            ) : (
              <PauseSvg className="!size-4 fill-tertiary" />
            )}
            <Typography
              className={clsx(
                "ml-1 text-sm font-semibold",
                isPaused ? "text-on-brand" : "text-primary",
              )}
            >
              {isPaused ? "Resume" : "Pause"}
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="ml-2 rounded-full border border-attention bg-attention p-[6px]"
          onPress={stopRecording}
        >
          <StopSvg className="size-4 fill-on-brand" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MeetingInProgressBar;
