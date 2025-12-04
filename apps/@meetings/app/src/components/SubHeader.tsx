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
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";

interface SubHeaderProps {
  showRightIcon?: boolean;
  showRightBtn?: boolean;
  showHeading?: boolean;
  headingTxt?: string;
  onPressBtn?: () => void;
}

const SubHeader: React.FC<SubHeaderProps> = ({
  showRightIcon = false,
  showHeading = true,
  showRightBtn = false,
  headingTxt = "New Meeting",
  onPressBtn,
}) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={Icons.ArrowLeft} className="size-6" />
        </TouchableOpacity>
        {showHeading && (
          <Text className="font-inter text-base font-semibold text-primary">
            {headingTxt}
          </Text>
        )}
        {(() => {
          if (showRightIcon) {
            return (
              <TouchableOpacity onPress={() => console.log("Icon pressed")}>
                <Image source={Icons.Bell} className="size-6" />
              </TouchableOpacity>
            );
          }

          if (showRightBtn) {
            return (
              <TouchableOpacity onPress={onPressBtn}>
                <Text className="font-inter text-base font-semibold text-[#B42D2D]">
                  Discard
                </Text>
              </TouchableOpacity>
            );
          }

          return <View className="size-6" />;
        })()}
      </View>
    </SafeAreaView>
  );
};

export default SubHeader;
