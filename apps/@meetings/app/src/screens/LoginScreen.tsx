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
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import { LearnMoreModal, LearnMoreSheet } from "../components/LearnMore";
import PrimaryButton from "../components/PrimaryButton";

const OFFLINE_MODE = process.env["EXPO_PUBLIC_OFFLINE_MODE"] === "true";

const LoginScreen = ({ onSkipAuth }: { onSkipAuth?: () => void }) => {
  const { authorize } = useAuth0();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [learnMoreModalVisible, setLearnMoreModalVisible] = useState(false);

  const handleContinue = async () => {
    const audience = process.env["EXPO_PUBLIC_AUTH0_AUDIENCE"];
    await authorize({ audience });
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
          <Image
            source={Icons.Logo}
            className="mb-8 size-16"
            resizeMode="contain"
          />
          <Text className="mb-8 text-center font-libre-baskerville text-[32px] font-bold text-primary">
            Sign In to Recidiviz
          </Text>

          <PrimaryButton label="Continue" onPress={handleContinue} />

          {/* Skip Auth Link for Offline Mode */}
          {OFFLINE_MODE && (
            <TouchableOpacity onPress={handleSkipAuth} className="mt-4">
              <Text className="text-center font-inter text-sm font-medium text-blue-600">
                Skip Authentication (Offline Mode)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Footer: restricted notice */}
      <View className="mb-6 flex-row items-center justify-center">
        <Text className="font-inter text-sm text-gray-400">
          Restricted to authorized users
        </Text>
        <TouchableOpacity onPress={openSheet}>
          <Text className="ml-1 font-inter text-sm font-medium text-[#4D5255]">
            Learn more
          </Text>
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
