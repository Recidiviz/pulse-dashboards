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

import {
  DrawerActions,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";
import ExternalLinkIcon from "react-native-heroicons/outline/ExternalLinkIcon";
import MenuIcon from "react-native-heroicons/outline/MenuIcon";
import BellIcon from "react-native-heroicons/solid/BellIcon";
import { SafeAreaView } from "react-native-safe-area-context";

import WordmarkSvg from "~@meetings/app/assets/icons/wordmark.svg";
import BgAvatarImage from "~@meetings/app/assets/images/bg-avatar.png";

import { useStateSelection } from "../context/StateContext";
import { useUserContext } from "../context/UserContext";
import { IS_PROD } from "../env";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { getInitials } from "../utils/format";
import DesktopMenuItem from "./DesktopMenuItem";
import { ProfileMenuItem } from "./ProfileMenuItem";

type HeaderNavProp = NativeStackNavigationProp<RootStackParamList>;
type HeaderRouteProp = RouteProp<RootStackParamList>;

interface HeaderProps {
  showBell?: boolean;
  showDrawer?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  showBell = true,
  showDrawer = true,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigation = useNavigation<HeaderNavProp>();
  const route = useRoute<HeaderRouteProp>();
  const {
    onLogout,
    name,
    email,
    hasSupervisionAccess,
    hasFacilitiesAccess,
    hasSupervisionAssistantAccess,
    hasFacilitiesAssistantAccess,
    hasCasePlanningAssistantAccess,
  } = useUserContext();
  const { canSelectStateCode, currentStateName } = useStateSelection();

  const dashboardUrl = IS_PROD
    ? "https://dashboard.recidiviz.org"
    : "https://dashboard-staging.recidiviz.org";

  const cpaUrl = IS_PROD
    ? "https://plan.recidiviz.org"
    : "https://plan-staging.recidiviz.org";

  const handleDropdownMenuPress = (callback: () => void) => {
    setProfileDropdownOpen(false);
    callback();
  };

  return (
    <SafeAreaView edges={["top"]} className="z-10 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 md:hidden">
        {showDrawer && (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MenuIcon className="text-muted" />
          </TouchableOpacity>
        )}

        {showBell && (
          <TouchableOpacity onPress={() => console.log("Notification screen")}>
            <BellIcon className="text-muted" />
          </TouchableOpacity>
        )}
      </View>

      <View className="hidden h-16 flex-row items-center justify-between bg-white px-4 md:flex lg:px-10">
        <TouchableOpacity
          testID="logo-button"
          onPress={() => navigation.navigate("Clients")}
        >
          <WordmarkSvg />
        </TouchableOpacity>

        <View className="h-full flex-row items-center gap-x-6">
          {hasSupervisionAccess && (
            <DesktopMenuItem
              isActive={route.name === "Clients"}
              screen="Clients"
            >
              Clients
            </DesktopMenuItem>
          )}
          {hasFacilitiesAccess && (
            <DesktopMenuItem
              isActive={route.name === "Residents"}
              screen="Residents"
            >
              Residents
            </DesktopMenuItem>
          )}
          <View className="relative">
            <TouchableOpacity
              onPress={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <View
                className="flex-row items-center gap-x-1 rounded-full border border-transparent p-1.5 transition-all duration-300 hover:border-gray/15"
                style={{ borderColor: profileDropdownOpen ? "#00665F" : "" }}
              >
                <ImageBackground
                  source={BgAvatarImage}
                  className="size-8 items-center justify-center overflow-hidden rounded-full"
                  imageClassName="!size-8"
                >
                  <Text className="font-inter text-base text-white">
                    {name ? getInitials(name) : "SS"}
                  </Text>
                </ImageBackground>
                {profileDropdownOpen ? (
                  <ChevronUpIcon className="size-4 stroke-[3px] text-muted" />
                ) : (
                  <ChevronDownIcon className="size-4 stroke-[3px] text-muted" />
                )}
              </View>
            </TouchableOpacity>
            {profileDropdownOpen && (
              <View className="absolute right-0 top-16 rounded-[20px] bg-white p-2 shadow-sm">
                <ScrollView contentContainerClassName="gap-1 cursor-pointer">
                  <TouchableOpacity
                    onPress={() =>
                      handleDropdownMenuPress(() => console.log("Settings"))
                    }
                  >
                    <View className="mb-1 flex min-w-[337px] cursor-default flex-row items-center gap-3 rounded-2xl border border-transparent bg-soft-green/23 p-3.5">
                      <ImageBackground
                        source={BgAvatarImage}
                        className="size-12 items-center justify-center overflow-hidden rounded-full"
                        imageClassName="!size-12"
                      >
                        <Text className="font-inter text-2xl leading-6 text-white">
                          {name ? getInitials(name) : "SS"}
                        </Text>
                      </ImageBackground>
                      <View className="flex flex-col justify-between">
                        <Text className="font-inter text-base font-semibold leading-5">
                          {name ?? "Test User"}
                        </Text>
                        <Text className="font-inter text-base font-normal text-gray/85">
                          {email ?? "testuser@mail.com"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {canSelectStateCode && (
                    <ProfileMenuItem
                      link={{
                        screen: "StateSelection",
                        onPress: () => setProfileDropdownOpen(false),
                      }}
                      label="Profile"
                      helperText={`Current state: ${currentStateName}`}
                    />
                  )}
                  {hasSupervisionAssistantAccess && (
                    <ProfileMenuItem
                      pressable={{
                        onPress: () =>
                          handleDropdownMenuPress(() =>
                            window.open(
                              dashboardUrl,
                              "_blank",
                              "noopener,noreferrer",
                            ),
                          ),
                      }}
                      label="Go to Supervision Assistant"
                      icon={
                        <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-muted" />
                      }
                    />
                  )}
                  {hasFacilitiesAssistantAccess && (
                    <ProfileMenuItem
                      pressable={{
                        onPress: () =>
                          handleDropdownMenuPress(() =>
                            window.open(
                              dashboardUrl,
                              "_blank",
                              "noopener,noreferrer",
                            ),
                          ),
                      }}
                      label="Go to Facilities Assistant"
                      icon={
                        <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-muted" />
                      }
                    />
                  )}
                  {hasCasePlanningAssistantAccess && (
                    <ProfileMenuItem
                      pressable={{
                        onPress: () =>
                          handleDropdownMenuPress(() =>
                            window.open(
                              cpaUrl,
                              "_blank",
                              "noopener,noreferrer",
                            ),
                          ),
                      }}
                      label="Go to Case Planning Assistant"
                      icon={
                        <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-muted" />
                      }
                    />
                  )}
                  <ProfileMenuItem
                    pressable={{
                      onPress: () => handleDropdownMenuPress(onLogout),
                    }}
                    label="Log Out"
                  />
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Header;
