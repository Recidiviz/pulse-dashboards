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

import { Text, TextProps } from "react-native";

/**
 * A wrapper around React Native's `Text` component that applies `font-inter`
 * as the default font via NativeWind. Use this instead of `Text` directly.
 *
 * To override the font, pass a font class via `className` — it will take
 * precedence over the default. For example, to use Libre Baskerville:
 *
 * @example
 * <Typography className="text-sm text-gray-500">Hello world</Typography>
 *
 * @example
 * <Typography className="font-libre-baskerville text-xl">Heading</Typography>
 */
export function Typography({ className, children, ...props }: TextProps) {
  return (
    // eslint-disable-next-line local/no-rn-text
    <Text className={`font-inter ${className}`} {...props}>
      {children}
    </Text>
  );
}
