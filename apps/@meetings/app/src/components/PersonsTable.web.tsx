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

import { Person } from "~@meetings/app/common/types";

import Icons from "../../assets/icons";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { getClientInitials } from "../utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableFooterCell,
  TableFooterRow,
  TableHead,
  TableHeadCell,
  TableHeadRow,
  TableRow,
} from "./Table.web";

const PAGE_SIZE = 7;

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Clients" | "Residents"
>;

interface PersonsProps {
  persons: Person[];
  type: "clients" | "residents";
}

const PersonsTable = ({ persons, type }: PersonsProps) => {
  const [page, setPage] = React.useState(1);
  const navigation = useNavigation<ProfileNavProp>();

  return (
    <Table>
      <TableHead>
        <TableHeadRow>
          <TableHeadCell>NAME</TableHeadCell>
          <TableHeadCell>ID</TableHeadCell>
          <TableHeadCell>
            {type === "clients" ? "SUPERVISION" : "FACILITY"}
          </TableHeadCell>
          <TableHeadCell>LAST MEETING</TableHeadCell>
          <TableHeadCell></TableHeadCell>
        </TableHeadRow>
      </TableHead>
      <TableBody>
        {persons
          .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
          .map((person) => (
            <TableRow key={person.personId}>
              <TableCell>
                <View className="flex h-full flex-row items-center gap-3">
                  <ImageBackground
                    source={Icons.BgAvatar}
                    className="size-11 items-center justify-center overflow-hidden rounded-full"
                    imageClassName="!size-11"
                  >
                    <Text className="font-inter text-base font-medium text-white">
                      {getClientInitials(person.fullName)}
                    </Text>
                  </ImageBackground>
                  <Text className="font-inter text-base font-medium text-primary">
                    {person.fullName}
                  </Text>
                </View>
              </TableCell>
              <TableCell>{person.displayPersonExternalId}</TableCell>
              <TableCell>{person.primaryMetadata}</TableCell>
              <TableCell>
                <Text className="font-inter text-base text-[#355362D9]">
                  Last meeting{" "}
                  <Text className="font-inter font-bold">
                    {person.lastMeeting}
                  </Text>
                </Text>
              </TableCell>
              <TableCell>
                <TouchableOpacity
                  className="invisible size-5 items-center justify-center group-hover:visible"
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
                  <Image source={Icons.ArrowRight} className="!size-full" />
                </TouchableOpacity>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
      {persons.length > PAGE_SIZE && (
        <TableFooter>
          <TableFooterRow>
            <TableFooterCell colSpan={5}>
              <View className="flex flex-row items-center justify-center gap-2 py-2">
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <Image
                    source={Icons.ArrowLeft}
                    className="!size-3"
                    style={{ resizeMode: "contain" }}
                  />
                </TouchableOpacity>
                <Text className="font-inter text-sm font-medium text-[#355362D9]">
                  Showing {(page - 1) * PAGE_SIZE + 1}-
                  {Math.min(page * PAGE_SIZE, persons.length)} of{" "}
                  {persons.length}
                </Text>
                <TouchableOpacity
                  onPress={() => setPage((p) => p + 1)}
                  disabled={page * PAGE_SIZE >= persons.length}
                >
                  <Image
                    source={Icons.ArrowRight}
                    className="!size-3"
                    style={{ resizeMode: "contain" }}
                  />
                </TouchableOpacity>
              </View>
            </TableFooterCell>
          </TableFooterRow>
        </TableFooter>
      )}
    </Table>
  );
};

export default PersonsTable;
