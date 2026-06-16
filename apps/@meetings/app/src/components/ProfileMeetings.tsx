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
  useIsFocused,
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

import { useCreateMeeting } from "~@meetings/app/entities/meeting";
import { useAudioUploadStore } from "~@meetings/app/features/audio-upload";
import { Person, PersonType } from "~@meetings/app/shared/api";

import { ClientMeetings, ResidentMeetings } from "../common/types";
import Header from "../components/Header";
import MeetingsTable from "../components/MeetingsTable.web";
import { NewMeetingOptionsModal } from "../components/NewMeetingOptionsModal";
import { NewMeetingRecordingSheet } from "../components/NewMeetingRecordingSheet";
import { useAgencyConfigs } from "../context/AgencyConfigContext";
import { useAnalytics } from "../context/AnalyticsContext";
import { useStateSelection } from "../context/StateContext";
import { useMeetingTypeStore } from "../entities/meeting-type";
import { validateAndStart } from "../entities/meeting-type/lib";
import { MeetingControlsMobile, useRecording } from "../features/recording";
import {
  ClientsStackParamList,
  ResidentsStackParamList,
} from "../shared/config/routes";
import { useIsMobileWidth } from "../shared/lib/useIsMobileWidth";
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
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const isMobileWidth = useIsMobileWidth();
  const navigation = useNavigation<ProfileNavProp>();
  const { agencyConfigs } = useAgencyConfigs();
  const { selectedStateCode } = useStateSelection();
  const meetingTypes = agencyConfigs[selectedStateCode].meetingTypes;
  const { status: recordingState } = useRecording();
  const {
    setMeetingId,
    setMeetingType,
    setPerson,
    setPersonType,
    startRecording,
  } = useRecording<"native">();
  const { openRecordingView, startRecording: startRecordingWeb } =
    useRecording<"web">();
  const openAudioUpload = useAudioUploadStore((s) => s.open);
  const audioUploadStatus = useAudioUploadStore((s) => s.status);
  const {
    meetingType: meetingTypeValue,
    meetingTypeCategory: meetingTypeCategoryValue,
    meetingTypeCategoryError,
    setMeetingType: setMeetingTypeValue,
    setMeetingTypeCategory: setMeetingTypeCategoryValue,
    setMeetingTypeCategoryError,
    reset: resetMeetingTypeStore,
  } = useMeetingTypeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(MeetingsSort.NEWEST_FIRST as string);
  const [isNewMeetingSheetOpen, setIsNewMeetingSheetOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);

  const handleAudioUpload = useCallback(() => {
    const startUpload = () => {
      setIsNewMeetingModalOpen(false);
      setIsNewMeetingSheetOpen(false);
      openAudioUpload({
        person,
        personType,
        meetingType: meetingTypeValue,
        meetingTypeCategory: meetingTypeCategoryValue,
      });
      resetMeetingTypeStore(meetingTypes[0].type ?? undefined);
    };
    validateAndStart({
      meetingTypes,
      meetingType: meetingTypeValue,
      meetingTypeCategoryValue,
      setMeetingTypeCategoryError,
      startCallback: startUpload,
    });
  }, [
    meetingTypes,
    meetingTypeValue,
    openAudioUpload,
    person,
    personType,
    meetingTypeCategoryValue,
    resetMeetingTypeStore,
    setMeetingTypeCategoryError,
  ]);

  const { track } = useAnalytics();

  const { handleCreateMeeting, isCreating } = useCreateMeeting({
    person,
    meetingType: meetingTypeValue,
    meetingTypeCategory: meetingTypeCategoryValue,
    personType: personType,
    onSuccess: (meetingId) => {
      track("meeting_started", { meetingId, personType });
      switch (Platform.OS) {
        case "web":
          openRecordingView({
            meetingId,
            meetingType: meetingTypeValue,
            meetingTypeCategory: meetingTypeCategoryValue,
            person,
          });
          startRecordingWeb();
          resetMeetingTypeStore(meetingTypes[0].type ?? undefined);
          break;
        case "ios":
        case "android":
          setMeetingId(meetingId);
          setMeetingType(meetingTypeValue);
          setPerson(person);
          setPersonType(personType);
          startRecording();
          resetMeetingTypeStore(meetingTypes[0].type ?? undefined);
          break;
      }
    },
  });

  useEffect(() => {
    if (recordingState) {
      refetch();
    }
  }, [recordingState, refetch]);

  useEffect(() => {
    if (meetingTypes.length > 0) {
      setMeetingTypeValue(meetingTypes[0].type);
    }
  }, [meetingTypes, meetingTypes.length, setMeetingTypeValue]);

  useEffect(() => {
    if (isNewMeetingModalOpen && isMobileWidth && Platform.OS === "web") {
      setIsNewMeetingModalOpen(false);
      setIsNewMeetingSheetOpen(true);
    }
    if (isNewMeetingSheetOpen && !isMobileWidth && Platform.OS === "web") {
      setIsNewMeetingSheetOpen(false);
      setIsNewMeetingModalOpen(true);
    }
  }, [isMobileWidth, isNewMeetingModalOpen, isNewMeetingSheetOpen]);

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
          meetingType: m.meetingType,
          meetingTypeCategory: m.meetingTypeCategory,
          date,
          time,
          start,
          end,
          duration,
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
              {isFocused && isMobileWidth && (
                <View className="flex-1">
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
              )}
              {isFocused && !isMobileWidth && (
                <ScrollView className="flex-1">
                  <View className="mx-auto w-full max-w-[960px] flex-1">
                    <View className="flex flex-1 flex-row pt-10">
                      <Link
                        className="flex flex-row items-center gap-2"
                        screen={
                          personType === "client" ? "Clients" : "Residents"
                        }
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
                      handleOpenBottomSheet={() =>
                        setIsNewMeetingSheetOpen(true)
                      }
                      handleOpenModal={() => setIsNewMeetingModalOpen(true)}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      sortOptions={Object.values(MeetingsSort)}
                      setSortBy={setSortBy}
                    />
                    {filteredMeetings.length === 0 ? (
                      <MeetingsPlaceholder
                        handleCreateMeeting={() =>
                          setIsNewMeetingModalOpen(true)
                        }
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
              )}
            </View>
          ),
        })}
      </View>
      {isNewMeetingSheetOpen && !audioUploadStatus && (
        <NewMeetingRecordingSheet
          person={person}
          onClose={() => setIsNewMeetingSheetOpen(false)}
          onStartMeeting={() => {
            const startMeeting = () => {
              setIsNewMeetingSheetOpen(false);
              handleCreateMeeting();
            };

            validateAndStart({
              meetingTypes,
              meetingType: meetingTypeValue,
              meetingTypeCategoryValue,
              setMeetingTypeCategoryError,
              startCallback: startMeeting,
            });
          }}
          onUploadFile={handleAudioUpload}
          isMeetingCreating={isCreating}
          meetingTypeValue={meetingTypeValue}
          meetingTypes={meetingTypes}
          setMeetingType={setMeetingTypeValue}
          meetingTypeCategory={meetingTypeCategoryValue}
          setMeetingTypeCategory={setMeetingTypeCategoryValue}
          meetingTypeCategoryError={meetingTypeCategoryError}
        />
      )}
      {isNewMeetingModalOpen && (
        <NewMeetingOptionsModal
          person={person}
          onClose={() => setIsNewMeetingModalOpen(false)}
          onStartMeeting={() => {
            const startMeeting = () => {
              setIsNewMeetingModalOpen(false);
              handleCreateMeeting();
            };

            validateAndStart({
              meetingTypes,
              meetingType: meetingTypeValue,
              meetingTypeCategoryValue,
              setMeetingTypeCategoryError,
              startCallback: startMeeting,
            });
          }}
          onUploadFile={handleAudioUpload}
          isMeetingCreating={isCreating}
          meetingTypeValue={meetingTypeValue}
          meetingTypes={meetingTypes}
          setMeetingType={setMeetingTypeValue}
          meetingTypeCategory={meetingTypeCategoryValue}
          setMeetingTypeCategory={setMeetingTypeCategoryValue}
          meetingTypeCategoryError={meetingTypeCategoryError}
        />
      )}
    </SafeAreaView>
  );
};

export default ProfileMeetings;
