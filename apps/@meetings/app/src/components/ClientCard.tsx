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
import { StackNavigationProp } from "@react-navigation/stack";
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

type ProfileNavProp = StackNavigationProp<RootStackParamList, "Clients">;

interface ClientProps {
  client: Client;
}

const ClientCard = ({ client }: ClientProps) => {
  const navigation = useNavigation<ProfileNavProp>();

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts.pop() || "")[0]).toUpperCase();
  };

  return (
    <View className="flex-row items-center border-b border-gray-300 px-2.5 py-3.5">
      <TouchableOpacity
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
        className="flex-1 flex-row items-center"
      >
        <ImageBackground
          source={Icons.BgAvatar}
          className="mr-3 size-11 items-center justify-center"
          style={{ borderRadius: 22, overflow: "hidden" }}
        >
          <Text className="font-[inter] text-sm font-semibold text-white">
            {getInitials(client.fullName)}
          </Text>
        </ImageBackground>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="mr-1.5 font-[inter] text-base font-semibold text-gray-900">
              {client.fullName}
            </Text>
            <Image
              source={Icons.ArrowRight}
              className="size-3.5"
              style={{ resizeMode: "contain" }}
            />
          </View>

          <View className="mt-0.5 flex-row items-center justify-between gap-1.5">
            <Text className="text-xs text-gray-600">
              ID: {client.displayPersonExternalId} • {client.supervision}
            </Text>
            <Text className="text-xs text-gray-600">
              Last meeting {client.lastMeeting}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ClientCard;
