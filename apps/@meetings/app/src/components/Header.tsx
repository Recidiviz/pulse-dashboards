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

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import MenuScreen from "../screens/MenuScreen";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { navigate } = useNavigation<HeaderNavProp>();
  const route = useRoute<HeaderRouteProp>();
  const { clearSession } = useAuth0();

  const handleDropdownMenuPress = (callback: () => void) => {
    setProfileDropdownOpen(false);
    callback();
  };

  const onLogout = async () => {
    await clearSession();
  };

  return (
    <SafeAreaView edges={["top"]} className="z-10 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 md:hidden">
        {showDrawer && (
          <TouchableOpacity onPress={() => setDrawerOpen(true)}>
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
        <TouchableOpacity onPress={() => navigate("Home")}>
          <Image
            source={Icons.Brand}
            className="!h-6 !w-24"
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View className="h-full flex-row items-center gap-x-6">
          <DesktopMenuItem
            title="Home"
            isActive={route.name === "Home"}
            onPress={() => navigate("Home")}
          />
          <DesktopMenuItem
            title="Clients"
            isActive={route.name === "Clients"}
            onPress={() => navigate("Clients")}
          />
          <View className="relative">
            <TouchableOpacity
              className="flex-row items-center gap-x-1"
              onPress={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <ImageBackground
                source={Icons.BgAvatar}
                className="size-8 items-center justify-center overflow-hidden rounded-full"
                imageClassName="!size-8"
              >
                <Text className="font-inter text-base text-white">SS</Text>
              </ImageBackground>
              <Image
                source={profileDropdownOpen ? Icons.ArrowUp : Icons.ArrowDown}
                className="!size-4"
              />
            </TouchableOpacity>
            {profileDropdownOpen && (
              <View className="absolute right-0 top-9 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm">
                <ScrollView contentContainerClassName="gap-2">
                  <TouchableOpacity
                    onPress={() =>
                      handleDropdownMenuPress(() => console.log("Settings"))
                    }
                  >
                    <Text className="whitespace-nowrap font-inter text-sm text-gray-700">
                      Settings
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleDropdownMenuPress(() =>
                        console.log("Contact Support"),
                      )
                    }
                  >
                    <Text className="whitespace-nowrap font-inter text-sm text-gray-700">
                      Contact Support
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDropdownMenuPress(onLogout)}
                  >
                    <Text className="whitespace-nowrap font-inter text-sm text-[#B42D2D]">
                      Log Out
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={drawerOpen}
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <MenuScreen onClose={() => setDrawerOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default Header;
