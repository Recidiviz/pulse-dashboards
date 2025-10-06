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
import { Image, TextInput, View } from "react-native";

import Icons from "../../assets/icons";

interface SearchBarProps {
  value: string;
  placeholder: string;
  onChange: (t: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  placeholder,
  onChange,
}) => (
  <View className="flex-row items-center rounded-md border border-gray-300 bg-gray-50 px-2">
    <Image
      source={Icons.Search}
      className="size-[18]"
      style={{ resizeMode: "contain" }}
    />

    <TextInput
      className="ml-1.5 h-10 flex-1 font-[inter] text-xs font-semibold text-black"
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChange}
    />
  </View>
);

export default SearchBar;
