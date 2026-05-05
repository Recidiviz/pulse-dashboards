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

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { theme } from "../config/theme";
import { Typography } from "./Typography";

const TRACK_COLOR = theme["backgroundColor"]["disabled"];
const PROGRESS_COLOR = theme["colors"]["brand"];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CircularUploadProgressProps = {
  current: number;
  total: number;
  strokeWidth?: number;
  size?: number;
  showText?: boolean;
};

export function CircularProgressBar({
  current,
  total,
  strokeWidth = 4,
  size = 40,
  showText,
}: CircularUploadProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const offsetValue = useSharedValue(circumference);
  useEffect(() => {
    const progress = total === 0 ? 0 : current / total;
    offsetValue.value = withTiming(circumference * (1 - progress), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [current, total, circumference, offsetValue]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: offsetValue.value,
  }));

  return (
    <View className="items-center justify-center">
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={PROGRESS_COLOR}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={arcProps}
        />
      </Svg>
      {showText && (
        <View className="absolute items-center justify-center">
          <Typography className="text-sm font-medium">
            {current}/{total}
          </Typography>
        </View>
      )}
    </View>
  );
}
