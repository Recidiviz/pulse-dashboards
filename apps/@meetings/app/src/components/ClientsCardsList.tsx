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
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Client } from "~@meetings/app/common/types";

import Icons from "../../assets/icons";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { getClientInitials, humanReadableTitleCase } from "../utils/format";
import MeetingInProgressBar from "./MeetingInProgressBar";

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, "Clients">;

interface ClientsProps {
  clients: Client[];
  recordingState: string;
}

const ClientsCardsList = ({ clients, recordingState }: ClientsProps) => {
  const navigation = useNavigation<ProfileNavProp>();

  return (
    <View className="flex flex-col">
      {clients.map((client) => {
        const hasActiveMeeting = !!client.activeMeetingId;

        const handleGoToMeetingScreen = () => {
          navigation.navigate("NewMeeting", {
            client: {
              personId: client.personId.toString(),
              fullName: client.fullName,
              displayPersonExternalId: client.displayPersonExternalId,
              supervision: client.supervision,
            },
            meetingId: client.activeMeetingId,
          });
        };

        return (
          <TouchableOpacity
            key={client.personId}
            className="px-2.5 py-3.5 border-gray-300 border-b"
            onPress={() =>
              navigation.navigate("Profile", {
                client: {
                  personId: client.personId.toString(),
                  fullName: client.fullName,
                  displayPersonExternalId: client.displayPersonExternalId,
                  supervision: client.supervision,
                },
              })
            }
          >
            <View className="flex-row flex-1 items-center">
              <ImageBackground
                source={Icons.BgAvatar}
                className="justify-center items-center mr-3 rounded-full size-11 overflow-hidden"
                imageClassName="!size-11"
              >
                <Text className="font-[inter] font-semibold text-white text-sm">
                  {getClientInitials(client.fullName)}
                </Text>
              </ImageBackground>

              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text className="mr-1.5 font-[inter] font-semibold text-gray-900 text-base">
                    {client.fullName}
                  </Text>
                  <Image source={Icons.ArrowRight} className="!size-3.5" />
                </View>

                <View className="flex-row justify-between items-center gap-1.5 mt-0.5">
                  <Text className="text-gray-600 text-xs">
                    ID: {client.displayPersonExternalId} •{" "}
                    {humanReadableTitleCase(client.supervision)}
                  </Text>
                  <Text className="text-gray-600 text-xs">
                    Last meeting {client.lastMeeting}
                  </Text>
                </View>
              </View>
            </View>

            {hasActiveMeeting && (
              <MeetingInProgressBar
                recordingState={recordingState || "recording"}
                startTime={new Date()} // TODO: Replace with API value
                endTime={null}
                onPauseResume={handleGoToMeetingScreen}
                onStop={handleGoToMeetingScreen}
                className="bg-white mt-2"
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ClientsCardsList;
