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

import { Link } from "@react-navigation/native";
import React from "react";
import { Text, View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

type MobileMenuItemProps = {
  icon: React.ElementType;
  title: string;
  badge?: number;
  screen: string;
  onPress?: () => void;
};

const MobileMenuItem = ({
  icon: IconComponent,
  title,
  badge,
  screen,
  onPress,
}: MobileMenuItemProps) => {
  return (
    <Link className="py-4" screen={screen} onPress={onPress} params={{}}>
      <View className="w-full flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <IconComponent className="size-6 fill-muted" />
          <Text className="font-inter text-base font-medium color-black">
            {title}
          </Text>
          {badge ? (
            <View className="ml-2 h-[14] w-4 justify-center rounded-full bg-gray-600">
              <Text className="text-center font-inter text-xs font-medium text-white">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <ChevronRightIcon className="size-4 stroke-muted stroke-[3px]" />
      </View>
    </Link>
  );
};

export default MobileMenuItem;
