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

import BottomSheet, {
  TouchableOpacity as BottomSheetTouchableOpacity,
} from "@gorhom/bottom-sheet";
import Clipboard from "@react-native-clipboard/clipboard";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import { MeetingDetails } from "../common/types";
import DraftCaseNoteSheet from "../components/DraftCaseNoteSheet";
import MeetingNotesTab from "../components/MeetingNotesTab";
import MeetingTabs, { Tab } from "../components/MeetingTabs";
import MeetingTranscriptionTab from "../components/MeetingTranscriptionTab";
import { useSnackbar } from "../components/Snackbar";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import {
  formatMeetingDuration,
  formatMeetingStartDate,
  humanReadableTitleCase,
} from "../utils/format";

type MeetingRouteProp = RouteProp<RootStackParamList, "Meeting">;

type Props = {
  meetingDetails?: MeetingDetails;
};

const MeetingMobile = ({ meetingDetails }: Props) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<MeetingRouteProp>();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Notes);
  const scrollY = useSharedValue(0);
  const draftCaseNoteSheetRef = useRef<BottomSheet>(null);
  const { showSnackbar, isShowing: isSnackbarShowing } = useSnackbar();

  const person = {
    ...route.params.person,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.person.personId),
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleDraftCaseNoteOpen = useCallback(() => {
    draftCaseNoteSheetRef.current?.snapToIndex(1);
  }, []);

  const handleCopyNotes = () => {
    Clipboard.setString(meetingDetails?.notes || "");
    showSnackbar("Case note copied to clipboard");
  };

  // values are taken from figma for each state of header
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, 50, 100, 101],
      [insets.top + 268, insets.top + 200, insets.top + 164, insets.top + 108],
      "clamp",
    ),
  }));

  const topDateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 10], [0, 1], "clamp"),
  }));

  const bottomDateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 10], [1, 0], "clamp"),
    height: interpolate(scrollY.value, [0, 10], [45, 0], "clamp"),
    marginBottom: interpolate(scrollY.value, [0, 10], [16, 0], "clamp"),
  }));

  const personNameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [50, 60], [1, 0], "clamp"),
    height: interpolate(scrollY.value, [50, 60], [20, 0], "clamp"),
    marginBottom: interpolate(scrollY.value, [50, 60], [16, 0], "clamp"),
  }));

  const draftCaseNoteBlockStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [100, 101], [1, 0], "clamp"),
  }));

  // values are taken from figma for each state of header
  // note: paddingTop does not contain the safe area inset
  // that is why initial value of header height and padding top are different
  // also padding includes space between header and tabs - 8px
  const bottomViewStyles = useAnimatedStyle(() => ({
    marginTop: interpolate(
      scrollY.value,
      [0, 101],
      [-insets.top + 20, -insets.top],
      "clamp",
    ),
    flex: 1,
  }));

  const bottomTabsStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [100, 101], [44, 0], "clamp"),
    opacity: interpolate(scrollY.value, [100, 101], [1, 0], "clamp"),
  }));

  const topTabsStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [100, 101], [0, 44], "clamp"),
    opacity: interpolate(scrollY.value, [100, 101], [0, 1], "clamp"),
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
    <View className="flex-1 grow">
      <Animated.View
        className="fixed flex flex-col rounded-b-[24px] bg-white p-4"
        style={[{ top: -insets.top, paddingTop: insets.top }, headerStyle]}
      >
        <View className="flex h-16 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={Icons.ArrowLeft}
              className="!size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Animated.View
            className="flex flex-col items-center gap-0.5"
            style={[topDateStyle]}
          >
            <Text className="font-inter text-lg font-semibold leading-[22px] text-primary">
              {meetingDate}
            </Text>
            <Text className="font-inter text-sm font-normal leading-[16px] text-gray-500">
              {person.fullName}
            </Text>
          </Animated.View>

          <TouchableOpacity onPress={onShare}>
            <Image
              source={Icons.Share}
              className="!size-4"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View className="flex flex-col">
          <Animated.View style={[topTabsStyle]}>
            <MeetingTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isTranscriptionUnavailable={!meetingDetails?.transcription}
            />
          </Animated.View>

          <Animated.View
            className="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-1"
            style={[personNameStyle]}
          >
            <Text className="font-inter text-base font-semibold leading-[20px] text-primary">
              {person.fullName}
            </Text>
            <Text className="font-inter text-sm font-normal leading-[16px] text-gray-500">
              ID: {person.displayPersonExternalId} •{" "}
              {humanReadableTitleCase(person.primaryMetadata)}
            </Text>
          </Animated.View>
          <Animated.View
            className="flex flex-col gap-2"
            style={[bottomDateStyle]}
          >
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
          </Animated.View>

          <Animated.View
            className="w-full flex-1"
            style={[draftCaseNoteBlockStyle]}
          >
            <View className="flex min-h-full w-full flex-col gap-1.5 rounded-xl bg-[#F4F5F5] px-[14px] py-3">
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center gap-1">
                  <Text className="font-inter text-xs font-semibold text-[#355362D9]">
                    Draft case note
                  </Text>
                  <Image
                    source={Icons.ArrowRightGray}
                    className="!size-2"
                    resizeMode="contain"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleCopyNotes}
                  disabled={isSnackbarShowing}
                >
                  <Image
                    source={Icons.Copy}
                    className="!size-4"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <BottomSheetTouchableOpacity
                onPress={handleDraftCaseNoteOpen}
                className="size-full flex-1"
              >
                <Text
                  numberOfLines={4}
                  ellipsizeMode="tail"
                  className="font-inter text-sm font-normal text-primary"
                >
                  {meetingDetails?.notes
                    ? meetingDetails.notes
                    : "Type your notes here..."}
                </Text>
              </BottomSheetTouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View
        className="flex flex-1 grow flex-col gap-4"
        style={[bottomViewStyles]}
      >
        <Animated.View className="px-4" style={[bottomTabsStyle]}>
          <MeetingTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isTranscriptionUnavailable={!meetingDetails?.transcription}
          />
        </Animated.View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          className="flex flex-1 flex-col gap-3 px-4"
          contentContainerClassName="grow"
          scrollEventThrottle={16}
        >
          <View className="mx-auto w-full max-w-[960px] flex-1">
            {activeTab === Tab.Notes && (
              <MeetingNotesTab notes={meetingDetails?.notes} />
            )}
            {activeTab === Tab.Transcription && (
              <MeetingTranscriptionTab
                transcription={meetingDetails?.transcription}
              />
            )}
          </View>
        </Animated.ScrollView>
      </Animated.View>

      <DraftCaseNoteSheet
        notes={meetingDetails?.notes || ""}
        clientName={person.fullName}
        meetingDate={meetingDetails?.startTime}
        ref={draftCaseNoteSheetRef}
      />
    </View>
  );
};

export default MeetingMobile;
