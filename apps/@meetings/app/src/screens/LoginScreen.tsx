// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import BottomSheet from "@gorhom/bottom-sheet";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { SafeAreaView } from "react-native-safe-area-context";

import LogoSvg from "../assets/icons/logo.svg";
import { LearnMoreModal, LearnMoreSheet } from "../components/LearnMore";
import PrimaryButton from "../components/PrimaryButton";
import env from "../env";
import { useSetDocumentTitle } from "../hooks/useSetDocumentTitle";
import { Typography } from "../shared/ui/Typography";

const LoginScreen = ({ onSkipAuth }: { onSkipAuth?: () => void }) => {
  useSetDocumentTitle("Login - Recidiviz Meetings");
  const { authorize } = useAuth0();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [learnMoreModalVisible, setLearnMoreModalVisible] = useState(false);

  const handleContinue = async () => {
    await authorize({
      audience: env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      scope: "openid profile email offline_access",
    });
  };

  const handleSkipAuth = () => {
    if (onSkipAuth) {
      onSkipAuth();
    }
  };

  const openSheet = () => {
    switch (Platform.OS) {
      case "web":
        setLearnMoreModalVisible(true);
        break;
      case "ios":
      case "android":
        bottomSheetRef.current?.expand();
        break;
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-2"
      >
        <View className="w-full max-w-[500px] items-center rounded-3xl bg-white py-12">
          <LogoSvg className="size-60" />
          <Typography className="mb-8 text-center font-libre-baskerville text-[32px] font-bold text-primary">
            Sign In to Recidiviz
          </Typography>

          <PrimaryButton label="Continue" onPress={handleContinue} />

          {/* Skip Auth Link for Local Mode */}
          {env.EXPO_PUBLIC_LOCAL_MODE && (
            <TouchableOpacity onPress={handleSkipAuth} className="mt-4">
              <Typography className="text-center text-sm font-medium text-blue-600">
                Skip Authentication (Local Mode)
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
      {/* Footer: restricted notice */}
      <View className="mb-6 flex-row items-center justify-center">
        <Typography className="text-sm text-gray-400">
          Restricted to authorized users
        </Typography>
        <TouchableOpacity onPress={openSheet}>
          <Typography className="ml-1 text-sm font-medium text-[#4D5255]">
            Learn more
          </Typography>
        </TouchableOpacity>
      </View>
      <LearnMoreModal
        visible={learnMoreModalVisible}
        onClose={() => setLearnMoreModalVisible(false)}
      />
      <LearnMoreSheet ref={bottomSheetRef} />
    </SafeAreaView>
  );
};

export default LoginScreen;
