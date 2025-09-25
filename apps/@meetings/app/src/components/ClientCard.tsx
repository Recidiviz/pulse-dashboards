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

import React from "react";
import { Image, Text, View } from "react-native";

import Icons from "../../assets/icons";

const ClientCard = ({
  client,
}: {
  client: {
    id: string;
    name: string;
    supervision: string;
    lastMeeting: string;
  };
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts.pop() || "")[0]).toUpperCase();
  };

  return (
    <View className="flex-row items-center border-b border-gray-300 px-2.5 py-3.5">
      <View className="flex-1 flex-row items-center">
        <View className="mr-3 size-11 items-center justify-center rounded-3xl border border-gray-400 bg-gray-200">
          <Text className="font-[inter] text-sm font-semibold text-gray-600">
            {getInitials(client.name)}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="mr-1.5 font-[inter] text-base font-semibold text-gray-900">
              {client.name}
            </Text>
            <Image
              source={Icons.ArrowRight}
              className="size-3.5"
              style={{ resizeMode: "contain" }}
            />
          </View>

          <View className="mt-0.5 flex-row items-center justify-between gap-1.5">
            <Text className="text-xs text-gray-600">
              ID: {client.id} • {client.supervision}
            </Text>
            <Text className="text-xs text-gray-600">
              Last meeting {client.lastMeeting}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ClientCard;
