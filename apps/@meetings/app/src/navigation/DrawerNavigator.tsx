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

import { createDrawerNavigator } from "@react-navigation/drawer";
import React from "react";

import DrawerContent from "../components/DrawerContent";
import ClientsScreen from "../screens/ClientsScreen";
import MeetingScreen from "../screens/MeetingScreen";
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
    >
      <Drawer.Screen name="Clients" component={ClientsScreen} />
      <Drawer.Screen name="Residents" component={ResidentsScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="NewMeeting" component={NewMeetingScreen} />
      <Drawer.Screen name="Meeting" component={MeetingScreen} />
    </Drawer.Navigator>
  );
};
