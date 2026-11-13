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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components";

import { DropdownMenu, DropdownToggle, Icon, palette } from "~design-system";

// Controls that more than one report field input uses, so the fields look
// and behave alike.

/**
 * Styles for a button that reads as a link in a report field, such as the
 * month picker's "Enter Date".
 */
export const reportLinkButtonStyles = css`
  ${typography.Sans14}
  display: inline-flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  padding: 0;
  border: none;
  background: transparent;
  color: ${palette.pine4};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    color: ${palette.pine3};
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
    border-radius: ${rem(4)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ClearButton = styled.button.attrs({ type: "button" })`
  ${reportLinkButtonStyles}
  color: ${palette.slate60};
`;

/**
 * The button beside a report field's value that clears it, such as a picked
 * month or age.
 *
 * @param label - Names the field it clears for screen readers, such as
 *   "Last Use".
 * @param onClick - Clears the field.
 */
export function ReportClearButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <ClearButton aria-label={`Clear ${label}`} onClick={onClick}>
      <Icon kind="Close" size={10} color="currentColor" />
    </ClearButton>
  );
}

/** A report dropdown's toggle, which shows the picked option and a caret. */
export const ReportDropdownToggle = styled(DropdownToggle).attrs({
  showCaret: true,
})`
  gap: ${rem(spacing.md)};
  color: ${palette.pine2};
`;

/**
 * A report dropdown's menu. A long list, such as every age from 1 to 100,
 * scrolls rather than running off the page.
 */
export const ReportDropdownMenu = styled(DropdownMenu).attrs({
  alignment: "left",
})`
  width: max-content;
  max-height: ${rem(240)};
  overflow-y: auto;
`;
