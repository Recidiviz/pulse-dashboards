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

import { ComponentType, ReactNode } from "react";
import { TouchableOpacity } from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import { SvgProps } from "react-native-svg";

import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  icon: ComponentType<SvgProps>;
  onPress: () => void;
  children: ReactNode;
};

export function PickerTrigger({ icon: Icon, onPress, children }: Props) {
  return (
    <TouchableOpacity
      className="flex-1 flex-row items-center gap-2 rounded-xl border border-subtle bg-secondary px-4 py-3"
      onPress={onPress}
    >
      <Icon className="size-5 fill-tertiary" />
      <Typography className="flex-1 text-sm text-secondary">
        {children}
      </Typography>
      <ChevronDownIcon className="size-4 stroke-tertiary stroke-[3px]" />
    </TouchableOpacity>
  );
}
