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

import { Image, Platform, TouchableOpacity, View } from "react-native";

import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { useIsMobileWidth } from "~@meetings/app/shared/lib/platform";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import ProTip2Image from "../assets/pro-tip-2.png";
import { OnboardingMobileStep, OnboardingWebStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { DescriptionContainer } from "./DescriptionContainer";

export function ProTip2() {
  const isMobileWidth = useIsMobileWidth();
  const setNextWebStep = useOnboardingStore((state) => state.setWebStep);
  const setNextMobileStep = useOnboardingStore((state) => state.setMobileStep);

  const setNextStep = () => {
    if (Platform.OS === "web") {
      setNextWebStep(OnboardingWebStep.ProTip3);
    } else {
      setNextMobileStep(OnboardingMobileStep.ProTip3);
    }
  };

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary ">
        <WordmarkSvg className="absolute left-[36px] top-[30px] h-8 w-[116px] md:left-[30px] md:h-10" />
        <View className="flex w-full flex-1 items-center justify-center overflow-hidden rounded-[20px] p-9 md:p-5">
          <Image
            source={ProTip2Image}
            resizeMode="contain"
            style={
              isMobileWidth
                ? {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    aspectRatio: 290 / 200,
                  }
                : {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    aspectRatio: 430 / 297,
                  }
            }
            className="rounded-[20px]"
          />
        </View>
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography className="mb-3 text-base font-medium">
          PRO Tip 2
        </Typography>
        <Typography className="mb-2 max-w-[261px] text-xl font-semibold">
          The "Mirror Technique".
        </Typography>
        <DescriptionContainer>
          <Typography className="mb-5 max-w-[480px] text-base font-normal text-secondary">
            Sometimes clients are quiet or vague. Instead of constantly asking
            them to speak up, simply "mirror" or repeat back their important
            answers. This is great for active listening, and it guarantees the
            AI catches the exact facts.
          </Typography>
        </DescriptionContainer>
        <TouchableOpacity
          className="mt-auto w-full rounded-full bg-brand  px-5 py-3 md:mt-0 md:w-fit"
          onPress={setNextStep}
        >
          <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
            Next Tip
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
}
