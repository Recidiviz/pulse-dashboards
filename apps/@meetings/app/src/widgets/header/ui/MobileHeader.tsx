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

import { DrawerActions, useNavigation } from "@react-navigation/native";
import clsx from "clsx";
import { TouchableOpacity, View } from "react-native";
import MenuIcon from "react-native-heroicons/outline/MenuIcon";
import ArrowLeftIcon from "react-native-heroicons/solid/ArrowLeftIcon";

import { useRecording } from "~@meetings/app/features/recording";
import { OfflineIndicator } from "~@meetings/app/shared/ui/OfflineIndicator";

import { HeaderNavProp, HeaderProps } from "../model/header";

interface MobileHeaderProps extends HeaderProps {
  className?: string;
}

export const MobileHeader = ({
  showDrawer,
  showGoBack,
  onGoBack,
  className,
}: MobileHeaderProps) => {
  const { status } = useRecording();
  const navigation = useNavigation<HeaderNavProp>();

  return (
    <View
      className={clsx(
        "flex-row items-center justify-between px-4 py-3",
        className,
      )}
    >
      {showDrawer && (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <MenuIcon className="text-tertiary" />
        </TouchableOpacity>
      )}

      {showGoBack && (
        <TouchableOpacity onPress={onGoBack}>
          <ArrowLeftIcon className="fill-tertiary" />
        </TouchableOpacity>
      )}
      <View className="absolute inset-x-0 items-center">
        <OfflineIndicator
          enableTooltip={status !== "idle"}
          side="bottom"
          align="center"
        />
      </View>
    </View>
  );
};
