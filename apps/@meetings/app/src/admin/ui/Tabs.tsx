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
import { Pressable, View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

export type TabOption<T extends string> = {
  value: T;
  label: string;
  /** A number shown after the label. */
  count?: number;
  /** A small dot beside the label, to point at a tab that needs attention. */
  flagged?: boolean;
};

type TabsProps<T extends string> = {
  tabs: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className={clsx("flex-row gap-5 border-b border-subtle", className)}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.value)}
            className={clsx(
              "-mb-px flex-row items-center gap-1.5 border-b-2 py-2.5",
              selected ? "border-brand" : "border-transparent",
            )}
          >
            <Typography
              variant={selected ? "body-s-medium" : "body-s-regular"}
              className={selected ? "!text-brand" : "!text-secondary"}
            >
              {tab.label}
            </Typography>
            {tab.count !== undefined && (
              <Typography variant="caption-s-medium" className="!text-tertiary">
                {tab.count}
              </Typography>
            )}
            {tab.flagged && (
              <View
                accessibilityLabel="Flagged"
                className="size-1.5 rounded-full bg-warning"
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
