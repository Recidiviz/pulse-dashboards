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

import { HIDDEN_HEADER_OFFSET } from "~@jii/common-ui";
import { Button, palette, spacing, typography } from "~design-system";

import { QUESTIONNAIRE_CONTENT_SIDE_PADDING } from "../constants";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

export const Heading = styled.h1`
  ${typography.Serif24}

  color: ${palette.pine1};
  margin: 0;
`;

export const Description = styled.p`
  ${typography.Sans16}

  color: ${palette.slate85};
  margin: 0;
`;

export const EntryList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Entry = styled.div<{ $isHashTarget: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  border-top: 1px solid ${palette.slate20};
  padding: ${rem(spacing.md)} 0;
  scroll-margin-top: ${rem(HIDDEN_HEADER_OFFSET)};

  ${({ $isHashTarget }) =>
    $isHashTarget &&
    css`
      isolation: isolate;
      outline: none;
      position: relative;

      /* Extends the highlight across the page's side padding, edge to edge. */
      &::before {
        background: ${palette.slate05};
        border-left: ${rem(spacing.xs)} solid ${palette.pine4};
        content: "";
        inset: 0 -${rem(QUESTIONNAIRE_CONTENT_SIDE_PADDING)};
        position: absolute;
        z-index: -1;
      }
    `}
`;

export const EntryText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const EntryQuestion = styled.span`
  ${typography.Sans16}

  color: ${palette.pine1};
  font-weight: 700;
`;

export const EntryAnswerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

export const EntryAnswer = styled.span`
  ${typography.Sans16}

  color: ${palette.slate85};
`;

export const UpdatedBadge = styled.span`
  ${typography.Sans12}

  background: ${rgba(palette.signal.highlight, 0.1)};
  border: 1px solid ${rgba(palette.signal.highlight, 0.4)};
  border-radius: ${rem(4)};
  color: ${palette.pine4};
  font-weight: 500;
  padding: ${rem(spacing.xs)} ${rem(spacing.sm)};
`;

export const ChangeLink = styled(Button)`
  flex-shrink: 0;
`;
