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

import { type LinkProps, useLinkProps } from "@react-navigation/native";
import { ReactNode } from "react";
import { type GestureResponderEvent, Pressable } from "react-native";

type BlockLinkProps<ParamList extends ReactNavigation.RootParamList> =
  LinkProps<ParamList> & {
    className?: string;
    onPress?: (e: GestureResponderEvent) => void;
    children: ReactNode;
  };

/**
 * Navigates to a screen like React Navigation's Link, but wraps block content
 * (views, icons, rows) instead of inline text.
 */
export function BlockLink<ParamList extends ReactNavigation.RootParamList>({
  className,
  onPress,
  children,
  ...linkProps
}: BlockLinkProps<ParamList>) {
  const { onPress: navigate, ...props } = useLinkProps<ParamList>(linkProps);

  const handlePress = (e: GestureResponderEvent) => {
    onPress?.(e);
    // Same as Link: the caller's onPress can cancel navigation
    if (!e.defaultPrevented) navigate(e);
  };

  return (
    <Pressable {...props} onPress={handlePress} className={className}>
      {children}
    </Pressable>
  );
}
