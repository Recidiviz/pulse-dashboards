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
import { useState } from "react";
import { Alert, Platform } from "react-native";

import { Person } from "../common/types";
import ProfileMeetings from "../components/ProfileMeetings";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";
import { deserializeClient } from "../utils/format";

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "ClientProfile"
>;
type ProfileRouteProp = RouteProp<RootStackParamList, "ClientProfile">;

const ClientProfileScreenContainer = () => {
  const route = useRoute<ProfileRouteProp>();
  const { data: person } = trpc.v1.client.get.useQuery(
    { personId: BigInt(route.params?.personId || 0) },
    { enabled: !!route.params?.personId },
  );

  if (!person) return null;

  return <ClientProfileScreen person={deserializeClient(person)} />;
};

type ProfileScreenProps = {
  person: Person;
};

const ClientProfileScreen = ({ person }: ProfileScreenProps) => {
  const navigation = useNavigation<ProfileNavProp>();
  const [isCreating, setIsCreating] = useState(false);
  const [webMeetingId, setWebMeetingId] = useState<string | null>(null);

  const {
    data: rawMeetings,
    isLoading,
    error,
    refetch,
  } = trpc.v1.client.getMeetings.useQuery(
    { clientId: person.personId },
    { enabled: !!person?.personId },
  );

  const createMeetingMutation = trpc.v1.client.createMeeting.useMutation();
  const handleCreateMeeting = async () => {
    try {
      setIsCreating(true);
      const startTime = new Date();
      const { id: meetingId } = await createMeetingMutation.mutateAsync({
        clientId: person.personId,
        startTime,
      });

      switch (Platform.OS) {
        case "web":
          setWebMeetingId(meetingId);
          break;
        case "ios":
        case "android":
          navigation.navigate("ClientNewMeeting", {
            personId: person.personId.toString(),
            fullName: person.fullName,
            displayPersonExternalId: person.displayPersonExternalId,
            primaryMetadata: person.primaryMetadata,
            meetingId,
          });
          break;
      }
    } catch (err) {
      console.error("[createMeeting] Failed:", err);
      Alert.alert("Error", "Failed to create meeting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ProfileMeetings
      type="client"
      person={person}
      rawMeetings={rawMeetings}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
      isMeetingCreating={isCreating}
      handleCreateMeeting={handleCreateMeeting}
      webMeetingId={webMeetingId}
      setWebMeetingId={setWebMeetingId}
    />
  );
};

export default ClientProfileScreenContainer;
