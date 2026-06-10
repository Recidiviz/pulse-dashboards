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

import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

import { MeetingTypeTag } from "../entities/meeting-type";
import { Person, PersonType } from "../entities/person";
import { useProcessingText } from "../hooks/useProcessingText";
import ProcessingSvg from "../shared/assets/icons/processing.svg";
import {
  ClientsStackParamList,
  ResidentsStackParamList,
} from "../shared/config/routes";
import { formatDurationCompact } from "../shared/lib/format";
import ProcessingErrorBanner from "../shared/ui/ProcessingErrorBanner";
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
} from "../shared/ui/Table.web";
import { TablePagination } from "../shared/ui/TablePagination";
import { Typography } from "../shared/ui/Typography";
import { isMeetingProcessing } from "../utils/isMeetingProcessing";

type ProfileMeetingNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<ClientsStackParamList, "ClientMeeting">,
  NativeStackNavigationProp<ResidentsStackParamList, "ResidentMeeting">
>;

type Meeting = {
  id: string;
  meetingType: string | null;
  meetingTypeCategory: string | null;
  date: string;
  time: string;
  duration: string | null;
  content: string;
  status: PostMeetingProcessingStatus;
  validationErrorType: string | null;
  start: Date;
  end: Date | null;
};

const PAGE_SIZE = 7;
const TABLE_HEIGHT = TABLE_HEAD_CELL_HEIGHT + PAGE_SIZE * TABLE_CELL_HEIGHT;

type MeetingRowProps = {
  meeting: Meeting;
  person: Person;
  personType: PersonType;
  duration: string;
};

const MeetingRow = ({
  meeting,
  person,
  personType,
  duration,
}: MeetingRowProps) => {
  const navigation = useNavigation<ProfileMeetingNavProp>();
  const isProcessing = isMeetingProcessing(meeting.status);
  const isError = !!meeting.validationErrorType;
  const { title: processingTitle, subtitle: processingSubtitle } =
    useProcessingText();

  const handleNavigateToMeeting = () => {
    if (!isError) {
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
      style={{
        pointerEvents: isError ? "none" : "auto",
      }}
    >
      <TableCell textClassName="flex flex-col gap-1">
        <Typography className="text-sm text-secondary">
          {meeting.date}
        </Typography>
        <MeetingTypeTag
          type={meeting.meetingType}
          typeCategory={meeting.meetingTypeCategory}
        />
      </TableCell>
      <TableCell textClassName="text-secondary">{meeting.time}</TableCell>
      <TableCell textClassName="text-secondary">{duration}</TableCell>
      {isError ? (
        <TableCell colSpan={2}>
          <ProcessingErrorBanner
            validationErrorType={meeting.validationErrorType}
            className="h-[90%]"
          />
        </TableCell>
      ) : (
        <>
          <TableCell>
            {isProcessing && (
              <View className="h-full max-h-[64px] overflow-hidden rounded-xl bg-brand-light">
                <View className="flex flex-row items-center gap-4 px-3 py-2">
                  <ProcessingSvg />
                  <View className="flex-1">
                    <Typography className="text-[14px] font-semibold leading-4 text-primary">
                      {processingTitle}
                    </Typography>
                    <Typography className="text-xs font-normal text-secondary">
                      {processingSubtitle}
                    </Typography>
                  </View>
                </View>
              </View>
            )}
            {!isProcessing && (
              <Typography
                className="text-base text-secondary"
                style={{ fontStyle: meeting.content ? "normal" : "italic" }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {meeting.content || "Note is empty"}
              </Typography>
            )}
          </TableCell>
          <TableCell>
            <View className="invisible size-5 items-center justify-center group-hover:visible">
              <ChevronRightIcon className="stroke-secondary stroke-[3px]" />
            </View>
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

type MeetingsTableProps = {
  meetings: Meeting[];
  person: Person;
  personType: PersonType;
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
                  duration={
                    meeting.duration
                      ? formatDurationCompact(meeting.duration)
                      : ""
                  }
                />
              ))}
          </TableBody>
        </Table>
      </View>
      {meetings.length > PAGE_SIZE && (
        <View className="mt-2 w-full border-spacing-0 overflow-hidden rounded-[20px] border border-subtle">
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
