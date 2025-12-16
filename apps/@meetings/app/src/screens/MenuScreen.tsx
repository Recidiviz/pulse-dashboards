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
      <Text
        className={`font-inter text-base font-medium ${colorClasses[color]}`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const MenuScreen = ({ onClose }: { onClose: () => void }) => {
  const { clearSession } = useAuth0();
  const navigation = useNavigation();

  const { user } = useAuth0();

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen as never);
    onClose();
  };

  const onLogout = async () => {
    await clearSession();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="flex-row justify-between items-center bg-white px-4 py-3 border-gray-200 border-b">
        <TouchableOpacity onPress={onClose}>
          <Image source={Icons.Cross} className="!size-6" />
        </TouchableOpacity>
        <Text className="font-inter font-semibold text-primary text-base">
          Navigation
        </Text>
        <TouchableOpacity onPress={() => console.log("Bell pressed")}>
          <Image source={Icons.Bell} className="!size-6" />
        </TouchableOpacity>
      </View>

      <View className="px-4 w-full">
        <View className="flex-row items-center self-center bg-[#C1E3D83B] m-[15px] p-4 rounded-[15px] w-full h-[78px]">
          <ImageBackground
            source={Icons.BgAvatar}
            className="justify-center items-center mr-3 rounded-full size-12 overflow-hidden"
          >
            <Text className="font-inter text-white">SS</Text>
          </ImageBackground>
          <View>
            <Text className="font-inter font-semibold text-primary text-base">
              {user?.name || "User name not found"}
            </Text>
            <Text className="font-inter text-[#355362D9] text-sm">
              {user?.email || "User email not found"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="font-inter text-gray-500 text-xs">Global</Text>
        <MobileMenuItem
          icon={Icons.Clients}
          title="Clients"
          onPress={() => handleMenuPress("Clients")}
        />
        <MobileMenuItem
          icon={Icons.Clients}
          title="Residents"
          onPress={() => handleMenuPress("Residents")}
        />
        {/* <MobileMenuItem
          icon={Icons.Chat}
          title="Messages"
          badge={1}
          onPress={() => handleMenuPress("Messages")}
        />

        <Text className="mt-[15px] font-inter text-xs text-gray-500">Tools</Text>
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
