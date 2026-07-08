// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { useNavigation, useRoute } from "@react-navigation/native";
import { TouchableOpacity, View } from "react-native";

import { useUserContext } from "~@meetings/app/entities/user";
import { useRecording } from "~@meetings/app/features/recording";
import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { OfflineIndicator } from "~@meetings/app/shared/ui/OfflineIndicator";

import { HeaderNavProp, HeaderRouteProp } from "../model/header";
import { DesktopMenuItem } from "./DesktopMenuItem";
import { ProfileMenu } from "./ProfileMenu";

export const DesktopNav = () => {
  const { status } = useRecording();
  const navigation = useNavigation<HeaderNavProp>();
  const route = useRoute<HeaderRouteProp>();
  const { hasSupervisionAccess, hasFacilitiesAccess } = useUserContext();

  return (
    <View className="hidden h-16 flex-row items-center justify-between bg-primary px-4 md:flex lg:px-10">
      <TouchableOpacity
        testID="logo-button"
        onPress={() =>
          navigation.navigate("ClientsRoot", { screen: "Clients" })
        }
      >
        <WordmarkSvg />
      </TouchableOpacity>
      <View className="h-full flex-row items-center gap-x-6">
        <OfflineIndicator
          enableTooltip={status !== "idle"}
          align="center"
          side="bottom"
        />
        {hasSupervisionAccess && (
          <DesktopMenuItem
            isActive={route.name.includes("Client")}
            screen="ClientsRoot"
          >
            Clients
          </DesktopMenuItem>
        )}
        {hasFacilitiesAccess && (
          <DesktopMenuItem
            isActive={route.name.includes("Resident")}
            screen="ResidentsRoot"
          >
            Residents
          </DesktopMenuItem>
        )}
        <ProfileMenu />
      </View>
    </View>
  );
};
