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

import { ReactNode } from "react";
import { Pressable, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { Sheet, SheetScrollView } from "../Sheet";
import { Typography } from "../Typography";

type DropdownSheetProps = {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  title?: string;
  children: ReactNode;
};

/** The bottom sheet a dropdown opens on native. */
export function DropdownSheet({
  visible,
  onClose,
  onDismissed,
  title,
  children,
}: DropdownSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      className="px-4 pb-8 pt-4"
    >
      <View className="mb-4 flex flex-row items-center justify-between">
        <View className="pointer-events-none size-8" />
        {title && (
          <Typography className="text-lg font-semibold text-primary">
            {title}
          </Typography>
        )}
        <Pressable onPress={onClose}>
          <View className="flex size-8 items-center justify-center rounded-full bg-secondary">
            <XIcon className="!size-4 stroke-tertiary" />
          </View>
        </Pressable>
      </View>
      <SheetScrollView>
        <View className="flex flex-col py-1">{children}</View>
      </SheetScrollView>
    </Sheet>
  );
}
