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
import { Text, TextProps } from "react-native";

// Mirrors the "Typography" text styles defined in Figma (Heading-1..5,
// Button/L/M, Body/M/S, Caption/S). Keep names in sync with Figma so a style
// there maps 1:1 to a variant here.
export const TYPOGRAPHY_VARIANTS = {
  "heading-1":
    "font-libre-baskerville text-[32px] font-bold leading-[44px] tracking-[-0.64px] text-primary",
  "heading-2":
    "font-libre-baskerville text-[28px] font-bold leading-[40px] tracking-[-0.56px] text-primary",
  "heading-3": "text-2xl font-semibold tracking-[-0.48px] text-primary",
  "heading-4": "text-xl font-semibold tracking-[-0.4px] text-primary",
  "heading-5":
    "text-lg font-semibold leading-[26px] tracking-[-0.36px] text-primary",
  "button-l":
    "text-base font-semibold leading-[18px] tracking-[-0.32px] text-primary",
  "button-m": "text-sm font-semibold leading-4 tracking-[-0.28px] text-primary",
  "body-m-regular": "text-base font-normal tracking-[-0.32px] text-primary",
  "body-m-medium": "text-base font-medium tracking-[-0.32px] text-primary",
  "body-s-regular": "text-sm font-normal tracking-[-0.28px] text-secondary",
  "body-s-medium": "text-sm font-medium tracking-[-0.28px] text-primary",
  "caption-s-regular": "text-xs font-normal tracking-[-0.24px] text-secondary",
  "caption-s-medium": "text-xs font-medium tracking-[-0.24px] text-primary",
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY_VARIANTS;

type TypographyProps = TextProps & {
  variant?: TypographyVariant;
};

export function Typography({
  variant,
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    // eslint-disable-next-line local/no-rn-text
    <Text
      className={clsx(
        "font-inter",
        variant && TYPOGRAPHY_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Text>
  );
}
