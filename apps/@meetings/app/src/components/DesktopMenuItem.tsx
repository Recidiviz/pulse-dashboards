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

import React from "react";
import { Text, TouchableOpacity } from "react-native";

type DesktopMenuItemProps = {
  title: string;
  isActive: boolean;
  onPress?: () => void;
};

const DesktopMenuItem = ({
  title,
  isActive,
  onPress,
}: DesktopMenuItemProps) => {
  return (
    <TouchableOpacity
      className={`h-full flex-row items-center justify-between border-y-4 border-b-transparent ${isActive ? "border-[#006C67]" : "border-transparent"}`}
      onPress={onPress}
    >
      <Text
        className={`px-1 font-inter text-sm font-medium ${isActive ? "text-primary" : "text-[#355362D9]"}`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default DesktopMenuItem;
