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
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import MeetingsCardsList from "../components/MeetingsCardsList";
import MeetingsTable from "../components/MeetingsTable.web";
import SearchBar from "../components/SearchBar";
import { useRecording } from "../context/RecordingContext";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";
import { humanReadableTitleCase } from "../utils/format";

type NewMeetingNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "NewMeeting"
>;
type NewMeetingRouteProp = RouteProp<RootStackParamList, "NewMeeting">;

enum MeetingsSort {
  NEWEST_FIRST = "Date (Latest first)",
  OLDEST_FIRST = "Date (Oldest first)",
  DURATION = "Duration",
}

const ProfileScreen = () => {
  const navigation = useNavigation<NewMeetingNavProp>();
  const route = useRoute<NewMeetingRouteProp>();
  const client = {
    ...route.params.client,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.client.personId),
  };

  const insets = useSafeAreaInsets();

  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Date (Latest first)");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0);
  const { status: recordingState } = useRecording();
  const scrollY = useRef(0);
  // const [sortBy, setSortBy] = useState<MeetingsSort>(MeetingsSort.NEWEST_FIRST);

  const {
    data: rawMeetings,
    isLoading,
    error,
    refetch,
  } = trpc.v1.client.getMeetings.useQuery(
    { clientId: client.personId },
    {
      enabled: !!client?.personId,
    },
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;

    // Only collapse when scrolling down past 50px
    if (currentOffset > 50 && currentOffset > scrollY.current) {
      setIsCollapsed(true);
    } else if (currentOffset < 30) {
      setIsCollapsed(false);
    }

    scrollY.current = currentOffset;
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

  const createMeetingMutation = trpc.v1.client.createMeeting.useMutation();
  const handleCreateMeeting = async () => {
    try {
      setIsCreating(true);
      const startTime = new Date();
      const { id: meetingId } = await createMeetingMutation.mutateAsync({
        clientId: client.personId,
        startTime,
      });

      navigation.navigate("NewMeeting", {
        client: {
          personId: client.personId.toString(),
          fullName: client.fullName,
          displayPersonExternalId: client.displayPersonExternalId,
          supervision: client.supervision,
        },
        meetingId,
      });
    } catch (err) {
      console.error("[createMeeting] Failed:", err);
      Alert.alert("Error", "Failed to create meeting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-700 text-base">Loading meetings...</Text>
      </View>
    );
  }

  if (error) throw error;

  const mobileContentPadding = mobileHeaderHeight - insets.top;

  const renderMeetingsContent = () => {
    if (processedMeetings.length === 0) {
      return (
        <View className="justify-center items-center py-16">
          <View className="justify-center items-center bg-[#2B696908] mb-6 p-3 border-2 border-gray-200 rounded-3xl">
            <Image source={Icons.Calendar} className="!size-14" />
          </View>
          <Text className="mb-2 font-libre-baskerville font-extrabold text-[28px] text-primary text-center leading-[32px] tracking-[-0.5px]">
            No meetings yet
          </Text>
          <Text className="mb-6 font-inter font-normal text-[#9CA3AF] text-sm text-center leading-5 tracking-[-0.28px]">
            Create a new meeting when you’re ready.
          </Text>
          <TouchableOpacity
            onPress={handleCreateMeeting}
            className="bg-[#006C67] px-6 py-3 rounded-full"
          >
            <Text className="font-inter font-medium text-[16px] text-white">
              + Meeting
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (filteredMeetings.length === 0) {
      return (
        <View className="justify-center items-center py-16">
          <View className="justify-center items-center bg-[#2B696908] mb-6 p-3 border-2 border-gray-200 rounded-3xl">
            <Image source={Icons.Lock} className="!size-14" />
          </View>
          <Text className="mb-2 font-libre-baskerville font-extrabold text-[28px] text-primary text-center leading-[32px] tracking-[-0.5px]">
            No meetings match your search
          </Text>
          <Text className="mb-6 font-inter font-normal text-[#9CA3AF] text-sm text-center leading-5 tracking-[-0.28px]">
            Try adjusting your search or use different keywords.
          </Text>
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            className="px-6 py-3 border border-gray-300 rounded-full"
          >
            <Text className="font-inter font-medium text-[16px] text-gray-700">
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
          client={route.params.client}
          onPress={(id) => {
            navigation.navigate("NewMeeting", {
              client: {
                personId: client.personId.toString(),
                fullName: client.fullName,
                displayPersonExternalId: client.displayPersonExternalId,
                supervision: client.supervision,
              },
              meetingId: id,
            });
          }}
        />
      ),
      web: (
        <View className="pb-4">
          <View className="md:hidden">
            <MeetingsCardsList
              meetings={filteredMeetings}
              client={route.params.client}
              onPress={(id) => {
                navigation.navigate("NewMeeting", {
                  client: {
                    personId: client.personId.toString(),
                    fullName: client.fullName,
                    displayPersonExternalId: client.displayPersonExternalId,
                    supervision: client.supervision,
                  },
                  meetingId: id,
                });
              }}
            />
          </View>
          <View className="hidden md:block">
            <MeetingsTable
              meetings={filteredMeetings}
              client={route.params.client}
            />
          </View>
        </View>
      ),
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1">
      <View className="hidden md:block z-10">
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
        <View className="px-4">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={Icons.ArrowLeft}
                className="!size-6"
                resizeMode="contain"
              />
            </TouchableOpacity>

            {isCollapsed && recordingState === "idle" && (
              <TouchableOpacity
                className="px-2"
                onPress={handleCreateMeeting}
                disabled={isCreating}
              >
                <Image
                  source={Icons.Plus}
                  className="size-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>

          {!isCollapsed && (
            <View className="pt-8">
              <Text className="mb-1 font-bold text-[28px] text-primary leading-[32px] tracking-[-0.56px]">
                {client.fullName}
              </Text>

              <Text className="text-[14px] text-primary leading-[16px] tracking-[-0.28px]">
                ID: {client.displayPersonExternalId} •{" "}
                {humanReadableTitleCase(client.supervision)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="md:!pt-0 grow"
        contentContainerClassName="px-4 md:pt-10"
        style={{ paddingTop: mobileContentPadding }}
      >
        <View className="hidden xl:left-10 xl:absolute md:flex items-start mx-auto mb-4 w-full max-w-[960px] xl:max-w-none">
          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={navigation.goBack}
          >
            <Image source={Icons.ArrowLeft} className="!size-3" />
            <Text className="font-medium text-[#355362D9] text-sm">Back</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 mx-auto w-full max-w-[960px]">
          <Text className="hidden md:block font-libre-baskerville font-bold text-[28px] text-primary md:text-[32px] leading-[32px] tracking-[-0.56px]">
            {client.fullName}
          </Text>

          <Text className="hidden md:block mt-1 text-[14px] text-primary md:text-base leading-[16px] tracking-[-0.28px]">
            ID: {client.displayPersonExternalId} • {client.supervision}
          </Text>

          <View className="flex-row justify-between items-center py-2">
            <Text className="font-semibold text-primary text-xl">
              Meetings{" "}
              <Text className="text-gray-400">({filteredMeetings.length})</Text>
            </Text>

            {recordingState === "idle" && (
              <TouchableOpacity
                className="flex-row justify-center items-center bg-[#006C67] px-4 py-2 rounded-full w-[100px]"
                onPress={handleCreateMeeting}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-medium text-white">+ Meeting</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="w-full">
          <SearchBar
            placeholder={"Enter keyword or phrase"}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </View>

        <View className="md:flex-row md:items-center gap-2 py-2">
          <Text className="text-[#355362D9] text-sm md:text-base">
            Filter by meeting topics:
          </Text>

          <View className="flex-row flex-wrap gap-2">
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
                className="group flex-row items-center gap-1 hover:bg-[#4D5255] px-4 py-1 rounded-full"
                onPress={() => setActiveFilters([])}
              >
                <Image
                  source={Icons.Reset}
                  className="group-hover:invert !size-3"
                />
                <Text className="text-[#252C32] group-hover:text-white text-sm">
                  Reset
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="text-primary text-sm">
            {filteredMeetings.length} meeting
            {filteredMeetings.length > 1 ? "s" : ""}
          </Text>

          <Dropdown
            label="Sort by"
            options={Object.values(MeetingsSort)}
            onSelect={(value) => setSortBy(value as MeetingsSort)}
          />
        </View>

        <View className="pb-8 grow basis-0">{renderMeetingsContent()}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
