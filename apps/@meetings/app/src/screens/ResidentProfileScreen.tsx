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
import { Platform } from "react-native";

import { Person } from "../common/types";
import ProfileMeetings from "../components/ProfileMeetings";
import { useRecording } from "../features/recording";
import { useCreateMeeting } from "../hooks/useCreateMeeting";
import { useMeetings } from "../hooks/useMeetings";
import { useSetDocumentTitle } from "../hooks/useSetDocumentTitle";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";
import { deserializeResident, formatPersonTitle } from "../utils/format";

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ResidentProfile"
>;
type ProfileRouteProp = RouteProp<RootStackParamList, "ResidentProfile">;

const ResidentProfileScreenContainer = () => {
  const route = useRoute<ProfileRouteProp>();
  const { data: person } = trpc.v1.resident.get.useQuery(
    { personId: BigInt(route.params?.personId || 0) },
    { enabled: !!route.params?.personId },
  );
  useSetDocumentTitle(
    person ? `${formatPersonTitle(person)} - Recidiviz Meetings` : undefined,
  );

  if (!person) return null;

  return <ResidentProfileScreen person={deserializeResident(person)} />;
};

type ProfileScreenProps = {
  person: Person;
};

const ResidentProfileScreen = ({ person }: ProfileScreenProps) => {
  const navigation = useNavigation<ProfileNavProp>();
  const { openRecordingView } = useRecording<"web">();

  const {
    data: rawMeetings,
    isLoading,
    error,
    refetch,
  } = useMeetings({ personId: person.personId, personType: "resident" });

  const { handleCreateMeeting, isCreating } = useCreateMeeting({
    person,
    personType: "resident",
    onSuccess: (meetingId) => {
      switch (Platform.OS) {
        case "web":
          openRecordingView({ meetingId, person });
          break;
        case "ios":
        case "android":
          navigation.navigate("ResidentNewMeeting", {
            personId: person.personId.toString(),
            fullName: person.fullName,
            displayPersonExternalId: person.displayPersonExternalId,
            primaryMetadata: person.primaryMetadata,
            meetingId,
          });
          break;
      }
    },
  });

  return (
    <ProfileMeetings
      type="resident"
      person={person}
      rawMeetings={rawMeetings}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
      isMeetingCreating={isCreating}
      handleCreateMeeting={handleCreateMeeting}
    />
  );
};

export default ResidentProfileScreenContainer;
