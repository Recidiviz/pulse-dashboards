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

import { FC, ReactNode } from "react";

import { ChipButton, ChipTag } from "./Chip.styles";

type InteractiveChipProps = {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  inverted?: boolean;
};

type LabelChipProps = {
  children: ReactNode;
  selected?: boolean;
  onClick?: undefined;
  inverted?: boolean;
};

export type ChipProps = InteractiveChipProps | LabelChipProps;

export const Chip: FC<ChipProps> = ({
  children,
  selected = false,
  onClick,
  inverted = false,
}) => {
  if (onClick) {
    return (
      <ChipButton
        type="button"
        $selected={selected}
        $inverted={inverted}
        onClick={onClick}
        aria-pressed={selected}
      >
        {children}
      </ChipButton>
    );
  }

  return (
    <ChipTag $selected={selected} $inverted={inverted}>
      {children}
    </ChipTag>
  );
};
