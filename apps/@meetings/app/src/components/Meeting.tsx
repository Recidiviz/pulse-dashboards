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

import { MeetingDetails, Person } from "../common/types";
import MeetingDesktop from "../components/MeetingDesktop";
import MeetingMobile from "../components/MeetingMobile";

type Props = {
  meetingDetails?: MeetingDetails;
  person: Person;
  personType: "client" | "resident";
};

const Meeting = ({ meetingDetails, person, personType }: Props) => {
  return (
    <SafeAreaView className="flex-1 grow bg-white">
      <View className="flex-1 grow md:hidden">
        <MeetingMobile
          meetingDetails={meetingDetails}
          person={person}
          personType={personType}
        />
      </View>
      <View className="hidden flex-1 grow md:flex">
        <MeetingDesktop
          meetingDetails={meetingDetails}
          person={person}
          personType={personType}
        />
      </View>
    </SafeAreaView>
  );
};

export default Meeting;
