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

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import XIcon from "react-native-heroicons/outline/XIcon";

import DashSvg from "~@meetings/app/shared/assets/icons/dash.svg";
import PauseSvg from "~@meetings/app/shared/assets/icons/pause.svg";
import PlaySvg from "~@meetings/app/shared/assets/icons/play.svg";

import { theme } from "../shared/config";
import { formatDurationNumeric } from "../shared/lib/format";
import { Typography } from "../shared/ui/Typography";

const PLAYBACK_RATES = [1, 1.5, 2] as const;

type Props = {
  url: string;
  onClose: () => void;
};

const AudioPlayer = ({ url, onClose }: Props) => {
  const player = useAudioPlayer({ uri: url });
  const { currentTime, duration, playing } = useAudioPlayerStatus(player);
  const barWidthRef = useRef(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState(0);
  const [rateIndex, setRateIndex] = useState(0);

  const playbackProgress = duration > 0 ? currentTime / duration : 0;
  const progress = isSeeking ? seekProgress : playbackProgress;

  const durationRef = useRef(duration);
  durationRef.current = duration;

  const handleBarLayout = (e: LayoutChangeEvent) => {
    barWidthRef.current = e.nativeEvent.layout.width;
  };

  useEffect(() => {
    return () => {
      // on mobile platforms the player is removed automatically
      if (Platform.OS === "web") player.remove();
    };
  }, [player]);

  const seekToRatio = useCallback(
    (ratio: number) => {
      const clamped = Math.max(0, Math.min(1, ratio));
      setSeekProgress(clamped);
      if (durationRef.current > 0) {
        player.seekTo(clamped * durationRef.current);
      }
    },
    [player],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => {
          if (barWidthRef.current === 0) return;
          setIsSeeking(true);
          seekToRatio(e.x / barWidthRef.current);
        })
        .onUpdate((e) => {
          if (barWidthRef.current === 0) return;
          seekToRatio(e.x / barWidthRef.current);
        })
        .onFinalize(() => setIsSeeking(false)),
    [seekToRatio],
  );

  const cycleRate = () => {
    const next = (rateIndex + 1) % PLAYBACK_RATES.length;
    setRateIndex(next);
    player.setPlaybackRate(PLAYBACK_RATES[next]);
  };

  return (
    <View className="flex-row items-center gap-3 rounded-full bg-secondary px-3 py-2">
      <TouchableOpacity
        onPress={() => (playing ? player.pause() : player.play())}
        className="size-8 items-center justify-center rounded-full bg-brand"
      >
        {playing ? (
          <PauseSvg className="size-4 fill-on-brand" />
        ) : (
          <PlaySvg className="size-4 fill-on-brand" />
        )}
      </TouchableOpacity>

      <View className="flex-1 gap-1">
        <View className="flex-row justify-between">
          <Typography className="text-sm text-secondary">
            {formatDurationNumeric(currentTime * 1000)}
          </Typography>
          <Typography className="text-sm text-secondary">
            {formatDurationNumeric(duration * 1000)}
          </Typography>
        </View>
        <GestureDetector gesture={panGesture}>
          <View onLayout={handleBarLayout} className="h-4 justify-center">
            <View
              pointerEvents="none"
              className="h-1 overflow-hidden rounded-full"
              style={{ backgroundColor: theme["borderColor"]["subtle"] }}
            >
              <View
                className="h-full rounded-full bg-brand"
                style={{ width: `${progress * 100}%` }}
              />
            </View>
            <View
              pointerEvents="none"
              className="absolute size-2 rounded-full bg-brand"
              style={{
                left: `${progress * 100}%`,
                marginLeft: -(progress * 8),
              }}
            />
          </View>
        </GestureDetector>
      </View>

      <TouchableOpacity onPress={cycleRate} className="size-6 justify-between">
        {/* 1.333 = size-6 / svg width = 24 / 18 */}
        <DashSvg className="scale-x-[1.333] self-center" />
        <Typography className="text-nowrap text-center text-xs tracking-tight text-brand">
          {PLAYBACK_RATES[rateIndex].toFixed(1)}x
        </Typography>
        {/* 1.333 = size-6 / svg width = 24 / 18 */}
        <DashSvg className="scale-x-[1.333] self-center" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClose}
        className="size-5 items-center justify-center"
      >
        <XIcon className="stroke-tertiary" />
      </TouchableOpacity>
    </View>
  );
};

export default AudioPlayer;
