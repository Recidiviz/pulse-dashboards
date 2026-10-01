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

import { HIDDEN_HEADER_OFFSET, STICKY_HEADER_ZINDEX } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

import { QUESTIONNAIRE_CONTENT_MAX_WIDTH } from "../constants";
import { SectionVariant } from "./types";

export const Wrapper = styled.div`
  background: ${palette.marble3};
  border-bottom: 1px solid ${palette.slate20};
  position: sticky;
  top: ${rem(HIDDEN_HEADER_OFFSET)};
  z-index: ${STICKY_HEADER_ZINDEX};
`;

export const Inner = styled.div`
  max-width: ${rem(QUESTIONNAIRE_CONTENT_MAX_WIDTH)};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  margin: 0 auto;
  padding: ${rem(spacing.xl)};
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SectionLabel = styled.span`
  ${typography.Sans24}

  color: ${palette.pine1};
`;

export const SectionCount = styled.span`
  ${typography.Sans16}

  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
  color: ${palette.slate85};

  strong {
    color: ${palette.pine1};
    font-weight: 700;
  }
`;

export const ChevronButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: ${palette.pine1};
  cursor: pointer;
  padding: 0;
`;

export const ProgressTrack = styled.div`
  height: ${rem(8)};
  width: 100%;
  background: ${palette.slate10};
  border-radius: ${rem(8)};
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${palette.signal.highlight};
  border-radius: ${rem(8)};
  transition: width 0.2s ease-in-out;
`;

export const SectionListPanel = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  list-style: none;
  background: ${palette.marble1};
  border-radius: ${rem(8)};
  margin: ${rem(spacing.lg)} 0 0;
  padding: ${rem(spacing.md)};
`;

export const SectionListRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

export const SectionListMarker = styled.span`
  height: ${rem(16)};
  width: ${rem(16)};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`;

export const CompletedCheck = styled.span`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${palette.signal.highlight};
  border-radius: 50%;
`;

export const MarkerDot = styled.span<{
  $variant: Exclude<SectionVariant, "completed">;
}>`
  border-radius: 50%;

  ${({ $variant }) =>
    $variant === "current"
      ? css`
          height: ${rem(8)};
          width: ${rem(8)};
          background: ${palette.signal.highlight};
        `
      : css`
          height: ${rem(6)};
          width: ${rem(6)};
          background: ${palette.slate20};
        `}
`;

export const SectionListLabel = styled.span<{ $muted: boolean }>`
  ${typography.Sans16}

  flex: 1;
  color: ${({ $muted }) => ($muted ? palette.slate60 : palette.pine1)};
`;

export const SectionStatusPill = styled.span<{
  $variant: Exclude<SectionVariant, "upcoming">;
}>`
  ${typography.Sans14}

  border: 1px solid;
  border-radius: ${rem(4)};
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};

  ${({ $variant }) =>
    $variant === "completed"
      ? css`
          background: ${rgba(palette.signal.highlight, 0.1)};
          border-color: ${palette.signal.highlight};
          color: ${palette.signal.highlight};
        `
      : css`
          background: ${palette.marble3};
          border-color: ${palette.slate30};
          color: ${palette.pine1};
        `}
`;
