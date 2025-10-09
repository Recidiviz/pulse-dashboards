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
import { useRef, useState } from "react";
import {
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
import meetings from "../data/meetings";
import { RootStackParamList } from "../navigation/DrawerNavigator";

type NewMeetingNavProp = StackNavigationProp<RootStackParamList, "NewMeeting">;
type NewMeetingRouteProp = RouteProp<RootStackParamList, "NewMeeting">;

const ProfileScreen = () => {
  const navigation = useNavigation<NewMeetingNavProp>();
  const route = useRoute<NewMeetingRouteProp>();
  const { client } = route.params;
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const scrollY = useRef(0);

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

  // Filter meetings based on search query and active filters
  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      searchQuery === "" ||
      meeting.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) =>
        meeting.notes?.toLowerCase().includes(filter.toLowerCase()),
      );

    return matchesSearch && matchesFilters;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
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
                onPress={() =>
                  navigation.navigate("NewMeeting", {
                    client: {
                      personId: client.personId,
                      fullName: client.fullName,
                    },
                  })
                }
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
              <Text className="text-primary mb-1 text-[28px] font-bold leading-[32px] tracking-[-0.56px]">
                Mike Woods
              </Text>

              <Text className="text-primary text-[14px] leading-[16px] tracking-[-0.28px]">
                ID: 123456 • Probation
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerClassName={`flex-grow px-4 ${
          isCollapsed ? "pt-[70px]" : "pt-[120px]"
        }`}
      >
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-primary text-xl font-semibold">
            Meetings{" "}
            <Text className="text-gray-400">({filteredMeetings.length})</Text>
          </Text>

          <TouchableOpacity
            className="rounded-full bg-[#006C67] px-4 py-2"
            onPress={() =>
              navigation.navigate("NewMeeting", {
                client: {
                  personId: client.personId,
                  fullName: client.fullName,
                },
              })
            }
          >
            <Text className="font-medium text-white">+ Meeting</Text>
          </TouchableOpacity>
        </View>

        <SearchBar
          placeholder={"Enter keyword or phrase"}
          value={searchQuery}
          onChange={setSearchQuery}
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
                  className={`text-sm ${
                    isActive ? "text-primary font-medium" : "text-gray-700"
                  }`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-primary text-sm">
            {filteredMeetings.length} meeting
            {filteredMeetings.length !== 1 ? "s" : ""}
          </Text>
          <Dropdown
            label="Sort by"
            options={["Date (Latest first)", "Date (Oldest first)", "Duration"]}
            onSelect={(value) => console.log("Sort by:", value)}
          />
        </View>

        {filteredMeetings.length > 0 ? (
          filteredMeetings.map((meeting, index) => (
            <MeetingCard
              key={`${meeting.id}-${index}`}
              meeting={meeting}
              onPress={(id) => console.log("Clicked:", id)}
            />
          ))
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-gray-500">No meeting found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
