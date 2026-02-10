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

import { Image, Text, TouchableOpacity, View } from "react-native";

import { Person } from "~@meetings/app/common/types";
import LinearProgressBar from "~@meetings/app/components/LinearProgressBar";
import { formatDurationNumeric } from "~@meetings/app/utils/format";
import Icons from "~@meetings/icons";

import { useRecording } from "../model";

type Props = {
  person: Person;
  totalDurationMs: number;
  onPauseResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
};

export function MeetingMinimizedModal({
  person,
  totalDurationMs,
  onPauseResume,
  onStop,
  onDiscard,
}: Props) {
  const { status, setIsRecordingViewMinimized } = useRecording<"web">();

  const isControlsDisabled = status === "uploading" || status === "ending";

  return (
    <View className="absolute bottom-5 right-5 h-[150px] w-[360px] overflow-hidden rounded-[20px] bg-white shadow-lg">
      <View className="grow p-5">
        <View className="mb-1 w-full flex-row justify-between">
          <Text className="font-inter text-lg font-medium text-primary">
            {person.fullName}
          </Text>
          <TouchableOpacity
            className="relative -right-1 -top-1"
            onPress={() => setIsRecordingViewMinimized(false)}
          >
            <Image source={Icons.Maximize} className="!size-5" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-2">
          {status === "recording" && (
            <Image source={Icons.Record} className="!size-4" />
          )}
          <Text className="font-inter font-medium text-primary">
            {status === "recording" ? "Recording in progress" : "Paused"}
          </Text>
          <Text className="font-inter font-semibold text-[#9AA6AC]">
            {formatDurationNumeric(totalDurationMs)}
          </Text>
        </View>
        <View className="mt-auto w-full flex-row justify-around">
          {status === "recording" ? (
            <TouchableOpacity
              className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-[#F4F5F5] aria-disabled:opacity-40"
              onPress={onPauseResume}
              disabled={isControlsDisabled}
            >
              <Image source={Icons.PauseBlack} className="mr-2 !size-6" />
              <Text className="font-inter text-base font-semibold text-primary">
                Pause
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-[#006C67] aria-disabled:opacity-40"
              onPress={onPauseResume}
              disabled={isControlsDisabled}
            >
              <Image source={Icons.Play} className="mr-2 !size-4" />
              <Text className="font-inter text-base font-semibold text-white">
                Resume
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-[#B42D2D] aria-disabled:opacity-40"
            onPress={onStop}
            disabled={isControlsDisabled}
          >
            <Image source={Icons.Stop} className="mr-2 !size-6" />
            <Text className="font-inter text-base font-semibold text-white">
              Stop
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="size-[44px] items-center justify-center rounded-full bg-[#E6EAEB] aria-disabled:opacity-40"
            onPress={onDiscard}
            disabled={isControlsDisabled}
          >
            <Image source={Icons.Cross} className="!size-6" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-1">
        {status === "ending" && <LinearProgressBar />}
      </View>
    </View>
  );
}
