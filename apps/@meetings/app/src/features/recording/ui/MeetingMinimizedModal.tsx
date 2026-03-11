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

import MaximizeSvg from "../../../assets/icons/arrows-poin-outting-in.svg";
import PauseSvg from "../../../assets/icons/pause.svg";
import PlaySvg from "../../../assets/icons/play.svg";
import StopSvg from "../../../assets/icons/stop.svg";
import { Person } from "../../../common/types";
import LinearProgressBar from "../../../components/LinearProgressBar";
import { Typography } from "../../../shared/ui/Typography";
import { formatDurationNumeric } from "../../../utils/format";
import { useRecording } from "../model";

type Props = {
  person: Person;
  durationMs: number;
  onPauseResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
};

export function MeetingMinimizedModal({
  person,
  durationMs,
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
          <Typography className="text-lg font-medium text-primary">
            {person.fullName}
          </Typography>
          <TouchableOpacity
            className="relative -right-1 -top-1"
            onPress={() => setIsRecordingViewMinimized(false)}
          >
            <MaximizeSvg className="size-5 text-[#355362]" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-2">
          {status === "recording" && (
            <View className="box-content size-1.5 rounded-full border-[3px] border-[#FFEAE5] bg-[#B42D2D]" />
          )}
          <Typography className="font-medium text-primary">
            {status === "recording" ? "Recording in progress" : "Paused"}
          </Typography>
          <Typography className="font-semibold text-[#9AA6AC]">
            {formatDurationNumeric(durationMs)}
          </Typography>
        </View>
        <View className="mt-auto w-full flex-row justify-around">
          {status === "recording" ? (
            <TouchableOpacity
              className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-[#F4F5F5] aria-disabled:opacity-40"
              onPress={onPauseResume}
              disabled={isControlsDisabled}
            >
              <PauseSvg className="size-6 fill-primary" />
              <Typography className="ml-2 text-base font-semibold text-primary">
                Pause
              </Typography>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-[#006C67] aria-disabled:opacity-40"
              onPress={onPauseResume}
              disabled={isControlsDisabled}
            >
              <PlaySvg className="size-4 fill-[#EDF1F1]" />
              <Typography className="ml-2 text-base font-semibold text-white">
                Resume
              </Typography>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="h-[44px] w-[130px] flex-row items-center justify-center rounded-full bg-[#B42D2D] aria-disabled:opacity-40"
            onPress={onStop}
            disabled={isControlsDisabled}
          >
            <StopSvg className="size-6 fill-[#FFEAE5]" />
            <Typography className="ml-2 text-base font-semibold text-white">
              Stop
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            className="size-[44px] items-center justify-center rounded-full bg-[#E6EAEB] aria-disabled:opacity-40"
            onPress={onDiscard}
            disabled={isControlsDisabled}
          >
            <XIcon className="size-5 stroke-[#9AA6AC]" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-1">
        {status === "ending" && <LinearProgressBar />}
      </View>
    </View>
  );
}
