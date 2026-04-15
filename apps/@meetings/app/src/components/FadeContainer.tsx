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

import React, { useEffect, useState } from "react";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type FadeContainerProps = {
  isVisible: boolean;
  children: React.ReactNode;
  duration?: number;
};

/**
 * Wraps children with a fade in/out animation driven by `isVisible`.
 * Keeps children mounted during fade-out so the animation completes
 * before unmounting.
 */
export function FadeContainer({
  isVisible,
  children,
  duration = 300,
}: FadeContainerProps) {
  const [isRendered, setIsRendered] = useState(isVisible);
  const opacity = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      opacity.value = withTiming(
        0,
        { duration, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setIsRendered)(false);
        },
      );
    }
  }, [isVisible, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isRendered) return null;

  return (
    <Animated.View
      style={animatedStyle}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {children}
    </Animated.View>
  );
}
