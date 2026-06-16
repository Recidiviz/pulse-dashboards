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

import { Person } from "~@meetings/app/shared/api";

import ProfileMeetings from "../components/ProfileMeetings";
import { deserializeClient, formatPersonTitle } from "../entities/person";
import { useMeetings } from "../hooks/useMeetings";
import { trpc } from "../shared/api";
import { ClientsStackParamList } from "../shared/config/routes";
import { useSetDocumentTitle } from "../shared/lib/useSetDocumentTitle";

type ProfileRouteProp = RouteProp<ClientsStackParamList, "ClientProfile">;

const ClientProfileScreenContainer = () => {
  const route = useRoute<ProfileRouteProp>();
  const { data: person } = trpc.v1.client.get.useQuery(
    { personId: BigInt(route.params?.personId || 0) },
    { enabled: !!route.params?.personId },
  );
  useSetDocumentTitle(
    person ? `${formatPersonTitle(person)} - Recidiviz Meetings` : undefined,
  );

  if (!person) return null;

  return <ClientProfileScreen person={deserializeClient(person)} />;
};

type ProfileScreenProps = {
  person: Person;
};

const ClientProfileScreen = ({ person }: ProfileScreenProps) => {
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
};

export default ClientProfileScreenContainer;
