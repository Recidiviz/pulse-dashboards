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

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  deserializeResident,
  formatPersonTitle,
} from "~@meetings/app/entities/person";
import { useMeetings } from "~@meetings/app/hooks/useMeetings";
import { Person, trpc } from "~@meetings/app/shared/api";
import { ResidentsStackParamList } from "~@meetings/app/shared/config";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/useSetDocumentTitle";
import { Header } from "~@meetings/app/widgets/header";
import { ProfileMeetings } from "~@meetings/app/widgets/profile-meetings";

type ProfileRouteProp = RouteProp<ResidentsStackParamList, "ResidentProfile">;

export function ResidentProfileScreen() {
  const route = useRoute<ProfileRouteProp>();
  const { data: person } = trpc.v1.resident.get.useQuery(
    { personId: BigInt(route.params?.personId || 0) },
    { enabled: !!route.params?.personId },
  );
  useSetDocumentTitle(
    person ? `${formatPersonTitle(person)} - Recidiviz Meetings` : undefined,
  );

  if (!person) return null;

  return <ResidentProfileContent person={deserializeResident(person)} />;
}

function ResidentProfileContent({ person }: { person: Person }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<ResidentsStackParamList>>();
  const {
    data: rawMeetings,
    isLoading,
    error,
    refetch,
  } = useMeetings({ personId: person.personId, personType: "resident" });

  return (
    <ProfileMeetings
      person={person}
      personType="resident"
      rawMeetings={rawMeetings}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
      header={
        <Header
          showDrawer={false}
          showGoBack
          onGoBack={() => navigation.navigate("Residents")}
        />
      }
    />
  );
}
