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

import { useIsFocused } from "@react-navigation/native";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSuppressFeedbackLauncher } from "~@meetings/app/features/intercom";
import Modal from "~@meetings/app/shared/ui/Modal";

import { OnboardingStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { EnableMicrophone } from "./EnableMicrophone";
import { HowItWorks } from "./HowItWorks";
import { ProTip1 } from "./ProTip1";
import { ProTip2 } from "./ProTip2";
import { ProTip3 } from "./ProTip3";
import { ProTip4 } from "./ProTip4";
import { ScratchpadExplainer } from "./ScratchpadExplainer";
import { SetupMicrophone } from "./SetupMicrophone";
import { Welcome } from "./Welcome";

export function OnboardingScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const step = useOnboardingStore((state) => state.step);
  useSuppressFeedbackLauncher(isFocused);

  const content = (
    <>
      {step === OnboardingStep.Welcome && <Welcome />}
      {step === OnboardingStep.EnableMicrophone && <EnableMicrophone />}
      {step === OnboardingStep.SetupMicrophone && <SetupMicrophone />}
      {step === OnboardingStep.HowItWorks && <HowItWorks />}
      {step === OnboardingStep.ScratchpadExplainer && <ScratchpadExplainer />}
      {step === OnboardingStep.ProTip1 && <ProTip1 />}
      {step === OnboardingStep.ProTip2 && <ProTip2 />}
      {step === OnboardingStep.ProTip3 && <ProTip3 />}
      {step === OnboardingStep.ProTip4 && <ProTip4 />}
    </>
  );

  if (Platform.OS === "web") {
    return (
      <Modal
        containerClassName="size-full md:max-w-[1240px] md:max-h-[720px] p-6"
        visible={isFocused}
      >
        {content}
      </Modal>
    );
  }

  return (
    <View
      style={{ paddingBottom: insets.bottom, paddingTop: insets.top }}
      className="flex-1 bg-primary p-4"
    >
      {content}
    </View>
  );
}
