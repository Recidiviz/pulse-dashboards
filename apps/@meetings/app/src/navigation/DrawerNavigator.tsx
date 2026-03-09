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

import { createDrawerNavigator, DrawerContent } from "@react-navigation/drawer";
import React from "react";

import Loading from "../components/Loading";
import {
  AVAILABLE_STATE_CODES,
  useStateSelection,
} from "../context/StateContext";
import { useUserContext } from "../context/UserContext";
import ClientMeetingScreen from "../screens/ClientMeetingScreen";
import ClientNewMeetingScreen from "../screens/ClientNewMeetingScreen";
import ClientProfileScreen from "../screens/ClientProfileScreen";
import ClientsScreen from "../screens/ClientsScreen";
import NoAccessScreen from "../screens/NoAccessScreen";
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
  const { hasSupervisionAccess, hasFacilitiesAccess, isLoading, stateCode } =
    useUserContext();
  const { isLoading: isStateLoading } = useStateSelection();

  // Wait for user metadata and state context to load before checking access
  if (isLoading || isStateLoading) {
    return <Loading message="Loading..." />;
  }

  // If user's state code is not supported by the Meetings app, show NoAccessScreen
  // Only check for state users (non-Recidiviz) since Recidiviz users can select any state
  if (stateCode && stateCode !== "recidiviz") {
    const normalizedStateCode = stateCode.toUpperCase();
    const isSupported = AVAILABLE_STATE_CODES.some(
      (s) => s.code === normalizedStateCode,
    );
    if (!isSupported) {
      return <NoAccessScreen />;
    }
  }

  // If user has no access to any route, show NoAccessScreen
  if (!hasSupervisionAccess && !hasFacilitiesAccess) {
    return <NoAccessScreen />;
  }

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: "100%" },
      }}
      backBehavior="fullHistory"
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      {hasSupervisionAccess && (
        <>
          <Drawer.Screen name="Clients" component={ClientsScreen} />
          <Drawer.Screen name="ClientProfile" component={ClientProfileScreen} />
          <Drawer.Screen
            name="ClientNewMeeting"
            component={ClientNewMeetingScreen}
          />
          <Drawer.Screen name="ClientMeeting" component={ClientMeetingScreen} />
        </>
      )}
      {hasFacilitiesAccess && (
        <>
          <Drawer.Screen name="Residents" component={ResidentsScreen} />
          <Drawer.Screen
            name="ResidentProfile"
            component={ResidentProfileScreen}
          />
          <Drawer.Screen
            name="ResidentNewMeeting"
            component={ResidentNewMeetingScreen}
          />
          <Drawer.Screen
            name="ResidentMeeting"
            component={ResidentMeetingScreen}
          />
        </>
      )}
      <Drawer.Screen name="StateSelection" component={StateSelectionScreen} />
    </Drawer.Navigator>
  );
}
