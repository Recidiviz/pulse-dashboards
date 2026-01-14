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
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import { ClientMeetings, Person, ResidentMeetings } from "../common/types";
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import MeetingsCardsList from "../components/MeetingsCardsList";
import MeetingsTable from "../components/MeetingsTable.web";
import NewMeetingModal from "../components/NewMeetingModal";
import SearchBar from "../components/SearchBar";
import { useRecording } from "../context/RecordingContext";
import { humanReadableTitleCase } from "../utils/format";

enum MeetingsSort {
  NEWEST_FIRST = "Date (Latest first)",
  OLDEST_FIRST = "Date (Oldest first)",
  DURATION = "Duration",
}

type Props = {
  type: "client" | "resident";
  person: Person;
  rawMeetings?: ClientMeetings | ResidentMeetings;
  isLoading: boolean;
  isMeetingCreating: boolean;
  error: unknown;
  refetch: () => void;
  handleCreateMeeting: () => void;
  webMeetingId: string | null;
  setWebMeetingId: (id: string | null) => void;
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
  webMeetingId,
  setWebMeetingId,
}: Props) => {
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Date (Latest first)");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0);
  const { status: recordingState } = useRecording();
  // const [sortBy, setSortBy] = useState<MeetingsSort>(MeetingsSort.NEWEST_FIRST);

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

  const filterOptions = [
    "New Job",
    "Address",
    "Substance use",
    "Motivation",
    "Partner",
  ];

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  // Processed meetings
  const processedMeetings = useMemo(() => {
    return (
      rawMeetings?.map((m) => {
        const start = new Date(m.startTime);
        const end = m.endTime ? new Date(m.endTime) : null;

        const duration = end
          ? new Date(end.getTime() - start.getTime())
              .toISOString()
              .substring(11, 19)
          : null;

        const date = start.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "2-digit",
        });

        const time = `${start.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}${
          end
            ? ` - ${end.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""
        }`;

        return {
          id: m.id,
          date,
          time,
          start,
          end,
          duration,
          recordingState,
          content: "",
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

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) =>
        meeting.content?.toLowerCase().includes(filter.toLowerCase()),
      );

    return matchesSearch && matchesFilters;
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="font-inter text-base text-gray-700">
          Loading meetings...
        </Text>
      </View>
    );
  }

  if (error) throw error;

  const mobileContentPadding = mobileHeaderHeight - insets.top;

  const renderMeetingsContent = () => {
    if (processedMeetings.length === 0) {
      return (
        <View className="items-center justify-center py-16">
          <View className="mb-6 items-center justify-center rounded-3xl border-2 border-gray-200 bg-[#2B696908] p-3">
            <Image source={Icons.Calendar} className="!size-14" />
          </View>
          <Text className="mb-2 text-center font-libre-baskerville text-[28px] font-extrabold leading-[32px] tracking-[-0.5px] text-primary">
            No meetings yet
          </Text>
          <Text className="mb-6 text-center font-inter text-sm font-normal leading-5 tracking-[-0.28px] text-[#9CA3AF]">
            Create a new meeting when you’re ready.
          </Text>
          <TouchableOpacity
            onPress={handleCreateMeeting}
            className="rounded-full bg-[#006C67] px-6 py-3"
          >
            <Text className="font-inter text-[16px] font-medium text-white">
              + Meeting
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (filteredMeetings.length === 0) {
      return (
        <View className="items-center justify-center py-16">
          <View className="mb-6 items-center justify-center rounded-3xl border-2 border-gray-200 bg-[#2B696908] p-3">
            <Image source={Icons.Lock} className="!size-14" />
          </View>
          <Text className="mb-2 text-center font-libre-baskerville text-[28px] font-extrabold leading-[32px] tracking-[-0.5px] text-primary">
            No meetings match your search
          </Text>
          <Text className="mb-6 text-center font-inter text-sm font-normal leading-5 tracking-[-0.28px] text-[#9CA3AF]">
            Try adjusting your search or use different keywords.
          </Text>
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            className="rounded-full border border-gray-300 px-6 py-3"
          >
            <Text className="font-inter text-[16px] font-medium text-gray-700">
              Clear search
            </Text>
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
    <SafeAreaView edges={["top"]} className="flex-1 grow">
      <View className="z-10 hidden md:block">
        <Header />
      </View>

      <View
        className={`absolute inset-x-0 top-0 z-50 rounded-b-[24px] border-b border-[#F4F5F5] bg-white px-4 pb-4 md:hidden ${
          Platform.OS === "web" ? "!pt-4" : ""
        }`}
        style={{
          paddingTop: insets.top,
          shadowColor: isCollapsed ? "#000" : "transparent",
        }}
        onLayout={(e) =>
          setMobileHeaderHeight(
            Math.max(mobileHeaderHeight, e.nativeEvent.layout.height),
          )
        }
      >
        <View className="flex-row items-center justify-between">
          <Link screen="Clients" params={{}}>
            <Image
              source={Icons.ArrowLeft}
              className="!size-6"
              resizeMode="contain"
            />
          </Link>

          {isCollapsed && recordingState === "idle" && (
            <TouchableOpacity
              className="px-2"
              onPress={handleCreateMeeting}
              disabled={isMeetingCreating}
            >
              <Image
                source={Icons.Plus}
                className="!size-6"
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>

        {!isCollapsed && (
          <View className="pt-8">
            <Text className="mb-1 text-[28px] font-bold leading-[32px] tracking-[-0.56px] text-primary">
              {person.fullName}
            </Text>

            <Text className="text-[14px] leading-[16px] tracking-[-0.28px] text-primary">
              ID: {person.displayPersonExternalId} •{" "}
              {humanReadableTitleCase(person.primaryMetadata)}
            </Text>
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
            <Image source={Icons.ArrowLeft} className="!size-3" />
            <Text className="text-sm font-medium text-[#355362D9]">Back</Text>
          </Link>
        </View>

        <View className="mx-auto w-full max-w-[960px]">
          <Text className="hidden font-libre-baskerville text-[28px] font-bold leading-[32px] tracking-[-0.56px] text-primary md:block md:text-[32px]">
            {person.fullName}
          </Text>

          <Text className="mt-1 hidden font-inter text-[14px] leading-[16px] tracking-[-0.28px] text-primary md:block md:text-base">
            ID: {person.displayPersonExternalId} • {person.primaryMetadata}
          </Text>

          <View className="my-4 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-primary md:text-2xl">
              Meetings{" "}
              <Text className="font-inter text-gray-400">
                ({filteredMeetings.length})
              </Text>
            </Text>

            {recordingState === "idle" && (
              <TouchableOpacity
                className="w-[100px] flex-row items-center justify-center rounded-full bg-[#006C67] px-4 py-2"
                onPress={handleCreateMeeting}
                disabled={isMeetingCreating}
              >
                {isMeetingCreating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-inter font-medium text-white">
                    + Meeting
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View className="w-full">
            <SearchBar
              placeholder={"Enter keyword or phrase"}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </View>

          <View className="gap-2 py-2 md:flex-row md:items-center">
            <Text className="text-sm text-[#355362D9] md:text-base">
              Filter by meeting topics:
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {/* TODO: filters are under discussion with design team */}
              {filterOptions.map((filter) => {
                const isActive = activeFilters.includes(filter);
                return (
                  <TouchableOpacity
                    key={filter}
                    className={`flex-row items-center gap-2 rounded-[5px] border px-3 py-1 ${
                      isActive
                        ? "border-[#00665F] bg-[#C1E3D83B]"
                        : "border-gray-300 bg-white"
                    }`}
                    onPress={() => toggleFilter(filter)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? "text-primary" : "text-gray-700"
                      }`}
                    >
                      {filter}
                    </Text>

                    {isActive && (
                      <Image source={Icons.CrossRound} className="!size-4" />
                    )}
                  </TouchableOpacity>
                );
              })}

              {activeFilters.length > 0 && (
                <TouchableOpacity
                  className="group flex-row items-center gap-1 rounded-full px-4 py-1 hover:bg-[#4D5255]"
                  onPress={() => setActiveFilters([])}
                >
                  <Image
                    source={Icons.Reset}
                    className="!size-3 group-hover:invert"
                  />
                  <Text className="text-sm text-[#252C32] group-hover:text-white">
                    Reset
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="z-10 my-4 flex-row items-center justify-between">
            <Text className="font-inter text-sm text-[#9AA6AC]">
              {filteredMeetings.length} meeting
              {filteredMeetings.length > 1 ? "s" : ""}
            </Text>

            <Dropdown
              label="Sort by"
              options={Object.values(MeetingsSort)}
              onSelect={(value) => setSortBy(value as MeetingsSort)}
            />
          </View>

          <View className="grow basis-0 pb-8">{renderMeetingsContent()}</View>

          {webMeetingId && (
            <NewMeetingModal
              person={person}
              onClose={() => setWebMeetingId(null)}
              meetingId={webMeetingId}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileMeetings;
