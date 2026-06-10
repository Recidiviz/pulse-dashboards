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

import { StylesConfig } from "react-select";
import styled from "styled-components";

import { palette } from "~design-system";

import { SelectOption } from "../CaseDetails/Form/types";
import { inlineDropdownBase } from "../OffenderAssessment/FormComponents.styles";

export const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  gap: 0.75rem;
`;

export const Divider = styled.div`
  width: 100%;
  height: 0.0625rem;
  background: ${palette.slate20};
`;

export const Card = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  align-self: stretch;
  padding-left: 2.5rem;
  padding-right: 2rem;
`;

export const SubsectionTitle = styled.div`
  color: ${palette.pine1};
  font-size: 1rem;
  padding-left: 2.5rem;
  padding-top: 1rem;
`;

export const ColumnSection = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 50%;
  align-self: stretch;
  flex-direction: column;
  color: ${palette.slate85};
`;

export const SectionHeader = styled.h3`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 1.2rem */
  letter-spacing: -0.01rem;
`;

export const pleaDropdownStyles: StylesConfig<SelectOption, boolean> = {
  ...inlineDropdownBase,
  container: (base) => ({ ...base, flex: 1, maxWidth: "50%" }),
  control: (_base, { isFocused }) => ({
    border: `1px solid ${isFocused ? palette.pine4 : palette.white}`,
    borderRadius: isFocused ? "4px" : "0",
    boxShadow: "none",
    minHeight: "unset",
    backgroundColor: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    margin: "-5px 0 0 -5px",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "1px 4px",
    fontSize: "0.8rem",
    fontFamily: "inherit",
  }),
  singleValue: (base) => ({
    ...base,
    color: palette.pine1,
    fontSize: "0.8rem",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: "0 4px",
    color: palette.pine1,
    svg: { width: "0.75em", height: "0.75em" },
  }),
};

export const MostSevereOffenseBadge = styled.div`
  display: flex;
  align-items: center;
  align-self: flex-start;
  padding: 0.25rem 0.5rem;
  border-radius: 6.25rem;
  background: ${palette.pink};
  color: ${palette.pinkDark};
  font-family: "Public Sans";
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.0075rem;
  white-space: nowrap;
`;
