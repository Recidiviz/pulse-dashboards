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

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TextInput,
  View,
} from "react-native";

import Icons from "../../assets/icons";
import MeetingSheet from "../components/MeetingSheet";
import RecordingControls from "../components/RecordingControls";
import SubHeader from "../components/SubHeader";
import { useMeetingRecording } from "../hooks/useMeetingRecording";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { humanReadableTitleCase } from "../utils/format";
import { saveItem } from "../utils/storage";

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Clients" | "Residents"
>;
type NewMeetingRouteProp = RouteProp<
  RootStackParamList,
  "ClientNewMeeting" | "ResidentNewMeeting"
>;

type Props = {
  personType: "client" | "resident";
};

const NewMeetingScreen = ({ personType }: Props) => {
  const navigation = useNavigation<ProfileNavProp>();
  const route = useRoute<NewMeetingRouteProp>();
  const person = {
    fullName: route.params.fullName,
    displayPersonExternalId: route.params.displayPersonExternalId,
    primaryMetadata: route.params.primaryMetadata,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.personId),
  };
  const { meetingId } = route.params;

  const navigateToClientProfile = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: personType === "client" ? "Clients" : "Residents" },
        {
          name: personType === "client" ? "ClientProfile" : "ResidentProfile",
          params: {
            personId: person.personId.toString(),
            fullName: person.fullName,
            displayPersonExternalId: person.displayPersonExternalId,
            primaryMetadata: person.primaryMetadata,
          },
        },
      ],
    });
  };

  const { status, note, setNote, recorderState, actions } = useMeetingRecording(
    {
      person,
      meetingId,
      onComplete: navigateToClientProfile,
    },
  );

  const {
    startRecording,
    handleTogglePauseResume,
    stopRecording,
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
        <Image source={Icons.Microphone} className="size-8" />
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
        <Image source={Icons.Notes} className="mr-2 size-5" />
        <Text className="font-inter text-lg font-semibold text-primary">
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
        onEndEditing={() => {
          saveItem("note", note);
        }}
      />
    </View>
  );

  const isMeetingActive = status !== "idle" || recorderState.isRecording;
  return (
    <View className="flex-1 bg-white">
      <SubHeader
        headingTxt={isMeetingActive ? "Meeting in Progress" : "New Meeting"}
        showRightBtn={isMeetingActive}
        onPressBtn={() => handleDiscard()}
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
          onStop={stopRecording}
          onPauseResume={handleTogglePauseResume}
        />
      </View>

      <Modal
        visible={["stopping", "discarding"].includes(status)}
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

export default NewMeetingScreen;
