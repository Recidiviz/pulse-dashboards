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
import { Text, View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import ProcessingSvg from "~@meetings/app/assets/icons/processing.svg";
import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

import { Person } from "../common/types";
import { useMeetingRecording, useRecording } from "../features/recording";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { formatDurationCompact, formatDurationNumeric } from "../utils/format";
import { isMeetingProcessing } from "../utils/isMeetingProcessing";
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
  status: PostMeetingProcessingStatus;
  recordingState: string;
  start: Date;
  end: Date | null;
};

const PAGE_SIZE = 7;
const TABLE_HEIGHT = TABLE_HEAD_CELL_HEIGHT + PAGE_SIZE * TABLE_CELL_HEIGHT;

type MeetingRowProps = {
  meeting: Meeting;
  person: Person;
  personType: "client" | "resident";
};

const MeetingRow = ({ meeting, person, personType }: MeetingRowProps) => {
  const navigation = useNavigation<ProfileMeetingNavProp>();
  const { totalDurationMs } = useMeetingRecording({
    meetingId: meeting.id,
    personId: person.personId,
  });
  const { status: recordingState, meetingId } = useRecording<"web">();

  const isMeetingInProgress =
    recordingState !== "idle" && meeting.id === meetingId;
  const isProcessing = isMeetingProcessing(meeting.status);

  const handleNavigateToMeeting = () => {
    if (!isMeetingInProgress) {
      navigation.navigate(
        personType === "client" ? "ClientMeeting" : "ResidentMeeting",
        {
          meetingId: meeting.id,
          personId: person.personId.toString(),
        },
      );
    }
  };

  return (
    <TableRow
      onClick={handleNavigateToMeeting}
      style={{ pointerEvents: isMeetingInProgress ? "none" : "auto" }}
    >
      <TableCell>{meeting.date}</TableCell>
      <TableCell>{meeting.time}</TableCell>
      <TableCell>
        {meeting.duration
          ? formatDurationCompact(meeting.duration)
          : formatDurationNumeric(totalDurationMs)}
      </TableCell>
      <TableCell>
        {isMeetingInProgress && (
          <View className="flex-row items-center pb-2">
            <View className="box-content size-1.5 rounded-full border-[3px] border-[#FFEAE5] bg-[#B42D2D]" />
            <Text className="px-2 font-inter text-black">In progress</Text>
          </View>
        )}
        {isProcessing && (
          <View className="h-full max-h-[64px] overflow-hidden rounded-xl bg-soft-green/23">
            <View className="flex flex-row items-center gap-4 px-3 py-2">
              <ProcessingSvg />
              <View className="flex-1">
                <Text className="font-inter text-[14px] font-semibold leading-4 text-primary">
                  Recording is being processed...
                </Text>
                <Text className="font-inter text-xs font-normal text-gray/85">
                  The notes and transcript will become available in a few
                  minutes
                </Text>
              </View>
            </View>
          </View>
        )}
        {!isMeetingInProgress && !isProcessing && (
          <Text
            className="font-inter text-base text-gray/85"
            style={{ fontStyle: meeting.content ? "normal" : "italic" }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {meeting.content || "Note is empty"}
          </Text>
        )}
      </TableCell>
      <TableCell>
        <View className="invisible size-5 items-center justify-center group-hover:visible">
          <ChevronRightIcon className="stroke-muted stroke-[3px]" />
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
    <>
      <View className="w-full" style={{ height: TABLE_HEIGHT }}>
        <Table className="table-fixed">
          <TableHead>
            <TableHeadRow>
              <TableHeadCell className="w-1/5">DATE</TableHeadCell>
              <TableHeadCell className="w-1/5">TIME</TableHeadCell>
              <TableHeadCell className="w-[15%]">DURATION</TableHeadCell>
              <TableHeadCell className="w-2/5">DRAFT CASE NOTE</TableHeadCell>
              <TableHeadCell className="w-[5%]"></TableHeadCell>
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
        </Table>
      </View>
      {meetings.length > PAGE_SIZE && (
        <View className="mt-2 w-full border-spacing-0 overflow-hidden rounded-[20px] border border-gray/15">
          <TablePagination
            page={page}
            setPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            setNextPage={() => setPage((p) => p + 1)}
            tableItemsLength={meetings.length}
          />
        </View>
      )}
    </>
  );
};

export default MeetingsTable;
