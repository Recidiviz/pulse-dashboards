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

import { RouteProp, useRoute } from "@react-navigation/native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MeetingDesktop from "../components/MeetingDesktop";
import MeetingMobile from "../components/MeetingMobile";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";

type MeetingRouteProp = RouteProp<RootStackParamList, "Meeting">;

const MeetingScreen = () => {
  const route = useRoute<MeetingRouteProp>();
  const person = {
    ...route.params.person,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.person.personId),
  };
  const { meeting } = route.params;
  const { data: meetingDetails } = trpc.v1.meeting.getDetails.useQuery({
    meetingId: meeting.id,
    clientId: person.personId,
  });

  return (
    <SafeAreaView className="flex-1 grow bg-white">
      <View className="flex-1 grow md:hidden">
        <MeetingMobile meetingDetails={meetingDetails} />
      </View>
      <View className="hidden flex-1 grow md:flex">
        <MeetingDesktop meetingDetails={meetingDetails} />
      </View>
    </SafeAreaView>
  );
};

export default MeetingScreen;
