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
import { useRef } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { Person } from "../../../common/types";
import MinimizeSvg from "../../../shared/assets/icons/arrows-pointing-in.svg";
import NotesSvg from "../../../shared/assets/icons/notes.svg";
import PauseSvg from "../../../shared/assets/icons/pause.svg";
import PlaySvg from "../../../shared/assets/icons/play.svg";
import StopSvg from "../../../shared/assets/icons/stop.svg";
import { formatDurationNumeric } from "../../../shared/lib/format";
import LinearProgressBar from "../../../shared/ui/LinearProgressBar";
import Modal from "../../../shared/ui/Modal";
import { OfflineIndicator } from "../../../shared/ui/OfflineIndicator";
import { RecordingIndicator } from "../../../shared/ui/RecordingIndicator";
import { Typography } from "../../../shared/ui/Typography";
import { useRecording } from "..";
import { useAudioErrorDetection } from "../model/useAudioErrorDetection";
import { MicIndicator } from "./MicIndicator";

type Props = {
  person: Person;
};

export const MeetingFullSizeModal = ({ person }: Props) => {
  const {
    status,
    note,
    setNote,
    durationMs,
    isSpeaking,
    setIsRecordingViewMinimized,
    stopRecording,
    discardRecording,
    togglePauseResume,
  } = useRecording<"web">();
  const { micStatus, hasAudioError, setHasAudioError } = useAudioErrorDetection(
    {
      isRecording: status === "recording",
      isSpeaking,
    },
  );

  const tooltipTriggerRef = useRef<TooltipPrimitive.TriggerRef>(null);

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

  return (
    <Modal
      visible
      transparent
      onClickOutside={() => setIsRecordingViewMinimized(true)}
      containerClassName="max-w-[960px] md:h-[658px] size-full"
    >
      <View className="h-full flex-1 grow md:h-auto">
        <View className="w-full flex-row items-center justify-between border-b border-subtle px-8 pb-3 pt-5">
          <View className="gap-1">
            <Typography className="text-xl font-semibold text-primary">
              New Meeting
            </Typography>
            <Typography className="text-base font-medium text-primary">
              {person.fullName}{" "}
              <Typography className="text-xs font-normal text-secondary md:text-base">
                {person.primaryMetadata} • ID: {person.displayPersonExternalId}
              </Typography>
            </Typography>
          </View>
          <View className="flex-row items-center gap-4">
            {/* <View className="flex-row items-center gap-2">
              <Text className="text-sm font-medium text-[#355362D9]">
                Show live AI transcript
              </Text>
              <TouchableWithoutFeedback
                onPress={() => setShowLiveTranscript(!showLiveTranscript)}
              >
                <View
                  className={`h-5 w-[38px] cursor-pointer rounded-full p-0.5 ${showLiveTranscript ? "items-end bg-[#004D48]" : "items-start bg-[#35536280]"}`}
                >
                  <View className="size-4 rounded-full bg-white" />
                </View>
              </TouchableWithoutFeedback>
            </View> */}
            <TouchableOpacity
              onPress={() => setIsRecordingViewMinimized(true)}
              className="rounded-full bg-screen p-1.5"
            >
              <MinimizeSvg className="size-5 text-secondary" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-1 grow flex-row">
          <View className="grow gap-5 py-5">
            <View className="flex-row items-center gap-1.5 px-8">
              <NotesSvg className="text-tertiary" />
              <Typography className="font-semibold text-primary">
                Notepad
              </Typography>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              className="grow justify-start px-8 leading-[20px] text-primary outline-none"
              placeholder="Use the notepad to flag anything you want to make sure is in the final notes. It won’t be saved, just used to build the summary."
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
        <View className="flex-col items-center justify-between gap-2 border-t border-subtle bg-screen px-8 py-5 lg:columns-3 lg:flex-row">
          <View className="flex flex-row items-center gap-3">
            <OfflineIndicator
              triggerClassName="hidden rounded-full border-2 border-on-brand bg-warning-light size-11 lg:flex"
              iconClassName="!size-5"
              enableTooltip
              side="top"
              align="start"
              alignOffset={-9}
              isInsideModal
            />
            <View className="flex w-[250px] flex-row-reverse justify-between lg:w-[180px] lg:flex-col lg:justify-start">
              <Typography className="text-lg font-semibold text-primary">
                {formatDurationNumeric(durationMs)}
              </Typography>
              <View className="flex-row items-center gap-2">
                <RecordingIndicator isRecording={status === "recording"} />
                <Typography className="font-medium text-secondary">
                  {status === "recording"
                    ? "Recording in progress"
                    : "Recording paused"}
                </Typography>
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <OfflineIndicator
              triggerClassName="rounded-full border-2 border-on-brand bg-warning-light size-11 lg:hidden"
              iconClassName="!size-5"
              enableTooltip
              side="top"
              align="start"
              alignOffset={-8}
              isInsideModal
            />
            <TooltipPrimitive.Root>
              <TooltipPrimitive.Trigger
                ref={tooltipTriggerRef}
                asChild
                onPress={() => setHasAudioError(false)}
                disabled={!hasAudioError}
                className="mr-6"
              >
                <View>
                  <MicIndicator variant="full" status={micStatus} />
                </View>
              </TooltipPrimitive.Trigger>
              <TooltipPrimitive.Portal container={tooltipContainer}>
                <TooltipPrimitive.Content
                  className="z-100 relative flex w-52 flex-col gap-1 rounded-xl bg-strong p-4"
                  side="top"
                  align="start"
                  sideOffset={12}
                >
                  <Typography className="text-sm font-semibold text-on-brand">
                    No audio detected
                  </Typography>
                  <Typography className="text-sm font-normal text-on-brand">
                    Check your microphone
                  </Typography>
                  <View className="absolute bottom-0 -z-10 size-4 rotate-45 bg-strong" />
                </TooltipPrimitive.Content>
              </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
            {status === "recording" ? (
              <TouchableOpacity
                className="w-[150px] flex-row items-center justify-center rounded-full bg-primary py-3 aria-disabled:opacity-40"
                onPress={togglePauseResume}
                disabled={isModalDisabled}
              >
                <PauseSvg className="size-6 fill-primary" />
                <Typography className="ml-2 text-lg font-semibold text-primary">
                  Pause
                </Typography>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="w-[150px] flex-row items-center justify-center rounded-full bg-brand py-3 aria-disabled:opacity-40"
                onPress={togglePauseResume}
                disabled={isModalDisabled}
              >
                <PlaySvg className="size-4 fill-on-brand" />
                <Typography className="ml-2 text-lg font-semibold text-on-brand">
                  Resume
                </Typography>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="w-[150px] flex-row items-center justify-center rounded-full bg-attention py-3 aria-disabled:opacity-40"
              onPress={stopRecording}
              disabled={isModalDisabled}
            >
              <StopSvg className="size-6 fill-on-brand" />
              <Typography className="ml-2 text-lg font-semibold text-on-brand">
                Stop
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              className="size-[52px] items-center justify-center rounded-full aria-disabled:opacity-40 lg:hidden"
              onPress={discardRecording}
              disabled={isModalDisabled}
            >
              <XIcon className="size-6 stroke-secondary" />
            </TouchableOpacity>
          </View>
          <View className="hidden w-[180px] lg:flex lg:items-end">
            <TouchableOpacity
              className="flex-row items-center aria-disabled:opacity-40"
              disabled={isModalDisabled}
              onPress={discardRecording}
            >
              <XIcon className="size-6 stroke-secondary" />
              <Typography className="ml-2 text-lg font-semibold text-secondary">
                Discard
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
