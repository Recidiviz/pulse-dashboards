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

import { useEffect, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";
import { Person, RecordingStatus } from "../common/types";
import { useMeetingRecording } from "../features/recording";
import { formatDurationNumeric } from "../utils/format";
import Modal from "./Modal";

type NewMeetingModalContainerProps = {
  person: Person;
  meetingId: string;
  onClose: () => void;
};

const NewMeetingModalContainer = ({
  person,
  meetingId,
  onClose,
}: NewMeetingModalContainerProps) => {
  return (
    <NewMeetingModal meetingId={meetingId} onClose={onClose} person={person} />
  );
};

type NewMeetingModalProps = NewMeetingModalContainerProps & {
  person: Person;
};

const NewMeetingModal = ({
  meetingId,
  onClose,
  person,
}: NewMeetingModalProps) => {
  const { status, note, setNote, isRecording, totalDurationMs, actions } =
    useMeetingRecording({
      meetingId,
      onComplete: onClose,
    });

  if (!status) return null;

  const {
    startRecording,
    handleTogglePauseResume,
    stopRecording,
    handleFinishAndSave,
    handleDiscard,
    handleFinalDiscard,
    handleContinue,
  } = actions;

  const isMeetingActive = status !== "idle" || isRecording;

  return (
    <Modal
      visible
      transparent
      onClose={isMeetingActive ? handleDiscard : onClose}
      containerClassName="max-w-[960px] md:h-[658px] size-full"
    >
      {isMeetingActive ? (
        <NewMeetingProgress
          person={person}
          status={status}
          note={note}
          setNote={setNote}
          stopRecording={stopRecording}
          handleTogglePauseResume={handleTogglePauseResume}
          handleDiscard={handleDiscard}
          handleContinue={handleContinue}
          handleFinishAndSave={handleFinishAndSave}
          handleFinalDiscard={handleFinalDiscard}
          totalDurationMs={totalDurationMs}
          onClose={onClose}
        />
      ) : (
        <NewMeetingIntro
          person={person}
          onClose={onClose}
          startRecording={startRecording}
        />
      )}
    </Modal>
  );
};

type NewMeetingIntroProps = {
  person: Person;
  onClose: () => void;
  startRecording: () => Promise<void>;
};

const NewMeetingIntro = ({
  person,
  onClose,
  startRecording,
}: NewMeetingIntroProps) => {
  return (
    <View className="h-full grow py-5 md:h-auto">
      <View className="w-full flex-row items-center justify-between border-b border-[#EDF1F1] px-8 pb-3">
        <View className="gap-1">
          <Text className="font-inter text-xl font-semibold text-primary">
            New Meeting
          </Text>
          <Text className="font-inter text-base font-medium text-primary">
            {person.fullName}{" "}
            <Text className="text-base font-normal text-[#355362D9]">
              {person.primaryMetadata} • ID: {person.displayPersonExternalId}
            </Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="rounded-full bg-[#F4F5F5] p-1.5"
        >
          <Image source={Icons.Minimize} className="!size-3.5" />
        </TouchableOpacity>
      </View>

      <View className="grow items-center justify-center px-8">
        <View className="mb-6 size-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
          <Image source={Icons.Microphone} className="!size-8" />
        </View>

        <Text className="mb-2 font-libre-baskerville text-[28px] font-bold text-primary">
          Meeting Recording
        </Text>

        <Text className="mb-6 max-w-[530px] text-center font-inter text-sm text-[#355362D9]">
          This meeting will be recorded and transcribed for note-taking. Be sure
          to confirm that everyone present is aware and has agreed to recording.
        </Text>
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            className="rounded-full border border-[#35536233] px-8 py-4"
            onPress={onClose}
          >
            <Text className="font-semibold">Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center rounded-full bg-[#006C67] px-8 py-4"
            onPress={startRecording}
          >
            <Image source={Icons.Play} className="mr-2 !size-4" />
            <Text className="font-inter font-semibold text-white">
              Start Meeting
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

type NewMeetingProgressProps = {
  person: Person;
  status: RecordingStatus;
  note: string;
  totalDurationMs: number;
  setNote: (note: string) => void;
  stopRecording: () => void;
  handleTogglePauseResume: () => void;
  handleDiscard: () => void;
  handleContinue: () => void;
  handleFinishAndSave: () => void;
  handleFinalDiscard: () => void;
  onClose: () => void;
};

const NewMeetingProgress = ({
  person,
  status,
  note,
  totalDurationMs,
  setNote,
  stopRecording,
  handleTogglePauseResume,
  handleDiscard,
  handleContinue,
  handleFinishAndSave,
  handleFinalDiscard,
  onClose,
}: NewMeetingProgressProps) => {
  // TODO: live transcript will be added in next releases
  // const [showLiveTranscript, setShowLiveTranscript] = useState(false);
  // const [isScrollToBottomButtonVisible, setIsScrollToBottomButtonVisible] =
  //   useState(true);
  const [discardCountdown, setDiscardCountdown] = useState(3);
  // const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (status !== "discarding") return;

    setDiscardCountdown(3);

    const interval = setInterval(() => {
      setDiscardCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

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

  const isUploading = status === "uploading";

  return (
    <>
      <View className="h-full flex-1 grow md:h-auto">
        <View className="w-full flex-row items-center justify-between border-b border-[#EDF1F1] px-8 pb-3 pt-5">
          <View className="gap-1">
            <Text className="font-inter text-xl font-semibold text-primary">
              New Meeting
            </Text>
            <Text className="font-inter text-base font-medium text-primary">
              {person.fullName}{" "}
              <Text className="text-base font-normal text-[#355362D9]">
                {person.primaryMetadata} • ID: {person.displayPersonExternalId}
              </Text>
            </Text>
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
              onPress={handleDiscard}
              className="rounded-full bg-[#F4F5F5] p-1.5"
            >
              <Image source={Icons.Minimize} className="!size-3.5" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 grow flex-row">
          <View className="grow gap-5 py-5">
            <View className="flex-row items-center gap-1.5 px-8">
              <Image source={Icons.Notes} className="!size-6" />
              <Text className="font-inter font-semibold text-primary">
                Notepad
              </Text>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              className="grow justify-start px-8 leading-[20px] text-primary outline-none"
              placeholder="Use the notepad to flag anything you want to make sure is in the final notes. It won’t be saved, just used to build the summary"
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

        <View className="columns-3 flex-row items-center justify-between border-t border-[#EDF1F1] bg-[#F4F5F5] px-8 py-5">
          <View className="w-[180px]">
            <Text className="font-inter text-lg font-semibold text-primary">
              {formatDurationNumeric(totalDurationMs)}
            </Text>
            <View className="flex-row items-center gap-2">
              {status === "recording" && (
                <Image source={Icons.Record} className="!size-4" />
              )}
              <Text className="font-inter font-medium text-[#9AA6AC]">
                {status === "recording"
                  ? "Recording in progress"
                  : "Recording paused"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            {status === "recording" ? (
              <TouchableOpacity
                className="w-[150px] flex-row items-center justify-center rounded-full bg-white py-3"
                onPress={handleTogglePauseResume}
                disabled={isUploading}
              >
                <Image source={Icons.PauseBlack} className="mr-2 !size-6" />
                <Text className="font-inter text-lg font-semibold text-primary">
                  Pause
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="w-[150px] flex-row items-center justify-center rounded-full bg-[#006C67] py-3"
                onPress={handleTogglePauseResume}
                disabled={isUploading}
              >
                <Image source={Icons.Play} className="mr-2 !size-4" />
                <Text className="font-inter text-lg font-semibold text-white">
                  Resume
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="w-[150px] flex-row items-center justify-center rounded-full bg-[#B42D2D] py-3"
              onPress={stopRecording}
              disabled={isUploading}
            >
              <Image source={Icons.Stop} className="mr-2 !size-6" />
              <Text className="font-inter text-lg font-semibold text-white">
                Stop
              </Text>
            </TouchableOpacity>
          </View>
          <View className="w-[180px] items-end">
            <TouchableOpacity
              className="flex-row items-center"
              disabled={isUploading}
              onPress={handleDiscard}
            >
              <Image source={Icons.Cross} className="mr-2 !size-6" />
              <Text className="font-inter text-lg font-semibold text-[#9AA6AC]">
                Discard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {status === "stopping" && (
        <Modal
          visible
          transparent
          onClose={onClose}
          containerClassName="px-6 py-5"
        >
          <Text className="mb-3 font-inter text-xl font-semibold text-primary">
            End this meeting?
          </Text>
          <Text className="mb-5 w-[350px] font-inter text-[#355362D9]">
            You’re about to finish the meeting with{" "}
            <Text className="font-bold">{person.fullName}</Text> and save the
            notes for processing.
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-[170px] items-center rounded-full border border-[#35536233] py-3"
              onPress={handleContinue}
            >
              <Text className="font-inter font-semibold text-primary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-[170px] items-center rounded-full bg-primary py-3"
              onPress={handleFinishAndSave}
            >
              <Text className="font-inter font-semibold text-white">
                Finish & Save
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {status === "discarding" && (
        <Modal
          visible
          transparent
          onClose={onClose}
          containerClassName="px-6 py-5"
        >
          <Text className="mb-3 font-inter text-xl font-semibold text-primary">
            Discard meeting?
          </Text>
          <Text className="mb-5 w-[350px] font-inter text-[#355362D9]">
            You’re about to discard the meeting with{" "}
            <Text className="font-bold">{person.fullName}.</Text> Notes and
            transcript won't be saved.
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="w-[170px] items-center rounded-full border border-[#35536233] py-3"
              onPress={handleContinue}
            >
              <Text className="font-inter font-semibold text-primary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`w-[170px] items-center rounded-full py-3 ${discardCountdown > 0 ? "bg-[#4D5255] opacity-30" : "bg-[#B42D2D]"}`}
              onPress={handleFinalDiscard}
              disabled={discardCountdown > 0}
            >
              <Text className="font-inter font-semibold text-white">
                {discardCountdown > 0
                  ? `Discard (0:${discardCountdown.toString().padStart(2, "0")})`
                  : "Discard"}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
};

export default NewMeetingModalContainer;
