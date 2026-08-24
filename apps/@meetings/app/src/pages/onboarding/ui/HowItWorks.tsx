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

import { View } from "react-native";

import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import HowItWorksDesktop from "../assets/how-it-works-desktop.svg";
import HowItWorksMobile from "../assets/how-it-works-mobile.svg";
import { OnboardingStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { DescriptionContainer } from "./DescriptionContainer";

export function HowItWorks() {
  const setNextStep = useOnboardingStore((state) => state.setStep);

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <WordmarkSvg className="absolute left-[36px] top-[30px] h-8 w-[116px] md:left-[30px] md:h-10" />
        <View className="w-full flex-1 items-center justify-center">
          <HowItWorksMobile className="h-[240px] w-full md:hidden" />
          <HowItWorksDesktop className="hidden w-full md:flex" />
        </View>
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography variant="heading-4" className="mb-2 max-w-[261px]">
          From conversation to case note.
        </Typography>
        <DescriptionContainer>
          <Typography
            variant="body-m-regular"
            className="mb-5 max-w-[480px] text-secondary"
          >
            Just hit record during your client check-in. When you're done,
            Recidiviz Meetings separates your voice from the client's and drafts
            your required documentation instantly. You always have the final
            review before saving.
          </Typography>
        </DescriptionContainer>
        <Button
          variant="primary"
          className="mt-auto w-full md:mt-0 md:w-fit"
          onPress={() => setNextStep(OnboardingStep.ScratchpadExplainer)}
        >
          Continue
        </Button>
      </View>
    </View>
  );
}
