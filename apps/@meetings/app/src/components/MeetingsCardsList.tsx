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

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import MeetingInProgressBar from "./MeetingInProgressBar";

type MeetingNavProp = NativeStackNavigationProp<RootStackParamList, "Meeting">;

type MeetingCardProps = {
  meetings: {
    id: string;
    date: string;
    time: string;
    duration: string | null;
    content: string;
    status: string;
    recordingState: string;
    start: Date;
    end: Date | null;
  }[];
  client: {
    personId: string;
    fullName: string;
    displayPersonExternalId: string;
    supervision: string;
  };
  onPress: (id: string) => void;
};

const MeetingsCardsList = ({ meetings, client, onPress }: MeetingCardProps) => {
  const navigation = useNavigation<MeetingNavProp>();
  // const [isExpanded, setIsExpanded] = useState(false);

  return meetings.map((meeting, index) => {
    const isProcessingMeeting = meeting.status !== "NOT_STARTED";

    const goToNewMeeting = () => {
      if (onPress) {
        onPress(meeting.id);
      }
    };
    return (
      <TouchableOpacity
        key={`${meeting.id}-${index}`}
        activeOpacity={0.9}
        onPress={() => {
          if (meeting.status === "NOT_STARTED" && onPress) {
            onPress(meeting.id);
          } else {
            navigation.navigate("Meeting", { meeting, client });
          }
        }}
        className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-inter text-base font-semibold text-primary">
            {meeting.date}
          </Text>
          <Image
            source={Icons.ArrowRight}
            className="ml-2 !size-3.5"
            style={{ resizeMode: "contain" }}
          />
        </View>

        <Text className="mr-1 font-inter text-xs font-medium text-primary">
          {meeting.time} • {meeting.duration || "In progress..."}
        </Text>
        {isProcessingMeeting ? (
          <View className="mt-4 rounded-xl bg-[#C1E3D83B] p-4">
            <View className="flex-row items-start">
              <Image
                source={Icons.Processing}
                className="mr-2 !size-8"
                style={{ resizeMode: "contain" }}
              />

              <View className="flex-1">
                <Text className="font-inter text-base font-semibold text-primary">
                  Recording is being processed...
                </Text>
                <Text className="font-inter text-sm font-medium text-gray-700">
                  The notes and transcript will become available in a few
                  minutes
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <MeetingInProgressBar
            recordingState={meeting.recordingState}
            startTime={meeting.start}
            endTime={meeting.end}
            onPauseResume={goToNewMeeting}
            onStop={goToNewMeeting}
            className="mt-2"
          />
        )}
        {/* <View className="my-2 border-gray-200 border-b" />
       <View className="mt-3">
        <Text
          className="text-gray-700 text-sm font-inter leading-5"
          numberOfLines={isExpanded ? undefined : 2}
        >
          {meeting.content}
        </Text>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex-row items-center mt-1"
        >
          <Text className="mr-1 font-medium font-inter text-primary text-xs">
            {isExpanded ? "Less" : "More"}
          </Text>
          <Image
            source={isExpanded ? Icons.ArrowUp : Icons.ArrowDown}
            className="!size-3.5"
            style={{ resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View> */}
      </TouchableOpacity>
    );
  });
};

export default MeetingsCardsList;
