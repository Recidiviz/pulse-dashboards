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

import { createDrawerNavigator } from "@react-navigation/drawer";
import React from "react";

import DrawerContent from "../components/DrawerContent";
import ClientMeetingScreen from "../screens/ClientMeetingScreen";
import ClientNewMeetingScreen from "../screens/ClientNewMeetingScreen";
import ClientProfileScreen from "../screens/ClientProfileScreen";
import ClientsScreen from "../screens/ClientsScreen";
import ResidentMeetingScreen from "../screens/ResidentMeetingScreen";
import ResidentNewMeetingScreen from "../screens/ResidentNewMeetingScreen";
import ResidentProfileScreen from "../screens/ResidentProfileScreen";
import ResidentsScreen from "../screens/ResidentsScreen";
import StateSelectionScreen from "../screens/StateSelectionScreen";

export type RootStackParamList = {
  Clients: undefined;
  Residents: undefined;
  StateSelection: undefined;
  // Messages: undefined;
  // Schedule: undefined;
  // Resources: undefined;
  ClientProfile: {
    personId: string;
  };
  ResidentProfile: {
    personId: string;
  };
  ClientNewMeeting: {
    personId: string;
    fullName: string;
    displayPersonExternalId: string;
    primaryMetadata: string;
    meetingId: string;
  };
  ResidentNewMeeting: {
    personId: string;
    fullName: string;
    displayPersonExternalId: string;
    primaryMetadata: string;
    meetingId: string;
  };
  ClientMeeting: {
    personId: string;
    meetingId: string;
  };
  ResidentMeeting: {
    personId: string;
    meetingId: string;
  };
};

const Drawer = createDrawerNavigator<RootStackParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: "100%" },
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
      backBehavior="fullHistory"
    >
      <Drawer.Screen name="Clients" component={ClientsScreen} />
      <Drawer.Screen name="Residents" component={ResidentsScreen} />
      <Drawer.Screen name="StateSelection" component={StateSelectionScreen} />
      <Drawer.Screen name="ClientProfile" component={ClientProfileScreen} />
      <Drawer.Screen name="ResidentProfile" component={ResidentProfileScreen} />
      <Drawer.Screen
        name="ClientNewMeeting"
        component={ClientNewMeetingScreen}
      />
      <Drawer.Screen
        name="ResidentNewMeeting"
        component={ResidentNewMeetingScreen}
      />
      <Drawer.Screen name="ClientMeeting" component={ClientMeetingScreen} />
      <Drawer.Screen name="ResidentMeeting" component={ResidentMeetingScreen} />
    </Drawer.Navigator>
  );
}
