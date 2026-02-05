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

import React from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";
import { Person } from "../common/types";
import { useMeetingRecording } from "../features/recording";
import MeetingSheet from "./MeetingSheet";

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
  startTime,
  endTime,
  person,
  meetingId,
  className = "",
}: MeetingInProgressBarProps) => {
  const isPaused = recordingState === "paused";

  const { actions, totalDurationMs } = useMeetingRecording({ meetingId });

  const {
    handleTogglePauseResume,
    handleStopRecording,
    handleFinishAndSave,
    handleDiscard,
    handleFinalDiscard,
    handleContinue,
  } = actions;

  return (
    <View
      className={`flex-row items-center justify-between rounded-xl bg-[#F4F5F5] p-3 ${className}`}
    >
      <View>
        <Text className="font-inter text-[13px] font-medium text-gray-700">
          Meeting in progress
        </Text>
        <Text className="mt-1 font-inter text-[12px] text-gray-600">
          {formatDuration(totalDurationMs)}
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          className="rounded-full px-3 py-2"
          onPress={handleTogglePauseResume}
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
          onPress={handleStopRecording}
        >
          <Image
            source={Icons.Stop}
            className="!size-4"
            style={{ tintColor: "white", resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={["stopping", "discarding"].includes(recordingState)}
        animationType="slide"
        transparent
      >
        <View className="flex-1 justify-end bg-[rgba(0,0,0,0.3)]">
          {recordingState === "discarding" && (
            <MeetingSheet
              title="Discard meeting?"
              description={`You're about to discard the meeting with ${person.fullName}. Notes and transcript will not be saved.`}
              primaryButton={{
                label: "Discard",
                onPress: handleFinalDiscard,
                variant: "danger",
              }}
              secondaryButton={{
                label: "Continue Meeting",
                onPress: handleContinue,
                variant: "neutral",
              }}
            />
          )}

          {recordingState === "stopping" && (
            <MeetingSheet
              title="End this meeting?"
              description={`You're about to finish the meeting with ${person.fullName} and save the notes for processing.`}
              primaryButton={{
                label: "Finish & Save",
                onPress: handleFinishAndSave,
                variant: "danger",
              }}
              secondaryButton={{
                label: "Continue Meeting",
                onPress: handleContinue,
                variant: "primary",
              }}
              tertiaryButton={{
                label: "Discard meeting",
                onPress: handleDiscard,
                variant: "neutral",
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default MeetingInProgressBar;
