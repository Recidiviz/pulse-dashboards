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
import { getClientInitials } from "../utils/format";

type ProfileNavProp = StackNavigationProp<RootStackParamList, "Clients">;

interface ClientsProps {
  clients: Client[];
}

const ClientsCardsTable = ({ clients }: ClientsProps) => {
  const navigation = useNavigation<ProfileNavProp>();

  return (
    <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-[20px] border border-[#35536226]">
      <thead className="bg-[#3553620A]">
        <tr className="border-b-2 border-white">
          <th className="border-b-2 border-white">
            <Text className="inline-block w-full py-3 pl-7 text-left font-[inter] text-sm font-medium text-[#355362D9]">
              NAME
            </Text>
          </th>
          <th className="border-b-2 border-white">
            <Text className="inline-block w-full py-3 text-left font-[inter] text-sm font-medium text-[#355362D9]">
              ID
            </Text>
          </th>
          <th className="border-b-2 border-white">
            <Text className="inline-block w-full py-3 text-left font-[inter] text-sm font-medium text-[#355362D9]">
              STATUS
            </Text>
          </th>
          <th className="border-b-2 border-white">
            <Text className="inline-block w-full py-3 pr-7 text-left font-[inter] text-sm font-medium text-[#355362D9]">
              LAST MEETING
            </Text>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {clients.map((client) => (
          <tr
            key={client.personId}
            className="group [&:first-child>td>div]:border-none [&:first-child>td]:border-none [&:hover+tr>td>div]:border-transparent [&:hover+tr>td]:border-transparent"
          >
            <td className="h-[72px] p-0">
              <View className="ml-3 h-full border-t border-[#35536226] p-0 group-hover:border-transparent">
                <View className="flex h-full flex-row items-center gap-3 rounded-l-[20px] pl-4 group-hover:bg-[#3553620A]">
                  <ImageBackground
                    source={Icons.BgAvatar}
                    className="size-11 items-center justify-center overflow-hidden rounded-full"
                    imageClassName="!size-11"
                  >
                    <Text className="font-['Public_Sans'] text-base font-semibold text-white">
                      {getClientInitials(client.fullName)}
                    </Text>
                  </ImageBackground>
                  <Text className="font-[inter] text-base font-medium text-primary">
                    {client.fullName}
                  </Text>
                </View>
              </View>
            </td>
            <td className="h-[72px] border-t border-[#35536226] p-0 group-hover:border-transparent group-hover:bg-[#3553620A]">
              <Text className="font-[inter] text-base text-[#355362D9]">
                {client.displayPersonExternalId}
              </Text>
            </td>
            <td className="h-[72px] border-t border-[#35536226] p-0 group-hover:border-transparent group-hover:bg-[#3553620A]">
              <Text className="font-[inter] text-base text-[#355362D9]">
                {client.supervision}
              </Text>
            </td>
            <td className="h-[72px] p-0">
              <View className="mr-3 h-full border-t border-[#35536226] p-0 group-hover:border-transparent">
                <View className="flex h-full flex-row items-center justify-between gap-3 rounded-r-[20px] py-5 pr-4 group-hover:bg-[#3553620A]">
                  <Text className="font-[inter] text-base text-[#355362D9]">
                    Last meeting{" "}
                    <Text className="font-bold">{client.lastMeeting}</Text>
                  </Text>
                  <View className="size-5">
                    <TouchableOpacity
                      className="hidden size-full items-center justify-center group-hover:flex"
                      onPress={() =>
                        navigation.navigate("Profile", {
                          client: {
                            personId: client.personId.toString(),
                            fullName: client.fullName,
                            displayPersonExternalId:
                              client.displayPersonExternalId,
                            supervision: client.supervision,
                          },
                        })
                      }
                    >
                      <Image source={Icons.ArrowRight} className="!size-full" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </td>
          </tr>
        ))}
      </tbody>
      {/*
      // TODO: Add footer and pagination
      <tfoot>
        <tr>
          <td colSpan={4} className="border-t border-[#35536226] bg-white">
            <View className="flex flex-row items-center justify-center gap-2 py-2">
              <TouchableOpacity>
                <Image
                  source={Icons.ArrowLeft}
                  className="!size-3"
                  style={{ resizeMode: "contain" }}
                />
              </TouchableOpacity>
              <Text className="font-[inter] text-sm font-medium text-[#355362D9]">
                Showing 1-7 of 112
              </Text>
              <TouchableOpacity>
                <Image
                  source={Icons.ArrowRight}
                  className="!size-3"
                  style={{ resizeMode: "contain" }}
                />
              </TouchableOpacity>
            </View>
          </td>
        </tr>
      </tfoot> */}
    </table>
  );
};

export default ClientsCardsTable;
