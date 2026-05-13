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
import Animated from "react-native-reanimated";

import MicrophoneMutedSvg from "~@meetings/app/shared/assets/icons/microphone-muted.svg";
import { theme } from "~@meetings/app/shared/config";

const ACTIVE_HOLD_MS = 1000;
const BAR_HEIGHT = 15;
const MIN_SCALE = 7 / BAR_HEIGHT;
const SILENCE_SCALE = 8 / BAR_HEIGHT;
const BAR_SPEEDS = [260, 200, 310, 240];

type Variant = "compact" | "full";

const BAR_KEYFRAMES = {
  from: { transform: [{ scaleY: MIN_SCALE }] },
  to: { transform: [{ scaleY: 1 }] },
};

function Bar({ index, active }: { index: number; active: boolean }) {
  return (
    <Animated.View
      style={[
        {
          height: BAR_HEIGHT,
          width: 2.5,
          borderRadius: 1.25,
          backgroundColor: active
            ? theme["colors"]["brand"]
            : theme["colors"]["tertiary"],
        },
        active
          ? {
              animationName: BAR_KEYFRAMES,
              animationDuration: BAR_SPEEDS[index],
              animationDirection: "alternate",
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-in-out",
            }
          : { transform: [{ scaleY: SILENCE_SCALE }] },
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
      })}
    />
  );
}

type Props = {
  variant: Variant;
  status: "speaking" | "silent" | "error";
};

export const MicIndicator = memo(function MicIndicator({
  variant,
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
        <Bar key={i} index={i} active={visuallyActive} />
      ))}
    </View>
  );

  if (variant === "full") {
    return (
      <View className="flex-row items-center gap-2">
        {isError ? (
          <MutedMicIcon variant={variant} />
        ) : (
          <MicrophoneIcon
            className={clsx(
              "size-5",
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
