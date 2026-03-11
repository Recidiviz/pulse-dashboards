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
import { TouchableOpacity, View } from "react-native";

import { useAppVersionCheck } from "../hooks/useAppVersionCheck";
import { Typography } from "../shared/ui/Typography";
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
      onClickOutside={hideModal}
      containerClassName="w-80"
    >
      <View className="p-6">
        <Typography className="mb-2 text-center text-xl font-bold text-gray-900">
          {title}
        </Typography>

        <Typography className="mb-6 text-center text-base text-gray-600">
          {message}
        </Typography>

        <TouchableOpacity
          onPress={openStore}
          className="mb-3 items-center rounded-full bg-[#006C67] py-4"
          accessibilityRole="button"
          accessibilityLabel="Update app"
        >
          <Typography className="font-semibold text-white">
            Update Now
          </Typography>
        </TouchableOpacity>

        {!forceUpgrade && (
          <TouchableOpacity
            onPress={hideModal}
            className="items-center py-3"
            accessibilityRole="button"
            accessibilityLabel="Update later"
          >
            <Typography className="text-gray-500">Later</Typography>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

export default AppUpdateModal;
