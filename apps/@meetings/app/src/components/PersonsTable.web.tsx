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

interface PersonsProps {
  persons: Person[];
  type: "clients" | "residents";
  sectionTitle?: string;
}

const PersonsTable = ({ persons, type, sectionTitle }: PersonsProps) => {
  const [page, setPage] = React.useState(1);

  return (
    <>
      {sectionTitle && (
        <Text className="mb-2 mt-6 font-inter text-base font-medium text-[#355362D9]">
          {sectionTitle}
        </Text>
      )}
      <Table className="table-fixed">
        <TableHead>
          <TableHeadRow>
            <TableHeadCell className="w-[35%]">NAME</TableHeadCell>
            <TableHeadCell className="w-1/4">ID</TableHeadCell>
            <TableHeadCell className="w-[15%]">
              {type === "clients" ? "SUPERVISION" : "FACILITY"}
            </TableHeadCell>
            <TableHeadCell className="w-1/5">LAST MEETING</TableHeadCell>
            <TableHeadCell className="w-[5%]"></TableHeadCell>
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
                  <Link
                    className="invisible size-5 items-center justify-center group-hover:visible"
                    screen={
                      type === "clients" ? "ClientProfile" : "ResidentProfile"
                    }
                    params={{ personId: person.personId.toString() }}
                  >
                    <Image source={Icons.ArrowRight} className="!size-full" />
                  </Link>
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
    </>
  );
};

export default PersonsTable;
