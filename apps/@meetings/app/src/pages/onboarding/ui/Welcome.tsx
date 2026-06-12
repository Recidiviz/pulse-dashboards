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

import { OnboardingMobileStep, OnboardingWebStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { DescriptionContainer } from "./DescriptionContainer";

export function Welcome() {
  const setNextWebStep = useOnboardingStore((state) => state.setWebStep);
  const setNextMobileStep = useOnboardingStore((state) => state.setMobileStep);

  const setNextStep = () => {
    if (Platform.OS === "web") {
      setNextWebStep(OnboardingWebStep.HowItWorks);
    } else {
      setNextMobileStep(OnboardingMobileStep.HowItWorks);
    }
  };

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <WordmarkSvg className="h-12 w-[140px]" />
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography className="mb-3 text-base font-medium">
          Welcome to Recidiviz Meetings.
        </Typography>
        <Typography className="mb-2 max-w-[261px] text-xl font-semibold">
          Less time typing, more time working on what matters.
        </Typography>
        <DescriptionContainer>
          <Typography className="mb-5 max-w-[480px] text-base font-normal text-secondary">
            We know managing a heavy caseload means hours of paperwork.
            Recidiviz Meetings acts as your secure, AI-powered assistant. Simply
            record your check-ins, and we'll automatically produce your first
            draft case notes, action items, and status updates.
          </Typography>
        </DescriptionContainer>
        <TouchableOpacity
          className="mt-auto w-full rounded-full bg-brand  px-5 py-3 md:mt-0 md:w-fit"
          onPress={setNextStep}
        >
          <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
            Get Started
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
}
