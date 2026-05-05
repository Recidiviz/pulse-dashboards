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
import { TextInput, TouchableOpacity, View } from "react-native";
import ArrowLeftIcon from "react-native-heroicons/outline/ArrowLeftIcon";
import SearchIcon from "react-native-heroicons/outline/SearchIcon";

import { theme } from "../config/theme";
import { Typography } from "./Typography";

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
      className="w-full flex-1 flex-row items-center rounded-xl border bg-secondary px-3 py-2"
      style={{
        borderColor: isFocused
          ? theme["borderColor"]["brand"]
          : theme["borderColor"]["subtle"],
        boxShadow: isFocused ? theme["boxShadow"]["focus-brand"] : "",
      }}
    >
      <TouchableOpacity onPress={() => (isFocused ? onExit?.() : null)}>
        {isFocused || value ? (
          <ArrowLeftIcon className="!size-4 stroke-tertiary" />
        ) : (
          <SearchIcon className="!size-4 stroke-tertiary" />
        )}
      </TouchableOpacity>
      <TextInput
        className="flex-1 px-2 py-0 font-inter text-sm text-primary outline-none"
        placeholder={placeholder}
        placeholderTextColor={theme["colors"]["secondary"]}
        value={value}
        onChangeText={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")}>
          <View className="flex size-4 items-center justify-center rounded-full bg-tertiary">
            <Typography className="text-[8px] font-extrabold leading-[8px] text-on-brand">
              ✕
            </Typography>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
