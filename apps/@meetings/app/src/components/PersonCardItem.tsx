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

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Person } from "~@meetings/app/common/types";

import Icons from "../../assets/icons";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { getClientInitials, humanReadableTitleCase } from "../utils/format";
import MeetingInProgressBar from "./MeetingInProgressBar";

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, "Clients" | "Residents">;

interface ItemProps {
  person: Person;
  recordingState: string;
  navigation: ProfileNavProp;
}

const PersonCardItem = ({ person, recordingState, navigation }: ItemProps) => {
  const hasActiveMeeting = !!person.activeMeetingId;
  const height = hasActiveMeeting ? 136 : 56;
  
  return (
    <TouchableOpacity
      key={person.personId}
      className="border-b border-gray-300 px-2.5 py-3.5"
      style={{ height }}
      onPress={() =>
        navigation.navigate("Profile", {
          person: {
            personId: person.personId.toString(),
            fullName: person.fullName,
            displayPersonExternalId: person.displayPersonExternalId,
            primaryMetadata: person.primaryMetadata,
          },
        })
      }
    >
      <View className="flex-1 flex-row items-center">
        <ImageBackground
          source={Icons.BgAvatar}
          className="mr-3 !size-11 items-center justify-center overflow-hidden rounded-full"
          imageClassName="!size-11"
        >
          <Text className="font-inter text-sm font-semibold text-white">
            {getClientInitials(person.fullName)}
          </Text>
        </ImageBackground>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="mr-1.5 font-inter text-base font-semibold text-gray-900">
              {person.fullName}
            </Text>
            <Image source={Icons.ArrowRight} className="!size-3.5" />
          </View>
          <View className="mt-0.5 flex-row items-center justify-between gap-1.5">
            <Text className="font-inter text-xs text-gray-600">
              ID: {person.displayPersonExternalId} •{" "}
              {humanReadableTitleCase(person.primaryMetadata)}
            </Text>
            <Text className="font-inter text-xs text-gray-600">
              Last meeting {person.lastMeeting}
            </Text>
          </View>
        </View>
      </View>
      {hasActiveMeeting && (
        <MeetingInProgressBar
          recordingState={recordingState || "recording"}
          startTime={new Date()} // TODO: Replace with API value
          endTime={null}
          person={{ ...person, personId: person.personId.toString() }}
          meetingId={person.activeMeetingId}
          className="mt-2 bg-white"
        />
      )}
    </TouchableOpacity>
  );
};

export default PersonCardItem;
