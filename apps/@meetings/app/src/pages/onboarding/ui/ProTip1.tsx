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

import { Image, Platform, View } from "react-native";

import { openMessengerWithMessage } from "~@meetings/app/features/intercom";
import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Link } from "~@meetings/app/shared/ui/Link";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import ProTip1Image from "../assets/pro-tip-1.png";
import { OnboardingStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { DescriptionContainer } from "./DescriptionContainer";

const NO_MIC_MESSAGE =
  "Hi! I don't have a microphone I can use with Recidiviz Meetings. Can you help me get one?";

export function ProTip1() {
  const setNextStep = useOnboardingStore((state) => state.setStep);

  const showMicHelp = Platform.OS === "web";

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex-1 items-center justify-center rounded-[20px] bg-secondary ">
        <WordmarkSvg className="absolute left-[36px] top-[30px] h-8 w-[116px] md:left-[30px] md:h-10" />
        <View className="w-full flex-1 overflow-hidden rounded-[20px] p-5 pt-16 md:pt-28">
          <Image
            source={ProTip1Image}
            resizeMode="cover"
            style={{ width: "100%", height: "100%", borderRadius: 20 }}
          />
        </View>
      </View>
      <View className="flex flex-1 flex-col">
        {/* Spacer */}
        <View className="hidden flex-1 md:flex" />
        <View className="flex flex-1 flex-col md:flex-none">
          <Typography variant="body-m-medium" className="mb-3">
            PRO Tip 1
          </Typography>
          <Typography variant="heading-4" className="mb-2 max-w-[261px]">
            Give your mic a clear path.
          </Typography>
          <DescriptionContainer>
            <Typography
              variant="body-m-regular"
              className="mb-5 max-w-[480px] text-secondary"
            >
              Recidiviz Meetings uses your computer's built-in microphone, so it
              needs to be able to hear you both clearly. Make sure your laptop
              is open and positioned between you and your client.
            </Typography>
          </DescriptionContainer>
          <Button
            variant="primary"
            className="mt-auto w-full md:mt-0 md:w-fit"
            onPress={() => setNextStep(OnboardingStep.ProTip2)}
          >
            Next Tip
          </Button>
        </View>
        <View className="md:flex-1 md:justify-end">
          {showMicHelp && (
            <View className="mt-5 max-w-[403px] gap-1 rounded-2xl border border-subtle p-4">
              <Typography variant="body-m-medium">
                Using a desktop or closed laptop dock?
              </Typography>
              <Typography variant="body-s-regular">
                We’ve got you covered. If you don't have an external microphone,
                click here to let us know and we’ll get you sorted.
              </Typography>
              <Link
                className="mt-2"
                onPress={() => openMessengerWithMessage(NO_MIC_MESSAGE)}
              >
                I don’t have a mic
              </Link>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
