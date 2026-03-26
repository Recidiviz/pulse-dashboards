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
import clsx from "clsx";
import React, { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";
import ExternalLinkIcon from "react-native-heroicons/outline/ExternalLinkIcon";
import MenuIcon from "react-native-heroicons/outline/MenuIcon";
import { SafeAreaView } from "react-native-safe-area-context";

import WordmarkSvg from "../assets/icons/wordmark.svg";
import BgAvatarImage from "../assets/images/bg-avatar.png";
import { useStateSelection } from "../context/StateContext";
import { useUserContext } from "../context/UserContext";
import { IS_PROD } from "../env";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { Typography } from "../shared/ui/Typography";
import { getInitials } from "../utils/format";
import DesktopMenuItem from "./DesktopMenuItem";
import { ProfileMenuItem } from "./ProfileMenuItem";

type HeaderNavProp = NativeStackNavigationProp<RootStackParamList>;
type HeaderRouteProp = RouteProp<RootStackParamList>;

interface HeaderProps {
  showDrawer?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showDrawer = true }) => {
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
    <SafeAreaView edges={["top"]} className="z-10 bg-primary">
      <View className="flex-row items-center justify-between px-4 py-3 md:hidden">
        {showDrawer && (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MenuIcon className="text-tertiary" />
          </TouchableOpacity>
        )}
      </View>
      <View className="hidden h-16 flex-row items-center justify-between bg-primary px-4 md:flex lg:px-10">
        <TouchableOpacity
          testID="logo-button"
          onPress={() => navigation.navigate("Clients")}
        >
          <WordmarkSvg />
        </TouchableOpacity>

        <View className="h-full flex-row items-center gap-x-6">
          {hasSupervisionAccess && (
            <DesktopMenuItem
              isActive={route.name.includes("Client")}
              screen="Clients"
            >
              Clients
            </DesktopMenuItem>
          )}
          {hasFacilitiesAccess && (
            <DesktopMenuItem
              isActive={route.name.includes("Resident")}
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
                className={clsx(
                  "flex-row items-center gap-x-1 rounded-full border p-1.5 transition-all duration-300",
                  profileDropdownOpen
                    ? "border-brand hover:border-brand"
                    : "border-transparent hover:border-subtle",
                )}
              >
                <ImageBackground
                  source={BgAvatarImage}
                  className="size-8 items-center justify-center overflow-hidden rounded-full"
                  imageClassName="!size-8"
                >
                  <Typography className="text-base text-on-brand">
                    {name ? getInitials(name) : "SS"}
                  </Typography>
                </ImageBackground>
                {profileDropdownOpen ? (
                  <ChevronUpIcon className="size-4 stroke-[3px] text-primary" />
                ) : (
                  <ChevronDownIcon className="size-4 stroke-[3px] text-primary" />
                )}
              </View>
            </TouchableOpacity>
            {profileDropdownOpen && (
              <View className="absolute right-0 top-16 rounded-[20px] bg-primary p-2 shadow-sm">
                <ScrollView contentContainerClassName="gap-1 cursor-pointer">
                  <TouchableOpacity
                    onPress={() =>
                      handleDropdownMenuPress(() => console.log("Settings"))
                    }
                  >
                    <View className="mb-1 flex min-w-[337px] cursor-default flex-row items-center gap-3 rounded-2xl bg-brand-light-secondary p-3.5">
                      <ImageBackground
                        source={BgAvatarImage}
                        className="size-12 items-center justify-center overflow-hidden rounded-full"
                        imageClassName="!size-12"
                      >
                        <Typography className="text-2xl leading-6 text-on-brand">
                          {name ? getInitials(name) : "SS"}
                        </Typography>
                      </ImageBackground>
                      <View className="flex flex-col justify-between">
                        <Typography className="text-base font-semibold leading-5 text-primary">
                          {name ?? "Test User"}
                        </Typography>
                        <Typography className="text-base font-normal text-secondary">
                          {email ?? "testuser@mail.com"}
                        </Typography>
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
                        <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-secondary" />
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
                        <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-secondary" />
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
                        <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-secondary" />
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
