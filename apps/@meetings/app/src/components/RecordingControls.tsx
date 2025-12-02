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

import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Icons from "../../assets/icons";
import { RecordingStatus } from "../common/types";

interface RecordingControlsProps {
  status: Exclude<RecordingStatus, "ending">;
  onStart: () => void;
  onStop: () => void;
  onPauseResume: () => void;
}

const StartButton: React.FC<{ onPress: () => void; disabled: boolean }> = ({
  onPress,
  disabled,
}) => (
  <TouchableOpacity
    className="flex-row justify-center items-center bg-[#006C67] py-5 rounded-full"
    onPress={onPress}
    disabled={disabled}
  >
    <Image source={Icons.Play} className="mr-2 size-4" />
    <Text className="font-semibold text-white">Start Recording</Text>
  </TouchableOpacity>
);

const StopButton: React.FC<{ onPress: () => void; disabled: boolean }> = ({
  onPress,
  disabled,
}) => {
  const bgClass = disabled ? "bg-gray-300" : "bg-[#B42D2D]";
  const textClass = disabled ? "text-gray-700" : "text-white";

  return (
    <TouchableOpacity
      className={`w-[120px] flex-row items-center justify-center rounded-full px-8 py-3 ${bgClass}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Image source={Icons.Stop} className="mr-2 size-6" />
      <Text className={`font-semibold ${textClass}`}>Stop</Text>
    </TouchableOpacity>
  );
};

const PauseResumeButton: React.FC<{
  status: Extract<RecordingStatus, "paused" | "recording" | "uploading">;
  onPress: () => void;
  disabled: boolean;
}> = ({ status, onPress, disabled }) => {
  const isUploading = status === "uploading";

  let bgColor = "#4D5255";
  if (isUploading) bgColor = "#D1D5DB";
  if (status === "paused") bgColor = "#006C67";

  const textClass = isUploading ? "text-gray-700" : "text-white";

  return (
    <TouchableOpacity
      className="flex-row justify-center items-center ml-3 px-8 py-3 rounded-full w-[120px]"
      onPress={onPress}
      disabled={disabled}
      style={{ backgroundColor: bgColor }}
    >
      {isUploading ? (
        <ActivityIndicator size="small" color="white" className="mr-2" />
      ) : (
        <Image
          source={status === "paused" ? Icons.Play : Icons.Pause}
          className="mr-2 size-6"
        />
      )}
      <Text className={`font-semibold ${textClass}`}>
        {status === "paused" ? "Resume" : "Pause"}
      </Text>
    </TouchableOpacity>
  );
};

const RecordingControls: React.FC<RecordingControlsProps> = ({
  status,
  onStart,
  onStop,
  onPauseResume,
}) => {
  const isUploading = status === "uploading";

  if (status === "idle") {
    return <StartButton onPress={onStart} disabled={isUploading} />;
  }

  return (
    <>
      {status === "recording" && (
        <View className="flex-row justify-center items-center pb-2">
          <Image source={Icons.Record} className="size-4" />
          <Text className="px-2 text-black">Recording in progress</Text>
        </View>
      )}

      <View className="flex-row justify-center items-center">
        <StopButton onPress={onStop} disabled={isUploading} />
        <PauseResumeButton
          status={
            status as Extract<
              RecordingStatus,
              "paused" | "recording" | "uploading"
            >
          }
          onPress={onPauseResume}
          disabled={isUploading}
        />
      </View>
    </>
  );
};

export default RecordingControls;
