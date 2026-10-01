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

import * as Sentry from "@sentry/react-native";
import clsx from "clsx";
import { ReactNode } from "react";
import { Linking, Platform, TextProps } from "react-native";

import { Typography, TypographyVariant } from "./Typography";

type LinkProps = {
  variant?: TypographyVariant;
  className?: string;
  children: ReactNode;
} & (
  | { href: string; onPress?: never }
  | { onPress: () => void | Promise<void>; href?: never }
);

/**
 * Underlined inline text that either navigates to href or runs onPress.
 *
 * With href, web renders a real <a href> so the browser handles navigation,
 * middle-click, and "copy link"; native opens the URL through Linking. With
 * onPress, the text gets the button role, which web renders as a <button> so
 * it stays keyboard-focusable and activates on Enter and Space.
 */
export function Link({
  href,
  onPress,
  variant = "body-s-regular",
  className,
  children,
}: LinkProps) {
  const isWebHref = Platform.OS === "web" && href !== undefined;

  const handlePress = () => {
    const action = href !== undefined ? () => Linking.openURL(href) : onPress;
    Promise.resolve(action()).catch((error) => {
      Sentry.captureException(error);
    });
  };

  // React Native's TextProps don't declare href, but react-native-web reads
  // it to render the text as an anchor.
  const webAnchorProps = isWebHref ? ({ href } as TextProps) : undefined;

  return (
    <Typography
      variant={variant}
      role={href !== undefined ? "link" : "button"}
      onPress={isWebHref ? undefined : handlePress}
      className={clsx("cursor-pointer underline", className)}
      {...webAnchorProps}
    >
      {children}
    </Typography>
  );
}
