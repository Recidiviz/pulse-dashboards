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

import { Platform, TouchableOpacity, View } from "react-native";

import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import ScratchpadExplainerImage from "../assets/scratchpad-explainer.svg";
import { OnboardingMobileStep, OnboardingWebStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { DescriptionContainer } from "./DescriptionContainer";

export function ScratchpadExplainer() {
  const setNextWebStep = useOnboardingStore((state) => state.setWebStep);
  const setNextMobileStep = useOnboardingStore((state) => state.setMobileStep);

  const setNextStep = () => {
    if (Platform.OS === "web") {
      setNextWebStep(OnboardingWebStep.ProTip1);
    } else {
      setNextMobileStep(OnboardingMobileStep.ProTip1);
    }
  };

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <WordmarkSvg className="absolute left-[36px] top-[30px] h-8 w-[116px] md:left-[30px] md:h-10" />
        <View>
          <ScratchpadExplainerImage className="size-full max-w-[271px]" />
        </View>
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography className="mb-2 max-w-[261px] text-xl font-semibold">
          Your notes, guaranteed.
        </Typography>
        <DescriptionContainer>
          <Typography className="mb-5 max-w-[480px] text-base font-normal text-secondary">
            The AI is smart, but you are the expert. Use the Scratchpad during
            recording to jot down critical observations, nonverbal cues, or
            details you're worried could get lost. Anything you type here is
            guaranteed to be included in the final case note draft.
          </Typography>
        </DescriptionContainer>
        <TouchableOpacity
          className="mt-auto w-full rounded-full bg-brand  px-5 py-3 md:mt-0 md:w-fit"
          onPress={setNextStep}
        >
          <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
            Got it
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
}
