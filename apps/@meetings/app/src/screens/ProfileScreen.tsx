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
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import MeetingCard from "../components/MeetingCard";
import SearchBar from "../components/SearchBar";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";

type NewMeetingNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "NewMeeting"
>;
type NewMeetingRouteProp = RouteProp<RootStackParamList, "NewMeeting">;

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const scrollY = useRef(0);

  const {
    data: rawMeetings,
    isLoading,
    error,
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

  // Processed meetings and filter based on search query and active filters
  const processedMeetings =
    rawMeetings?.map((m) => {
      const start = new Date(m.startTime);
      const end = m.endTime ? new Date(m.endTime) : null;

      // Duration in hh:mm:ss
      const duration = end
        ? new Date(end.getTime() - start.getTime())
            .toISOString()
            .substring(11, 19)
        : null;

      // Format date/time
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
        duration,
        content: "",
        status: m.postMeetingProcessingStatus,
      };
    }) || [];

  const filteredMeetings = processedMeetings.filter((meeting) => {
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
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-700">Loading meetings...</Text>
      </View>
    );
  }

  if (error) throw error;

  return (
    <SafeAreaView className="flex-1">
      <View
        className={`absolute inset-x-0 top-0 z-50 rounded-b-[24px] bg-white pb-4 `}
        style={{
          paddingTop: insets.top,
          shadowColor: isCollapsed ? "#000" : "transparent",
        }}
      >
        <View className="px-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={Icons.ArrowLeft}
                className="size-6"
                resizeMode="contain"
              />
            </TouchableOpacity>

            {isCollapsed && (
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
              <Text className="mb-1 text-[28px] font-bold leading-[32px] tracking-[-0.56px] text-primary">
                {client.fullName}
              </Text>

              <Text className="text-[14px] leading-[16px] tracking-[-0.28px] text-primary">
                ID: {client.displayPersonExternalId} • {client.supervision}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerClassName={`px-4 ${
          isCollapsed ? "pt-[70px]" : "pt-[120px]"
        }`}
      >
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-xl font-semibold text-primary">
            Meetings{" "}
            <Text className="text-gray-400">({filteredMeetings.length})</Text>
          </Text>
          <TouchableOpacity
            className="w-[100px] flex-row items-center justify-center rounded-full bg-[#006C67] px-4 py-2"
            onPress={handleCreateMeeting}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-medium text-white">+ Meeting</Text>
            )}
          </TouchableOpacity>
        </View>

        <SearchBar
          placeholder={"Enter keyword or phrase"}
          value={searchQuery}
          onChange={setSearchQuery}
          onExit={() => {
            setSearchQuery("");
          }}
        />

        <View className="flex-row flex-wrap gap-2 py-2">
          {filterOptions.map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <TouchableOpacity
                key={filter}
                className={`rounded-[5px] border px-4 py-1 ${
                  isActive
                    ? "border-primary bg-white"
                    : "border-gray-300 bg-white"
                }`}
                onPress={() => toggleFilter(filter)}
              >
                <Text
                  className={`${
                    isActive ? "font-medium text-primary" : "text-gray-700"
                  } text-sm`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-primary">
            {filteredMeetings.length} meeting
            {filteredMeetings.length > 1 ? "s" : ""}
          </Text>
          <Dropdown
            label="Sort by"
            options={["Date (Latest first)", "Date (Oldest first)", "Duration"]}
            onSelect={(value) => console.log("Sort by:", value)}
          />
        </View>
        {filteredMeetings.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="mb-6 items-center justify-center rounded-3xl border-2 border-gray-200 bg-[#2B696908] p-3">
              <Image source={Icons.Lock} className="size-14" />
            </View>
            <Text className="mb-2 text-center font-[LibreBaskerville] text-3xl font-extrabold leading-[32px] tracking-[-0.5px] text-[#9CA3AF]">
              No meetings found
            </Text>
            <Text className="mb-6 text-center font-[inter] text-sm font-normal leading-5 tracking-[-0.28px] text-[#9CA3AF]">
              Try adjusting your search or use different keywords.
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              className="rounded-full border border-gray-300 px-6 py-3"
            >
              <Text className="font-[inter] text-[16px] font-medium text-gray-700">
                Clear search
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredMeetings.map((meeting, index) => (
            <MeetingCard
              key={`${meeting.id}-${index}`}
              meeting={meeting}
              onPress={(id) => console.log("Clicked:", id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
