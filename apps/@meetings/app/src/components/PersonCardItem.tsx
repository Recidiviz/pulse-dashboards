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

import { Link } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import upperFirst from "lodash/upperFirst";
import React from "react";
import { ImageBackground, View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import BgAvatarImage from "../assets/images/bg-avatar.png";
import { Person, PersonType } from "../common/types";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { Typography } from "../shared/ui/Typography";
import { getInitials, humanReadableTitleCase } from "../utils/format";
import MeetingInProgressBar from "./MeetingInProgressBar";

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Clients" | "Residents"
>;

interface ItemProps {
  person: Person;
  recordingState: string;
  navigation: ProfileNavProp;
  personType: PersonType;
}

const PersonCardItem = ({
  person,
  recordingState,
  navigation,
  personType,
}: ItemProps) => {
  const hasActiveMeeting = !!person.activeMeetingId;
  const height = hasActiveMeeting ? 136 : 56;

  return (
    <View
      key={person.personId}
      style={{ height }}
      className="flex w-full justify-center border-b border-gray-300 px-2.5"
    >
      <Link
        screen={personType === "client" ? "ClientProfile" : "ResidentProfile"}
        params={{ personId: person.personId.toString() }}
      >
        <View className="w-full flex-1 flex-row items-center">
          <ImageBackground
            source={BgAvatarImage}
            className="mr-3 !size-11 items-center justify-center overflow-hidden rounded-full"
            imageClassName="!size-11"
          >
            <Typography className="text-sm font-semibold text-white">
              {getInitials(person.fullName)}
            </Typography>
          </ImageBackground>
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Typography className="mr-1.5 text-base font-semibold text-gray-900">
                {person.fullName}
              </Typography>
              <ChevronRightIcon className="size-3.5 stroke-muted stroke-[3px]" />
            </View>
            <View className="mt-0.5 flex-row items-center justify-between gap-1.5">
              <Typography className="text-xs text-gray-600">
                ID: {person.displayPersonExternalId} •{" "}
                {humanReadableTitleCase(person.primaryMetadata)}
              </Typography>
              <Typography className="text-xs text-gray-600">
                {upperFirst(person.lastMeeting)}
              </Typography>
            </View>
          </View>
        </View>
      </Link>
      {!!person.activeMeetingId && (
        <MeetingInProgressBar
          recordingState={recordingState || "recording"}
          startTime={new Date()} // TODO: Replace with API value
          endTime={null}
          person={{ ...person, personId: person.personId }}
          meetingId={person.activeMeetingId}
          className="mt-2 bg-white"
        />
      )}
    </View>
  );
};

export default PersonCardItem;
