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
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deserializeClient,
  formatPersonTitle,
} from "~@meetings/app/entities/person";
import { trpc } from "~@meetings/app/shared/api";
import { ClientsStackParamList } from "~@meetings/app/shared/config";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/useSetDocumentTitle";
import Loading from "~@meetings/app/shared/ui/Loading";
import { Header } from "~@meetings/app/widgets/header";
import { NewMeeting } from "~@meetings/app/widgets/new-meeting";

type ProfileNavProp = NativeStackNavigationProp<
  ClientsStackParamList,
  "Clients"
>;
type NewMeetingRouteProp = RouteProp<ClientsStackParamList, "ClientNewMeeting">;

export const ClientNewMeetingScreen = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const route = useRoute<NewMeetingRouteProp>();
  const { data: person } = trpc.v1.client.get.useQuery(
    { personId: BigInt(route.params?.personId || 0) },
    { enabled: !!route.params?.personId },
  );

  const routePerson = {
    fullName: route.params.fullName,
    displayPersonExternalId: route.params.displayPersonExternalId,
    primaryMetadata: route.params.primaryMetadata,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.personId),
  };

  useSetDocumentTitle(
    `New Meeting - ${formatPersonTitle(routePerson)} - Recidiviz Meetings`,
  );

  if (!person) return <Loading message="Loading..." />;

  const navigateToClientProfile = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: "Clients" },
        {
          name: "ClientProfile",
          params: {
            personId: route.params.personId,
            fullName: route.params.fullName,
            displayPersonExternalId: route.params.displayPersonExternalId,
            primaryMetadata: route.params.primaryMetadata,
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <NewMeeting
        person={deserializeClient(person)}
        navigateToPersonProfile={navigateToClientProfile}
        header={({ onGoBack }) => (
          <Header showDrawer={false} showGoBack onGoBack={onGoBack} />
        )}
      />
    </SafeAreaView>
  );
};
