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

import clsx from "clsx";
import { ReactNode } from "react";
import {
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

type DrawerProps = {
  header: ReactNode;
  headerRight?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Drawer({
  header,
  headerRight,
  onClose,
  children,
  className,
}: DrawerProps) {
  return (
    <RNModal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill}>
          <View className="absolute size-full bg-scrim-default" />
          <View className="size-full flex-row justify-end">
            <TouchableWithoutFeedback>
              <View
                className={clsx(
                  "size-full bg-primary shadow-md md:w-[720px]",
                  className,
                )}
              >
                <View className="flex-row items-start justify-between gap-4 border-b border-subtle px-8 py-5">
                  <View className="flex-1 gap-1">{header}</View>
                  <View className="flex-row items-center gap-3">
                    {headerRight}
                    <TouchableOpacity
                      onPress={onClose}
                      accessibilityLabel="Close"
                      className="cursor-pointer rounded-full p-1"
                    >
                      <XIcon className="size-5 stroke-tertiary stroke-2" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="flex-1">{children}</View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
