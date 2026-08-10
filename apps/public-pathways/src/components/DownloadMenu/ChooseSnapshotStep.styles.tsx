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
import styled, { css } from "styled-components";

import { Button, ModalHeading, RadioGroup, spacing } from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

const PROXIMA_NOVA_FONT_FAMILY = '"Proxima Nova", sans-serif';

export const SnapshotHeading = styled(ModalHeading)`
  font-weight: 700;
  font-family: ${PROXIMA_NOVA_FONT_FAMILY};
  margin-top: 0.75rem;
  margin-bottom: 0;
`;

export const SnapshotSubheading = styled.p`
  ${publicPathwaysTypography.Sans16}
  margin: 0;
  color: ${publicPathwaysPalette.text.primary};
`;

export const SnapshotRadioGroup = styled(RadioGroup)`
  padding: 0;
`;

export const SnapshotOptionRow = styled.div<{ $isSelected: boolean }>`
  border: 1px solid ${publicPathwaysPalette.slate30};
  padding: ${rem(spacing.md)};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  cursor: pointer;
  transition:
    border-color 0.15s ease-in-out,
    background-color 0.15s ease-in-out;

  &:hover {
    border-width: 2px;
    border-color: ${publicPathwaysPalette.focusColor};
  }

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      border-width: 2px;
      border-color: ${publicPathwaysPalette.focusColor};
    `}

  .ds-radio {
    align-items: flex-start;
  }

  .ds-radio__box {
    margin-top: 3px;
  }
`;

export const SnapshotOptionHeading = styled.p`
  ${publicPathwaysTypography.Sans16}
  font-weight: 700;
  margin: 0;
  color: ${publicPathwaysPalette.pine1};
`;

export const SnapshotOptionSubheading = styled.p`
  ${publicPathwaysTypography.Sans14}
  margin: 0.15rem 0 0;
  color: ${publicPathwaysPalette.slate70};
`;

export const SnapshotDivider = styled.hr`
  width: 100%;
  border: none;
  border-top: 1px solid ${publicPathwaysPalette.slate20};
  margin: 0;
`;

export const SnapshotDatePickerRow = styled.div`
  width: 100%;
`;

export const SnapshotActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${rem(spacing.xs)};
`;

export const ContinueButton = styled(Button)`
  font-weight: 700;
  min-height: ${rem(44)};
  padding: ${rem(spacing.sm)} ${rem(spacing.lg)};
  font-size: ${rem(15)};
  font-family: ${PROXIMA_NOVA_FONT_FAMILY};
  background-color: ${publicPathwaysPalette.focusColor};
  border-color: ${publicPathwaysPalette.focusColor};

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background-color: ${publicPathwaysPalette.focusColor};
    border-color: ${publicPathwaysPalette.focusColor};
  }
`;

export const CancelButton = styled(Button)`
  min-width: auto;
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
  font-family: ${PROXIMA_NOVA_FONT_FAMILY};
  color: ${publicPathwaysPalette.text.primary};

  &:hover,
  &:focus-visible,
  &:active {
    color: ${publicPathwaysPalette.text.primary};
  }
`;
