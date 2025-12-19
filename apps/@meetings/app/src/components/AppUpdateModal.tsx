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

import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { useAppVersionCheck } from "../hooks/useAppVersionCheck";
import Modal from "./Modal";

const AppUpdateModal = () => {
  const { isModalVisible, hideModal, openStore, options } =
    useAppVersionCheck();

  const { title, message, forceUpgrade } = options;

  if (!isModalVisible) {
    return null;
  }

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onClose={hideModal}
      containerClassName="w-80"
    >
      <View className="p-6">
        <Text className="mb-2 font-inter font-bold text-gray-900 text-xl text-center">
          {title}
        </Text>

        <Text className="mb-6 font-inter text-gray-600 text-base text-center">
          {message}
        </Text>

        <TouchableOpacity
          onPress={openStore}
          className="items-center bg-[#006C67] mb-3 py-4 rounded-full"
          accessibilityRole="button"
          accessibilityLabel="Update app"
        >
          <Text className="font-inter font-semibold text-white">
            Update Now
          </Text>
        </TouchableOpacity>

        {!forceUpgrade && (
          <TouchableOpacity
            onPress={hideModal}
            className="items-center py-3"
            accessibilityRole="button"
            accessibilityLabel="Update later"
          >
            <Text className="font-inter text-gray-500">Later</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

export default AppUpdateModal;
