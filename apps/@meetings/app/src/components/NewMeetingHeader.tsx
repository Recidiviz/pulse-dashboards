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

import { useNavigation } from "@react-navigation/native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import BellIcon from "react-native-heroicons/solid/BellIcon";
import ChevronLeftIcon from "react-native-heroicons/solid/ChevronLeftIcon";
import { SafeAreaView } from "react-native-safe-area-context";

import { Typography } from "../shared/ui/Typography";

interface NewMeetingHeaderProps {
  isMeetingActive: boolean;
  onDiscard: () => void;
  onFinalDiscard: () => void;
}

const NewMeetingHeader: React.FC<NewMeetingHeaderProps> = ({
  isMeetingActive,
  onDiscard,
  onFinalDiscard,
}) => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    if (!isMeetingActive) {
      onFinalDiscard();
    }
    navigation.goBack();
  };

  const renderHeaderRightButton = () => {
    if (isMeetingActive) {
      return (
        <TouchableOpacity onPress={onDiscard}>
          <Typography className="text-base font-semibold text-[#B42D2D]">
            Discard
          </Typography>
        </TouchableOpacity>
      );
    } else {
      return (
        <View>
          <BellIcon className="size-6 fill-muted" />
        </View>
      );
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <TouchableOpacity onPress={handleGoBack}>
          <ChevronLeftIcon className="size-6 fill-muted" />
        </TouchableOpacity>
        <Typography className="text-base font-semibold text-primary">
          {isMeetingActive ? "Meeting in Progress" : "New Meeting"}
        </Typography>
        {renderHeaderRightButton()}
      </View>
    </SafeAreaView>
  );
};

export default NewMeetingHeader;
