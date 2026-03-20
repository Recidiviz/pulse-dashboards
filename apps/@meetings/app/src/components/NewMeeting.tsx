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
  TextInput,
  View,
} from "react-native";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";

import NotesSvg from "../assets/icons/notes.svg";
import { Person } from "../common/types";
import MeetingSheet from "../components/MeetingSheet";
import RecordingControls from "../components/RecordingControls";
import { useRecording } from "../features/recording";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { Typography } from "../shared/ui/Typography";
import { humanReadableTitleCase } from "../utils/format";
import NewMeetingHeader from "./NewMeetingHeader";

type NewMeetingRouteProp = RouteProp<
  RootStackParamList,
  "ClientNewMeeting" | "ResidentNewMeeting"
>;

type Props = {
  person: Person;
  navigateToPersonProfile: () => void;
};

const NewMeeting = ({ person, navigateToPersonProfile }: Props) => {
  const route = useRoute<NewMeetingRouteProp>();
  const meetingId = route.params?.meetingId;

  const {
    status,
    note,
    setNote,
    isRecording,
    durationMs,
    setMeetingId,
    setPerson,
    startRecording,
    stopRecording,
    discardRecording,
    togglePauseResume,
    handleFinishAndSave,
    handleFinalDiscard,
  } = useRecording<"native">();

  useEffect(() => {
    if (meetingId && person) {
      setMeetingId(meetingId);
      setPerson(person);
    }
  }, [meetingId, person, setMeetingId, setPerson]);

  const onComplete = () => {
    navigateToPersonProfile();
    setMeetingId(null);
    setPerson(null);
  };

  if (!status) return null;

  if (status === "ending") {
    return (
      <View className="flex-1 flex-row items-center justify-center bg-primary">
        <ActivityIndicator size="small" color="text-primary" />
        <Typography className="p-4 text-lg font-medium text-primary">
          Meeting ending...
        </Typography>
      </View>
    );
  }

  const RecordingIntro = (
    <View className="flex-1 items-center justify-center">
      <View
        className="mb-6 size-16 items-center justify-center border border-subtle bg-secondary"
        style={{ borderRadius: 17 }}
      >
        <MicrophoneIcon className="size-8 text-primary" />
      </View>

      <Typography className="mb-2 text-center text-2xl font-bold leading-8 tracking-[-0.014rem] text-primary">
        Meeting Recording
      </Typography>

      <Typography className="px-4 text-center text-sm font-normal leading-5 tracking-[-0.02em] text-secondary">
        This meeting will be recorded and transcribed for note-taking. Be sure
        to confirm that everyone present is aware and has agreed to recording.
      </Typography>
    </View>
  );

  const RecordingNotes = (
    <View className="mt-6">
      <View className="mb-2 flex-row items-center">
        <NotesSvg className="size-5 text-secondary" />
        <Typography className="ml-2 text-lg font-semibold text-primary">
          Notepad
        </Typography>
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
        onDiscard={() => discardRecording()}
        onFinalDiscard={() => handleFinalDiscard(onComplete)}
      />
      <View className="flex-1 px-6">
        {isMeetingActive ? RecordingNotes : RecordingIntro}
      </View>
      <View className="rounded-t-2xl bg-secondary px-6 py-12">
        <Typography className="text-center text-base font-semibold text-primary">
          {person.fullName}
        </Typography>
        <Typography className="mb-4 text-center text-sm text-secondary">
          ID: {person.displayPersonExternalId} •{" "}
          {humanReadableTitleCase(person.primaryMetadata)}
        </Typography>
        <RecordingControls
          status={status}
          onStart={startRecording}
          onStop={stopRecording}
          onPauseResume={togglePauseResume}
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
        <View className="flex-1 justify-end bg-tertiary">
          {status === "discarding" && (
            <MeetingSheet
              title="Discard meeting?"
              description={`You're about to discard the meeting with ${person.fullName}. Notes and transcript will not be saved.`}
              primaryButton={{
                label: "Discard",
                onPress: () => handleFinalDiscard(onComplete),
                variant: "danger",
              }}
              secondaryButton={{
                label: "Continue Meeting",
                onPress: togglePauseResume,
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
                onPress: () => handleFinishAndSave(onComplete),
                variant: "danger",
              }}
              secondaryButton={{
                label: "Continue Meeting",
                onPress: togglePauseResume,
                variant: "primary",
              }}
              tertiaryButton={{
                label: "Discard meeting",
                onPress: discardRecording,
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
