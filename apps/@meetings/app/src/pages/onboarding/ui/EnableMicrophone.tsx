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

import { Platform, View } from "react-native";

import WordmarkSvg from "~@meetings/app/shared/assets/icons/wordmark.svg";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { OnboardingStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { useMicPermissionRequest } from "../model/useMicPermissionRequest";
import { DescriptionContainer } from "./DescriptionContainer";

export function EnableMicrophone() {
  const setNextStep = useOnboardingStore((state) => state.setStep);
  const { requestPermission } = useMicPermissionRequest();

  const handleEnableMicrophone = async () => {
    await requestPermission();
    setNextStep(OnboardingStep.SetupMicrophone);
  };

  return (
    <View className="flex size-full flex-1 flex-col gap-5 md:flex-row-reverse">
      <View className="flex flex-1 items-center justify-center rounded-[20px] bg-secondary">
        <WordmarkSvg className="h-12 w-[140px]" />
      </View>
      <View className="flex flex-1 flex-col justify-center">
        <Typography variant="heading-4" className="mb-2 max-w-[261px]">
          Let's get ready to record.
        </Typography>
        <DescriptionContainer>
          <Typography
            variant="body-m-regular"
            className="mb-5 max-w-[480px] text-secondary"
          >
            Recidiviz Meetings needs access to your microphone to record your
            meetings. You always control when recording starts, pauses, and
            stops.
          </Typography>
        </DescriptionContainer>
        <View className="mt-auto flex flex-col-reverse gap-3 md:mt-0 md:flex-col">
          <Button
            variant="primary"
            className="w-full md:w-fit"
            onPress={handleEnableMicrophone}
          >
            Enable Microphone
          </Button>
          <Typography
            variant="body-s-regular"
            className="text-center md:text-start"
          >
            {Platform.OS === "web"
              ? "Your browser will ask for permission in a pop-up."
              : "Your device will ask for microphone permission in a pop-up."}
          </Typography>
        </View>
      </View>
    </View>
  );
}
