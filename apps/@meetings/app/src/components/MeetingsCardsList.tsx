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
import { View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

import ProcessingSvg from "../assets/icons/processing.svg";
import { Person, PersonType } from "../common/types";
import { useRecording } from "../features/recording";
import { useProcessingText } from "../hooks/useProcessingText";
import { Typography } from "../shared/ui/Typography";
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
  personType: PersonType;
};

const MeetingsCardsList = ({
  meetings,
  person,
  personType,
}: MeetingCardProps) => {
  const { status: recordingState } = useRecording<"native">();
  const { title: processingTitle, subtitle: processingSubtitle } =
    useProcessingText();
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
        <Link className="text-[0px]" {...linkProps}>
          <View className="w-full">
            <View className="w-full flex-row items-center justify-between">
              <Typography className="text-base font-semibold text-primary">
                {meeting.date}
              </Typography>
              <ChevronRightIcon className="stroke-muted size-3.5 stroke-[3px]" />
            </View>

            <Typography className="mr-1 text-xs font-medium text-primary">
              {meeting.time} • {meeting.duration || "In progress..."}
            </Typography>
            {isProcessing ? (
              <View className="bg-soft-green/23 mt-4 rounded-xl p-4">
                <View className="flex-row items-start">
                  <ProcessingSvg />

                  <View className="ml-2 flex-1">
                    <Typography className="text-base font-semibold text-primary">
                      {processingTitle}
                    </Typography>
                    <Typography className="text-sm font-medium text-gray-700">
                      {processingSubtitle}
                    </Typography>
                  </View>
                </View>
              </View>
            ) : (
              <Typography
                style={{ fontStyle: meeting.content ? "normal" : "italic" }}
                className="text-title-default mt-3 border-t border-[#EDF1F1] pt-3 text-sm font-medium"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {meeting.content || "Note is empty"}
              </Typography>
            )}
          </View>
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
