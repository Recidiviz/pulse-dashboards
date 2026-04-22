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

import React, { useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

type ExpandableProps = {
  isExpanded: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Expandable({
  isExpanded,
  children,
  className,
}: ExpandableProps) {
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(isExpanded ? measuredHeight : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    }),
    overflow: "hidden",
  }));

  return (
    <>
      <View
        className="absolute opacity-0"
        onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height)}
        pointerEvents="none"
      >
        {children}
      </View>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </>
  );
}
