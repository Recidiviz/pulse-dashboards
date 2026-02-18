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
import React, { useEffect } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";
import { Person } from "../common/types";
import { useMeetingRecording, useRecording } from "../features/recording";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { formatDurationCompact, formatDurationNumeric } from "../utils/format";
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

type ProfileMeetingNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ClientMeeting" | "ResidentMeeting"
>;

type Meeting = {
  id: string;
  date: string;
  time: string;
  duration: string | null;
  content: string;
  status: string;
  recordingState: string;
  start: Date;
  end: Date | null;
};

const PAGE_SIZE = 7;

type MeetingRowProps = {
  meeting: Meeting;
  person: Person;
  personType: "client" | "resident";
};

const MeetingRow = ({ meeting, person, personType }: MeetingRowProps) => {
  const navigation = useNavigation<ProfileMeetingNavProp>()
  const { totalDurationMs } = useMeetingRecording({ meetingId: meeting.id });
  const { status: recordingState, meetingId } = useRecording<"web">();

  const isMeetingInProgress = recordingState !== "idle" && meeting.id === meetingId;

  const handleNavigateToMeeting = () => {
    if (!isMeetingInProgress) {
      navigation.navigate(
        personType === "client" ? "ClientMeeting" : "ResidentMeeting",
        {
          meetingId: meeting.id,
          personId: person.personId.toString(),
        }
      );
    }
  };

  return (
    <TableRow onClick={handleNavigateToMeeting} style={{ pointerEvents: isMeetingInProgress ? "none" : "auto" }}>
      <TableCell>{meeting.date}</TableCell>
      <TableCell>{meeting.time}</TableCell>
      <TableCell>
        {meeting.duration
          ? formatDurationCompact(meeting.duration)
          : formatDurationNumeric(totalDurationMs)}
      </TableCell>
      {!isMeetingInProgress ? (
        <TableCell>
          <Text
            className="w-[180px] font-inter text-base text-[#355362D9]"
            style={{ fontStyle: meeting.content ? "normal" : "italic" }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {meeting.content || "Note is empty"}
          </Text>
        </TableCell>
      ) : (
        <TableCell>
          <View className="flex-row items-center pb-2">
            <Image source={Icons.Record} className="!size-4" />
            <Text className="px-2 font-inter text-black">In progress</Text>
          </View>
        </TableCell>
      )}
      <TableCell>
        <View className="invisible size-5 items-center justify-center group-hover:visible">
          <Image source={Icons.ArrowRight} className="!size-full" />
        </View>
      </TableCell>
    </TableRow>
  );
};

type MeetingsTableProps = {
  meetings: Meeting[];
  person: Person;
  personType: "client" | "resident";
};

const MeetingsTable = ({
  meetings,
  person,
  personType,
}: MeetingsTableProps) => {
  const [page, setPage] = React.useState(1);

  useEffect(() => {
    setPage(1);
  }, [meetings]);

  return (
    <Table>
      <TableHead>
        <TableHeadRow>
          <TableHeadCell>DATE</TableHeadCell>
          <TableHeadCell>TIME</TableHeadCell>
          <TableHeadCell>DURATION</TableHeadCell>
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
              personType={personType}
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
