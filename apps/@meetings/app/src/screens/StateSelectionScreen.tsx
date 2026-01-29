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

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header";
import {
  AVAILABLE_STATE_CODES,
  StateCode,
  useStateSelection,
} from "../context/StateContext";
import { RootStackParamList } from "../navigation/DrawerNavigator";

type StateSelectionNavProp = NativeStackNavigationProp<RootStackParamList>;

const StateSelectionScreen = () => {
  const navigation = useNavigation<StateSelectionNavProp>();
  const { selectedStateCode, setSelectedStateCode } = useStateSelection();
  const [isSaving, setIsSaving] = useState(false);

  const handleStateCodeSelect = async (stateCode: StateCode) => {
    try {
      setIsSaving(true);
      await setSelectedStateCode(stateCode);
      // Navigate back to Clients screen after selecting
      navigation.navigate("Clients");
    } catch (error) {
      console.error("Failed to save state code selection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header showBell={false} />
      <ScrollView className="flex-1 px-4 py-6 md:px-10">
        <View className="mx-auto w-full max-w-2xl">
          <Text className="font-libre mb-2 text-3xl font-bold text-gray-900">
            Select State
          </Text>
          <Text className="mb-6 font-inter text-base text-gray-600">
            Choose which state's data you want to view
          </Text>

          <View className="rounded-lg bg-white p-4 shadow-sm">
            {AVAILABLE_STATE_CODES.map((stateCodeOption, index) => (
              <React.Fragment key={stateCodeOption.code}>
                <TouchableOpacity
                  onPress={() => handleStateCodeSelect(stateCodeOption.code)}
                  disabled={isSaving}
                  className="flex-row items-center justify-between py-4"
                >
                  <View className="flex-1">
                    <Text className="font-inter text-lg text-gray-900">
                      {stateCodeOption.name}
                    </Text>
                    <Text className="font-inter text-sm text-gray-500">
                      {stateCodeOption.code}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-3">
                    {selectedStateCode === stateCodeOption.code && (
                      <View className="rounded-full bg-blue-600 px-3 py-1">
                        <Text className="font-inter text-xs text-white">
                          Current
                        </Text>
                      </View>
                    )}
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <View className="size-6 items-center justify-center rounded-full border-2 border-gray-300">
                        {selectedStateCode === stateCodeOption.code && (
                          <View className="size-3 rounded-full bg-blue-600" />
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                {index < AVAILABLE_STATE_CODES.length - 1 && (
                  <View className="h-px bg-gray-200" />
                )}
              </React.Fragment>
            ))}
          </View>

          <Text className="mt-4 font-inter text-sm text-gray-500">
            Currently viewing data for{" "}
            {
              AVAILABLE_STATE_CODES.find((s) => s.code === selectedStateCode)
                ?.name
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StateSelectionScreen;
