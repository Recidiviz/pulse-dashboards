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
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import MobileMenuItem from "../components/MobileMenuItem";

const MenuTextItem = ({
  title,
  onPress,
  color = "default",
}: {
  title: string;
  onPress?: () => void;
  color?: "default" | "danger";
}) => {
  const colorClasses: Record<"default" | "danger", string> = {
    default: "text-gray-600",
    danger: "text-[#B42D2D]",
  };

  return (
    <TouchableOpacity onPress={onPress} className="py-4">
      <Text className={`text-base font-medium ${colorClasses[color]}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

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
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <TouchableOpacity onPress={onClose}>
          <Image source={Icons.Cross} className="!size-6" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-primary">Navigation</Text>
        <TouchableOpacity onPress={() => console.log("Bell pressed")}>
          <Image source={Icons.Bell} className="!size-6" />
        </TouchableOpacity>
      </View>

      <View className="w-full px-4">
        <View className="m-[15px] h-[78px] w-full flex-row items-center self-center rounded-[15px] bg-[#C1E3D83B] p-4">
          <ImageBackground
            source={Icons.BgAvatar}
            className="mr-3 size-12 items-center justify-center overflow-hidden rounded-full"
          >
            <Text className="text-white">SS</Text>
          </ImageBackground>
          <View>
            <Text className="text-base font-semibold text-primary">
              Sam Smith
            </Text>
            <Text className="text-sm text-[#355362D9]">user@example.com</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-xs text-gray-500">Global</Text>
        <MobileMenuItem
          icon={Icons.Home}
          title="Home"
          onPress={() => handleMenuPress("Home")}
        />
        {/* <MobileMenuItem
          icon={Icons.Trends}
          title="Trends"
          onPress={() => handleMenuPress("Trends")}
        /> */}
        <MobileMenuItem
          icon={Icons.Clients}
          title="Clients"
          onPress={() => handleMenuPress("Clients")}
        />
        {/* <MobileMenuItem
          icon={Icons.Chat}
          title="Messages"
          badge={1}
          onPress={() => handleMenuPress("Messages")}
        />

        <Text className="mt-[15px] text-xs text-gray-500">Tools</Text>
        <MobileMenuItem
          icon={Icons.Schedule}
          title="Schedule"
          onPress={() => handleMenuPress("Schedule")}
        />
        <MobileMenuItem
          icon={Icons.Resources}
          title="Resources"
          onPress={() => handleMenuPress("Resources")}
        /> */}
      </ScrollView>

      <View className="bg-gray-200 px-4 py-[26px]">
        <MenuTextItem title="Settings" />
        <MenuTextItem title="Contact Support" />
        <MenuTextItem title="Log Out" onPress={onLogout} color="danger" />
      </View>
    </SafeAreaView>
  );
};

export default MenuScreen;
