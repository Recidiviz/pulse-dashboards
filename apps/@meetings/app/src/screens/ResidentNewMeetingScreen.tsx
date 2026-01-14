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

import NewMeeting from "../components/NewMeeting";
import { RootStackParamList } from "../navigation/DrawerNavigator";

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Residents"
>;
type NewMeetingRouteProp = RouteProp<RootStackParamList, "ResidentNewMeeting">;

const ResidentNewMeetingScreen = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const route = useRoute<NewMeetingRouteProp>();
  const person = {
    fullName: route.params.fullName,
    displayPersonExternalId: route.params.displayPersonExternalId,
    primaryMetadata: route.params.primaryMetadata,
    // Convert this back into a BigInt for TRPC calls
    personId: BigInt(route.params.personId),
  };

  const navigateToResidentProfile = () => {
    navigation.reset({
      index: 1,
      routes: [
        { name: "Residents" },
        {
          name: "ResidentProfile",
          params: {
            personId: person.personId.toString(),
            fullName: person.fullName,
            displayPersonExternalId: person.displayPersonExternalId,
            primaryMetadata: person.primaryMetadata,
          },
        },
      ],
    });
  };

  return (
    <NewMeeting
      person={person}
      navigateToPersonProfile={navigateToResidentProfile}
    />
  );
};

export default ResidentNewMeetingScreen;
