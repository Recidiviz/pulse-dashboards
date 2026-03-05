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
import { Text, View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import ProcessingSvg from "~@meetings/app/assets/icons/processing.svg";
import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

import { Person } from "../common/types";
import { useRecording } from "../features/recording";
import { isMeetingProcessing } from "../utils/isMeetingProcessing";
import MeetingInProgressBar from "./MeetingInProgressBar";

type MeetingCardProps = {
  meetings: {
    id: string;
    date: string;
    time: string;
    duration: string | null;
    content: string;
    status: PostMeetingProcessingStatus;
    recordingState: string;
    start: Date;
    end: Date | null;
  }[];
  person: Person;
  personType: "client" | "resident";
};

const MeetingsCardsList = ({
  meetings,
  person,
  personType,
}: MeetingCardProps) => {
  const { status: recordingState } = useRecording<"native">();
  return meetings.map((meeting, index) => {
    const isMeetingInProgress =
      recordingState !== "idle" && meeting.status === "NOT_STARTED";
    const isProcessing = isMeetingProcessing(meeting.status);

    const linkProps =
      meeting.status === "NOT_STARTED"
        ? {
            screen:
              personType === "client"
                ? "ClientNewMeeting"
                : "ResidentNewMeeting",
            params: {
              personId: person.personId,
              fullName: person.fullName,
              displayPersonExternalId: person.displayPersonExternalId,
              primaryMetadata: person.primaryMetadata,
              meetingId: meeting.id,
            },
          }
        : {
            screen:
              personType === "client" ? "ClientMeeting" : "ResidentMeeting",
            params: {
              meetingId: meeting.id,
              personId: person.personId.toString(),
            },
          };

    return (
      <View
        key={`${meeting.id}-${index}`}
        className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <Link {...linkProps}>
          <View className="w-full flex-row items-center justify-between">
            <Text className="font-inter text-base font-semibold text-primary">
              {meeting.date}
            </Text>
            <ChevronRightIcon className="size-3.5 stroke-muted stroke-[3px]" />
          </View>

          <Text className="mr-1 font-inter text-xs font-medium text-primary">
            {meeting.time} • {meeting.duration || "In progress..."}
          </Text>
          {isProcessing && (
            <View className="mt-4 rounded-xl bg-soft-green/23 p-4">
              <View className="flex-row items-start">
                <ProcessingSvg />
                <View className="ml-2 flex-1">
                  <Text className="font-inter text-base font-semibold text-primary">
                    Recording is being processed...
                  </Text>
                  <Text className="font-inter text-sm font-medium text-gray-700">
                    The notes and transcript will become available in a few
                    minutes
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Link>
        {isMeetingInProgress && (
          <MeetingInProgressBar
            recordingState={meeting.recordingState}
            startTime={meeting.start}
            endTime={meeting.end}
            person={person}
            meetingId={meeting.id}
            className="mt-2"
          />
        )}
      </View>
    );
  });
};

export default MeetingsCardsList;
