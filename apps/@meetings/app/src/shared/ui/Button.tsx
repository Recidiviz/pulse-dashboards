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
import { ComponentType, ReactNode } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { SvgProps } from "react-native-svg";

import { Typography } from "./Typography";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";

type ButtonIconProps = {
  icon: ComponentType<SvgProps>;
  position?: "before" | "after";
  className?: string;
};

type ButtonProps = {
  variant: ButtonVariant;
  children?: ReactNode;
  icon?: ButtonIconProps;
  // "circle" is for icon-only buttons (e.g. thumbs up/down) - children is ignored
  shape?: "pill" | "circle";
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  className?: string;
};

const VARIANT_CONTAINER_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand",
  secondary: "bg-secondary",
  tertiary: "border border-subtle bg-transparent",
  destructive: "bg-attention",
};

const VARIANT_TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: "font-semibold text-on-brand",
  secondary: "font-medium text-primary",
  tertiary: "font-medium text-primary",
  destructive: "font-semibold text-on-attention",
};

const VARIANT_ICON_CLASSES: Record<ButtonVariant, string> = {
  primary: "fill-on-brand stroke-on-brand",
  secondary: "fill-tertiary stroke-tertiary",
  tertiary: "fill-tertiary stroke-tertiary",
  destructive: "fill-on-attention stroke-on-attention",
};

// Matches the actual hex behind each variant's text/icon color, since
// ActivityIndicator takes a real color, not a className.
const VARIANT_SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: "#FFFFFF",
  secondary: "#0D2B3A",
  tertiary: "#0D2B3A",
  destructive: "#FFFFFF",
};

export function Button({
  variant,
  children,
  icon,
  shape = "pill",
  loading = false,
  disabled = false,
  onPress,
  className,
}: ButtonProps) {
  const Icon = icon?.icon;
  const iconPosition = icon?.position ?? "before";
  const isCircle = shape === "circle";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={clsx(
        "cursor-pointer flex-row items-center justify-center rounded-full aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
        isCircle ? "size-10" : "gap-1.5 px-4 py-2",
        VARIANT_CONTAINER_CLASSES[variant],
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={VARIANT_SPINNER_COLOR[variant]}
        />
      ) : (
        <View pointerEvents="none" className="flex-row items-center gap-1.5">
          {Icon && iconPosition === "before" && (
            <Icon
              className={clsx(VARIANT_ICON_CLASSES[variant], icon?.className)}
            />
          )}
          {children && !isCircle && (
            <Typography
              className={clsx("text-sm", VARIANT_TEXT_CLASSES[variant])}
            >
              {children}
            </Typography>
          )}
          {Icon && iconPosition === "after" && (
            <Icon
              className={clsx(VARIANT_ICON_CLASSES[variant], icon?.className)}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
