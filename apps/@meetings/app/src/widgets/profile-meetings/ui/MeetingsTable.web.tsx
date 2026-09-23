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
import React, { Dispatch, SetStateAction } from "react";
import { View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import {
  type ClientMeetings,
  isMeetingProcessing,
} from "~@meetings/app/entities/meeting";
import { ReviewIndicator } from "~@meetings/app/features/meeting-section-approval";
import { Person, PersonType } from "~@meetings/app/shared/api";
import ProcessingSvg from "~@meetings/app/shared/assets/icons/processing.svg";
import {
  ClientsStackParamList,
  ResidentsStackParamList,
} from "~@meetings/app/shared/config";
import ProcessingErrorBanner from "~@meetings/app/shared/ui/ProcessingErrorBanner";
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
} from "~@meetings/app/shared/ui/Table.web";
import { TablePagination } from "~@meetings/app/shared/ui/TablePagination";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

import { useProcessingText } from "../lib/useProcessingText";

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
  approvals: ClientMeetings[number]["approvals"];
  start: Date;
  end: Date | null;
  staffEmail: string;
};

const PAGE_SIZE = 7;
const TABLE_HEIGHT = TABLE_HEAD_CELL_HEIGHT + PAGE_SIZE * TABLE_CELL_HEIGHT;

type MeetingRowProps = {
  meeting: Meeting;
  person: Person;
  personType: PersonType;
  hasMeetingTypes: boolean;
};

const MeetingRow = ({
  meeting,
  person,
  personType,
  hasMeetingTypes,
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
      <TableCell textClassName="text-secondary">
        {`${meeting.date} ${meeting.time}`}
      </TableCell>
      <TableCell>
        <View className="flex flex-col">
          {hasMeetingTypes && meeting.meetingType && (
            <Typography variant="body-m-medium" className="text-secondary">
              {meeting.meetingTypeCategory
                ? `${meeting.meetingType} - ${meeting.meetingTypeCategory}`
                : meeting.meetingType}{" "}
              by
            </Typography>
          )}
          <Typography
            variant="body-m-medium"
            className="text-secondary"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {meeting.staffEmail}
          </Typography>
        </View>
      </TableCell>
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
                    <Typography variant="button-m">
                      {processingTitle}
                    </Typography>
                    <Typography variant="caption-s-regular">
                      {processingSubtitle}
                    </Typography>
                  </View>
                </View>
              </View>
            )}
            {!isProcessing && (
              <View className="flex flex-row items-center gap-3">
                <ReviewIndicator
                  isApproved={meeting.approvals.caseNote.isApproved}
                />
                <Typography
                  variant="body-m-regular"
                  className="flex-1 text-secondary"
                  style={{ fontStyle: meeting.content ? "normal" : "italic" }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {meeting.content || "Note is empty"}
                </Typography>
              </View>
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
  hasMeetingTypes: boolean;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
};

const MeetingsTable = ({
  meetings,
  person,
  personType,
  hasMeetingTypes,
  page,
  setPage,
}: MeetingsTableProps) => {
  return (
    <>
      <View className="w-full" style={{ height: TABLE_HEIGHT }}>
        <Table className="table-fixed">
          <TableHead>
            <TableHeadRow>
              <TableHeadCell className="w-1/4">DATE / TIME</TableHeadCell>
              <TableHeadCell className="w-1/4">
                {hasMeetingTypes ? "MEETING" : "STAFF"}
              </TableHeadCell>
              <TableHeadCell className="w-[45%]">DRAFT CASE NOTE</TableHeadCell>
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
                  hasMeetingTypes={hasMeetingTypes}
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
