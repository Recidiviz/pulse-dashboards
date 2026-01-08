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
import { Text } from "react-native";

type DesktopMenuItemProps = {
  isActive: boolean;
  screen: string;
  children: string;
};

const DesktopMenuItem = ({
  isActive,
  screen,
  children,
}: DesktopMenuItemProps) => {
  return (
    <Link
      className={`flex h-full flex-row items-center justify-between border-y-4 border-b-transparent ${isActive ? "border-[#006C67]" : "border-transparent"}`}
      screen={screen}
      params={{}}
    >
      <Text
        className={`px-1 font-inter text-sm font-medium ${isActive ? "text-primary" : "text-[#355362D9]"}`}
      >
        {children}
      </Text>
    </Link>
  );
};

export default DesktopMenuItem;
