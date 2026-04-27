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

import {
  CompositeNavigationProp,
  Link,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format } from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAudioUploadStore } from "~@meetings/app/features/audio-upload";

import {
  ClientMeetings,
  Person,
  PersonType,
  ResidentMeetings,
} from "../common/types";
import Header from "../components/Header";
import MeetingsTable from "../components/MeetingsTable.web";
import { NewMeetingOptionsModal } from "../components/NewMeetingOptionsModal";
import { NewMeetingRecordingSheet } from "../components/NewMeetingRecordingSheet";
import { MeetingControlsMobile, useRecording } from "../features/recording";
import { useCreateMeeting } from "../hooks/useCreateMeeting";
import {
  ClientsStackParamList,
  ResidentsStackParamList,
} from "../navigation/DrawerNavigator";
import { Typography } from "../shared/ui/Typography";
import MeetingsHeaderContent from "./MeetingsHeaderContent";
import MeetingsMobileList from "./MeetingsMobileList";
import MeetingsPlaceholder from "./MeetingsPlaceholder";

type ProfileNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<ClientsStackParamList, "ClientProfile">,
  NativeStackNavigationProp<ResidentsStackParamList, "ResidentProfile">
>;

enum MeetingsSort {
  NEWEST_FIRST = "Date (Latest first)",
  OLDEST_FIRST = "Date (Oldest first)",
  DURATION = "Duration",
}

type Props = {
  person: Person;
  personType: PersonType;
  rawMeetings?: ClientMeetings | ResidentMeetings;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
};

const ProfileMeetings = ({
  person,
  personType,
  rawMeetings,
  isLoading,
  error,
  refetch,
}: Props) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavProp>();
  const { status: recordingState } = useRecording();
  const { setMeetingId, setPerson, setPersonType, startRecording } =
    useRecording<"native">();
  const { openRecordingView, startRecording: startRecordingWeb } =
    useRecording<"web">();
  const openAudioUpload = useAudioUploadStore((s) => s.open);
  const audioUploadStatus = useAudioUploadStore((s) => s.status);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(MeetingsSort.NEWEST_FIRST as string);
  const [isNewMeetingSheetOpen, setIsNewMeetingSheetOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);

  const handleAudioUpload = useCallback(() => {
    openAudioUpload({ person, personType });
  }, [openAudioUpload, person, personType]);

  const { handleCreateMeeting, isCreating } = useCreateMeeting({
    person,
    personType: personType,
    onSuccess: (meetingId) => {
      switch (Platform.OS) {
        case "web":
          openRecordingView({ meetingId, person });
          startRecordingWeb();
          break;
        case "ios":
        case "android":
          setMeetingId(meetingId);
          setPerson(person);
          setPersonType(personType);
          startRecording();
          break;
      }
    },
  });

  useEffect(() => {
    if (recordingState) {
      refetch();
    }
  }, [recordingState, refetch]);

  // Processed meetings
  const processedMeetings = useMemo(() => {
    if (!recordingState) return [];

    return (
      rawMeetings?.map((m) => {
        const start = new Date(m.startTime);
        const end = m.endTime ? new Date(m.endTime) : null;

        let duration: string | null = null;

        if (m.durationMs) {
          const totalSeconds = Math.floor(m.durationMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          duration = [hours, minutes, seconds]
            .map((v) => String(v).padStart(2, "0"))
            .join(":");
        } else if (end) {
          duration = new Date(end.getTime() - start.getTime())
            .toISOString()
            .substring(11, 19);
        }

        const date = format(start, "EEEE MMM dd");
        const time = `${format(start, "HH:mm")}${
          end ? ` - ${format(end, "HH:mm")}` : ""
        }`;

        return {
          id: m.id,
          date,
          time,
          start,
          end,
          duration,
          recordingState,
          content: m.caseNote?.replace(/\n/g, " ") || "",
          status: m.postMeetingProcessingStatus,
          validationErrorType: m.validationErrorType,
          isActive: !end,
          caseNote: m.caseNote,
        };
      }) || []
    );
  }, [rawMeetings, recordingState]);

  // Sort meetings
  const sortedMeetings = useMemo(() => {
    if (!processedMeetings) return [];
    const sortedMeetings = processedMeetings.sort((a, b) => {
      if (sortBy === MeetingsSort.NEWEST_FIRST) {
        return new Date(b.start).getTime() - new Date(a.start).getTime();
      } else if (sortBy === MeetingsSort.OLDEST_FIRST) {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      } else {
        const parseDuration = (duration: string | null) => {
          if (!duration) return 0;
          const [hh, mm, ss] = duration.split(":").map(Number);
          return hh * 3600 + mm * 60 + ss;
        };
        return parseDuration(b.duration) - parseDuration(a.duration);
      }
    });

    return sortedMeetings.sort((a, b) => {
      const statusOrder = (status: string) => {
        if (status === "NOT_STARTED") return 0;
        if (status === "COMPLETED") return 2;
        return 1;
      };
      return statusOrder(a.status) - statusOrder(b.status);
    });
  }, [sortBy, processedMeetings]);

  // Filter meetings based on search query and active filters
  const filteredMeetings = sortedMeetings.filter((meeting) => {
    const matchesSearch =
      searchQuery === "" ||
      meeting.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.content?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Typography className="text-base text-gray-700">
          Loading meetings...
        </Typography>
      </View>
    );
  }

  if (error) throw error;

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1" style={{ marginTop: -insets.top }}>
        <Header
          showDrawer={false}
          showGoBack={true}
          onGoBack={() =>
            navigation.navigate(
              personType === "client" ? "Clients" : "Residents",
            )
          }
        />
        {Platform.select({
          native: (
            <>
              <MeetingsMobileList
                meetings={filteredMeetings}
                person={person}
                handleOpenBottomSheet={() => setIsNewMeetingSheetOpen(true)}
                handleOpenModal={() => setIsNewMeetingModalOpen(true)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortOptions={Object.values(MeetingsSort)}
                setSortBy={setSortBy}
                personType={personType}
              />
              <MeetingControlsMobile />
            </>
          ),
          web: (
            <View className="flex-1 pb-4">
              <View className="flex-1 md:hidden">
                <MeetingsMobileList
                  meetings={filteredMeetings}
                  person={person}
                  handleOpenBottomSheet={() => setIsNewMeetingSheetOpen(true)}
                  handleOpenModal={() => setIsNewMeetingModalOpen(true)}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  sortOptions={Object.values(MeetingsSort)}
                  setSortBy={setSortBy}
                  personType={personType}
                />
              </View>
              <ScrollView className="hidden flex-1 md:block">
                <View className="mx-auto w-full max-w-[960px] flex-1">
                  <View className="flex flex-1 flex-row pt-10">
                    <Link
                      className="flex flex-row items-center gap-2"
                      screen={personType === "client" ? "Clients" : "Residents"}
                      params={{}}
                    >
                      <ChevronLeftIcon className="size-3 stroke-primary stroke-[3px]" />
                      <Typography className="text-sm font-medium text-primary">
                        Back
                      </Typography>
                    </Link>
                  </View>
                  <MeetingsHeaderContent
                    person={person}
                    meetingsCount={filteredMeetings.length}
                    handleOpenBottomSheet={() => setIsNewMeetingSheetOpen(true)}
                    handleOpenModal={() => setIsNewMeetingModalOpen(true)}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    sortOptions={Object.values(MeetingsSort)}
                    setSortBy={setSortBy}
                  />
                  {filteredMeetings.length === 0 ? (
                    <MeetingsPlaceholder
                      handleCreateMeeting={() => setIsNewMeetingModalOpen(true)}
                      isSearchResultEmpty={searchQuery.trim().length > 0}
                    />
                  ) : (
                    <MeetingsTable
                      meetings={filteredMeetings}
                      person={person}
                      personType={personType}
                    />
                  )}
                </View>
              </ScrollView>
            </View>
          ),
        })}
      </View>
      {isNewMeetingSheetOpen && !audioUploadStatus && (
        <NewMeetingRecordingSheet
          person={person}
          onClose={() => setIsNewMeetingSheetOpen(false)}
          onStartMeeting={() => {
            setIsNewMeetingSheetOpen(false);
            handleCreateMeeting();
          }}
          onUploadFile={handleAudioUpload}
          isMeetingCreating={isCreating}
        />
      )}
      {isNewMeetingModalOpen && (
        <NewMeetingOptionsModal
          person={person}
          onClose={() => setIsNewMeetingModalOpen(false)}
          onStartMeeting={() => {
            setIsNewMeetingModalOpen(false);
            handleCreateMeeting();
          }}
          onUploadFile={() => {
            setIsNewMeetingModalOpen(false);
            handleAudioUpload();
          }}
          isMeetingCreating={isCreating}
        />
      )}
    </SafeAreaView>
  );
};

export default ProfileMeetings;
