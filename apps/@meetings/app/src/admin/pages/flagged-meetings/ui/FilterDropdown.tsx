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

import clsx from "clsx";
import { useState } from "react";
import { Pressable, View } from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";

import { Typography } from "~@meetings/app/shared/ui/Typography";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  subtitle?: string;
};

type FilterDropdownProps<T extends string> = {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * A left-anchored popover for the web-only filter row. The shared
 * DropdownContainer right-aligns its menu, which clips at the edge of a
 * left-aligned row.
 */
export function FilterDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const Chevron = open ? ChevronUpIcon : ChevronDownIcon;

  return (
    <View className={clsx("relative", open && "z-50")}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((isOpen) => !isOpen)}
        className="h-8 flex-row items-center gap-2 rounded px-1"
      >
        <Typography variant="body-s-regular" className="!text-tertiary">
          {label}:
        </Typography>
        <Typography variant="body-s-medium">{selected?.label}</Typography>
        <Chevron className="size-4 shrink-0 stroke-tertiary stroke-[3px]" />
      </Pressable>
      {open && (
        <>
          <Pressable
            accessibilityLabel="Close menu"
            onPress={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <View className="absolute left-0 top-9 z-50 min-w-[220px] rounded-lg border border-subtle bg-primary p-1 shadow-lg">
            {options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="menuitem"
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="gap-0.5 rounded p-2.5 hover:bg-hover"
              >
                <Typography
                  variant={
                    option.value === value ? "body-s-medium" : "body-s-regular"
                  }
                  className="!text-primary"
                >
                  {option.label}
                </Typography>
                {option.subtitle && (
                  <Typography variant="caption-s-regular">
                    {option.subtitle}
                  </Typography>
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
