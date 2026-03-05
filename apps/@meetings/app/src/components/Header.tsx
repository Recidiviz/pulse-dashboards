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
  Link,
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
import LogoutIcon from "react-native-heroicons/outline/LogoutIcon";
import MenuIcon from "react-native-heroicons/outline/MenuIcon";
import SupportIcon from "react-native-heroicons/outline/SupportIcon";
import BellIcon from "react-native-heroicons/solid/BellIcon";
import { SafeAreaView } from "react-native-safe-area-context";

import WordmarkSvg from "~@meetings/app/assets/icons/wordmark.svg";
import BgAvatarImage from "~@meetings/app/assets/images/bg-avatar.png";

import { useStateSelection } from "../context/StateContext";
import { useUserContext } from "../context/UserContext";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { getInitials } from "../utils/format";
import DesktopMenuItem from "./DesktopMenuItem";

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
  const { onLogout, name, email, hasSupervisionAccess, hasFacilitiesAccess } =
    useUserContext();
  const { canSelectStateCode, currentStateName } = useStateSelection();

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
                className="flex-row items-center gap-x-1 rounded-full border border-transparent p-1.5 transition-all duration-300 hover:border-[#35536226]"
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
                <ScrollView contentContainerClassName="gap-1">
                  <TouchableOpacity
                    onPress={() =>
                      handleDropdownMenuPress(() => console.log("Settings"))
                    }
                  >
                    <View className="mb-1 flex min-w-[337px] cursor-default flex-row items-center gap-3 rounded-2xl border border-transparent bg-[#C1E3D83B] p-3.5">
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
                        <Text className="font-inter text-base font-normal text-[#355362D9]">
                          {email ?? "testuser@mail.com"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {canSelectStateCode && (
                    <Link
                      screen="StateSelection"
                      onPress={() => setProfileDropdownOpen(false)}
                      params={{}}
                      className="group flex flex-row items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 hover:bg-[#C1E3D83B]"
                    >
                      <SupportIcon className="stroke-muted transition-all duration-300 group-hover:stroke-[#006C67]" />
                      <Text className="whitespace-nowrap font-inter text-base font-medium leading-5 text-[#355362D9] transition-all duration-300 group-hover:text-[#006C67]">
                        Settings
                      </Text>
                      {currentStateName && (
                        <Text className="ml-auto whitespace-nowrap font-inter text-xs text-gray-500">
                          Current state: {currentStateName}
                        </Text>
                      )}
                    </Link>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDropdownMenuPress(onLogout)}
                  >
                    <View className="group flex flex-row items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 hover:bg-[#C1E3D83B]">
                      <LogoutIcon className="stroke-muted transition-all duration-300 group-hover:stroke-[#006C67]" />
                      <Text className="whitespace-nowrap font-inter text-base font-medium leading-5 text-[#355362D9] transition-all duration-300 group-hover:text-[#006C67]">
                        Log Out
                      </Text>
                    </View>
                  </TouchableOpacity>
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
