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

import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth0 } from "react-native-auth0";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import MenuItem from "../components/MenuItem";

const MenuTextItem = ({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity onPress={onPress}>
    <Text className="my-2 text-base font-medium text-gray-500">{title}</Text>
  </TouchableOpacity>
);

const MenuScreen = ({ onClose }: { onClose: () => void }) => {
  const { clearSession } = useAuth0();
  const navigation = useNavigation();

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen as never);
    onClose();
  };

  const onLogout = async () => {
    await clearSession();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-row items-center justify-between border-b border-gray-300 px-5 pb-3">
        <TouchableOpacity onPress={onClose}>
          <Image
            source={Icons.Cross}
            className="size-6"
            style={{ resizeMode: "contain" }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log("Bell pressed")}>
          <Image
            source={Icons.Bell}
            className="size-6"
            style={{ resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="p-[16]">
        <MenuItem
          icon={Icons.Home}
          title="Home"
          onPress={() => handleMenuPress("Home")}
        />
        <MenuItem
          icon={Icons.Trends}
          title="Trends"
          onPress={() => handleMenuPress("Trends")}
        />
        <MenuItem
          icon={Icons.Clients}
          title="Clients"
          onPress={() => handleMenuPress("Clients")}
        />
        <MenuItem
          icon={Icons.Messages}
          title="Messages"
          badge={2}
          onPress={() => handleMenuPress("Messages")}
        />
        <MenuItem
          icon={Icons.Schedule}
          title="Schedule"
          onPress={() => handleMenuPress("Schedule")}
        />
        <MenuItem
          icon={Icons.Resources}
          title="Resources"
          onPress={() => handleMenuPress("Resources")}
        />

        <View className="mt-12 border-t border-gray-300 pt-5">
          <MenuTextItem title="Settings" />
          <MenuTextItem title="Contact Support" />
          <MenuTextItem title="Log Out" onPress={onLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MenuScreen;
