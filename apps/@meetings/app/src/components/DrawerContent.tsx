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
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import React from "react";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import MobileMenuItem from "../components/MobileMenuItem";
import MobileMenuTextItem from "./MobileMenuTextItem";

const DrawerContent = (props: DrawerContentComponentProps) => {
  const insets = useSafeAreaInsets();
  const { user, clearSession } = useAuth0();
  const { navigation } = props;

  const onLogout = async () => {
    await clearSession();
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flex: 1,
        paddingBottom: 0,
        paddingStart: 0,
        paddingEnd: 0,
      }}
    >
      <View className="flex-row items-center justify-between bg-white px-4 pb-4">
        <TouchableOpacity onPress={() => navigation.closeDrawer()}>
          <Image source={Icons.Cross} className="!size-6" />
        </TouchableOpacity>
        <Text className="font-inter text-lg font-semibold leading-[22px] text-primary">
          Navigation
        </Text>
        <TouchableOpacity onPress={() => console.log("Bell pressed")}>
          <Image source={Icons.Bell} className="!size-6" />
        </TouchableOpacity>
      </View>

      <View className="w-full px-2">
        <View className="m-[15px] h-[78px] w-full flex-row items-center self-center rounded-[15px] bg-[#C1E3D83B] p-4">
          <ImageBackground
            source={Icons.BgAvatar}
            className="mr-3 size-12 items-center justify-center overflow-hidden rounded-full"
          >
            <Text className="font-inter text-white">SS</Text>
          </ImageBackground>
          <View>
            <Text className="font-inter text-base font-semibold text-primary">
              {user?.name || "User name not found"}
            </Text>
            <Text className="font-inter text-sm text-[#355362D9]">
              {user?.email || "User email not found"}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1 px-4">
        <MobileMenuItem
          icon={Icons.Clients}
          title="Clients"
          screen="Clients"
          onPress={navigation.closeDrawer}
        />
        <MobileMenuItem
          icon={Icons.Clients}
          title="Residents"
          screen="Residents"
          onPress={navigation.closeDrawer}
        />
      </View>

      <View
        className="flex flex-col gap-1.5 bg-gray-100 px-4"
        style={{ paddingBottom: insets.bottom || 16, paddingTop: 16 }}
      >
        <MobileMenuTextItem title="Settings" />
        <MobileMenuTextItem title="Contact Support" />
        <MobileMenuTextItem title="Log Out" onPress={onLogout} color="danger" />
      </View>
    </DrawerContentScrollView>
  );
};

export default DrawerContent;
