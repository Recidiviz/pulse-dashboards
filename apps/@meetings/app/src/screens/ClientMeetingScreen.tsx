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

import { RouteProp, useRoute } from "@react-navigation/native";

import Meeting from "../components/Meeting";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";
import { deserializeClient } from "../utils/format";

type MeetingRouteProp = RouteProp<RootStackParamList, "ClientMeeting">;

const ClientMeetingScreen = () => {
  const route = useRoute<MeetingRouteProp>();
  const { data: meetingDetails } = trpc.v1.meeting.getDetails.useQuery(
    { meetingId: route.params?.meetingId || "" },
    { enabled: !!route.params?.meetingId },
  );
  const { data: person } = trpc.v1.staff.getClient.useQuery(
    { personId: BigInt(route.params?.personId || 0) },
    { enabled: !!route.params?.personId },
  );

  if (!person) return null;

  return (
    <Meeting
      meetingDetails={meetingDetails}
      person={deserializeClient(person)}
      personType="client"
    />
  );
};

export default ClientMeetingScreen;
