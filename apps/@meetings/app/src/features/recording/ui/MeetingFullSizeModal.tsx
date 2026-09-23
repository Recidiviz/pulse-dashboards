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
import { useEffect, useRef } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

import { MeetingTypeTag } from "~@meetings/app/entities/meeting-type";
import { Person } from "~@meetings/app/shared/api";

import PauseSvg from "../../../shared/assets/icons/pause.svg";
import PlaySvg from "../../../shared/assets/icons/play.svg";
import StopSvg from "../../../shared/assets/icons/stop.svg";
import { formatDurationNumeric } from "../../../shared/lib/format";
import LinearProgressBar from "../../../shared/ui/LinearProgressBar";
import { OfflineIndicator } from "../../../shared/ui/OfflineIndicator";
import { RecordingIndicator } from "../../../shared/ui/RecordingIndicator";
import { Typography } from "../../../shared/ui/Typography";
import { useRecording } from "..";
import { useAudioErrorDetection } from "../model/useAudioErrorDetection";
import { MeetingModalLayout } from "./MeetingModalLayout";
import { MicIndicator } from "./MicIndicator";

type Props = {
  person: Person;
};

export const MeetingFullSizeModal = ({ person }: Props) => {
  const {
    meetingType,
    meetingTypeCategory,
    status,
    note,
    setNote,
    durationMs,
    audioLevel,
    setIsRecordingViewMinimized,
    stopRecording,
    discardRecording,
    togglePauseResume,
  } = useRecording<"web">();
  const { micStatus, hasAudioError } = useAudioErrorDetection({
    isRecording: status === "recording",
    audioLevel,
  });

  const tooltipTriggerRef = useRef<TooltipPrimitive.TriggerRef>(null);

  useEffect(() => {
    if (hasAudioError) {
      tooltipTriggerRef.current?.open();
    } else {
      tooltipTriggerRef.current?.close();
    }
  }, [hasAudioError]);

  const tooltipContainer =
    typeof document !== "undefined"
      ? document.getElementById("rnmodal")
      : undefined;

  // TODO: live transcript will be added in next releases
  // const [showLiveTranscript, setShowLiveTranscript] = useState(false);
  // const [isScrollToBottomButtonVisible, setIsScrollToBottomButtonVisible] =
  //   useState(true);
  // const scrollViewRef = useRef<ScrollView>(null);

  // const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
  //   const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  //   const isBottom =
  //     contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
  //   setIsScrollToBottomButtonVisible(isBottom);
  // };

  // const scrollToBottom = () => {
  //   scrollViewRef.current?.scrollToEnd({ animated: true });
  // };

  // useEffect(() => {
  //   if (showLiveTranscript) scrollToBottom();
  // }, [showLiveTranscript]);

  if (!status) return null;

  const isModalDisabled = status === "uploading" || status === "ending";
  const minimize = () => setIsRecordingViewMinimized(true);

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
              editable={!isModalDisabled}
            />
          </View>
          {/* {showLiveTranscript && (
            <View className="min-w-[300px] flex-1 gap-5 border-l border-[#EDF1F1] py-5">
              <View className="flex-row items-center gap-1.5 px-8">
                <Image source={Icons.Sparkles} className="!size-5" />
                <Text className="font-inter font-semibold text-primary">
                  Live AI Transcript
                </Text>
              </View>
              <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-8"
                contentContainerClassName="grow"
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                <Text className="font-inter leading-[20px] text-[#355362D9]">
                  I started the new job a few weeks ago and things have been
                  going pretty smoothly so far. The first few days were a bit of
                  an adjustment, mostly just figuring out the routine and
                  getting used to being up early again. After the first week it
                  started to feel more natural, and now I actually look forward
                  to going in. The team has been really welcoming — everyone’s
                  been patient while I learn how things work. My supervisor
                  checks in often to make sure I have what I need and gives
                  helpful feedback. It’s nice to feel supported and to know that
                  people trust me to do my part. I’ve been showing up on time
                  every day, trying to stay consistent with my schedule. Having
                  that structure helps a lot, and it keeps me motivated to keep
                  improving. Even when the work gets I started the new job a few
                  weeks ago and things have been going pretty smoothly so far.
                  The first few days were a bit of an adjustment, mostly just
                  figuring out the routine and getting used to being up early
                  again. After the first week it started to feel more natural,
                  and now I actually look forward to going in. The team has been
                  really welcoming — everyone’s been patient while I learn how
                  things work. My supervisor checks in often to make sure I have
                  what I need and gives helpful feedback. It’s nice to feel
                  supported and to know that people trust me to do my part. I’ve
                  been showing up on time every day, trying to stay consistent
                  with my schedule. Having that structure helps a lot, and it
                  keeps me motivated to keep improving. Even when the work gets
                </Text>
              </ScrollView>
              {!isScrollToBottomButtonVisible && (
                <TouchableOpacity
                  className="absolute bottom-4 right-4 size-10 items-center justify-center rounded-full bg-white shadow-lg"
                  onPress={scrollToBottom}
                >
                  <Image source={Icons.ArrowDown} className="!size-5" />
                </TouchableOpacity>
              )}
            </View>
          )} */}
        </View>
        <View className="h-1">
          {status === "ending" && <LinearProgressBar />}
        </View>
        <View className="flex-row items-center justify-between gap-4 border-t border-subtle bg-screen px-12 py-6">
          <View className="flex-row items-center gap-4">
            <OfflineIndicator
              triggerClassName="rounded-full border-2 border-on-brand bg-warning-light size-11"
              iconClassName="!size-5"
              enableTooltip
              side="top"
              align="start"
              alignOffset={-9}
              isInsideModal
            />
            <Typography variant="heading-5">
              {formatDurationNumeric(durationMs)}
            </Typography>
            <View className="flex-row items-center gap-2">
              <RecordingIndicator isRecording={status === "recording"} />
              <Typography variant="body-m-medium" className="!text-secondary">
                {status === "recording"
                  ? "Recording in progress"
                  : "Recording paused"}
              </Typography>
            </View>
          </View>
          <View className="flex-row items-center gap-4">
            {status === "recording" ? (
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
            {status === "recording" ? (
              <TouchableOpacity
                className="w-[140px] flex-row items-center justify-center rounded-full border border-subtle bg-primary py-3 aria-disabled:opacity-40"
                onPress={togglePauseResume}
                disabled={isModalDisabled}
              >
                <PauseSvg className="size-6 fill-primary" />
                <Typography
                  variant="heading-5"
                  className="ml-1 !text-secondary"
                >
                  Pause
                </Typography>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="w-[140px] flex-row items-center justify-center rounded-full bg-brand py-3 aria-disabled:opacity-40"
                onPress={togglePauseResume}
                disabled={isModalDisabled}
              >
                <PlaySvg className="size-4 fill-on-brand" />
                <Typography variant="heading-5" className="ml-2 !text-on-brand">
                  Resume
                </Typography>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="size-[50px] items-center justify-center rounded-full bg-attention aria-disabled:opacity-40"
              onPress={stopRecording}
              disabled={isModalDisabled}
            >
              <StopSvg className="size-6 fill-on-brand" />
            </TouchableOpacity>
            <TouchableOpacity
              className="aria-disabled:opacity-40"
              disabled={isModalDisabled}
              onPress={discardRecording}
            >
              <Typography variant="heading-5" className="!text-secondary">
                Discard
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MeetingModalLayout>
  );
};
