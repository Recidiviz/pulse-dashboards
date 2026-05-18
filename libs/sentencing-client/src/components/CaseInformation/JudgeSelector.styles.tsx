// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { rgba } from "polished";
import { StylesConfig } from "react-select";
import styled from "styled-components";

import { Icon, IconSVG, iconToDataURI, palette } from "~design-system";

import { SelectOption } from "../CaseDetails/Form/types";
import { inlineDropdownBase } from "../OffenderAssessment/FormComponents.styles";
import {
  HelperText as FormFieldHelperText,
  Label,
  pencilInputBase,
} from "./FormField.styles";

// pine3 compensates for ChevronDown being an outline icon (vs filled pencil/calendar)
// so it reads at the same visual weight as palette.signal.links on the solid icons
const CHEVRON_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG["ChevronDown"]} color={palette.pine3} />,
);

// Dropdown control styled like the offense card inputs (inline, no border, chevron icon),
// but options styled like the employment history modal dropdown.
export const judgeDropdownStyles: StylesConfig<SelectOption, boolean> = {
  ...inlineDropdownBase,
  control: (_base, { isFocused }) => ({
    border: isFocused
      ? `1px solid ${rgba(palette.pine4, 0.15)}`
      : "1px solid white",
    borderRadius: isFocused ? "4px" : "0",
    boxShadow: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    minHeight: "unset",
    minWidth: "10rem",
    padding: 0,
    "&:hover": {
      borderColor: rgba(palette.pine4, 0.15),
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "2px 9px 2px 1.5em",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "left 4px center",
    backgroundSize: "0.75em",
    backgroundImage: CHEVRON_BACKGROUND,
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: "normal",
  }),
  singleValue: (base) => ({ ...base, color: palette.pine3, margin: 0 }),
  dropdownIndicator: () => ({ display: "none" }),
};

// Text input styled like the offense card (pencil icon, no border, compact)
export const PencilInput = styled.input`
  ${pencilInputBase}
  font-weight: 500;
  font-family: "Public Sans";
  font-size: 0.875rem;
  padding: 2px 9px 2px 1.5em;
  min-width: 10rem;
  flex-shrink: 0;
  &:focus {
    outline: none;
  }
`;

// 2-column grid so HelperText can align under the input, not the label
export const JudgeNameSection = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 6px;
  align-items: center;
`;

// Extends FormField HelperText; spans both grid columns to align under the label
export const HelperText = styled(FormFieldHelperText)`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

export const BackToListLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-family: "Public Sans";
  font-size: 0.75rem;
  font-style: italic;
  color: ${palette.signal.links};
  cursor: pointer;
  text-decoration: underline;
`;

export const InlineRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

// Extends Label (same visual styles, rendered as span)
export const TitlePrefix = styled(Label).attrs({ as: "span" })``;
