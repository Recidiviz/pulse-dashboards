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
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
} from "react-native";

type TextInputVariant =
  // No frame
  | "plain"
  // Frame that reacts to hover and focus
  | "outlined"
  // Same frame without hover and focus styles
  | "outlined-static";

type TextInputProps = RNTextInputProps & {
  variant?: TextInputVariant;
  containerClassName?: string;
};

export function TextInput({
  variant = "plain",
  containerClassName,
  onFocus,
  onBlur,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isOutlined = variant !== "plain";
  const isInteractive = variant === "outlined";

  return (
    <View
      className={clsx(
        isOutlined && "rounded-xl border p-6 transition",
        isOutlined &&
          (isInteractive && isFocused
            ? "border-primary/80 shadow-focus-brand"
            : clsx(
                "border-primary/30",
                isInteractive &&
                  "hover:border-primary/80 hover:ring-1 hover:ring-primary/80",
              )),
        containerClassName,
      )}
    >
      <RNTextInput
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
      />
    </View>
  );
}
