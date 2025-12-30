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

import { Text, TouchableOpacity } from "react-native";

const MobileMenuTextItem = ({
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
    <TouchableOpacity onPress={onPress} className="py-3 px-2">
      <Text
        className={`font-inter text-lg leading-[22px] font-normal ${colorClasses[color]}`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default MobileMenuTextItem;
