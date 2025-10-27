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
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const client = {
    ...route.params.client,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.client.personId),
  };
  const { meetingId } = route.params;

  const [status, setStatus] = useState<
    | "idle"
    | "recording"
    | "paused"
    | "uploading"
    | "stopping"
    | "discarding"
    | "ending"
  >("idle");

  const audioRecorder = useAudioRecorder(RecordingPresets["HIGH_QUALITY"]);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission to access microphone was denied");
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const endMeetingMutation = trpc.v1.meeting.endMeeting.useMutation({
    onSuccess: () => {
      console.log("Meeting successfully ended and processing started");
      navigation.navigate("Profile", {
        client: {
          personId: client.personId.toString(),
          fullName: client.fullName,
          displayPersonExternalId: client.displayPersonExternalId,
          supervision: client.supervision,
        },
      });
    },
    onError: (err) => {
      console.error("[endMeeting] Failed:", err);
    },
  });

  const { refetch } = trpc.v1.meeting.getSignedUrlForRecording.useQuery(
    { clientId: client.personId, meetingId: meetingId ?? "" },
    { enabled: false },
  );

  const uploadSegmentToGCS = async (uri: string) => {
    const { data } = await refetch(); // data is the signed URL
    if (!data) return;

    const response = await fetch(uri);
    const blob = await response.blob();
    await fetch(data, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "audio/m4a" },
    });
  };

  const startRecording = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
    setStatus("recording");
  };
  const stopRecording = () => setStatus("stopping");

  const togglePauseResume = async () => {
    if (status === "uploading") return;

    if (status === "paused") {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setStatus("recording");
    } else if (status === "recording") {
      setStatus("uploading");
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (uri) await uploadSegmentToGCS(uri);
      } catch (err) {
        console.error("Upload during pause failed:", err);
        Alert.alert("Upload Failed", "Please try again.");
      } finally {
        setStatus("paused");
      }
    }
  };

  const handleFinishAndSave = async () => {
    setStatus("ending");
    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (uri) await uploadSegmentToGCS(uri);
      }
      await endMeetingMutation.mutateAsync({
        clientId: client.personId,
        meetingId,
        // TODO: Umar to fill in the actual notes from transcription
        notes: "Sample notes",
      });
    } catch (err) {
      console.error("[handleFinishAndSave] error:", err);
      Alert.alert("Error", "Failed to end meeting. Please try again.");
      setStatus("paused");
    }
  };

  const handleContinue = () => setStatus("recording");
  const handleDiscard = () => setStatus("discarding");
  const handleFinalDiscard = async () => {
    await audioRecorder.stop();
    // TODO: implement meeting discard API
    setStatus("idle");
  };

  if (status === "ending") {
    return (
      <View className="flex-1 flex-row items-center justify-center bg-white">
        <ActivityIndicator size="small" color="text-primary" />
        <Text className="text-primary p-4 text-lg font-medium">
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
  const isUploading = status === "uploading";
  const buttonBgClass = isUploading ? "bg-gray-300" : "bg-[#B42D2D]";
  const buttonTextClass = isUploading ? "text-gray-700" : "text-white";
  let pauseResumeBgColor = "#4D5255";
  if (isUploading) {
    pauseResumeBgColor = "#D1D5DB";
  } else if (status === "paused") {
    pauseResumeBgColor = "#006C67";
  }

  const RecordingControls =
    status === "idle" ? (
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
        </View>

        <View className="flex-row items-center justify-center">
          <TouchableOpacity
            className={`w-[120px] flex-row items-center justify-center rounded-full px-8 py-3 ${buttonBgClass}`}
            onPress={stopRecording}
            disabled={isUploading}
          >
            <Image source={Icons.Stop} className="mr-2 size-6" />
            <Text className={`font-semibold ${buttonTextClass}`}>Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="ml-3 w-[120px] flex-row items-center justify-center rounded-full px-8 py-3"
            onPress={togglePauseResume}
            disabled={isUploading}
            style={{ backgroundColor: pauseResumeBgColor }}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" className="mr-2" />
            ) : (
              <Image
                source={status === "paused" ? Icons.Play : Icons.Pause}
                className="mr-2 size-6"
              />
            )}
            <Text className={`font-semibold ${buttonTextClass}`}>
              {status === "paused" ? "Resume" : "Pause"}
            </Text>
          </TouchableOpacity>
        </View>
      </>
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
        <Text className="text-primary text-center text-base font-semibold">
          {client.fullName}
        </Text>
        <Text className="mb-4 text-center text-sm text-gray-600">
          ID: {client.displayPersonExternalId} • {client.supervision}
        </Text>

        {RecordingControls}
      </View>

      {/* Modal Bottom Sheet */}
      <Modal
        visible={["stopping", "discarding"].includes(status)}
        animationType="slide"
        transparent
      >
        <View className="flex-1 justify-end bg-[rgba(0,0,0,0.3)]">
          {status === "discarding" && (
            <MeetingSheet
              title="Discard meeting?"
              description={`You're about to discard the meeting with ${client.fullName}. Notes and transcript will not be saved.`}
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
              description={`You're about to finish the meeting with ${client.fullName} and save the notes for processing.`}
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
