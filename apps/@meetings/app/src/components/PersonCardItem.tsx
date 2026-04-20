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
import { ImageBackground, View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import BgAvatarImage from "../assets/images/bg-avatar.png";
import { Person, PersonType } from "../common/types";
import ProcessingErrorBanner from "../shared/ui/ProcessingErrorBanner";
import { Typography } from "../shared/ui/Typography";
import {
  formatPersonLastMeetingDate,
  getInitials,
  humanReadableTitleCase,
} from "../utils/format";
import MeetingInProgressBar from "./MeetingInProgressBar";

interface ItemProps {
  person: Person;
  recordingState: string;
  personType: PersonType;
}

const PersonCardItem = ({ person, recordingState, personType }: ItemProps) => {
  const hasActiveMeeting = !!person.activeMeetingId;
  const hasValidationError =
    !hasActiveMeeting && !!person.meetingDetails.validationErrorType;
  const hasLastMeeting =
    !hasValidationError &&
    !!person.meetingDetails.id &&
    !!person.meetingDetails.lastCompletedMeetingTime;

  return (
    <View key={person.personId} className="mb-2 w-full px-4">
      <View className="flex w-full flex-1 flex-col gap-2 rounded-[20px] bg-primary p-3">
        <Link
          screen={personType === "client" ? "ClientProfile" : "ResidentProfile"}
          params={{ personId: person.personId.toString() }}
        >
          <View className="w-full flex-1 flex-row items-center">
            <ImageBackground
              source={BgAvatarImage}
              className="mr-3 !size-11 items-center justify-center overflow-hidden rounded-full"
              imageClassName="!size-11"
            >
              <Typography className="text-sm font-semibold text-white">
                {getInitials(person.fullName)}
              </Typography>
            </ImageBackground>
            <View className="flex-1">
              <View className="flex flex-col gap-0.5">
                <Typography className="text-base font-medium leading-5 text-primary">
                  {person.fullName}
                </Typography>
                <Typography className="text-sm text-secondary">
                  ID: {person.displayPersonExternalId} •{" "}
                  {humanReadableTitleCase(person.primaryMetadata)}
                </Typography>
              </View>
            </View>
            <ChevronRightIcon className="ml-auto !size-6 stroke-tertiary stroke-[2px]" />
          </View>
        </Link>
        {!!person.activeMeetingId && (
          <MeetingInProgressBar
            recordingState={recordingState || "recording"}
            startTime={new Date()} // TODO: Replace with API value
            endTime={null}
            person={{ ...person, personId: person.personId }}
            meetingId={person.activeMeetingId}
          />
        )}
        {hasValidationError && (
          <ProcessingErrorBanner
            validationErrorType={person.meetingDetails.validationErrorType}
          />
        )}
        {hasLastMeeting && !hasActiveMeeting && (
          <Link
            className="flex flex-1"
            screen={
              personType === "client" ? "ClientMeeting" : "ResidentMeeting"
            }
            params={{
              personId: person.personId.toString(),
              meetingId: person.meetingDetails.id,
            }}
          >
            <View className="w-full flex-1 flex-col gap-2.5 rounded-xl bg-secondary px-4 py-2.5">
              <View className="flex w-full flex-row items-center justify-between">
                <View className="flex flex-col gap-[3px]">
                  <Typography className="text-sm leading-4 text-secondary">
                    Last meeting
                  </Typography>
                  <Typography className="text-base font-medium leading-5 text-primary">
                    {formatPersonLastMeetingDate(
                      person.meetingDetails.lastCompletedMeetingTime,
                    )}
                  </Typography>
                </View>
                <ChevronRightIcon className="ml-auto !size-6 stroke-tertiary stroke-[2px]" />
              </View>
              <Typography
                className="flex-1 text-sm font-normal text-secondary"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {person.meetingDetails.caseNote ?? "Case note is empty. \n"}
              </Typography>
            </View>
          </Link>
        )}
      </View>
    </View>
  );
};

export default PersonCardItem;
