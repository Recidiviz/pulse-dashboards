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
import { useMeetings } from "~@meetings/app/hooks/useMeetings";
import { Person, trpc } from "~@meetings/app/shared/api";
import { ClientsStackParamList } from "~@meetings/app/shared/config";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/useSetDocumentTitle";
import { ProfileMeetings } from "~@meetings/app/widgets/profile-meetings";

type ProfileRouteProp = RouteProp<ClientsStackParamList, "ClientProfile">;

export function ClientProfileScreen() {
  const route = useRoute<ProfileRouteProp>();
  const { data: person } = trpc.v1.client.get.useQuery(
    { personId: BigInt(route.params?.personId || 0) },
    { enabled: !!route.params?.personId },
  );
  useSetDocumentTitle(
    person ? `${formatPersonTitle(person)} - Recidiviz Meetings` : undefined,
  );

  if (!person) return null;

  return <ClientProfileContent person={deserializeClient(person)} />;
}

function ClientProfileContent({ person }: { person: Person }) {
  const {
    data: rawMeetings,
    isLoading,
    error,
    refetch,
  } = useMeetings({ personId: person.personId, personType: "client" });

  return (
    <ProfileMeetings
      person={person}
      personType="client"
      rawMeetings={rawMeetings}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  );
}
