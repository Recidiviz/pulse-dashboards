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
import ArrowDownIcon from "react-native-heroicons/outline/ArrowDownIcon";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Typography } from "~@meetings/app/shared/ui/Typography";

const BOUNCE_DISTANCE = 8;
const BOUNCE_HALF_PERIOD_MS = 900;

export function ScrollTip() {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(BOUNCE_DISTANCE, {
        duration: BOUNCE_HALF_PERIOD_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(offset);
  }, [offset]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View className="items-center gap-3">
      <View className="w-full rounded-xl border border-subtle bg-secondary p-3.5">
        <Typography variant="body-s-regular" className="leading-5">
          <Typography variant="body-s-medium" className="font-semibold">
            Tip:
          </Typography>{" "}
          Scroll down to read the whole draft case note. Then, make edits and
          copy.
        </Typography>
      </View>
      <Animated.View style={arrowStyle}>
        <ArrowDownIcon className="size-5 stroke-tertiary" />
      </Animated.View>
    </View>
  );
}
