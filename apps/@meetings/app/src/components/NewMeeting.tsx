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

import { RouteProp, useRoute } from "@react-navigation/native";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";

import NotesSvg from "~@meetings/app/assets/icons/notes.svg";

import MeetingSheet from "../components/MeetingSheet";
import RecordingControls from "../components/RecordingControls";
import { useMeetingRecording, useRecording } from "../features/recording";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { humanReadableTitleCase } from "../utils/format";
import NewMeetingHeader from "./NewMeetingHeader";

type NewMeetingRouteProp = RouteProp<
  RootStackParamList,
  "ClientNewMeeting" | "ResidentNewMeeting"
>;

type Props = {
  person: {
    fullName: string;
    displayPersonExternalId: string;
    primaryMetadata: string;
    personId: bigint;
  };
  navigateToPersonProfile: () => void;
};

const NewMeeting = ({ person, navigateToPersonProfile }: Props) => {
  const route = useRoute<NewMeetingRouteProp>();
  const meetingId = route.params?.meetingId;
  const { durationMs, setMeetingId } = useRecording<"native">();

  useEffect(() => {
    if (meetingId) {
      setMeetingId(meetingId);
    }
  }, [meetingId, setMeetingId]);

  const onComplete = () => {
    navigateToPersonProfile();
    setMeetingId(null);
  };

  const { status, note, setNote, isRecording, actions } = useMeetingRecording({
    meetingId,
    onComplete: onComplete,
    personId: person.personId,
  });

  if (!status) return null;

  const {
    startRecording,
    handleTogglePauseResume,
    handleStopRecording,
    handleFinishAndSave,
    handleDiscard,
    handleFinalDiscard,
    handleContinue,
  } = actions;

  if (status === "ending") {
    return (
      <View className="flex-1 flex-row items-center justify-center bg-white">
        <ActivityIndicator size="small" color="text-primary" />
        <Text className="p-4 font-inter text-lg font-medium text-primary">
          Meeting ending...
        </Text>
      </View>
    );
  }

  const RecordingIntro = (
    <View className="flex-1 items-center justify-center">
      <View
        className="mb-6 size-16 items-center justify-center border border-gray-200 bg-gray-100"
        style={{ borderRadius: 17 }}
      >
        <MicrophoneIcon className="size-8 text-[#35536233]" />
      </View>

      <Text className="mb-2 text-center font-inter text-2xl font-bold leading-8 tracking-[-0.014rem] text-primary">
        Meeting Recording
      </Text>

      <Text className="px-4 text-center font-inter text-sm font-normal leading-5 tracking-[-0.02em] text-gray-500">
        This meeting will be recorded and transcribed for note-taking. Be sure
        to confirm that everyone present is aware and has agreed to recording.
      </Text>
    </View>
  );

  const RecordingNotes = (
    <View className="mt-6">
      <View className="mb-2 flex-row items-center">
        <NotesSvg className="size-5 text-[#9AA9B1]" />
        <Text className="ml-2 font-inter text-lg font-semibold text-primary">
          Notepad
        </Text>
      </View>

      <TextInput
        className="text-primary"
        value={note}
        onChangeText={setNote}
        placeholder="Write your notes..."
        maxLength={100000}
        multiline
      />
    </View>
  );

  const isMeetingActive = status !== "idle" || isRecording;
  return (
    <View className="flex-1 bg-white">
      <NewMeetingHeader
        isMeetingActive={isMeetingActive}
        onDiscard={() => handleDiscard()}
        onFinalDiscard={() => handleFinalDiscard()}
      />

      <View className="flex-1 px-6">
        {isMeetingActive ? RecordingNotes : RecordingIntro}
      </View>

      <View className="rounded-t-2xl bg-gray-100 px-6 py-12">
        <Text className="text-center font-inter text-base font-semibold text-primary">
          {person.fullName}
        </Text>
        <Text className="mb-4 text-center font-inter text-sm text-gray-600">
          ID: {person.displayPersonExternalId} •{" "}
          {humanReadableTitleCase(person.primaryMetadata)}
        </Text>
        <RecordingControls
          status={status}
          onStart={startRecording}
          onStop={handleStopRecording}
          onPauseResume={handleTogglePauseResume}
          durationMs={durationMs}
        />
      </View>

      <Modal
        visible={
          ["stopping", "discarding"].includes(status) && Platform.OS !== "web"
        }
        animationType="slide"
        transparent
      >
        <View className="flex-1 justify-end bg-[rgba(0,0,0,0.3)]">
          {status === "discarding" && (
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

          {status === "stopping" && (
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

export default NewMeeting;
