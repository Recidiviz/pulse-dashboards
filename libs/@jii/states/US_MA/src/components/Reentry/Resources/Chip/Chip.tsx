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

import { FC, ReactNode, Ref } from "react";

import { Icon } from "~design-system";

import { ChipButton, ChipTag, RemovableChipButton } from "./Chip.styles";

type InteractiveChipProps = {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  onRemove?: undefined;
};

/** A selected option, such as an applied filter, that removes itself on click. */
type RemovableChipProps = {
  children: ReactNode;
  removeLabel: string;
  onRemove: () => void;
  ref?: Ref<HTMLButtonElement>;
  onClick?: undefined;
};

type LabelChipProps = {
  children: ReactNode;
  onClick?: undefined;
  onRemove?: undefined;
};

export type ChipProps =
  | InteractiveChipProps
  | RemovableChipProps
  | LabelChipProps;

export const Chip: FC<ChipProps> = (props) => {
  if (props.onClick) {
    return (
      <ChipButton
        type="button"
        $selected={props.selected}
        aria-pressed={props.selected}
        onClick={props.onClick}
      >
        {props.children}
      </ChipButton>
    );
  }

  if (props.onRemove) {
    return (
      <RemovableChipButton
        ref={props.ref}
        type="button"
        aria-label={props.removeLabel}
        onClick={props.onRemove}
      >
        {props.children}
        <Icon kind="Close" size={10} />
      </RemovableChipButton>
    );
  }

  return <ChipTag>{props.children}</ChipTag>;
};
