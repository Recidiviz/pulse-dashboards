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

import Clipboard from "@react-native-clipboard/clipboard";
import { Link } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import ClockIcon from "react-native-heroicons/outline/ClockIcon";
import DocumentDuplicateIcon from "react-native-heroicons/outline/DocumentDuplicateIcon";
import PrinterIcon from "react-native-heroicons/solid/PrinterIcon";

import BgAvatarImage from "../assets/images/bg-avatar.png";
import { MeetingDetails, Person, PersonType } from "../common/types";
import MeetingNotesTab from "../components/MeetingNotesTab";
import MeetingTabs, { Tab } from "../components/MeetingTabs";
import MeetingTranscriptionTab from "../components/MeetingTranscriptionTab";
import { useSnackbar } from "../components/Snackbar";
import { usePrintMeetingDetails } from "../hooks/usePrintMeetingDetails";
import { useUpdateNotesMutation } from "../hooks/useUpdateNotesMutation";
import { Typography } from "../shared/ui/Typography";
import {
  formatMeetingDuration,
  formatMeetingStartDate,
  getInitials,
  humanReadableTitleCase,
} from "../utils/format";
import Header from "./Header";

type DraftCaseNoteProps = {
  meetingId: string;
  notes: string;
};

const DraftCaseNote = ({ meetingId, notes }: DraftCaseNoteProps) => {
  const updateNotesMutation = useUpdateNotesMutation(meetingId);
  const [isEditable, setIsEditable] = useState(false);
  const [inputNotes, setInputNotes] = useState(notes || "");
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  useEffect(() => {
    setInputNotes(notes || "");
  }, [notes, isEditable]);

  const handleCopyNotes = () => {
    Clipboard.setString(notes);
    showSnackbar("Case note copied to clipboard");
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({
      meetingId,
      caseNote: inputNotes,
    });
    setIsEditable(false);
    showSnackbar("Case note saved");
  };

  const handleCancelNotesEdit = () => {
    setInputNotes(notes || "");
    setIsEditable(false);
  };

  return (
    <>
      <View>
        <Typography className="text-xs font-semibold text-secondary">
          Draft case note
        </Typography>
      </View>
      <Pressable onPress={() => setIsEditable(true)}>
        <TextInput
          className={`no-scrollbar rounded-lg border border-transparent px-1.5 py-0.5 text-sm font-normal text-primary outline-2 outline-brand hover:bg-hover focus:border-brand focus:bg-secondary focus:outline ${isEditable ? "" : "cursor-pointer"}`}
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
          <TouchableOpacity onPress={handleCancelNotesEdit}>
            <Typography className="text-sm font-medium text-primary">
              Cancel
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveNotes}
            className="rounded-full bg-brand px-3 py-2"
          >
            <Typography className="text-sm font-semibold text-on-brand">
              Save Changes
            </Typography>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleCopyNotes}
          disabled={isSnackbarShowing}
          className="flex-row items-center gap-1"
        >
          <DocumentDuplicateIcon className="size-4 stroke-tertiary stroke-[3px]" />
          <Typography className="text-sm font-medium text-primary">
            Copy
          </Typography>
        </TouchableOpacity>
      )}
    </>
  );
};

type Props = {
  meetingId: string;
  meetingDetails: MeetingDetails;
  person: Person;
  personType: PersonType;
  showTranscription?: boolean;
};

const MeetingDesktop = ({
  meetingId,
  meetingDetails,
  person,
  personType,
  showTranscription = false,
}: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Notes);

  const meetingDate = meetingDetails.startTime
    ? formatMeetingStartDate(meetingDetails.startTime)
    : "";
  const { time, duration } = formatMeetingDuration({
    startDate: meetingDetails.startTime || null,
    endDate: meetingDetails.endTime || null,
  });

  const handlePrint = usePrintMeetingDetails({
    person,
    meetingDetails,
    meetingDate,
    time,
    duration,
  });

  return (
    <View className="flex-1 grow">
      <Header />
      <View className="flex-1 grow flex-row border-t border-subtle">
        <View className="border-r border-subtle pt-8">
          <Link
            className="mx-10 flex flex-row items-center gap-2"
            screen={
              personType === "client" ? "ClientProfile" : "ResidentProfile"
            }
            params={{ personId: person.personId.toString() }}
          >
            <ChevronLeftIcon className="size-3 stroke-primary stroke-[3px]" />
            <Typography className="text-sm font-medium text-primary">
              Back
            </Typography>
          </Link>

          <View className="flex-row items-center gap-3 border-b border-subtle px-10 py-6">
            <ImageBackground
              source={BgAvatarImage}
              className="size-12 items-center justify-center overflow-hidden rounded-full"
              imageClassName="!size-full"
            >
              <Typography className="text-lg text-on-brand">
                {getInitials(person.fullName)}
              </Typography>
            </ImageBackground>
            <View>
              <Typography className="font-libre-baskerville text-lg font-bold text-primary">
                {person.fullName}{" "}
                <Typography className="text-sm font-semibold text-secondary">
                  ID: {person.displayPersonExternalId}
                </Typography>
              </Typography>
              <Typography className="text-sm text-tertiary">
                {humanReadableTitleCase(person.primaryMetadata)}
              </Typography>
            </View>
          </View>

          <View className="gap-3 border-b border-subtle px-10 py-6">
            <Typography className="text-xl font-semibold leading-[24px] text-primary">
              Meeting: {meetingDate}
            </Typography>
            <View className="flex flex-row items-center gap-1">
              <ClockIcon className="size-3 stroke-secondary stroke-[3px]" />
              <Typography className="text-sm font-normal leading-[14px] text-secondary">
                {time}
                {duration ? ` • ${duration}` : ""}
              </Typography>
            </View>
          </View>

          <View className="gap-3 px-10 py-6">
            <DraftCaseNote
              meetingId={meetingId}
              notes={meetingDetails.caseNote || ""}
            />
          </View>
        </View>

        <View className="flex-1 gap-4 pt-8">
          <View className="w-full flex-row items-center justify-between px-14">
            <View className="w-[300px]">
              <MeetingTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isTranscriptionUnavailable={!meetingDetails.transcription}
                showTranscription={showTranscription}
              />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handlePrint}
                className="flex-row items-center gap-1.5 rounded-full border border-subtle px-4 py-3"
              >
                <PrinterIcon className="size-4 fill-tertiary" />
                <Typography className="text-sm font-medium text-primary">
                  Print
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="grow px-14">
            <View className="mx-auto w-full flex-1">
              {activeTab === Tab.Notes && (
                <MeetingNotesTab meetingDetails={meetingDetails} />
              )}
              {activeTab === Tab.Transcription &&
                showTranscription &&
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
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default MeetingDesktop;
