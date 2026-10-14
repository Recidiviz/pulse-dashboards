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

import { rem, rgba } from "polished";
import styled, { css } from "styled-components";

import { palette, spacing, typography } from "~design-system";

import { CalloutTone, CalloutVariant } from "./types";

const toneStyles: Record<
  CalloutTone,
  { backgroundColor: string; borderColor: string }
> = {
  neutral: {
    backgroundColor: palette.slate05,
    borderColor: palette.slate20,
  },
  info: {
    backgroundColor: rgba(palette.signal.notification, 0.1),
    borderColor: palette.signal.notification,
  },
  warning: {
    backgroundColor: rgba(palette.data.gold2, 0.1),
    borderColor: palette.data.gold2,
  },
  success: {
    backgroundColor: rgba(palette.signal.highlight, 0.1),
    borderColor: palette.signal.highlight,
  },
  error: {
    backgroundColor: rgba(palette.signal.error, 0.1),
    borderColor: palette.signal.error,
  },
};

const bannerStyles = css<{ $tone: CalloutTone }>`
  align-items: center;
  border-left: 4px solid ${({ $tone }) => toneStyles[$tone].borderColor};
  padding: ${rem(spacing.md)};
`;

const slimStyles = css<{ $tone: CalloutTone }>`
  ${bannerStyles}

  gap: ${rem(spacing.sm)};
  min-height: ${rem(spacing.xxl)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
`;

const cardStyles = css`
  align-items: flex-start;
  border-radius: ${rem(8)};
  flex-direction: column;
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
`;

const variantStyles = {
  banner: bannerStyles,
  slim: slimStyles,
  card: cardStyles,
};

export const Wrapper = styled.div<{
  $tone: CalloutTone;
  $variant: CalloutVariant;
}>`
  background-color: ${({ $tone }) => toneStyles[$tone].backgroundColor};
  display: flex;
  gap: ${rem(spacing.md)};

  ${({ $variant }) => variantStyles[$variant]}
`;

export const IconSlot = styled.div<{ $variant: CalloutVariant }>`
  align-self: ${({ $variant }) =>
    $variant === "slim" ? "center" : "flex-start"};
  color: ${palette.pine2};
  display: flex;
  flex-shrink: 0;
`;

export const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

export const Heading = styled.p`
  ${typography.Sans18}

  color: ${palette.pine2};
  font-weight: 700;
  margin: 0;
`;

export const Description = styled.p<{ $variant: CalloutVariant }>`
  ${typography.Sans16}

  color: ${({ $variant }) =>
    $variant === "card" ? palette.pine2 : palette.slate85};
  margin: 0;
`;

export const ActionSlot = styled.div`
  flex-shrink: 0;
`;

export const DismissButton = styled.button`
  height: ${rem(24)};
  width: ${rem(24)};
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: ${palette.pine2};
  cursor: pointer;
  padding: 0;
`;
