// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MeetingDetails } from "~@meetings/app/common/types";
import { Person, PersonType } from "~@meetings/app/shared/api";

import MeetingDesktop from "./MeetingDesktop";
import MeetingMobile from "./MeetingMobile";

type Props = {
  meetingId: string;
  meetingDetails: MeetingDetails;
  person: Person;
  personType: PersonType;
};

export const Meeting = ({
  meetingId,
  meetingDetails,
  person,
  personType,
}: Props) => {
  // Show transcription tab if the backend returned transcription data
  const showTranscription = meetingDetails?.transcription !== undefined;
  return (
    <SafeAreaView className="flex-1 grow bg-primary">
      <View className="flex-1 grow lg:hidden">
        <MeetingMobile
          meetingId={meetingId}
          meetingDetails={meetingDetails}
          person={person}
          personType={personType}
          showTranscription={showTranscription}
        />
      </View>
      <View className="hidden flex-1 grow lg:flex">
        <MeetingDesktop
          meetingId={meetingId}
          meetingDetails={meetingDetails}
          person={person}
          personType={personType}
          showTranscription={showTranscription}
        />
      </View>
    </SafeAreaView>
  );
};
