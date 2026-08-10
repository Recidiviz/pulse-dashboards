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
import { useState } from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";
import { ChevronDownIcon } from "react-native-heroicons/solid";

import { MicIndicator, MicStatus } from "~@meetings/app/features/recording";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import WebMicGuideImage from "../assets/web-mic-guide.png";
import { OnboardingStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { useMicLevelMonitor } from "../model/useMicLevelMonitor";
import { MicErrorModal } from "./MicErrorModal";

export function SetupMicrophone() {
  const [showGuide, setShowGuide] = useState(false);
  const [showMicErrorModal, setShowMicErrorModal] = useState(false);
  const setNextStep = useOnboardingStore((state) => state.setStep);
  const { audioLevel, errorType, retry } = useMicLevelMonitor();

  const getMicStatus = (): MicStatus => {
    if (errorType) return "error";
    return audioLevel > 0 ? "speaking" : "silent";
  };

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <MicIndicator
          variant="large"
          status={getMicStatus()}
          level={audioLevel}
        />
      </View>
      <View className="flex flex-1 flex-col md:justify-center">
        <Typography className="mb-2 max-w-[261px] text-xl font-semibold">
          Perfect.
        </Typography>
        <Typography className="mb-5 max-w-[480px] text-base font-normal text-secondary">
          Do you see this line move when you're talking?
        </Typography>
        <View className="relative md:hidden">
          <MicGuide
            showGuide={showGuide}
            toggleGuide={() => setShowGuide(!showGuide)}
          />
        </View>
        <View className="mb-3 mt-auto flex flex-col-reverse gap-2 md:mt-0 md:flex-row">
          <TouchableOpacity
            className="w-full rounded-full bg-brand px-5 py-3 md:w-fit"
            onPress={() => setNextStep(OnboardingStep.HowItWorks)}
          >
            <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
              Yes, let's continue
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-full rounded-full bg-secondary px-5 py-3 md:w-fit"
            onPress={() => setShowMicErrorModal(true)}
          >
            <Typography className="text-center text-base font-semibold leading-[18px] text-primary">
              It's not moving
            </Typography>
          </TouchableOpacity>
        </View>
        <View className="relative hidden md:flex">
          <MicGuide
            showGuide={showGuide}
            toggleGuide={() => setShowGuide(!showGuide)}
          />
        </View>
      </View>
      {showMicErrorModal && (
        <MicErrorModal
          onClose={() => {
            retry();
            setShowMicErrorModal(false);
          }}
          errorType={errorType || "not-found"}
        />
      )}
    </View>
  );
}

function MicGuide({
  showGuide,
  toggleGuide,
}: {
  showGuide: boolean;
  toggleGuide: () => void;
}) {
  if (Platform.OS !== "web") return null;

  return (
    <>
      <TouchableOpacity
        className="mb-3 flex flex-row items-center gap-1"
        onPress={toggleGuide}
      >
        <Typography className="text-sm font-medium text-primary">
          I have multiple microphones
        </Typography>
        <ChevronDownIcon
          className={clsx(
            "size-5 text-tertiary transition-all duration-300",
            showGuide ? "rotate-180" : "rotate-0",
          )}
        />
      </TouchableOpacity>
      <View className="absolute top-full max-h-[182px] w-full">
        <Image
          source={WebMicGuideImage}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
          className={clsx(
            "aspect-[543/182] transition-all duration-300",
            showGuide ? "opacity-100" : "opacity-0",
          )}
        />
      </View>
    </>
  );
}
