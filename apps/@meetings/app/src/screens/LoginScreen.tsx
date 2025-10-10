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
import React, { useRef } from "react";
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
import LearnMoreSheet from "../components/LearnMoreSheet";
import PrimaryButton from "../components/PrimaryButton";

const LoginScreen = () => {
  const { authorize } = useAuth0();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleContinue = async () => {
    const audience = process.env["EXPO_PUBLIC_AUTH0_AUDIENCE"];
    await authorize({ audience });
  };

  const openSheet = () => bottomSheetRef.current?.expand();

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-2"
      >
        <View className="w-full items-center rounded-3xl bg-white py-12">
          <Image
            source={Icons.Logo}
            className="mb-8 size-16"
            resizeMode="contain"
          />
          <Text className="text-primary mb-8 text-center text-[32px] font-bold">
            Sign In to Recidiviz
          </Text>

          <PrimaryButton label="Continue" onPress={handleContinue} />
        </View>
      </KeyboardAvoidingView>

      {/* Footer: restricted notice */}
      <View className="mb-6 flex-row items-center justify-center">
        <Text className="text-sm text-gray-400">
          Restricted to authorized users
        </Text>
        <TouchableOpacity onPress={openSheet}>
          <Text className="ml-1 text-sm font-medium text-[#4D5255]">
            Learn more
          </Text>
        </TouchableOpacity>
      </View>

      <LearnMoreSheet ref={bottomSheetRef} />
    </SafeAreaView>
  );
};

export default LoginScreen;
