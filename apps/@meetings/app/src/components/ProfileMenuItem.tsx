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

import { Link } from "@react-navigation/native";
import { ReactNode } from "react";
import { Pressable, PressableProps } from "react-native";

import { RootStackParamList } from "../shared/config/routes";
import { Typography } from "../shared/ui/Typography";

type WithLink = {
  link: { screen: keyof RootStackParamList; onPress: () => void };
  pressable?: never;
};

type WithPressable = {
  pressable: PressableProps;
  link?: never;
};

type Props = {
  label: string;
  helperText?: string;
  icon?: ReactNode;
} & (WithLink | WithPressable);

export const ProfileMenuItem = ({
  label,
  link,
  pressable,
  helperText,
  icon,
}: Props) => {
  const children = (
    <>
      <Typography className="whitespace-nowrap text-base font-medium leading-5 text-secondary transition-all duration-300 group-hover:text-brand">
        {label}
      </Typography>
      {helperText && (
        <Typography className="ml-auto whitespace-nowrap text-xs text-tertiary">
          {helperText}
        </Typography>
      )}
      {icon}
    </>
  );

  if (link)
    return (
      <Link
        className="group flex flex-row items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 hover:bg-brand-light"
        {...link}
      >
        {children}
      </Link>
    );

  return (
    <Pressable
      className="group flex flex-row items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 hover:bg-brand-light"
      {...pressable}
    >
      {children}
    </Pressable>
  );
};
