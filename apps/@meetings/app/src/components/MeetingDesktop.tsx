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

import Clipboard from "@react-native-clipboard/clipboard";
import { Link } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Icons from "../../assets/icons";
import { MeetingDetails, Person } from "../common/types";
import MeetingNotesTab from "../components/MeetingNotesTab";
import MeetingTabs, { Tab } from "../components/MeetingTabs";
import MeetingTranscriptionTab from "../components/MeetingTranscriptionTab";
import { useSnackbar } from "../components/Snackbar";
import {
  formatMeetingDuration,
  formatMeetingStartDate,
  getClientInitials,
  humanReadableTitleCase,
} from "../utils/format";
import Header from "./Header";

const DraftCaseNote = ({ notes }: { notes?: string }) => {
  const [isEditable, setIsEditable] = useState(false);
  const [inputNotes, setInputNotes] = useState(notes || "");
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  const handleCopyNotes = () => {
    Clipboard.setString(notes || "");
    showSnackbar("Case note copied to clipboard");
  };

  const handleSaveNotes = () => {
    console.log("Saved notes:", inputNotes);
    setIsEditable(false);
    showSnackbar("Case note saved");
  };

  return (
    <>
      <View>
        <Text className="font-inter text-xs font-semibold text-[#355362D9]">
          Draft case note
        </Text>
      </View>

      <Pressable onPress={() => setIsEditable(true)}>
        <TextInput
          className={`no-scrollbar rounded-lg border border-transparent px-1.5 py-0.5 font-inter text-sm font-normal text-primary outline-2 outline-[#00665F33] hover:bg-[#F4F5F5] focus:border-[#00665F] focus:bg-[#F4F5F5] focus:outline ${isEditable ? "" : "cursor-pointer"}`}
          placeholder="Type your notes here..."
          value={inputNotes}
          onChangeText={setInputNotes}
          multiline
          numberOfLines={15}
          readOnly={!isEditable}
        />
      </Pressable>
      {isEditable ? (
        <View className="flex-row items-center justify-end gap-5">
          <TouchableOpacity onPress={() => setIsEditable(false)}>
            <Text className="font-inter text-sm font-medium text-primary">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveNotes}
            className="rounded-full bg-primary px-3 py-2"
          >
            <Text className="font-inter text-sm font-semibold text-white">
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleCopyNotes}
          disabled={isSnackbarShowing}
          className="flex-row items-center gap-1"
        >
          <Image source={Icons.Copy} className="!size-4" resizeMode="contain" />
          <Text className="font-inter text-sm font-medium text-primary">
            Copy
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

type Props = {
  meetingDetails?: MeetingDetails;
  person: Person;
  personType: "client" | "resident";
};

const MeetingDesktop = ({ meetingDetails, person, personType }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Notes);

  const meetingDate = meetingDetails?.startTime
    ? formatMeetingStartDate(meetingDetails.startTime)
    : "";
  const { time, duration } = formatMeetingDuration({
    startDate: meetingDetails?.startTime || null,
    endDate: meetingDetails?.endTime || null,
  });

  return (
    <View className="flex-1 grow">
      <Header />
      <View className="flex-1 grow flex-row border-t border-[#35536226]">
        <View className="border-r border-[#35536226] pt-8">
          <Link
            className="mx-10 flex flex-row items-center gap-2"
            screen={
              personType === "client" ? "ClientProfile" : "ResidentProfile"
            }
            params={{ personId: person.personId.toString() }}
          >
            <Image source={Icons.ArrowLeft} className="!size-3" />
            <Text className="text-sm font-medium text-[#355362D9]">Back</Text>
          </Link>

          <View className="flex-row items-center gap-3 border-b border-[#35536226] px-10 py-6">
            <ImageBackground
              source={Icons.BgAvatar}
              className="size-12 items-center justify-center overflow-hidden rounded-full"
              imageClassName="!size-full"
            >
              <Text className="font-inter text-lg text-white">
                {getClientInitials(person.fullName)}
              </Text>
            </ImageBackground>
            <View>
              <Text className="font-libre-baskerville text-lg font-bold text-primary">
                {person.fullName}{" "}
                <Text className="font-inter text-sm font-semibold text-[#8BB1BA]">
                  ID: {person.displayPersonExternalId}
                </Text>
              </Text>
              <Text className="font-inter text-sm text-[#2B5469B2]">
                {humanReadableTitleCase(person.primaryMetadata)}
              </Text>
            </View>
          </View>

          <View className="gap-3 border-b border-[#35536226] px-10 py-6">
            <Text className="font-inter text-xl font-semibold leading-[24px] text-primary">
              Meeting: {meetingDate}
            </Text>
            <View className="flex flex-row items-center gap-1">
              <Image
                source={Icons.Clock}
                className="!size-3"
                resizeMode="contain"
              />
              <Text className="font-inter text-sm font-normal leading-[14px] text-gray-500">
                {time}
                {duration ? ` • ${duration}` : ""}
              </Text>
            </View>
          </View>

          <View className="gap-3 px-10 py-6">
            <DraftCaseNote notes={meetingDetails?.caseNote || undefined} />
          </View>
        </View>

        <View className="flex-1 gap-4 px-14 pt-8">
          <View className="w-full flex-row items-center justify-between">
            <View className="w-[300px] print:hidden">
              <MeetingTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isTranscriptionUnavailable={!meetingDetails?.transcription}
              />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={window.print}
                className="flex-row items-center gap-1.5 rounded-full border border-[#35536233] px-4 py-3"
              >
                <Image
                  source={Icons.Printer}
                  className="!size-4"
                  resizeMode="contain"
                />
                <Text className="font-inter text-sm font-medium text-primary">
                  Print
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mx-auto w-full max-w-[960px] flex-1">
            {activeTab === Tab.Notes && (
              <MeetingNotesTab
                notes={meetingDetails?.userNotepadNotes}
                actionItems={meetingDetails?.actionItems}
                criticalUpdates={meetingDetails?.criticalUpdates}
                meetingSummary={meetingDetails?.meetingSummary}
              />
            )}
            {activeTab === Tab.Transcription &&
              meetingDetails?.transcription && (
                <MeetingTranscriptionTab
                  transcription={{
                    ...meetingDetails.transcription,
                    utterances: meetingDetails.transcription.utterances.map(
                      (u) => ({
                        ...u,
                        confidence: u.confidence ?? 0,
                        speaker: u.speaker ?? "Unknown",
                      }),
                    ),
                  }}
                />
              )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default MeetingDesktop;
