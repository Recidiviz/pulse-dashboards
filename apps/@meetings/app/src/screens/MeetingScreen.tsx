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
import { useState } from "react";
import {
  Alert,
  Image,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import MeetingNotesTab from "../components/MeetingNotesTab";
import MeetingTabs, { Tab } from "../components/MeetingTabs";
import MeetingTranscriptionTab from "../components/MeetingTranscriptionTab";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";
import { humanReadableTitleCase } from "../utils/format";

type MeetingRouteProp = RouteProp<RootStackParamList, "Meeting">;

const formatMeetingStartDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatMeetingDuration = ({
  startDate,
  endDate,
}: {
  startDate: Date | null;
  endDate: Date | null;
}) => {
  if (!startDate) {
    return { time: null, duration: null };
  }

  const startTimeFormatted = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTimeFormatted = endDate
    ? endDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const timeFormatted = endTimeFormatted
    ? `${startTimeFormatted} - ${endTimeFormatted}`
    : startTimeFormatted;

  if (!endDate) {
    return { time: timeFormatted, duration: null };
  }

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const differenceInMilliseconds = endTime - startTime;
  const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
  const duration =
    differenceInSeconds < 60
      ? `${differenceInSeconds} sec`
      : `${Math.floor(differenceInSeconds / 60)} min`;

  return { time: timeFormatted, duration };
};

const MeetingScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<MeetingRouteProp>();
  const client = {
    ...route.params.client,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.client.personId),
  };
  const { meeting } = route.params;
  const { data: meetingDetails } = trpc.v1.meeting.getDetails.useQuery({
    meetingId: meeting.id,
    clientId: client.personId,
  });
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Notes);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // values are taken from figma for each state of header
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, 50, 100, 101],
      [insets.top + 182, insets.top + 116, insets.top + 64, insets.top + 140],
      "clamp",
    ),
  }));

  const bottomDateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 10], [1, 0], "clamp"),
  }));

  const topDateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 10], [0, 1], "clamp"),
  }));

  const userNameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [50, 60], [1, 0], "clamp"),
  }));

  // values are taken from figma for each state of header
  // note: paddingTop does not contain the safe area inset
  // that is why initial value of header height and padding top are different
  // also padding includes space between header and tabs - 8px
  const bottomViewStyles = useAnimatedStyle(() => ({
    paddingTop: interpolate(
      scrollY.value,
      [0, 50, 100, 101],
      [202, 136, 84, 152],
      "clamp",
    ),
  }));

  const bottomTabsStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [100, 101], [44, 0], "clamp"),
    opacity: interpolate(scrollY.value, [100, 101], [1, 0], "clamp"),
  }));

  const topTabsStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [100, 101], [0, 44], "clamp"),
    opacity: interpolate(scrollY.value, [100, 101], [0, 1], "clamp"),
    marginTop: interpolate(scrollY.value, [100, 101], [0, 16], "clamp"),
  }));

  const onShare = async () => {
    if (!meetingDetails?.notes) return;

    try {
      const result = await Share.share({
        message: meetingDetails.notes,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Shared via ${result.activityType}`);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      let errorMessage = "An unknown error occurred during sharing.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      Alert.alert("Sharing error:", errorMessage);
    }
  };

  const meetingDate = meetingDetails?.startTime
    ? formatMeetingStartDate(meetingDetails.startTime)
    : "";
  const { time, duration } = formatMeetingDuration({
    startDate: meetingDetails?.startTime || null,
    endDate: meetingDetails?.endTime || null,
  });

  return (
    <SafeAreaView className="flex-1">
      <Animated.View
        className="absolute inset-x-0 top-0 z-50 flex flex-col rounded-b-[24px] bg-white px-4"
        style={[{ paddingTop: insets.top }, headerStyle]}
      >
        <View className="flex flex-row items-center justify-between h-16">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={Icons.ArrowLeft}
              className="size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Animated.View
            className="flex flex-col items-center gap-0.5"
            style={[topDateStyle]}
          >
            <Text className="text-primary text-lg font-semibold leading-[22px] font-inter">
              {meetingDate}
            </Text>
            <Text className="text-sm font-normal leading-[16px] text-gray-500 font-inter">
              {client.fullName}
            </Text>
          </Animated.View>

          <TouchableOpacity onPress={onShare}>
            <Image
              source={Icons.Share}
              className="size-4"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View className="flex flex-col gap-4">
          <Animated.View style={[topTabsStyle]}>
            <MeetingTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isTranscriptionUnavailable={!meetingDetails?.transcription}
            />
          </Animated.View>

          <Animated.View
            className="flex flex-row items-baseline gap-x-2 gap-y-1 flex-wrap"
            style={[userNameStyle]}
          >
            <Text className="text-primary text-base font-semibold leading-[20px] font-inter">
              {client.fullName}
            </Text>
            <Text className="text-sm font-normal leading-[16px] text-gray-500 font-inter">
              ID: {client.displayPersonExternalId} •{" "}
              {humanReadableTitleCase(client.supervision)}
            </Text>
          </Animated.View>
          <Animated.View
            className="flex flex-col gap-2"
            style={[bottomDateStyle]}
          >
            <Text className="text-primary text-xl font-semibold leading-[24px] font-inter">
              Meeting: {meetingDate}
            </Text>
            <View className="flex flex-row items-center gap-1">
              <Image
                source={Icons.Clock}
                className="size-3"
                resizeMode="contain"
              />
              <Text className="text-sm font-normal leading-[14px] text-gray-500 font-inter">
                {time}
                {duration ? ` • ${duration}` : ""}
              </Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View className="flex flex-col gap-4" style={[bottomViewStyles]}>
        <Animated.View className="px-4" style={[bottomTabsStyle]}>
          <MeetingTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isTranscriptionUnavailable={!meetingDetails?.transcription}
          />
        </Animated.View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          className="flex flex-col gap-3 px-4"
          scrollEventThrottle={16}
        >
          {activeTab === Tab.Notes && (
            <MeetingNotesTab notes={meetingDetails?.notes} />
          )}
          {activeTab === Tab.Transcription && (
            <MeetingTranscriptionTab
              transcription={meetingDetails?.transcription}
            />
          )}
        </Animated.ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default MeetingScreen;
