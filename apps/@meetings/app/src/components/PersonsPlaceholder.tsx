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

import { Image, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";

type Props = {
  message: string;
  onClearSearch?: () => void;
};

const PersonsPlaceholder = ({ message, onClearSearch }: Props) => {
  return (
    <View className="items-center justify-center py-16">
      <View className="mb-6 items-center justify-center rounded-3xl border-2 border-gray-200 bg-[#2B696908] p-3">
        <Image source={Icons.Lock} className="!size-14" />
      </View>
      <Text className="mb-2 text-center font-libre-baskerville text-3xl font-extrabold leading-[32px] tracking-[-0.5px] text-[#9CA3AF]">
        {message}
      </Text>
      <Text className="mb-6 text-center font-inter text-sm font-normal leading-5 tracking-[-0.28px] text-[#9CA3AF]">
        Try adjusting your search or use different keywords.
      </Text>
      {onClearSearch && (
        <TouchableOpacity
          onPress={onClearSearch}
          className="rounded-full border border-gray-300 px-6 py-3"
        >
          <Text className="font-inter text-[16px] font-medium text-gray-700">
            Clear search
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PersonsPlaceholder;
