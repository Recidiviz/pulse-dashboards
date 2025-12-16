// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Modal } from "react-native";

import ClientsScreen from "../screens/ClientsScreen";
import MeetingScreen from "../screens/MeetingScreen";
import MenuScreen from "../screens/MenuScreen";
import NewMeetingScreen from "../screens/NewMeetingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ResidentsScreen from "../screens/ResidentsScreen";

export type RootStackParamList = {
  Clients: undefined;
  Residents: undefined;
  // Messages: undefined;
  // Schedule: undefined;
  // Resources: undefined;
  Profile: {
    person: {
      personId: string;
      fullName: string;
      displayPersonExternalId: string;
      primaryMetadata: string;
    };
  };
  NewMeeting: {
    person: {
      personId: string;
      fullName: string;
      displayPersonExternalId: string;
      primaryMetadata: string;
    };
    meetingId: string;
  };
  Meeting: {
    person: {
      personId: string;
      fullName: string;
      displayPersonExternalId: string;
      primaryMetadata: string;
    };
    meeting: {
      id: string;
      date: string;
      time: string;
      duration: string | null;
      content: string;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function DrawerNavigator() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Clients" component={ClientsScreen} />
        <Stack.Screen name="Residents" component={ResidentsScreen} />
        {/* <Stack.Screen name="Messages" component={HomeScreen} />
        <Stack.Screen name="Schedule" component={HomeScreen} />
        <Stack.Screen name="Resources" component={HomeScreen} /> */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="NewMeeting" component={NewMeetingScreen} />
        <Stack.Screen name="Meeting" component={MeetingScreen} />
      </Stack.Navigator>

      <Modal
        visible={drawerOpen}
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <MenuScreen onClose={() => setDrawerOpen(false)} />
      </Modal>
    </>
  );
}
