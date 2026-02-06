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
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import Logout from "../../assets/icons/logout.svg";
import Support from "../../assets/icons/support.svg";
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
  const { onLogout, name, email } = useUserContext();
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
            <Image
              source={Icons.Menu}
              className="!size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {showBell && (
          <TouchableOpacity onPress={() => console.log("Notification screen")}>
            <Image
              source={Icons.Bell}
              className="!size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      <View className="hidden h-16 flex-row items-center justify-between bg-white px-4 md:flex lg:px-10">
        <TouchableOpacity
          testID="logo-button"
          onPress={() => navigation.navigate("Clients")}
        >
          <Image
            source={Icons.Brand}
            className="!h-6 !w-24"
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View className="h-full flex-row items-center gap-x-6">
          <DesktopMenuItem isActive={route.name === "Clients"} screen="Clients">
            Clients
          </DesktopMenuItem>
          <DesktopMenuItem
            isActive={route.name === "Residents"}
            screen="Residents"
          >
            Residents
          </DesktopMenuItem>
          <View className="relative">
            <TouchableOpacity
              onPress={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <View
                className="flex-row items-center gap-x-1 border border-transparent hover:border-[#35536226] rounded-full transition-all duration-300 p-1.5"
                style={{ borderColor: profileDropdownOpen ? "#00665F" : "" }}
              >
                <ImageBackground
                  source={Icons.BgAvatar}
                  className="size-8 items-center justify-center overflow-hidden rounded-full"
                  imageClassName="!size-8"
                >
                  <Text className="font-inter text-base text-white">{name ? getInitials(name) : "SS"}</Text>
                </ImageBackground>
                <Image
                  source={profileDropdownOpen ? Icons.ArrowUp : Icons.ArrowDown}
                  className="!size-4"
                />
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
                    <View className="bg-[#C1E3D83B] border border-transparent p-3.5 rounded-2xl flex flex-row items-center gap-3 min-w-[337px] mb-1 cursor-default">
                      <ImageBackground
                        source={Icons.BgAvatar}
                        className="size-12 items-center justify-center overflow-hidden rounded-full"
                        imageClassName="!size-12"
                      >
                        <Text className="font-inter text-2xl leading-6 text-white">{name ? getInitials(name) : "SS"}</Text>
                      </ImageBackground>
                      <View className="flex flex-col justify-between">
                        <Text className="font-semibold font-inter text-base leading-5">{name ?? "Test User"}</Text>
                        <Text className="font-normal font-inter text-base text-[#355362D9]">{email ?? "testuser@mail.com"}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {canSelectStateCode && (
                    <Link
                      screen="StateSelection"
                      onPress={() => setProfileDropdownOpen(false)}
                      params={{}}
                      className="flex flex-row items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#C1E3D83B] group transition-all duration-300"
                    >
                      <Support width={24} height={24} className="fill-[#35536280] group-hover:fill-[#006C67] transition-all duration-300" />
                      <Text className="whitespace-nowrap font-inter font-medium text-base leading-5 text-[#355362D9] group-hover:text-[#006C67] transition-all duration-300">
                        Settings
                      </Text>
                      {currentStateName && (
                        <Text className="whitespace-nowrap font-inter text-xs text-gray-500 ml-auto">
                          Current state: {currentStateName}
                        </Text>
                      )}
                    </Link>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDropdownMenuPress(onLogout)}
                  >
                    <View className="flex flex-row items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#C1E3D83B] group transition-all duration-300">
                      <Logout width={24} height={24} className="stroke-[#35536280] stroke-2 group-hover:stroke-[#006C67] transition-all duration-300" />
                      <Text className="whitespace-nowrap font-inter font-medium text-base leading-5 text-[#355362D9] group-hover:text-[#006C67] transition-all duration-300">
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
