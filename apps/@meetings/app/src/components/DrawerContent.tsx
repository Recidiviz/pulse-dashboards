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
import { ImageBackground, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";
import BellIcon from "react-native-heroicons/solid/BellIcon";
import UsersIcon from "react-native-heroicons/solid/UsersIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BgAvatarImage from "../assets/images/bg-avatar.png";
import MobileMenuItem from "../components/MobileMenuItem";
import { useStateSelection } from "../context/StateContext";
import { useUserContext } from "../context/UserContext";
import { Typography } from "../shared/ui/Typography";
import { getInitials } from "../utils/format";
import MobileMenuTextItem from "./MobileMenuTextItem";

const DrawerContent = (props: DrawerContentComponentProps) => {
  const insets = useSafeAreaInsets();
  const { navigation } = props;
  const { canSelectStateCode, currentStateName } = useStateSelection();
  const { name, email, hasSupervisionAccess, hasFacilitiesAccess, onLogout } =
    useUserContext();

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
          <XIcon className="stroke-muted" />
        </TouchableOpacity>
        <Typography className="text-lg font-semibold leading-[22px] text-primary">
          Navigation
        </Typography>
        <TouchableOpacity onPress={() => console.log("Bell pressed")}>
          <BellIcon className="fill-muted" />
        </TouchableOpacity>
      </View>
      <View className="w-full px-2">
        <View className="m-[15px] h-[78px] w-full flex-row items-center self-center rounded-[15px] bg-soft-green/23 p-4">
          <ImageBackground
            source={BgAvatarImage}
            className="mr-3 size-12 items-center justify-center overflow-hidden rounded-full"
          >
            <Typography className="text-white">
              {name ? getInitials(name) : "SS"}
            </Typography>
          </ImageBackground>
          <View>
            <Typography className="text-base font-semibold text-primary">
              {name ?? "User name not found"}
            </Typography>
            <Typography className="text-sm text-gray/85">
              {email ?? "User email not found"}
            </Typography>
          </View>
        </View>
      </View>
      <View className="flex-1 px-4">
        {hasSupervisionAccess && (
          <MobileMenuItem
            icon={UsersIcon}
            title="Clients"
            screen="Clients"
            onPress={navigation.closeDrawer}
          />
        )}
        {hasFacilitiesAccess && (
          <MobileMenuItem
            icon={UsersIcon}
            title="Residents"
            screen="Residents"
            onPress={navigation.closeDrawer}
          />
        )}
      </View>
      <View
        className="flex flex-col gap-1.5 bg-gray-100 px-4"
        style={{ paddingBottom: insets.bottom || 16, paddingTop: 16 }}
      >
        {canSelectStateCode && (
          <>
            <MobileMenuTextItem
              title="Settings"
              onPress={() => navigation.navigate("StateSelection")}
            />
            {currentStateName && (
              <Typography className="px-4 text-xs text-gray-500">
                Current state: {currentStateName}
              </Typography>
            )}
          </>
        )}
        <MobileMenuTextItem title="Contact Support" />
        <MobileMenuTextItem title="Log Out" onPress={onLogout} color="danger" />
      </View>
    </DrawerContentScrollView>
  );
};

export default DrawerContent;
