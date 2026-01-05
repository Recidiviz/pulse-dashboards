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
import { formatDurationCompact } from "../utils/format";
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

type Meeting = {
  id: string;
  date: string;
  time: string;
  duration: string | null;
  content: string;
};

type Person = {
  personId: string;
  fullName: string;
  displayPersonExternalId: string;
  primaryMetadata: string;
};

const PAGE_SIZE = 7;

const TOPICS = ["New Job", "Motivation", "Partner", "Address"];

type MeetingNavProp = NativeStackNavigationProp<RootStackParamList, "Meeting">;

const Topic = ({ topic }: { topic: string }) => {
  return (
    <Text className="rounded bg-[#E6EAEB] px-1.5 py-0.5 font-inter text-xs font-semibold">
      {topic}
    </Text>
  );
};

type MeetingRowProps = {
  meeting: Meeting;
  person: Person;
};

const MeetingRow = ({ meeting, person }: MeetingRowProps) => {
  const navigation = useNavigation<MeetingNavProp>();

  return (
    <TableRow>
      <TableCell>{meeting.date}</TableCell>
      <TableCell>{meeting.time}</TableCell>
      <TableCell>
        {meeting.duration
          ? formatDurationCompact(meeting.duration)
          : "In progress..."}
      </TableCell>
      <TableCell>
        <View className="w-[150px] flex-row flex-wrap gap-1">
          {TOPICS.map((topic) => (
            <Topic key={`${meeting.id}-${topic}`} topic={topic} />
          ))}
        </View>
      </TableCell>
      <TableCell>
        <Text
          className="w-[180px] font-inter text-base text-[#355362D9]"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {meeting.content || (
            // TODO: adding note under discussion with design team
            <TouchableOpacity className="rounded-full px-2.5 py-1.5 font-inter text-[#006C67] hover:bg-[#4D5255] hover:text-white">
              <Text className="font-inter">+ Add note</Text>
            </TouchableOpacity>
          )}
        </Text>
      </TableCell>
      <TableCell>
        <TouchableOpacity
          className="invisible size-5 items-center justify-center group-hover:visible"
          onPress={() => navigation.navigate("Meeting", { meeting, person })}
        >
          <Image source={Icons.ArrowRight} className="!size-full" />
        </TouchableOpacity>
      </TableCell>
    </TableRow>
  );
};

type MeetingsTableProps = {
  meetings: Meeting[];
  person: Person;
};

const MeetingsTable = ({ meetings, person }: MeetingsTableProps) => {
  const [page, setPage] = React.useState(1);

  return (
    <Table>
      <TableHead>
        <TableHeadRow>
          <TableHeadCell>DATE</TableHeadCell>
          <TableHeadCell>TIME</TableHeadCell>
          <TableHeadCell>DURATION</TableHeadCell>
          <TableHeadCell>TOPICS</TableHeadCell>
          <TableHeadCell>DRAFT CASE NOTE</TableHeadCell>
          <TableHeadCell></TableHeadCell>
        </TableHeadRow>
      </TableHead>
      <TableBody>
        {meetings
          .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
          .map((meeting, index) => (
            <MeetingRow
              key={`${meeting.id}-${index}`}
              meeting={meeting}
              person={person}
            />
          ))}
      </TableBody>
      {meetings.length > PAGE_SIZE && (
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
                  {Math.min(page * PAGE_SIZE, meetings.length)} of{" "}
                  {meetings.length}
                </Text>
                <TouchableOpacity
                  onPress={() => setPage((p) => p + 1)}
                  disabled={page * PAGE_SIZE >= meetings.length}
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

export default MeetingsTable;
