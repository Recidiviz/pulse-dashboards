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
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";

type DropdownProps = {
  options: string[];
  label?: string;
  onSelect?: (value: string) => void;
};

const Dropdown = ({ options, label, onSelect }: DropdownProps) => {
  const [selected, setSelected] = useState(options[0]);
  const [open, setOpen] = useState(false);

  const handleSelect = (opt: string) => {
    setSelected(opt);
    setOpen(false);
    if (onSelect) onSelect(opt);
  };

  return (
    <View className="z-50 self-start">
      <View className="flex-row items-center justify-between">
        {label && (
          <Text className="text-sm text-[#355362D9] md:text-base">
            {label}:
          </Text>
        )}

        <TouchableOpacity
          className="min-w-[100px] flex-row items-center justify-between rounded-md  bg-gray-100"
          onPress={() => setOpen((p) => !p)}
        >
          <Text
            className="px-1 text-sm text-[#004D48] md:text-base md:font-medium"
            numberOfLines={1}
          >
            {selected}
          </Text>
          <Image
            source={open ? Icons.ArrowUpGreen : Icons.ArrowDown}
            className="!size-4"
          />
        </TouchableOpacity>
      </View>

      {open && (
        <View
          className="absolute top-7 z-50 w-full rounded-lg border border-[#EDF1F1] bg-white p-1"
          style={{
            shadowColor: "#29605F",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <ScrollView>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                className="group rounded p-2.5 hover:bg-[#F4F5F5]"
                onPress={() => handleSelect(opt)}
              >
                <Text className="text-sm font-medium text-[#355362D9] group-hover:text-[#004D48]">
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default Dropdown;
