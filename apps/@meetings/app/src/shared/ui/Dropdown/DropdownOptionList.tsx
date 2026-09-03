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

import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useState } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { theme } from "../../config/theme";
import { Typography } from "../Typography";

const FREE_TEXT_OPTION_LABEL = "Other";

type DropdownOptionListProps = {
  options: string[];
  value?: string | null;
  onSelect: (value: string) => void;
  close: () => void;
  hasFreeTextOption?: boolean;
};

const DropdownOptionList = ({
  options,
  value,
  onSelect,
  close,
  hasFreeTextOption = false,
}: DropdownOptionListProps) => {
  const isFreeTextValue = !!value && !options.includes(value);
  const [freeTextValue, setFreeTextValue] = useState(() =>
    isFreeTextValue ? value : "",
  );
  const [isFreeTextOptionSelected, setIsFreeTextOptionSelected] =
    useState(isFreeTextValue);

  const handleSelect = (opt: string) => {
    onSelect(opt);
    close();
    if (options.includes(opt)) {
      setFreeTextValue("");
      setIsFreeTextOptionSelected(false);
    }
  };

  const handleFreeTextSelect = () => {
    if (freeTextValue.trim()) handleSelect(freeTextValue.trim());
  };

  if (Platform.OS === "web") {
    return (
      <>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            className="group rounded p-2.5 hover:bg-hover"
            onPress={() => handleSelect(opt)}
          >
            <Typography
              variant="body-s-medium"
              className="whitespace-nowrap group-hover:text-brand"
            >
              {opt}
            </Typography>
          </TouchableOpacity>
        ))}
        {hasFreeTextOption && (
          <View className="flex flex-col gap-2 px-2">
            <FreeTextInput
              value={freeTextValue}
              onChange={setFreeTextValue}
              placeholder="Type your variant"
            />
            {freeTextValue.trim().length > 0 && (
              <TouchableOpacity
                onPress={handleFreeTextSelect}
                className="w-fit rounded-full bg-brand px-3 py-2"
              >
                <Typography variant="button-m" className="!text-on-brand">
                  Continue
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  }

  return (
    <>
      {options.map((opt, i) => (
        <DropdownOptionItem
          key={opt}
          option={opt}
          isActive={opt === value}
          onSelect={handleSelect}
          isLast={!hasFreeTextOption && i === options.length - 1}
        />
      ))}
      {hasFreeTextOption && (
        <>
          <DropdownOptionItem
            option={FREE_TEXT_OPTION_LABEL}
            isActive={isFreeTextOptionSelected}
            onSelect={() => setIsFreeTextOptionSelected(true)}
            isLast
          />
          {isFreeTextOptionSelected && (
            <View className="flex flex-col gap-2">
              <FreeTextInput
                value={freeTextValue}
                onChange={setFreeTextValue}
                placeholder="Type your variant"
              />
              <TouchableOpacity
                onPress={handleFreeTextSelect}
                className="h-fit w-full rounded-full bg-brand px-4 py-3 disabled:opacity-40"
                disabled={freeTextValue.trim().length === 0}
              >
                <Typography
                  variant="button-l"
                  className="text-center !text-on-brand"
                >
                  Continue
                </Typography>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </>
  );
};

export const DropdownOptionItem = ({
  option,
  isActive,
  onSelect,
  isLast,
}: {
  option: string;
  isActive: boolean;
  onSelect: (opt: string) => void;
  isLast: boolean;
}) => {
  return (
    <Pressable onPress={() => onSelect(option)} className="flex-1">
      <View
        className={`flex w-full flex-1 flex-row items-center justify-between border-subtle py-2 ${isLast ? "border-none" : "border-b"}`}
      >
        <Typography variant="body-m-medium">{option}</Typography>
        <View
          className={`flex size-6 items-center justify-center rounded-full border border-subtle ${isActive ? "bg-brand" : "bg-secondary"}`}
        >
          <View
            className={`size-2 rounded-full bg-primary ${isActive ? "block" : "hidden"}`}
          />
        </View>
      </View>
    </Pressable>
  );
};

function FreeTextInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (t: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  const TextInputComponent =
    Platform.OS === "web" ? TextInput : BottomSheetTextInput;

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
      <TextInputComponent
        className="flex-1 py-0 pr-2 font-inter text-sm text-primary outline-none"
        placeholder={placeholder}
        placeholderTextColor={theme["colors"]["secondary"]}
        value={value}
        onChangeText={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={20}
        textAlignVertical="top"
      />
      {value?.length > 0 && (
        <Typography variant="caption-s-regular">{value.length}/20</Typography>
      )}
    </View>
  );
}

export default DropdownOptionList;
