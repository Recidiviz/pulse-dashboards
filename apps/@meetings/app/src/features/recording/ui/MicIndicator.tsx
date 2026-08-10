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
import { debounce } from "lodash";
import { memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import MicrophoneIcon from "react-native-heroicons/solid/MicrophoneIcon";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import MicrophoneMutedSvg from "~@meetings/app/shared/assets/icons/microphone-muted.svg";
import { theme } from "~@meetings/app/shared/config";

import { MicStatus } from "../model";

// How long to keep the bars "active" after the last `speaking` signal, so brief
// pauses between words don't collapse the animation.
const ACTIVE_HOLD_MS = 1000;
// Base (unscaled) bar height in px; all scales below are expressed as fractions
// of it so the visual sizes stay readable.
const STANDARD_BAR_HEIGHT = 15;
const LARGE_BAR_HEIGHT = 40;
// Bottom of the pulse range (~7px) — the shortest a bar gets while pulsing.
const STANDARD_MIN_SCALE = 7 / STANDARD_BAR_HEIGHT;
const LARGE_MIN_SCALE = 18 / LARGE_BAR_HEIGHT;
// Flat resting height (~8px) shown while inactive, slightly above MIN_SCALE so
// idle bars don't look fully collapsed.
const STANDARD_SILENCE_SCALE = 8 / STANDARD_BAR_HEIGHT;
const LARGE_SILENCE_SCALE = 20 / LARGE_BAR_HEIGHT;
// Per-bar pulse durations (ms). Intentionally mismatched so the bars drift out
// of phase and shimmer instead of moving in unison.
const BAR_SPEEDS = [260, 200, 310, 240];
// How quickly `peak` eases toward a new `level` — short, so the bars feel
// responsive to volume without jittering.
const LEVEL_FOLLOW_MS = 120;
// Crossfade duration when bars fade between the resting and pulsing states.
const ACTIVE_FADE_MS = 200;
// Easing for the pulse oscillation; in-out gives the bar a soft top/bottom.
const PULSE_EASING = Easing.inOut(Easing.ease);

type Variant = "compact" | "full" | "large";

type BarProps = {
  index: number;
  active: boolean;
  level: number;
  variant?: Variant;
};

function Bar({ index, active, level, variant }: BarProps) {
  const barHeight =
    variant === "large" ? LARGE_BAR_HEIGHT : STANDARD_BAR_HEIGHT;
  const minScale = variant === "large" ? LARGE_MIN_SCALE : STANDARD_MIN_SCALE;
  const silenceScale =
    variant === "large" ? LARGE_SILENCE_SCALE : STANDARD_SILENCE_SCALE;
  const progress = useSharedValue(0);
  const peak = useSharedValue(minScale);
  const activeMix = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: BAR_SPEEDS[index], easing: PULSE_EASING }),
      -1,
      true,
    );
  }, [index, progress]);

  useEffect(() => {
    // Treat `level` (0–1) as a percentage of the range between the resting
    // minimum and full height, so louder audio pulses the bar higher.
    const clampedLevel = Math.min(Math.max(level, 0), 1);
    peak.value = withTiming(minScale + (1 - minScale) * clampedLevel, {
      duration: LEVEL_FOLLOW_MS,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, peak]);

  useEffect(() => {
    activeMix.value = withTiming(active ? 1 : 0, { duration: ACTIVE_FADE_MS });
  }, [active, activeMix]);

  const animatedStyle = useAnimatedStyle(() => {
    const pulse = interpolate(progress.value, [0, 1], [minScale, peak.value]);
    const scaleY = silenceScale + (pulse - silenceScale) * activeMix.value;
    return { transform: [{ scaleY }] };
  });

  return (
    <Animated.View
      style={[
        {
          height: barHeight,
          width: variant === "large" ? 6 : 2.5,
          borderRadius: variant === "large" ? 999 : 1.25,
          backgroundColor: active
            ? theme["colors"]["brand"]
            : theme["colors"]["tertiary"],
        },
        animatedStyle,
      ]}
    />
  );
}

function MutedMicIcon({ variant }: { variant: Variant }) {
  return (
    <MicrophoneMutedSvg
      className={clsx("fill-attention", {
        "size-4": variant === "compact",
        "size-5": variant === "full",
        "size-16": variant === "large",
      })}
    />
  );
}

type Props = {
  variant: Variant;
  level: number;
  status: MicStatus;
};

export const MicIndicator = memo(function MicIndicator({
  variant,
  level,
  status,
}: Props) {
  const [visuallyActive, setVisuallyActive] = useState(false);

  const deactivate = useMemo(
    () => debounce(() => setVisuallyActive(false), ACTIVE_HOLD_MS),
    [],
  );

  useEffect(() => {
    switch (status) {
      case "speaking":
        deactivate.cancel();
        setVisuallyActive(true);
        break;
      case "error":
        deactivate.cancel();
        setVisuallyActive(false);
        break;
      case "silent":
        deactivate();
        break;
    }
  }, [status, deactivate]);

  useEffect(() => {
    return () => deactivate.cancel();
  }, [deactivate]);

  const isError = status === "error";

  const bars = (
    <View className="flex-row items-center gap-1">
      {BAR_SPEEDS.map((_, i) => (
        <Bar
          key={i}
          index={i}
          active={visuallyActive}
          level={level}
          variant={variant}
        />
      ))}
    </View>
  );

  if (variant === "full" || variant === "large") {
    return (
      <View className="flex-row items-center gap-2">
        {isError ? (
          <MutedMicIcon variant={variant} />
        ) : (
          <MicrophoneIcon
            className={clsx(
              variant === "full" && "size-5",
              variant === "large" && "size-16",
              visuallyActive ? "fill-brand" : "fill-tertiary",
            )}
          />
        )}
        {bars}
      </View>
    );
  }

  return isError ? <MutedMicIcon variant={variant} /> : bars;
});
