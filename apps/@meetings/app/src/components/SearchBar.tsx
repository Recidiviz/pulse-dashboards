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

import React, { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";

interface SearchBarProps {
  value: string;
  placeholder: string;
  onChange: (t: string) => void;
  onExit?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  placeholder,
  onChange,
  onExit,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`flex-1 flex-row items-center rounded-xl border px-3 ${
        isFocused ? "border-primary" : "border-gray-300"
      } bg-gray-50`}
    >
      <TouchableOpacity onPress={() => (isFocused ? onExit?.() : null)}>
        <Image
          source={isFocused || value ? Icons.LeftIcon : Icons.Search}
          className="size-[16]"
          style={{ resizeMode: "contain" }}
        />
      </TouchableOpacity>

      <TextInput
        className="mb-1 ml-2 h-10 flex-1 font-inter text-sm text-black"
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {value?.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")}>
          <View className="size-4 items-center justify-center rounded-full bg-[#9AA9B1]">
            <Text className="text-[8px] font-extrabold text-white">✕</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
