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
import * as FileSystem from "expo-file-system/legacy";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useRecording } from "../context/RecordingContext";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";
import { humanReadableTitleCase } from "../utils/format";
import {
  requestNotificationPermissions,
  sendNotification,
} from "../utils/notifications";
import { getItem, removeItem, saveItem } from "../utils/storage";

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, "Profile">;
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

  const [note, setNote] = useState("");

  const {
    status,
    setStatus,
    recorderState,
    startRecording,
    stopRecording,
    stopAndUploadRecording,
    togglePauseResume: contextTogglePauseResume,
    initializeRecording,
    cleanupRecording,
  } = useRecording();

  const prevRecorderStateRef = useRef(recorderState.isRecording);
  useEffect(() => {
    (async () => {
      await initializeRecording();
      const saved = await getItem("note");
      setNote(saved);
      requestNotificationPermissions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToClientProfile = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: "Clients" },
        {
          name: "Profile",
          params: {
            client: {
              personId: client.personId.toString(),
              fullName: client.fullName,
              displayPersonExternalId: client.displayPersonExternalId,
              supervision: client.supervision,
            },
          },
        },
      ],
    });
  };
  const endMeetingMutation = trpc.v1.meeting.endMeeting.useMutation({
    onSuccess: () => {
      console.log("Meeting successfully ended and processing started");
    },
    onError: (err) => {
      console.error("[endMeeting] Failed:", err);
    },
  });

  const updateNotesMutation = trpc.v1.meeting.updateNotes.useMutation({
    onSuccess: () => {
      console.log("Notes updated successfully on server");
    },
    onError: (err) => {
      console.error("[updateNotes] Failed:", err);
    },
  });

  const discardMeetingMutation = trpc.v1.meeting.discardMeeting.useMutation({
    onSuccess: () => {
      console.log("Meeting discarded successfully");
    },
    onError: (err) => {
      console.error("[discardMeeting] Failed:", err);
      Alert.alert("Error", "Failed to discard meeting. Please try again.");
    },
  });

  const { refetch } = trpc.v1.meeting.getSignedUrlForRecording.useQuery(
    { clientId: client.personId, meetingId: meetingId ?? "" },
    { enabled: false },
  );

  const uploadSegmentToGCS = useCallback(
    async (uri: string) => {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.warn("File does not exist:", uri);
        return;
      }

      const { data: signedUrl } = await refetch();
      if (!signedUrl) return;

      try {
        await FileSystem.uploadAsync(signedUrl, uri, {
          httpMethod: "PUT",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { "Content-Type": "audio/m4a" },
        });
      } catch (error) {
        console.error("Upload failed:", error);
        throw error;
      }
    },
    [refetch],
  );

  const handleTogglePauseResume = async () => {
    await contextTogglePauseResume(uploadSegmentToGCS);

    // Update notes after pausing
    if (status === "recording") {
      try {
        await updateNotesMutation.mutateAsync({
          clientId: client.personId,
          meetingId,
          notes: note,
        });
      } catch (err) {
        console.error("Failed to update notes:", err);
      }
    }
  };

  const handleFinishAndSave = async () => {
    setStatus("ending");

    try {
      if (recorderState.isRecording) {
        await stopAndUploadRecording(uploadSegmentToGCS);
      }

      await removeItem("note");

      await endMeetingMutation.mutateAsync({
        clientId: client.personId,
        meetingId,
        notes: note,
      });

      await cleanupRecording();
      navigateToClientProfile();
    } catch (err) {
      console.error("Failed to end meeting:", err);
      Alert.alert("Error", "Failed to end meeting. Please try again.");
      setStatus("idle");
    }
  };

  const handleContinue = () => setStatus("recording");
  const handleDiscard = () => setStatus("discarding");

  const handleFinalDiscard = async () => {
    await cleanupRecording();

    await discardMeetingMutation.mutateAsync({
      clientId: client.personId,
      meetingId,
    });

    navigateToClientProfile();
  };

  const handleAutoStopRecording = useCallback(async () => {
    setStatus("uploading");
    await stopAndUploadRecording(uploadSegmentToGCS);
    setStatus("paused");

    sendNotification(
      "Recording Paused",
      "90 minute-at-a-time recording limit reached. Pausing Recording",
    );
  }, [setStatus, stopAndUploadRecording, uploadSegmentToGCS]);

  // Auto-stop recording when limit is reached
  useEffect(() => {
    //introduced to keep track of previous recorder state to prevent initial triggering of the handleAutoStopRecording function
    const prevIsRecording = prevRecorderStateRef.current;
    if (
      status === "recording" &&
      prevIsRecording &&
      !recorderState.isRecording
    ) {
      handleAutoStopRecording();
    }

    prevRecorderStateRef.current = recorderState.isRecording;
  }, [status, recorderState.isRecording, handleAutoStopRecording]);

  if (status === "ending") {
    return (
      <View className="flex-row flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="small" color="text-primary" />
        <Text className="p-4 font-medium text-primary text-lg">
          Meeting ending...
        </Text>
      </View>
    );
  }

  const RecordingIntro = (
    <View className="flex-1 justify-center items-center">
      <View
        className="justify-center items-center bg-gray-100 mb-6 border border-gray-200 size-16"
        style={{ borderRadius: 17 }}
      >
        <Image source={Icons.Microphone} className="size-8" />
      </View>

      <Text className="mb-2 font-bold text-primary text-2xl text-center leading-8 tracking-[-0.014rem]">
        Meeting Recording
      </Text>

      <Text className="px-4 font-normal text-gray-500 text-sm text-center leading-5 tracking-[-0.02em]">
        This meeting will be recorded and transcribed for note-taking. Be sure
        to confirm that everyone present is aware and has agreed to recording.
      </Text>
    </View>
  );

  const RecordingNotes = (
    <View className="mt-6">
      <View className="flex-row items-center mb-2">
        <Image source={Icons.Notes} className="mr-2 size-5" />
        <Text className="font-semibold text-primary text-lg">Notepad</Text>
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

      <View className="bg-gray-100 px-6 py-12 rounded-t-2xl">
        <Text className="font-semibold text-primary text-base text-center">
          {client.fullName}
        </Text>
        <Text className="mb-4 text-gray-600 text-sm text-center">
          ID: {client.displayPersonExternalId} •{" "}
          {humanReadableTitleCase(client.supervision)}
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
