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

import Modal from "~@meetings/app/shared/ui/Modal";

import { OnboardingMobileStep, OnboardingWebStep } from "../config";
import { useOnboardingStore } from "../model/store";
import { HowItWorks } from "./HowItWorks";
import { ProTip1 } from "./ProTip1";
import { ProTip2 } from "./ProTip2";
import { ProTip3 } from "./ProTip3";
import { ProTip4 } from "./ProTip4";
import { ScratchpadExplainer } from "./ScratchpadExplainer";
import { Welcome } from "./Welcome";

export function OnboardingScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const webStep = useOnboardingStore((state) => state.webStep);
  const mobileStep = useOnboardingStore((state) => state.mobileStep);

  if (Platform.OS === "web") {
    return (
      <Modal
        visible={isFocused}
        containerClassName="size-full md:max-w-[1240px] md:max-h-[720px] p-6"
      >
        {webStep === OnboardingWebStep.Welcome && <Welcome />}
        {webStep === OnboardingWebStep.HowItWorks && <HowItWorks />}
        {webStep === OnboardingWebStep.ScratchpadExplainer && (
          <ScratchpadExplainer />
        )}
        {webStep === OnboardingWebStep.ProTip1 && <ProTip1 />}
        {webStep === OnboardingWebStep.ProTip2 && <ProTip2 />}
        {webStep === OnboardingWebStep.ProTip3 && <ProTip3 />}
        {webStep === OnboardingWebStep.ProTip4 && <ProTip4 />}
      </Modal>
    );
  }

  return (
    <View
      style={{ paddingBottom: insets.bottom, paddingTop: insets.top }}
      className="flex-1 bg-primary p-4"
    >
      {mobileStep === OnboardingMobileStep.Welcome && <Welcome />}
      {mobileStep === OnboardingMobileStep.HowItWorks && <HowItWorks />}
      {mobileStep === OnboardingMobileStep.ScratchpadExplainer && (
        <ScratchpadExplainer />
      )}
      {mobileStep === OnboardingMobileStep.ProTip1 && <ProTip1 />}
      {mobileStep === OnboardingMobileStep.ProTip2 && <ProTip2 />}
      {mobileStep === OnboardingMobileStep.ProTip3 && <ProTip3 />}
      {mobileStep === OnboardingMobileStep.ProTip4 && <ProTip4 />}
    </View>
  );
}
