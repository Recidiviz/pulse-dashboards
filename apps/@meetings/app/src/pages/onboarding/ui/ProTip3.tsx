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

import ProTip3Image from "../assets/pro-tip-3.svg";
import { OnboardingStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { DescriptionContainer } from "./DescriptionContainer";

export function ProTip3() {
  const setNextStep = useOnboardingStore((state) => state.setStep);

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <WordmarkSvg className="absolute left-[36px] top-[30px] h-8 w-[116px] md:left-[30px] md:h-10" />
        <ProTip3Image />
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography variant="body-m-medium" className="mb-3">
          PRO Tip 3
        </Typography>
        <Typography variant="heading-4" className="mb-2 max-w-[261px]">
          Client trust always comes first.
        </Typography>
        <DescriptionContainer>
          <Typography
            variant="body-m-regular"
            className="mb-3 max-w-[480px] text-secondary"
          >
            Always ensure the people in the room are aware and comfortable with
            being recorded. If you sense a client is closing up or hesitant,
            turn the recording off. It is always better to maintain trust.
          </Typography>
          <Typography
            variant="body-m-regular"
            className="mb-5 max-w-[480px] text-secondary"
          >
            If you turn off the live recording, just hit record after the client
            leaves and dictate a quick summary. We'll still do the heavy lifting
            to turn your dictation into a fully formatted case note.
          </Typography>
        </DescriptionContainer>
        <Button
          variant="primary"
          className="mt-auto w-full md:mt-0 md:w-fit"
          onPress={() => setNextStep(OnboardingStep.ProTip4)}
        >
          Next Tip
        </Button>
      </View>
    </View>
  );
}
