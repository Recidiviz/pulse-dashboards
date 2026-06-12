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

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import clsx from "clsx";
import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";
import XIcon from "react-native-heroicons/outline/XIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../config/theme";
import { Typography } from "./Typography";

const BOTTOM_SHEET_FREE_TEXT_OPTION = "Other";

type DropdownProps = {
  className?: string;
  variant?: "text" | "outline";
  value?: string | null;
  options: string[];
  onSelect?: (value: string) => void;
  label?: string;
  placeholder?: string;
  defaultEmptyValue?: boolean;
  errorMessage?: string | null;
  hasFreeTextOption?: boolean;
};

const Dropdown = ({
  className,
  variant = "text",
  value,
  options,
  onSelect,
  label,
  placeholder,
  defaultEmptyValue = false,
  errorMessage,
  hasFreeTextOption = false,
}: DropdownProps) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(() => {
    if (value) return value;
    if (defaultEmptyValue) return null;
    return options[0];
  });
  const [freeTextValue, setFreeTextValue] = useState(() => {
    if (value && !options.includes(value)) {
      return value;
    }
    return "";
  });
  const [isFreeTextOptionSelected, setIsFreeTextOptionSelected] = useState(
    () => {
      if (selected && !options.includes(selected)) {
        return true;
      }
      return false;
    },
  );

  const [open, setOpen] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleToggle = useCallback(() => {
    if (Platform.OS === "web") {
      setOpen((open) => !open);
    } else {
      bottomSheetRef.current?.present();
    }
  }, []);

  const handleDropdownSelect = (opt: string) => {
    setSelected(opt);
    setOpen(false);
    if (onSelect) onSelect(opt);
    if (options.includes(opt)) setFreeTextValue("");
  };

  const handleFreeTextSelect = () => {
    if (freeTextValue.trim()) {
      Platform.OS === "web"
        ? handleDropdownSelect(freeTextValue.trim())
        : handleBottomSheetSelect(freeTextValue.trim());
    }
  };

  const handleBottomSheetSelect = useCallback(
    (opt: string) => {
      setSelected(opt);
      setOpen(false);
      bottomSheetRef.current?.close();
      if (onSelect) onSelect(opt);
      if (options.includes(opt)) {
        setFreeTextValue("");
        setIsFreeTextOptionSelected(false);
      }
    },
    [onSelect, options],
  );

  const ScrollableContainer =
    Platform.OS === "web" ? ScrollView : BottomSheetScrollView;

  return (
    <View className={clsx("flex flex-col items-center gap-2", className)}>
      <View
        className={clsx(
          "relative z-50 md:min-w-[200px]",
          variant === "text" && "w-fit self-start",
          variant === "outline" &&
            errorMessage &&
            "w-full rounded-lg border bg-secondary px-3 py-2.5 md:w-[320px]",
          variant === "outline" &&
            "w-full rounded-lg border bg-secondary px-3 py-2.5 md:w-[320px]",
          errorMessage ? "border-attention" : "border-subtle",
        )}
      >
        <Pressable
          className={clsx(
            "flex-row items-center",
            variant === "text" && "justify-end",
            variant === "outline" && "justify-between",
          )}
          onPress={handleToggle}
        >
          {label && (
            <Typography className="text-sm text-secondary md:text-base">
              {label}:
            </Typography>
          )}

          <View
            className={clsx(
              "flex-row items-center rounded-md",
              variant === "text" && "justify-end",
              variant === "outline" && "w-full justify-between",
            )}
          >
            <Typography
              className={clsx(
                "px-1 text-sm text-primary",
                variant === "text" && "md:text-base md:font-medium",
                selected ? "text-primary" : "text-secondary",
              )}
              numberOfLines={1}
            >
              {selected || placeholder}
            </Typography>
            {open ? (
              <ChevronUpIcon className="size-4 stroke-tertiary stroke-[3px]" />
            ) : (
              <ChevronDownIcon className="size-4 stroke-tertiary stroke-[3px]" />
            )}
          </View>
        </Pressable>
        {open && Platform.OS === "web" && (
          <>
            <TouchableWithoutFeedback onPress={() => setOpen(false)}>
              <View className="fixed inset-0 z-40" />
            </TouchableWithoutFeedback>
            <View
              className={clsx(
                "absolute right-0 z-50 w-fit flex-1 rounded-lg border border-subtle bg-primary p-1",
                variant === "text" && "top-7 w-fit",
                variant === "outline" && "top-[120%] max-h-[150px] w-full",
              )}
              style={{
                shadowColor: theme["backgroundColor"]["brand-light"],
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
                    className="group rounded p-2.5 hover:bg-hover"
                    onPress={() => handleDropdownSelect(opt)}
                  >
                    <Typography className="whitespace-nowrap text-sm font-medium text-primary group-hover:text-brand">
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
                        <Typography className="text-sm font-semibold leading-[16px] text-on-brand">
                          Continue
                        </Typography>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </>
        )}
        {Platform.OS !== "web" && (
          <BottomSheetModal
            ref={bottomSheetRef}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            enableDynamicSizing
            enablePanDownToClose
            handleIndicatorStyle={{
              backgroundColor: theme["backgroundColor"]["strong"],
            }}
            containerStyle={{ flex: 1 }}
            backdropComponent={(props) => (
              <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={1}
                pressBehavior="close"
                opacity={0.5}
              />
            )}
          >
            <ScrollableContainer className="flex max-h-full flex-1 flex-col px-4">
              <View className="mb-4 flex flex-row items-center justify-between">
                <View className="pointer-events-none size-8" />
                <Pressable onPress={() => bottomSheetRef.current?.close()}>
                  <View className="flex size-8 items-center justify-center rounded-full bg-secondary">
                    <XIcon className="!size-4 stroke-tertiary" />
                  </View>
                </Pressable>
              </View>
              <View
                className="flex size-full flex-col py-1"
                style={{ paddingBottom: insets.bottom + 32 }}
              >
                {options.map((opt, i) => (
                  <BottomSheetOptionItem
                    key={opt}
                    option={opt}
                    isActive={opt === selected}
                    onSelect={handleBottomSheetSelect}
                    isLast={!hasFreeTextOption && i === options.length - 1}
                  />
                ))}
                {hasFreeTextOption && (
                  <>
                    <BottomSheetOptionItem
                      key={BOTTOM_SHEET_FREE_TEXT_OPTION}
                      option={BOTTOM_SHEET_FREE_TEXT_OPTION}
                      isActive={isFreeTextOptionSelected}
                      onSelect={() => setIsFreeTextOptionSelected(true)}
                      isLast={true}
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
                          <Typography className="text-center text-base font-semibold leading-[18px] text-on-brand">
                            Continue
                          </Typography>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollableContainer>
          </BottomSheetModal>
        )}
      </View>
      {errorMessage && (
        <Typography className="text-xs font-normal text-attention">
          {errorMessage}
        </Typography>
      )}
    </View>
  );
};

const BottomSheetOptionItem = ({
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
        <Typography className="text-base font-medium">{option}</Typography>
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
        <Typography className="text-xs font-normal text-secondary">
          {value.length}/20
        </Typography>
      )}
    </View>
  );
}

export default Dropdown;
