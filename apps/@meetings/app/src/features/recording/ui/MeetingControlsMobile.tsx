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

import { Link, useRoute } from "@react-navigation/native";
import { TouchableOpacity, View } from "react-native";
import { ChevronRightIcon } from "react-native-heroicons/outline";
import XIcon from "react-native-heroicons/outline/XIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PauseSvg from "../../../shared/assets/icons/pause.svg";
import PlaySvg from "../../../shared/assets/icons/play.svg";
import StopSvg from "../../../shared/assets/icons/stop.svg";
import { formatDurationNumeric } from "../../../shared/lib/format";
import { RecordingIndicator } from "../../../shared/ui/RecordingIndicator";
import { Typography } from "../../../shared/ui/Typography";
import { useActiveMeetingStore, useNewRecording } from "../model";
import { useAudioErrorDetection } from "../model/useAudioErrorDetection";
import { MicIndicator } from "./MicIndicator";

export function MeetingControlsMobile() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const {
    person,
    personType,
    meetingId,
    controlsDisabled,
    setShowEndModal,
    setShowDiscardModal,
  } = useActiveMeetingStore();
  const {
    resumeRecording,
    durationMs,
    audioLevel,
    pauseRecording,
    state: recorderState,
  } = useNewRecording();
  const { micStatus } = useAudioErrorDetection({
    isRecording: recorderState === "recording",
    audioLevel,
  });

  if (recorderState === "idle" || !meetingId || !person) return null;

  const linkProps = {
    screen: personType === "client" ? "ClientNewMeeting" : "ResidentNewMeeting",
    params: {
      personId: person.personId.toString(),
      fullName: person.fullName,
      displayPersonExternalId: person.displayPersonExternalId,
      primaryMetadata: person.primaryMetadata,
      meetingId,
    },
  };

  const onEndPress = () => {
    pauseRecording();
    setShowEndModal(true);
  };

  const onDiscardPress = () => {
    pauseRecording();
    setShowDiscardModal(true);
  };
  const isNewMeetingScreen =
    route.name === "ClientNewMeeting" || route.name === "ResidentNewMeeting";

  return (
    <>
      <View className="flex flex-col items-center rounded-t-3xl bg-primary p-4">
        <View className="flex-row items-center self-stretch">
          <View className="h-[24px] w-[42px] items-center justify-center rounded-full bg-secondary">
            <MicIndicator
              variant="compact"
              status={micStatus}
              level={audioLevel}
            />
          </View>
          <View className="flex-1 items-center">
            {isNewMeetingScreen ? (
              <Typography className="text-lg font-semibold leading-[26px] text-primary">
                {person.fullName}
              </Typography>
            ) : (
              <Link {...linkProps}>
                <View className="flex flex-row items-center gap-1">
                  <Typography className="text-lg font-semibold leading-[26px] text-primary">
                    {person.fullName}
                  </Typography>
                  <ChevronRightIcon className="!size-6 stroke-tertiary stroke-[2px]" />
                </View>
              </Link>
            )}
          </View>
          <View className="w-[42px]" />
        </View>
        <View className="mt-1 flex flex-row items-center gap-2">
          <RecordingIndicator isRecording={recorderState === "recording"} />
          <Typography className="text-sm font-medium text-primary">
            Recording in progress
          </Typography>
          <Typography className="text-sm text-secondary">
            {formatDurationNumeric(durationMs)}
          </Typography>
        </View>
        <View className="mt-4 w-full flex-row items-center justify-center gap-2">
          {recorderState === "recording" ? (
            <TouchableOpacity
              className="flex-1 disabled:opacity-50"
              onPress={pauseRecording}
              disabled={controlsDisabled}
            >
              <View className="flex h-[44px] flex-row items-center justify-center gap-1.5 rounded-full bg-secondary">
                <PauseSvg className="!size-4 fill-tertiary" />
                <Typography className="text-base font-semibold leading-[18px] text-primary">
                  Pause
                </Typography>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 disabled:opacity-50"
              onPress={resumeRecording}
              disabled={controlsDisabled}
            >
              <View className="flex h-[44px] flex-row items-center justify-center gap-1.5 rounded-full bg-brand">
                <PlaySvg className="!size-4 fill-on-brand" />
                <Typography className="text-base font-semibold leading-[18px] text-on-brand">
                  Resume
                </Typography>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="flex-1 disabled:opacity-50"
            onPress={onEndPress}
            disabled={controlsDisabled}
          >
            <View className="flex h-[44px] flex-row items-center justify-center gap-1.5 rounded-full bg-attention">
              <StopSvg className="!size-4 fill-on-brand" />
              <Typography className="text-base font-semibold leading-[18px] text-on-brand">
                Stop
              </Typography>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="disabled:opacity-50"
            onPress={onDiscardPress}
            disabled={controlsDisabled}
          >
            <View className="flex size-[44px] items-center justify-center rounded-full bg-secondary">
              <XIcon className="!size-5 stroke-tertiary" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View
        className="bg-primary"
        style={{ height: insets.bottom, marginBottom: -insets.bottom }}
      />
    </>
  );
}
