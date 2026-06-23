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

import {
  deserializeClient,
  formatPersonTitle,
} from "~@meetings/app/entities/person";
import { useMeetingDetails } from "~@meetings/app/hooks/useMeetingDetails";
import { trpc } from "~@meetings/app/shared/api";
import { ClientsStackParamList } from "~@meetings/app/shared/config";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/useSetDocumentTitle";
import Loading from "~@meetings/app/shared/ui/Loading";
import { formatMeetingStartDateTitle } from "~@meetings/app/utils/format";
import { Meeting } from "~@meetings/app/widgets/meeting";

type MeetingRouteProp = RouteProp<ClientsStackParamList, "ClientMeeting">;

export function ClientMeetingScreen() {
  const route = useRoute<MeetingRouteProp>();
  const meetingId = route.params?.meetingId || "";
  const { data: meetingDetails, isLoading: isMeetingDetailsLoading } =
    useMeetingDetails(meetingId);
  const { data: person, isLoading: isPersonLoading } =
    trpc.v1.client.get.useQuery(
      { personId: BigInt(route.params?.personId || 0) },
      { enabled: !!route.params?.personId },
    );
  useSetDocumentTitle(
    meetingDetails && person
      ? `Meeting on ${formatMeetingStartDateTitle(meetingDetails.startTime)} - ${formatPersonTitle(person)} - Recidiviz Meetings`
      : undefined,
  );

  if (isMeetingDetailsLoading || isPersonLoading)
    return <Loading message="Loading..." />;
  if (!person || !meetingDetails) return null;

  return (
    <Meeting
      meetingId={meetingId}
      meetingDetails={meetingDetails}
      person={deserializeClient(person)}
      personType="client"
    />
  );
}
