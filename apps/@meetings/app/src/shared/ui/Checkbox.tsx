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

import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import CheckIcon from "react-native-heroicons/solid/CheckIcon";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// bg-brand / border-brand
const CHECKED_COLOR = "#006C67";
// border-subtle
const UNCHECKED_BORDER_COLOR = "#E1E5E7";
// bg-secondary
const UNCHECKED_BACKGROUND_COLOR = "#F7F8F8";

type CheckboxProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  className,
}: CheckboxProps) {
  const progress = useSharedValue(checked ? 1 : 0);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    progress.value = withTiming(checked ? 1 : 0, {
      duration: 100,
      easing: Easing.out(Easing.cubic),
    });
  }, [checked, progress]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [UNCHECKED_BORDER_COLOR, CHECKED_COLOR],
    ),
  }));

  // The fill and checkmark grow from the center on check, and shrink back
  // into the center on uncheck.
  const growFromCenterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(progress.value, 0) }],
  }));

  return (
    <CheckboxPrimitive.Root
      checked={checked}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onCheckedChange={onCheckedChange ? onCheckedChange : () => {}}
      disabled={disabled}
      className={clsx(disabled && "opacity-50", className)}
    >
      <Animated.View
        style={[
          {
            width: 16,
            height: 16,
            borderRadius: 5,
            borderWidth: 1,
            backgroundColor: UNCHECKED_BACKGROUND_COLOR,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          },
          borderStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: 4,
              backgroundColor: CHECKED_COLOR,
            },
            growFromCenterStyle,
          ]}
        />
        <CheckboxPrimitive.Indicator forceMount>
          <Animated.View style={growFromCenterStyle}>
            <CheckIcon className="size-3 fill-on-brand" />
          </Animated.View>
        </CheckboxPrimitive.Indicator>
      </Animated.View>
    </CheckboxPrimitive.Root>
  );
}
