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

import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Link } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Alert,
  ImageBackground,
  Share,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ChevronLeftIcon from "react-native-heroicons/outline/ChevronLeftIcon";
import ClockIcon from "react-native-heroicons/outline/ClockIcon";
import ShareIcon from "react-native-heroicons/outline/ShareIcon";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MeetingDetails, Person, PersonType } from "../common/types";
import DraftCaseNoteSheet from "../components/DraftCaseNoteSheet";
import DraftCaseNoteTab from "../components/DraftCaseNoteTab";
import { BulletListTab } from "../components/MeetingDetailTabs";
import MeetingTabs, { Tab } from "../components/MeetingTabs";
import MeetingTranscriptionTab from "../components/MeetingTranscriptionTab";
import { MeetingTypeTag } from "../entities/meeting-type";
import BgAvatarImage from "../shared/assets/images/bg-avatar.png";
import { getInitials, humanReadableTitleCase } from "../shared/lib/format";
import { Typography } from "../shared/ui/Typography";
import { formatMeetingDuration, formatMeetingStartDate } from "../utils/format";
import { ActionItemsTab } from "./ActionItemsTab";
import MeetingNotesSheet from "./MeetingNotesSheet";

const HEADER_HEIGHT = 64;

type Props = {
  meetingId: string;
  meetingDetails: MeetingDetails;
  person: Person;
  personType: PersonType;
  showTranscription?: boolean;
};

const MeetingMobile = ({
  meetingId,
  meetingDetails,
  person,
  personType,
  showTranscription = false,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DraftCaseNotes);
  const scrollY = useSharedValue(0);
  const draftCaseNoteSheetRef = useRef<BottomSheetModal>(null);
  const meetingNotesSheetRef = useRef<BottomSheet>(null);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, 15, 35, 55],
      [insets.top + 168, insets.top + 148, insets.top + 120, insets.top + 108],
      "clamp",
    ),
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 25], [1, 0], "clamp"),
    transform: [
      { scale: interpolate(scrollY.value, [0, 25], [1, 0.5], "clamp") },
    ],
  }));

  const innerTextWidth = useSharedValue(0);
  const line1Width = useSharedValue(0);
  const line2Width = useSharedValue(0);

  const movingTextStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 45],
      [insets.top + HEADER_HEIGHT, insets.top + 12],
      "clamp",
    );

    const textBlockWidth =
      innerTextWidth.value > 0 ? innerTextWidth.value : 200;
    const startTranslateX = 58 + textBlockWidth / 2 - width / 2;

    const translateX = interpolate(
      scrollY.value,
      [0, 45],
      [startTranslateX, 0],
      "clamp",
    );

    const scale = interpolate(scrollY.value, [0, 45], [1, 0.9], "clamp");

    return {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      transform: [{ translateY }, { translateX }, { scale }],
      zIndex: 20,
    };
  });

  const line1CenterStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollY.value,
          [0, 45],
          [0, (innerTextWidth.value - line1Width.value) / 2],
          "clamp",
        ),
      },
    ],
  }));

  const line2CenterStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollY.value,
          [0, 45],
          [0, (innerTextWidth.value - line2Width.value) / 2],
          "clamp",
        ),
      },
    ],
  }));

  const textPlaceholderStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [15, 35], [44, 0], "clamp"),
    marginBottom: interpolate(scrollY.value, [15, 35], [16, 0], "clamp"),
  }));

  const bottomDateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 15], [1, 0], "clamp"),
    height: interpolate(scrollY.value, [0, 15], [45, 0], "clamp"),
    marginBottom: interpolate(scrollY.value, [0, 15], [16, 0], "clamp"),
  }));

  const bottomViewStyles = useAnimatedStyle(() => ({
    marginTop: interpolate(
      scrollY.value,
      [0, 55],
      [-insets.top + 20, -insets.top],
      "clamp",
    ),
    flex: 1,
  }));

  const bottomTabsStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [50, 55], [44, 0], "clamp"),
    opacity: interpolate(scrollY.value, [50, 55], [1, 0], "clamp"),
  }));

  const topTabsStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [50, 55], [0, 44], "clamp"),
    opacity: interpolate(scrollY.value, [50, 55], [0, 1], "clamp"),
  }));

  const onShare = async () => {
    if (!meetingDetails.caseNote) return;

    try {
      const result = await Share.share({
        message: meetingDetails.caseNote,
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

  const meetingDate = meetingDetails.startTime
    ? formatMeetingStartDate(meetingDetails.startTime)
    : "";
  const { time, duration } = formatMeetingDuration({
    startDate: meetingDetails.startTime || null,
    endDate: meetingDetails.endTime || null,
    durationMs: meetingDetails.durationMs,
  });

  return (
    <View className="flex-1 grow">
      <Animated.View
        className="fixed flex flex-col rounded-b-[24px] bg-white p-4"
        style={[{ top: -insets.top, paddingTop: insets.top }, headerStyle]}
      >
        <View
          className="flex flex-row items-center justify-between"
          style={{ height: HEADER_HEIGHT }}
        >
          <Link
            screen={
              personType === "client" ? "ClientProfile" : "ResidentProfile"
            }
            params={{ personId: person.personId.toString() }}
          >
            <ChevronLeftIcon className="text-muted" />
          </Link>

          <View className="flex-1" />

          <TouchableOpacity onPress={onShare}>
            <ShareIcon className="text-muted" />
          </TouchableOpacity>
        </View>

        <Animated.View style={movingTextStyle}>
          <View
            className="flex flex-col items-start"
            onLayout={(e) => {
              innerTextWidth.value = e.nativeEvent.layout.width;
            }}
          >
            <Animated.View
              style={line1CenterStyle}
              onLayout={(e) => {
                line1Width.value = e.nativeEvent.layout.width;
              }}
            >
              <Typography className="text-lg font-semibold leading-[22px] text-primary">
                {person.fullName}
              </Typography>
            </Animated.View>
            <Animated.View
              style={line2CenterStyle}
              onLayout={(e) => {
                line2Width.value = e.nativeEvent.layout.width;
              }}
            >
              <Typography className="text-sm font-normal leading-[16px] text-gray-500">
                ID: {person.displayPersonExternalId} •{" "}
                {humanReadableTitleCase(person.primaryMetadata)}
              </Typography>
            </Animated.View>
          </View>
        </Animated.View>

        <View className="flex flex-col">
          <Animated.View style={[topTabsStyle]}>
            <MeetingTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isTranscriptionUnavailable={!meetingDetails?.transcription}
              showTranscription={showTranscription}
            />
          </Animated.View>

          <Animated.View style={textPlaceholderStyle}>
            <Animated.View
              className="flex flex-row items-center gap-3"
              style={[avatarStyle]}
            >
              <ImageBackground
                source={BgAvatarImage}
                className="size-10 items-center justify-center overflow-hidden rounded-full"
                imageClassName="!size-full"
              >
                <Typography className="text-base text-on-brand">
                  {getInitials(person.fullName)}
                </Typography>
              </ImageBackground>
            </Animated.View>
          </Animated.View>

          <Animated.View
            className="flex flex-col gap-2"
            style={[bottomDateStyle]}
          >
            <Typography className="text-xl font-semibold leading-[24px] text-primary">
              Meeting: {meetingDate}
            </Typography>
            <View className="flex flex-row items-center gap-1">
              <MeetingTypeTag type={meetingDetails.meetingType} />
              <ClockIcon className="text-muted size-4" />
              <Typography className="text-sm font-normal leading-[14px] text-gray-500">
                {time}
                {duration ? ` • ${duration}` : ""} • {meetingDetails.staffEmail}
              </Typography>
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
            showTranscription={showTranscription}
          />
        </Animated.View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          className="flex flex-1 flex-col gap-3 px-4"
          contentContainerClassName="grow"
          scrollEventThrottle={16}
        >
          <View className="mx-auto mt-4 w-full max-w-[960px] flex-1">
            {activeTab === Tab.DraftCaseNotes && (
              <DraftCaseNoteTab
                meetingId={meetingId}
                caseNote={meetingDetails.caseNote || ""}
              />
            )}
            {activeTab === Tab.ActionItems && (
              <ActionItemsTab items={meetingDetails.structuredActionItems} />
            )}
            {activeTab === Tab.CriticalUpdates && (
              <BulletListTab items={meetingDetails.criticalUpdates} />
            )}
            {activeTab === Tab.Transcript &&
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
                  transcriptDeleted={!!meetingDetails.transcriptDeletedAt}
                />
              )}
          </View>
        </Animated.ScrollView>
      </Animated.View>
      <DraftCaseNoteSheet
        meetingId={meetingId}
        notes={meetingDetails?.caseNote || ""}
        clientName={person.fullName}
        meetingDate={meetingDetails?.startTime}
        ref={draftCaseNoteSheetRef}
      />
      <MeetingNotesSheet
        meetingDetails={meetingDetails}
        clientName={person.fullName}
        bottomSheetRef={meetingNotesSheetRef}
      />
    </View>
  );
};

export default MeetingMobile;
