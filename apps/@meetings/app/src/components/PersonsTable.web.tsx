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
import upperFirst from "lodash/upperFirst";
import React, { useEffect } from "react";
import { ImageBackground, View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import BgAvatarImage from "../assets/images/bg-avatar.png";
import { Person } from "../common/types";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { Typography } from "../shared/ui/Typography";
import { getInitials } from "../utils/format";
import {
  Table,
  TABLE_CELL_HEIGHT,
  TABLE_HEAD_CELL_HEIGHT,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableHeadRow,
  TableRow,
} from "./Table.web";
import { TablePagination } from "./TablePagination";
import { TooltipText } from "./TooltipText";

const PAGE_SIZE = 7;
const TABLE_HEIGHT = TABLE_HEAD_CELL_HEIGHT + PAGE_SIZE * TABLE_CELL_HEIGHT;

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ClientProfile" | "ResidentProfile"
>;

interface PersonsProps {
  persons: Person[];
  type: "clients" | "residents";
  sectionTitle?: string;
}

const PersonsTable = ({ persons, type, sectionTitle }: PersonsProps) => {
  const [page, setPage] = React.useState(1);
  const navigation = useNavigation<ProfileNavProp>();

  useEffect(() => {
    setPage(1);
  }, [persons]);

  const handleNavigateToProfile = (personId: string) => {
    navigation.navigate(
      type === "clients" ? "ClientProfile" : "ResidentProfile",
      { personId },
    );
  };

  return (
    <>
      {sectionTitle && (
        <Typography className="mt-6 text-base font-medium text-gray/85">
          {sectionTitle}
        </Typography>
      )}
      <View className="mt-2 w-full" style={{ height: TABLE_HEIGHT }}>
        <Table className="table-fixed">
          <TableHead>
            <TableHeadRow>
              <TableHeadCell className="w-[35%]">NAME</TableHeadCell>
              <TableHeadCell className="w-[15%]">ID</TableHeadCell>
              <TableHeadCell className="w-[23%]">
                {type === "clients" ? "SUPERVISION" : "FACILITY"}
              </TableHeadCell>
              <TableHeadCell className="w-[23%]">LAST MEETING</TableHeadCell>
              <TableHeadCell className="w-[4%]"></TableHeadCell>
            </TableHeadRow>
          </TableHead>
          <TableBody>
            {persons
              .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
              .map((person) => (
                <TableRow
                  key={person.personId}
                  // onClickCapture allows row to be clicked instead of Pressable inside TooltipText,
                  // If inside row by design we have to add something clickable
                  // then this solution has to be changed
                  onClickCapture={() =>
                    handleNavigateToProfile(person.personId.toString())
                  }
                >
                  <TableCell>
                    <View className="flex size-full flex-row items-center gap-3">
                      <ImageBackground
                        source={BgAvatarImage}
                        className="size-11 items-center justify-center overflow-hidden rounded-full"
                        imageClassName="!size-11"
                      >
                        <Typography className="text-base font-medium text-white">
                          {getInitials(person.fullName)}
                        </Typography>
                      </ImageBackground>
                      <TooltipText
                        tooltipText={person.fullName.toLowerCase()}
                        textClassName="text-base font-medium capitalize text-primary"
                      >
                        {person.fullName.toLowerCase()}
                      </TooltipText>
                    </View>
                  </TableCell>
                  <TableCell>
                    <TooltipText tooltipText={person.displayPersonExternalId}>
                      {person.displayPersonExternalId}
                    </TooltipText>
                  </TableCell>
                  <TableCell>
                    <TooltipText tooltipText={person.primaryMetadata}>
                      {person.primaryMetadata}
                    </TooltipText>
                  </TableCell>
                  <TableCell>
                    {person.activeMeetingId ? (
                      <View className="flex-row items-center pb-2">
                        <View className="box-content size-1.5 rounded-full border-[3px] border-[#FFEAE5] bg-[#B42D2D]" />
                        <Typography className="px-2 text-black">
                          In progress
                        </Typography>
                      </View>
                    ) : (
                      <Typography className="text-base text-gray/85">
                        <Typography className="font-bold">
                          {upperFirst(person.lastMeeting)}
                        </Typography>
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <View className="invisible size-5 items-center justify-center group-hover:visible">
                      <ChevronRightIcon className="stroke-muted stroke-[3px]" />
                    </View>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </View>
      {persons.length > PAGE_SIZE && (
        <View className="mt-2 w-full border-spacing-0 overflow-hidden rounded-[20px] border border-gray/15">
          <TablePagination
            page={page}
            setPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            setNextPage={() => setPage((p) => p + 1)}
            tableItemsLength={persons.length}
          />
        </View>
      )}
    </>
  );
};

export default PersonsTable;
