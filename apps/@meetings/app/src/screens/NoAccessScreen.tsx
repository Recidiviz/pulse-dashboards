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

import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "../components/PrimaryButton";
import { useUserContext } from "../context/UserContext";
import { useSetDocumentTitle } from "../hooks/useSetDocumentTitle";

const NoAccessScreen = () => {
  useSetDocumentTitle("Access Denied - Recidiviz Meetings");
  const { onLogout } = useUserContext();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
          <Text className="font-libre mb-4 text-center text-3xl font-bold text-gray-900">
            Access Denied
          </Text>
          <Text className="mb-6 text-center font-inter text-base text-gray-600">
            You do not have permission to access the Meetings app. Please
            contact your administrator to request access.
          </Text>
          <PrimaryButton onPress={onLogout} label="Log Out" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NoAccessScreen;
