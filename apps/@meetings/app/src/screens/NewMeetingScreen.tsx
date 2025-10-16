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
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";
import MeetingSheet from "../components/MeetingSheet";
import SubHeader from "../components/SubHeader";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";

type ProfileNavProp = StackNavigationProp<RootStackParamList, "Profile">;
type NewMeetingRouteProp = RouteProp<RootStackParamList, "NewMeeting">;

const NewMeetingScreen = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const route = useRoute<NewMeetingRouteProp>();
  const { client } = route.params;

  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sheetStep, setSheetStep] = useState<"none" | "discard" | "end">(
    "none",
  );

  const startRecording = () => setIsRecording(true);
  const stopRecording = () => setSheetStep("discard");
  const handleContinue = () => setSheetStep("none");
  const handleDiscard = () => setSheetStep("end");
  const handleFinishAndSave = () => {
    setSheetStep("none");
    setIsRecording(false);
    navigation.navigate("Profile", {
      client: { personId: client.personId, fullName: client.fullName },
    });
  };
  const handleFinalDiscard = () => {
    setSheetStep("none");
    setIsRecording(false);
  };

  const createMeetingMutation = trpc.v1.client.createMeeting.useMutation({
    onSuccess: (data) => setMeetingId(data.id),
  });

  useEffect(() => {
    try {
      const startTime = new Date();
      createMeetingMutation.mutate({
        clientId: client.personId,
        startTime,
      });
    } catch (err) {
      console.error("[create] Failed to create meeting", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (meetingId === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-primary text-lg font-medium">
          Creating meeting...
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

      <Text className="text-primary mb-2 text-center text-2xl font-bold leading-8 tracking-[-0.014rem]">
        Meeting Recording
      </Text>

      <Text className="px-4 text-center text-sm font-normal leading-5 tracking-[-0.02em] text-gray-500">
        This meeting will be recorded and transcribed for note-taking. Be sure
        to confirm that everyone present is aware and has agreed to recording.
      </Text>
    </View>
  );

  const RecordingNotes = (
    <View className="mt-6">
      <View className="mb-2 flex-row items-center">
        <Image source={Icons.Notes} className="mr-2 size-5" />
        <Text className="text-primary text-lg font-semibold">Notepad</Text>
      </View>

      <Text className="text-primary py-2">
        Claims alibi – cousin's house (needs check). Says didn't enter store,
        "just waiting outside"
      </Text>
      <Text className="text-primary py-2">
        Mentioned partner Mike (unknown)
      </Text>
      <Text className="text-primary py-2">Nervous when asked about tools</Text>
      <Text className="text-primary py-2">
        Requests lighter sentence, willing to cooperate
      </Text>
      <Text className="text-primary py-2">
        Asked about lawyer, declined for now
      </Text>
    </View>
  );

  const RecordingControls = !isRecording ? (
    <TouchableOpacity
      className="flex-row items-center justify-center rounded-full bg-[#006C67] py-5"
      onPress={startRecording}
    >
      <Image source={Icons.Play} className="mr-2 size-4" />
      <Text className="font-semibold text-white">Start Recording</Text>
    </TouchableOpacity>
  ) : (
    <>
      <View className="flex-row items-center justify-center pb-2">
        <Image source={Icons.Record} className="size-4" />
        <Text className="px-2 text-black">Recording in progress</Text>
        <Text className="text-sm text-gray-500">4:22</Text>
      </View>

      <View className="flex-row items-center justify-center">
        <TouchableOpacity
          className="flex-row items-center justify-center rounded-full bg-[#B42D2D] px-8 py-3"
          onPress={stopRecording}
        >
          <Image source={Icons.Stop} className="mr-2 size-6" />
          <Text className="font-semibold text-white">Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity className="ml-3 flex-row items-center justify-center rounded-full bg-[#4D5255] px-8 py-3">
          <Image source={Icons.Pause} className="mr-2 size-6" />
          <Text className="font-semibold text-white">Pause</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-white">
      <SubHeader
        headingTxt={isRecording ? "Meeting in Progress" : "New Meeting"}
        showRightBtn={isRecording}
      />

      <View className="flex-1 px-6">
        {!isRecording ? RecordingIntro : RecordingNotes}
      </View>

      <View className="rounded-t-2xl bg-gray-100 px-6 py-12">
        <Text className="text-primary text-center text-base font-semibold">
          Mike Woods
        </Text>
        <Text className="mb-4 text-center text-sm text-gray-600">
          ID: 123456 · Probation
        </Text>

        {RecordingControls}
      </View>

      {/* Modal Bottom Sheet */}
      <Modal visible={sheetStep !== "none"} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-[rgba(0,0,0,0.3)]">
          {sheetStep === "discard" && (
            <MeetingSheet
              title="Discard meeting?"
              description="You're about to discard the meeting with Mike Woods. Notes and transcript will not be saved."
              primaryButton={{
                label: "Discard",
                onPress: handleDiscard,
                variant: "danger",
                countdown: 3,
              }}
              secondaryButton={{
                label: "Continue Meeting",
                onPress: handleContinue,
                variant: "neutral",
              }}
            />
          )}

          {sheetStep === "end" && (
            <MeetingSheet
              title="End this meeting?"
              description="You're about to finish the meeting with Mike Woods and save the notes for processing."
              primaryButton={{
                label: "Finish & Save",
                onPress: handleFinishAndSave,
                variant: "danger",
                countdown: 5,
              }}
              secondaryButton={{
                label: "Continue Meeting",
                onPress: handleContinue,
                variant: "primary",
              }}
              tertiaryButton={{
                label: "Discard meeting",
                onPress: handleFinalDiscard,
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
