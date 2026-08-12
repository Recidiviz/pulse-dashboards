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
import { Pressable } from "react-native";

type Props = {
  onBackgroundPress: () => void;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps a region and reports presses that land on the background behind its
 * children — for dismissing a selection, menu, or popover by tapping elsewhere.
 *
 * On web the press is a DOM click, which bubbles even when a child handled it,
 * so an interactive child must call `event.stopPropagation()` to stay out of
 * the background.
 */
export function BackgroundPressable({
  onBackgroundPress,
  className,
  children,
}: Props) {
  return (
    <Pressable
      onPress={onBackgroundPress}
      accessible={false}
      className={clsx("cursor-default", className)}
    >
      {children}
    </Pressable>
  );
}
