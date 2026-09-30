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
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { useAgencyConfigs } from "~@meetings/app/entities/agency-config";
import { useStateSelection } from "~@meetings/app/entities/state-code";
import { useGetUser, useUserContext } from "~@meetings/app/entities/user";
import { AgencyConfigScreen } from "~@meetings/app/pages/agency-config";
import { ClientMeetingScreen } from "~@meetings/app/pages/client-meeting";
import { ClientNewMeetingScreen } from "~@meetings/app/pages/client-new-meeting";
import { ClientProfileScreen } from "~@meetings/app/pages/client-profile";
import { ClientsScreen } from "~@meetings/app/pages/clients";
import { EditCaseNoteScreen } from "~@meetings/app/pages/meeting-case-note-edit";
import { NoAccessScreen } from "~@meetings/app/pages/no-access";
import { OnboardingScreen } from "~@meetings/app/pages/onboarding";
import { ResidentMeetingScreen } from "~@meetings/app/pages/resident-meeting";
import { ResidentNewMeetingScreen } from "~@meetings/app/pages/resident-new-meeting";
import { ResidentProfileScreen } from "~@meetings/app/pages/resident-profile";
import { ResidentsScreen } from "~@meetings/app/pages/residents";
import { StateSelectionScreen } from "~@meetings/app/pages/state-selection";
import {
  ClientsStackParamList,
  IS_PROD,
  ResidentsStackParamList,
  RootStackParamList,
} from "~@meetings/app/shared/config";
import { usePlatform } from "~@meetings/app/shared/lib/platform";
import Loading from "~@meetings/app/shared/ui/Loading";
import { DrawerContent } from "~@meetings/app/widgets/navigation-drawer";

const Drawer = createDrawerNavigator<RootStackParamList>();
const ClientsStackNavigator =
  createNativeStackNavigator<ClientsStackParamList>();
const ResidentsStackNavigator =
  createNativeStackNavigator<ResidentsStackParamList>();

export default function DrawerNavigator() {
  const {
    hasSupervisionAccess,
    hasFacilitiesAccess,
    isLoading,
    stateCode,
    isRecidivizUser,
  } = useUserContext();
  const { isLoading: isStateLoading } = useStateSelection();
  const { agencyConfigs, isPending: isConfigsPending } = useAgencyConfigs();
  const { isMobile, isWeb } = usePlatform();
  const { data: userData, isLoading: isUserLoading } = useGetUser();

  const hasSeenOnboarding = userData ? userData.hasSeenOnboarding : false;

  // Wait for user metadata and state context to load before checking access
  if (isLoading || isStateLoading || isConfigsPending || isUserLoading) {
    return <Loading message="Loading..." />;
  }

  // On native, every block shows the mobile copy; web keeps the generic message
  const noAccessMessage = isMobile
    ? "Recidiviz for Android / iOS isn't available yet in your state. For more details, contact your account manager."
    : undefined;

  // Recidiviz users can select any state, so only check state users
  if (stateCode && stateCode !== "recidiviz") {
    const agencyConfig = agencyConfigs[stateCode.toUpperCase()];
    // Some states allow web access only; Recidiviz users are exempt
    if (
      !agencyConfig ||
      (isMobile && !isRecidivizUser && agencyConfig.mobileAppEnabled === false)
    ) {
      return <NoAccessScreen errorMessage={noAccessMessage} />;
    }
  }

  if (!hasSupervisionAccess && !hasFacilitiesAccess) {
    return <NoAccessScreen errorMessage={noAccessMessage} />;
  }

  const getInitialRouteName = () => {
    // Temporarily limit this to non-Recidiviz users on staging,
    // which effectively hides it from all users while development is still in progress.
    if (!hasSeenOnboarding && !isRecidivizUser && !IS_PROD) {
      return "Onboarding";
    }
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
        // swipeEnabled: hasSeenOnboarding,
        swipeEnabled: true,
      }}
      backBehavior="fullHistory"
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="Onboarding" component={OnboardingScreen} />
      {hasSupervisionAccess && (
        <Drawer.Screen name="ClientsRoot" component={ClientsStack} />
      )}
      {hasFacilitiesAccess && (
        <Drawer.Screen name="ResidentsRoot" component={ResidentsStack} />
      )}
      <Drawer.Screen name="StateSelection" component={StateSelectionScreen} />
      {/* Web only: AgencyConfigScreen renders a Monaco editor, which is DOM-based
          and throws an Invariant Violation on native. */}
      {isRecidivizUser && isWeb && (
        <Drawer.Screen name="AgencyConfig" component={AgencyConfigScreen} />
      )}
    </Drawer.Navigator>
  );
}

const ClientsStack = () => {
  const { isMobile } = usePlatform();

  return (
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
      {/* Native only: web keeps inline editing on the meeting screen */}
      {isMobile && (
        <ClientsStackNavigator.Screen
          name="ClientEditCaseNote"
          component={EditCaseNoteScreen}
        />
      )}
    </ClientsStackNavigator.Navigator>
  );
};

const ResidentsStack = () => {
  const { isMobile } = usePlatform();

  return (
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
      {/* Native only: web keeps inline editing on the meeting screen */}
      {isMobile && (
        <ResidentsStackNavigator.Screen
          name="ResidentEditCaseNote"
          component={EditCaseNoteScreen}
        />
      )}
    </ResidentsStackNavigator.Navigator>
  );
};
