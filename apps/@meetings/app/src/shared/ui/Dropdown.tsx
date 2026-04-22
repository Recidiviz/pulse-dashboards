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
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";
import XIcon from "react-native-heroicons/outline/XIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../../common/theme";
import { Typography } from "./Typography";

type DropdownProps = {
  options: string[];
  label?: string;
  onSelect?: (value: string) => void;
};

const Dropdown = ({ options, label, onSelect }: DropdownProps) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(options[0]);
  const [open, setOpen] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ["40%"], []);

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
  };

  const handleBottomSheetSelect = useCallback(
    (opt: string) => {
      setSelected(opt);
      setOpen(false);
      bottomSheetRef.current?.close();
      if (onSelect) onSelect(opt);
    },
    [onSelect],
  );

  const ScrollableContainer =
    Platform.OS === "web" ? ScrollView : BottomSheetScrollView;

  return (
    <View className="relative z-50 w-fit self-start md:min-w-[200px]">
      <Pressable
        className="flex-row items-center justify-end"
        onPress={handleToggle}
      >
        {label && (
          <Typography className="text-sm text-secondary md:text-base">
            {label}:
          </Typography>
        )}

        <View className="flex-row items-center justify-end rounded-md">
          <Typography
            className="px-1 text-sm text-primary md:text-base md:font-medium"
            numberOfLines={1}
          >
            {selected}
          </Typography>
          {open ? (
            <ChevronUpIcon className="size-4 stroke-tertiary stroke-[3px]" />
          ) : (
            <ChevronDownIcon className="size-4 stroke-tertiary stroke-[3px]" />
          )}
        </View>
      </Pressable>
      {open && Platform.OS === "web" && (
        <View
          className="absolute right-0 top-7 w-fit rounded-lg border border-subtle bg-primary p-1"
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
          </ScrollView>
        </View>
      )}
      {Platform.OS !== "web" && (
        <BottomSheetModal
          ref={bottomSheetRef}
          snapPoints={snapPoints}
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
              <Typography className="text-xl font-semibold text-primary">
                Sort by
              </Typography>
              <Pressable onPress={() => bottomSheetRef.current?.close()}>
                <View className="flex size-8 items-center justify-center rounded-full bg-secondary">
                  <XIcon className="!size-4 stroke-tertiary" />
                </View>
              </Pressable>
            </View>
            <View
              className="flex size-full flex-col py-1"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              {options.map((opt, i) => (
                <BottomSheetOptionItem
                  key={opt}
                  option={opt}
                  isActive={opt === selected}
                  onSelect={handleBottomSheetSelect}
                  isLast={i === options.length - 1}
                />
              ))}
            </View>
          </ScrollableContainer>
        </BottomSheetModal>
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
    <Pressable onPress={() => onSelect(option)}>
      <View
        className={`flex w-full flex-1 flex-row items-center justify-between border-subtle py-3 ${isLast ? "border-none" : "border-b"}`}
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

export default Dropdown;
