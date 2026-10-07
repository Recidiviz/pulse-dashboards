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
import styled from "styled-components";

import { HIDDEN_HEADER_OFFSET, STICKY_HEADER_ZINDEX } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

import { CONTENT_MAX_WIDTH } from "../constants";

export const Wrapper = styled.div`
  background: ${palette.marble3};
  border-bottom: 1px solid ${palette.slate20};
  position: sticky;
  top: ${rem(HIDDEN_HEADER_OFFSET)};
  z-index: ${STICKY_HEADER_ZINDEX};
`;

export const Inner = styled.div`
  max-width: ${rem(CONTENT_MAX_WIDTH)};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  margin: 0 auto;
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SectionLabel = styled.span`
  ${typography.Sans18}

  color: ${palette.pine1};
`;

export const NextSection = styled.span`
  ${typography.Sans16}

  color: ${palette.slate85};

  strong {
    color: ${palette.pine1};
  }
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
