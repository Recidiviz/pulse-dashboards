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

import { Link } from "@react-navigation/native";
import { format } from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import PlusIcon from "react-native-heroicons/outline/PlusIcon";
import DocumentSearchIcon from "react-native-heroicons/solid/DocumentSearchIcon";
import UploadIcon from "react-native-heroicons/solid/UploadIcon";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAudioUploadStore } from "~@meetings/app/features/audio-upload";

import { theme } from "../common/theme";
import {
  ClientMeetings,
  Person,
  PersonType,
  ResidentMeetings,
} from "../common/types";
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import MeetingsCardsList from "../components/MeetingsCardsList";
import MeetingsTable from "../components/MeetingsTable.web";
import { NewMeetingRecordingSheet } from "../components/NewMeetingRecordingSheet";
import SearchBar from "../components/SearchBar";
import { useRecording } from "../features/recording";
import { Typography } from "../shared/ui/Typography";
import { humanReadableTitleCase } from "../utils/format";

enum MeetingsSort {
  NEWEST_FIRST = "Date (Latest first)",
  OLDEST_FIRST = "Date (Oldest first)",
  DURATION = "Duration",
}

type Props = {
  type: PersonType;
  person: Person;
  rawMeetings?: ClientMeetings | ResidentMeetings;
  isLoading: boolean;
  isMeetingCreating: boolean;
  error: unknown;
  refetch: () => void;
  handleCreateMeeting: () => void;
};

const ProfileMeetings = ({
  type,
  person,
  rawMeetings,
  isLoading,
  isMeetingCreating,
  error,
  refetch,
  handleCreateMeeting,
}: Props) => {
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Date (Latest first)");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0);
  const [isNewMeetingSheetOpen, setIsNewMeetingSheetOpen] = useState(false);
  const { status: recordingState } = useRecording();
  // const [sortBy, setSortBy] = useState<MeetingsSort>(MeetingsSort.NEWEST_FIRST);

  const openAudioUpload = useAudioUploadStore((s) => s.open);
  const audioUploadStatus = useAudioUploadStore((s) => s.status);

  const handleAudioUpload = useCallback(() => {
    openAudioUpload({ person, personType: type });
  }, [openAudioUpload, person, type]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;

    // Only collapse when scrolling down past 50px
    if (currentOffset > 50) setIsCollapsed(true);
    else setIsCollapsed(false);
  };

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
          isActive: !end,
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

  const mobileContentPadding = mobileHeaderHeight - insets.top;

  const renderMeetingsContent = () => {
    if (processedMeetings.length === 0) {
      return (
        <View className="items-center justify-center py-16">
          <View className="mb-6 items-center justify-center rounded-3xl border-2 border-subtle bg-tertiary p-3">
            <DocumentSearchIcon className="size-14 fill-primary" />
          </View>
          <Typography className="mb-2 text-center font-libre-baskerville text-[28px] font-extrabold leading-[32px] tracking-[-0.5px] text-primary">
            No meetings yet
          </Typography>
          <Typography className="mb-6 text-center text-sm font-normal leading-5 tracking-[-0.28px] text-secondary">
            Create a new meeting when you’re ready.
          </Typography>
        </View>
      );
    }
    if (filteredMeetings.length === 0) {
      return (
        <View className="items-center justify-center py-16">
          <View className="mb-6 items-center justify-center rounded-3xl border-2 border-subtle bg-secondary p-3">
            <DocumentSearchIcon className="size-14 fill-primary" />
          </View>
          <Typography className="mb-2 text-center font-libre-baskerville text-[28px] font-extrabold leading-[32px] tracking-[-0.5px] text-primary">
            No meetings match your search
          </Typography>
          <Typography className="mb-6 text-center text-sm font-normal leading-5 tracking-[-0.28px] text-secondary">
            Try adjusting your search or use different keywords.
          </Typography>
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            className="rounded-full border border-subtle px-6 py-3"
          >
            <Typography className="text-[16px] font-medium text-secondary">
              Clear search
            </Typography>
          </TouchableOpacity>
        </View>
      );
    }
    return Platform.select({
      native: (
        <MeetingsCardsList
          meetings={filteredMeetings}
          person={person}
          personType={type}
        />
      ),
      web: (
        <View className="pb-4">
          <View className="md:hidden">
            <MeetingsCardsList
              meetings={filteredMeetings}
              person={person}
              personType={type}
            />
          </View>
          <View className="hidden md:block">
            <MeetingsTable
              meetings={filteredMeetings}
              person={person}
              personType={type}
            />
          </View>
        </View>
      ),
    });
  };

  return (
    <>
      <SafeAreaView edges={["top"]} className="flex-1 grow">
        <View className="z-10 hidden md:block">
          <Header />
        </View>
        <View
          className={`absolute inset-x-0 top-0 z-50 rounded-b-[24px] border-b border-subtle bg-primary px-4 pb-4 md:hidden ${
            Platform.OS === "web" ? "!pt-4" : ""
          }`}
          style={{
            paddingTop: insets.top,
            shadowColor: isCollapsed
              ? theme["backgroundColor"]["strong"]
              : "transparent",
          }}
          onLayout={(e) =>
            setMobileHeaderHeight(
              Math.max(mobileHeaderHeight, e.nativeEvent.layout.height),
            )
          }
        >
          <View className="flex-row items-center justify-between">
            <Link screen="Clients" params={{}}>
              <ChevronLeftIcon className="size-6 stroke-primary stroke-[3px]" />
            </Link>
            {isCollapsed && recordingState === "idle" && (
              <TouchableOpacity
                className="px-2"
                onPress={() => setIsNewMeetingSheetOpen(true)}
              >
                <PlusIcon className="size-6 stroke-primary stroke-[3px]" />
              </TouchableOpacity>
            )}
          </View>

          {!isCollapsed && (
            <View className="pt-8">
              <Typography className="mb-1 text-[28px] font-bold leading-[32px] tracking-[-0.56px] text-primary">
                {person.fullName}
              </Typography>

              <Typography className="text-[14px] leading-[16px] tracking-[-0.28px] text-primary">
                ID: {person.displayPersonExternalId} •{" "}
                {humanReadableTitleCase(person.primaryMetadata)}
              </Typography>
            </View>
          )}
        </View>
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          className="grow md:!pt-0"
          contentContainerClassName="flex-grow px-4 md:pt-10"
          style={{ paddingTop: mobileContentPadding }}
        >
          <View className="mx-auto mb-4 hidden w-full max-w-[960px] items-start md:flex xl:absolute xl:left-10 xl:max-w-none">
            {/* TODO: back button under discussion with design team */}
            <Link
              className="flex flex-row items-center gap-2"
              screen={type === "client" ? "Clients" : "Residents"}
              params={{}}
            >
              <ChevronLeftIcon className="size-3 stroke-primary stroke-[3px]" />
              <Typography className="text-sm font-medium text-primary">
                Back
              </Typography>
            </Link>
          </View>

          <View className="mx-auto w-full max-w-[960px]">
            <Typography className="hidden font-libre-baskerville text-[28px] font-bold capitalize leading-[32px] tracking-[-0.56px] text-primary md:block md:text-[32px]">
              {person.fullName.toLowerCase()}
            </Typography>

            <Typography className="mt-1 hidden text-[14px] leading-[16px] tracking-[-0.28px] text-primary md:block md:text-base">
              ID: {person.displayPersonExternalId} • {person.primaryMetadata}
            </Typography>

            <View className="my-4 flex-row items-center justify-between">
              <Typography className="text-xl font-semibold text-primary md:text-2xl">
                Meetings
              </Typography>

              {recordingState === "idle" && (
                <>
                  {/* Desktop: show both buttons inline */}
                  <View className="hidden flex-row gap-6 md:flex">
                    <TouchableOpacity
                      className="flex-row items-center gap-1"
                      onPress={() => handleAudioUpload()}
                    >
                      <UploadIcon className="size-4 fill-brand" />
                      <Typography className="font-medium text-brand">
                        Upload
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="w-[100px] flex-row items-center justify-center rounded-full bg-brand px-4 py-2"
                      onPress={handleCreateMeeting}
                      disabled={isMeetingCreating}
                    >
                      {isMeetingCreating ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Typography className="font-medium text-on-brand">
                          + Meeting
                        </Typography>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Mobile: single button that opens the bottom sheet */}
                  <TouchableOpacity
                    className="w-[100px] flex-row items-center justify-center rounded-full bg-brand px-4 py-2 md:hidden"
                    onPress={() => setIsNewMeetingSheetOpen(true)}
                  >
                    <Typography className="font-medium text-on-brand">
                      + Meeting
                    </Typography>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View className="h-10 w-full">
              <SearchBar
                placeholder={"Enter keyword or phrase"}
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </View>

            <View className="z-10 my-4 flex-row items-center justify-between">
              <Typography className="text-sm text-secondary">
                {filteredMeetings.length} meeting
                {filteredMeetings.length === 1 ? "" : "s"}
              </Typography>

              <Dropdown
                label="Sort by"
                options={Object.values(MeetingsSort)}
                onSelect={(value) => setSortBy(value as MeetingsSort)}
              />
            </View>

            <View className="grow basis-0 pb-8">{renderMeetingsContent()}</View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {isNewMeetingSheetOpen && !audioUploadStatus && (
        <NewMeetingRecordingSheet
          person={person}
          onClose={() => setIsNewMeetingSheetOpen(false)}
          onStartMeeting={() => {
            setIsNewMeetingSheetOpen(false);
            handleCreateMeeting();
          }}
          onUploadFile={handleAudioUpload}
          isMeetingCreating={isMeetingCreating}
        />
      )}
    </>
  );
};

export default ProfileMeetings;
