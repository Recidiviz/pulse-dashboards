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

import { TouchableOpacity } from "react-native";

import { Typography } from "../shared/ui/Typography";

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
    default: "text-secondary",
    danger: "text-attention",
  };

  return (
    <TouchableOpacity onPress={onPress} className="px-2 py-3">
      <Typography
        className={`text-lg font-normal leading-[22px] ${colorClasses[color]}`}
      >
        {title}
      </Typography>
    </TouchableOpacity>
  );
};

export default MobileMenuTextItem;
