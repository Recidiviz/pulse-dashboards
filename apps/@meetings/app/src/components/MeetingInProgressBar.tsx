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

import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";

type MeetingInProgressBarProps = {
  recordingState: string;
  startTime: Date;
  endTime: Date | null;
  onPauseResume: () => void;
  onStop: () => void;
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
  startTime,
  endTime,
  onPauseResume,
  onStop,
  className = "",
}: MeetingInProgressBarProps) => {
  const [durationMs, setDurationMs] = useState(0);
  const isPaused = recordingState === "paused";

  useEffect(() => {
    // Calculate initial time
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const initialDiff = end - start;
    setDurationMs(initialDiff);

    // If paused, don't run interval
    if (recordingState === "paused") {
      return;
    }

    // Only run interval when recording
    if (recordingState === "recording") {
      const interval = setInterval(() => {
        const diffMs = Date.now() - start;
        setDurationMs(diffMs);
      }, 1000);

      return () => clearInterval(interval);
    }

    return;
  }, [recordingState, startTime, endTime]);

  return (
    <View
      className={`flex-row items-center justify-between rounded-xl bg-[#F4F5F5] p-3 ${className}`}
    >
      <View>
        <Text className="font-inter text-[13px] font-medium text-gray-700">
          Meeting in progress
        </Text>
        <Text className="mt-1 font-inter text-[12px] text-gray-600">
          {formatDuration(durationMs)}
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          className="rounded-full px-3 py-2"
          onPress={onPauseResume}
          style={{
            backgroundColor: isPaused ? "#006C67" : "#4D5255",
          }}
        >
          <View className="flex-row items-center">
            <Image
              source={isPaused ? Icons.Play : Icons.Pause}
              className="mr-1.5 !size-4"
              style={{ tintColor: "white", resizeMode: "contain" }}
            />
            <Text className="font-inter text-[13px] font-semibold text-white">
              {isPaused ? "Resume" : "Pause"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="ml-2 rounded-full bg-[#B91C1C] p-2"
          onPress={onStop}
        >
          <Image
            source={Icons.Stop}
            className="!size-4"
            style={{ tintColor: "white", resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MeetingInProgressBar;
