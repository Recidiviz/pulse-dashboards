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

import NewMeeting from "../components/NewMeeting";
import { useSetDocumentTitle } from "../hooks/useSetDocumentTitle";
import { ResidentsStackParamList } from "../navigation/DrawerNavigator";
import Loading from "../shared/ui/Loading";
import { trpc } from "../trpc/client";
import { deserializeResident } from "../utils/format";
import { formatPersonTitle } from "../utils/format";

type ProfileNavProp = NativeStackNavigationProp<
  ResidentsStackParamList,
  "Residents"
>;
type NewMeetingRouteProp = RouteProp<
  ResidentsStackParamList,
  "ResidentNewMeeting"
>;

const ResidentNewMeetingScreen = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const route = useRoute<NewMeetingRouteProp>();

  const { data: resident } = trpc.v1.resident.get.useQuery(
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

  if (!resident) return <Loading message="Loading..." />;

  const navigateToResidentProfile = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: "Residents" },
        {
          name: "ResidentProfile",
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
        person={deserializeResident(resident)}
        personType="resident"
        navigateToPersonProfile={navigateToResidentProfile}
      />
    </SafeAreaView>
  );
};

export default ResidentNewMeetingScreen;
