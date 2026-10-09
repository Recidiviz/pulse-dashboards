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

import * as TooltipPrimitive from "@rn-primitives/tooltip";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { MeetingTypeTag } from "~@meetings/app/entities/meeting-type";

import PauseSvg from "../../../shared/assets/icons/pause.svg";
import PlaySvg from "../../../shared/assets/icons/play.svg";
import StopSvg from "../../../shared/assets/icons/stop.svg";
import { formatDurationNumeric } from "../../../shared/lib/format";
import LinearProgressBar from "../../../shared/ui/LinearProgressBar";
import { OfflineIndicator } from "../../../shared/ui/OfflineIndicator";
import { RecordingIndicator } from "../../../shared/ui/RecordingIndicator";
import { Typography } from "../../../shared/ui/Typography";
import { useActiveMeetingStore } from "../model";
import { useNewRecording } from "../model";
import { useAudioErrorDetection } from "../model/useAudioErrorDetection";
import { MeetingModalLayout } from "./MeetingModalLayout";
import { MicIndicator } from "./MicIndicator";

export const MeetingFullSizeModal = () => {
  const {
    meetingType,
    meetingTypeCategory,
    note,
    setNote,
    setIsMinimized,
    setShowEndModal,
    setShowDiscardModal,
    controlsDisabled,
    person,
    isSidebarCollapsed,
  } = useActiveMeetingStore();

  const {
    durationMs,
    audioLevel,
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

  const { micStatus, hasAudioError } = useAudioErrorDetection({
    isRecording: recorderState === "recording",
    audioLevel,
  });

  const tooltipTriggerRef = useRef<TooltipPrimitive.TriggerRef>(null);

  useEffect(
    function displayErrorTip() {
      if (hasAudioError) {
        tooltipTriggerRef.current?.open();
      } else {
        tooltipTriggerRef.current?.close();
      }
    },
    [hasAudioError],
  );

  const tooltipContainer =
    typeof document !== "undefined"
      ? document.getElementById("rnmodal")
      : undefined;

  if (!person) return null;

  const minimize = () => setIsMinimized(true);

  return (
    <MeetingModalLayout
      titleAccessory={
        <MeetingTypeTag type={meetingType} typeCategory={meetingTypeCategory} />
      }
      onClose={minimize}
      sidebarProps={{ person, onNavigateAway: minimize }}
    >
      <View className="flex-1 grow">
        <View className="flex-1 grow flex-row">
          <View className="flex-1 gap-2 px-12 pb-6 pt-8">
            <Typography variant="heading-5">Notepad</Typography>
            <Typography variant="body-m-regular" className="!text-secondary">
              Use the notepad to flag anything you want to make sure is in the
              final notes. It will be saved and used to build the summary.
            </Typography>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              className="mt-4 grow justify-start rounded-lg border border-subtle px-4 py-3 text-base leading-[22px] text-primary outline-none"
              placeholder="Start typing here... Try adding details you want saved, discussion topics, or other notes."
              editable={!controlsDisabled}
            />
          </View>
        </View>
        <View className="h-1">
          {recorderState === "idle" && <LinearProgressBar />}
        </View>
        <View
          className={clsx(
            "flex-col items-center justify-between gap-2 border-t border-subtle bg-screen px-8 py-5",
            isSidebarCollapsed && "lg:columns-3 lg:flex-row",
          )}
        >
          <View className="flex flex-row items-center gap-3">
            <OfflineIndicator
              triggerClassName={clsx(
                "hidden rounded-full border-2 border-on-brand bg-warning-light size-11",
                isSidebarCollapsed && "lg:flex",
              )}
              iconClassName="!size-5"
              enableTooltip
              side="top"
              align="start"
              alignOffset={-9}
              isInsideModal
            />
            <View
              className={clsx(
                "flex w-[250px] flex-row-reverse justify-between",
                isSidebarCollapsed &&
                  "lg:w-[180px] lg:flex-col lg:justify-start",
              )}
            >
              <Typography className="text-lg font-semibold text-primary">
                {formatDurationNumeric(durationMs)}
              </Typography>
              <View className="flex-row items-center gap-2">
                <RecordingIndicator
                  isRecording={recorderState === "recording"}
                />
                <Typography className="font-medium text-secondary">
                  {recorderState === "recording"
                    ? "Recording in progress"
                    : "Recording paused"}
                </Typography>
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <OfflineIndicator
              triggerClassName={clsx(
                "rounded-full border-2 border-on-brand bg-warning-light size-11",
                isSidebarCollapsed && "lg:hidden",
              )}
              iconClassName="!size-5"
              enableTooltip
              side="top"
              align="start"
              alignOffset={-8}
              isInsideModal
            />
            {recorderState === "recording" ? (
              <TooltipPrimitive.Root delayDuration={0}>
                <TooltipPrimitive.Trigger
                  ref={tooltipTriggerRef}
                  asChild
                  onPress={() => tooltipTriggerRef.current?.close()}
                  className="mr-6"
                >
                  <View>
                    <MicIndicator
                      variant="full"
                      status={micStatus}
                      level={audioLevel}
                    />
                  </View>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal container={tooltipContainer}>
                  <TooltipPrimitive.Content
                    className="z-100 relative flex w-52 flex-col gap-1 rounded-xl bg-strong p-4"
                    side="top"
                    align="start"
                    sideOffset={12}
                  >
                    {micStatus === "error" ? (
                      <>
                        <Typography className="text-sm font-semibold text-on-brand">
                          No audio detected
                        </Typography>
                        <Typography className="text-sm font-normal text-on-brand">
                          Check your microphone
                        </Typography>
                      </>
                    ) : (
                      <Typography className="text-sm font-semibold text-on-brand">
                        Audio is detected
                      </Typography>
                    )}
                    <View className="absolute bottom-0 -z-10 size-4 rotate-45 bg-strong" />
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            ) : (
              <View className="mr-6">
                <MicIndicator
                  variant="full"
                  status={micStatus}
                  level={audioLevel}
                />
              </View>
            )}
            {recorderState === "recording" ? (
              <TouchableOpacity
                className="w-[150px] flex-row items-center justify-center rounded-full bg-primary py-3 aria-disabled:opacity-40"
                onPress={pauseRecording}
                disabled={controlsDisabled}
              >
                <PauseSvg className="size-6 fill-primary" />
                <Typography className="ml-2 text-lg font-semibold text-primary">
                  Pause
                </Typography>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="w-[150px] flex-row items-center justify-center rounded-full bg-brand py-3 aria-disabled:opacity-40"
                onPress={resumeRecording}
                disabled={controlsDisabled}
              >
                <PlaySvg className="size-4 fill-on-brand" />
                <Typography className="ml-2 text-lg font-semibold text-on-brand">
                  Resume
                </Typography>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="w-[150px] flex-row items-center justify-center rounded-full bg-attention py-3 aria-disabled:opacity-40"
              onPress={onEnd}
              disabled={controlsDisabled}
            >
              <StopSvg className="size-6 fill-on-brand" />
              <Typography className="ml-2 text-lg font-semibold text-on-brand">
                Stop
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              className={clsx(
                "size-[52px] items-center justify-center rounded-full aria-disabled:opacity-40",
                isSidebarCollapsed && "lg:hidden",
              )}
              onPress={onDiscard}
              disabled={controlsDisabled}
            >
              <XIcon className="size-6 stroke-secondary" />
            </TouchableOpacity>
          </View>
          <View
            className={clsx(
              "hidden w-[180px]",
              isSidebarCollapsed && "lg:flex lg:items-end",
            )}
          >
            <TouchableOpacity
              className="flex-row items-center aria-disabled:opacity-40"
              disabled={controlsDisabled}
              onPress={onDiscard}
            >
              <XIcon className="size-6 stroke-secondary" />
              <Typography className="ml-2 text-lg font-semibold text-secondary">
                Discard
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MeetingModalLayout>
  );
};
