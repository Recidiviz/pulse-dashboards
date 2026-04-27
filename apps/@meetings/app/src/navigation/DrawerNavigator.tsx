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
import { NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import DrawerContent from "../components/DrawerContent";
import { useAgencyConfigs } from "../context/AgencyConfigContext";
import { useStateSelection } from "../context/StateContext";
import { useUserContext } from "../context/UserContext";
import { NoAccessScreen } from "../pages/no-access";
import ClientMeetingScreen from "../screens/ClientMeetingScreen";
import ClientNewMeetingScreen from "../screens/ClientNewMeetingScreen";
import ClientProfileScreen from "../screens/ClientProfileScreen";
import ClientsScreen from "../screens/ClientsScreen";
import ResidentMeetingScreen from "../screens/ResidentMeetingScreen";
import ResidentNewMeetingScreen from "../screens/ResidentNewMeetingScreen";
import ResidentProfileScreen from "../screens/ResidentProfileScreen";
import ResidentsScreen from "../screens/ResidentsScreen";
import StateSelectionScreen from "../screens/StateSelectionScreen";
import Loading from "../shared/ui/Loading";

export type ClientsStackParamList = {
  Clients: undefined;
  ClientProfile: {
    personId: string;
  };
  ClientNewMeeting: {
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
};

export type ResidentsStackParamList = {
  Residents: undefined;
  ResidentProfile: {
    personId: string;
  };
  ResidentNewMeeting: {
    personId: string;
    fullName: string;
    displayPersonExternalId: string;
    primaryMetadata: string;
    meetingId: string;
  };
  ResidentMeeting: {
    personId: string;
    meetingId: string;
  };
};

export type RootStackParamList = {
  ClientsRoot: NavigatorScreenParams<ClientsStackParamList>;
  ResidentsRoot: NavigatorScreenParams<ResidentsStackParamList>;
  StateSelection: undefined;
};

const Drawer = createDrawerNavigator<RootStackParamList>();
const ClientsStackNavigator =
  createNativeStackNavigator<ClientsStackParamList>();
const ResidentsStackNavigator =
  createNativeStackNavigator<ResidentsStackParamList>();

export default function DrawerNavigator() {
  const { hasSupervisionAccess, hasFacilitiesAccess, isLoading, stateCode } =
    useUserContext();
  const { isLoading: isStateLoading } = useStateSelection();
  const { agencyConfigs, isLoading: isLoadingConfigs } = useAgencyConfigs();

  // Wait for user metadata and state context to load before checking access
  if (isLoading || isStateLoading || isLoadingConfigs) {
    return <Loading message="Loading..." />;
  }

  // If user's state code is not supported by the Meetings app, show NoAccessScreen
  // Only check for state users (non-Recidiviz) since Recidiviz users can select any state
  if (stateCode && stateCode !== "recidiviz") {
    const normalizedStateCode = stateCode.toUpperCase();
    const isSupported = normalizedStateCode in agencyConfigs;
    if (!isSupported) {
      return <NoAccessScreen />;
    }
  }

  // If user has no access to any route, show NoAccessScreen
  if (!hasSupervisionAccess && !hasFacilitiesAccess) {
    return <NoAccessScreen />;
  }

  const getInitialRouteName = () => {
    if (hasSupervisionAccess) {
      return "ClientsRoot";
    }
    if (hasFacilitiesAccess) {
      return "ResidentsRoot";
    }
    return undefined;
  };

  return (
    <Drawer.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { width: "100%" },
        swipeEnabled: true,
      }}
      backBehavior="fullHistory"
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      {hasSupervisionAccess && (
        <Drawer.Screen name="ClientsRoot" component={ClientsStack} />
      )}
      {hasFacilitiesAccess && (
        <Drawer.Screen name="ResidentsRoot" component={ResidentsStack} />
      )}
      <Drawer.Screen name="StateSelection" component={StateSelectionScreen} />
    </Drawer.Navigator>
  );
}

const ClientsStack = () => (
  <ClientsStackNavigator.Navigator
    initialRouteName="Clients"
    screenOptions={{
      gestureEnabled: true,
      gestureDirection: "horizontal",
      headerShown: false,
      fullScreenGestureEnabled: true,
    }}
  >
    <ClientsStackNavigator.Screen name="Clients" component={ClientsScreen} />
    <ClientsStackNavigator.Screen
      name="ClientProfile"
      component={ClientProfileScreen}
    />
    <ClientsStackNavigator.Screen
      name="ClientNewMeeting"
      component={ClientNewMeetingScreen}
    />
    <ClientsStackNavigator.Screen
      name="ClientMeeting"
      component={ClientMeetingScreen}
    />
  </ClientsStackNavigator.Navigator>
);

const ResidentsStack = () => (
  <ResidentsStackNavigator.Navigator
    initialRouteName="Residents"
    screenOptions={{
      gestureEnabled: true,
      gestureDirection: "horizontal",
      headerShown: false,
      fullScreenGestureEnabled: true,
    }}
  >
    <ResidentsStackNavigator.Screen
      name="Residents"
      component={ResidentsScreen}
    />
    <ResidentsStackNavigator.Screen
      name="ResidentProfile"
      component={ResidentProfileScreen}
    />
    <ResidentsStackNavigator.Screen
      name="ResidentNewMeeting"
      component={ResidentNewMeetingScreen}
    />
    <ResidentsStackNavigator.Screen
      name="ResidentMeeting"
      component={ResidentMeetingScreen}
    />
  </ResidentsStackNavigator.Navigator>
);
