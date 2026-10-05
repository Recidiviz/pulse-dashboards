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

import { rem } from "polished";
import * as React from "react";
import { type JSX } from "react";
import styled from "styled-components";

import { palette, typography } from "~design-system";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

const SwitchLabel = styled.label`
  ${typography.Sans14}
  display: inline-flex;
  align-items: center;
  gap: ${rem(8)};
  cursor: pointer;
  color: ${palette.slate85};
  text-decoration: underline;
`;

const SwitchTrack = styled.span`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  width: ${rem(24)};
  height: ${rem(15)};
`;

const SwitchInput = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  height: 100%;
  margin: 0;
  border-radius: ${rem(15)};
  background-color: ${palette.slate50};
  cursor: inherit;
  transition: background-color 0.1s ease-in-out;

  &:checked {
    background-color: ${palette.pine4};
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: ${rem(2)} solid ${palette.signal.links};
    outline-offset: ${rem(2)};
  }
`;

const SwitchThumb = styled.span.attrs({ "aria-hidden": "true" })`
  position: absolute;
  top: ${rem(2)};
  left: ${rem(2)};
  width: ${rem(11)};
  height: ${rem(11)};
  border-radius: 50%;
  background-color: ${palette.marble1};
  pointer-events: none;
  transition: transform 0.1s ease-in-out;

  ${SwitchInput}:checked + & {
    transform: translateX(${rem(9)});
  }
`;

export const Switch = ({
  checked,
  onChange,
  children,
}: SwitchProps): JSX.Element => {
  return (
    <SwitchLabel>
      <SwitchTrack>
        <SwitchInput
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <SwitchThumb />
      </SwitchTrack>
      {children}
    </SwitchLabel>
  );
};
