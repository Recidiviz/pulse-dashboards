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
import { ReactNode } from "react";
import styled from "styled-components";

import { palette, typography } from "~design-system";

/**
 * Stacked label-over-value field shared across the US_MO profile cards (Case
 * Overview's Client Information, Case Planning's ORAS Assessment, …). The label
 * sits `rem(8)` above the value; multi-line values stack at `rem(2)`. Spacing
 * *between* fields is the parent's concern (a column `gap`, row padding, etc.),
 * so this component owns only the label/value pair itself.
 *
 * Tokens come from Figma nodes 7364-3879 / 7432-2685.
 */

export const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(8)};
`;

export const FieldLabel = styled.div`
  ${typography.Sans12}
  color: ${palette.pine1};
`;

// `fs-exclude` keeps potentially-PII values out of FullStory recordings.
export const FieldValue = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans12}
  color: ${palette.slate85};
  display: flex;
  flex-direction: column;
  gap: ${rem(2)};
`;

type LabelValueProps = {
  label: ReactNode;
  children: ReactNode;
  // Forwarded to the container so callers can add outer spacing (e.g. row
  // padding) via `styled(LabelValue)`.
  className?: string;
};

export const LabelValue = ({ label, children, className }: LabelValueProps) => (
  <FieldContainer className={className}>
    <FieldLabel>{label}</FieldLabel>
    <FieldValue>{children}</FieldValue>
  </FieldContainer>
);
