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

import { ABOUT_VIDEO_ILLUSTRATION_BACKGROUND } from "~@jii/onboarding-video";
import { palette, spacing, typography } from "~design-system";

export const Row = styled.button`
  align-items: center;
  background: ${palette.slate05};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(8)};
  cursor: pointer;
  display: flex;
  gap: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.md)};
  padding: ${rem(spacing.sm + spacing.xs)};
  text-align: left;
  width: 100%;

  &:hover,
  &:focus-visible {
    border-color: ${palette.pine4};
  }
`;

export const Thumbnail = styled.span`
  align-items: center;
  background: ${ABOUT_VIDEO_ILLUSTRATION_BACKGROUND};
  border-radius: ${rem(4)};
  display: flex;
  flex: 0 0 auto;
  height: ${rem(64)};
  justify-content: center;
  width: ${rem(96)};

  img {
    display: block;
    height: ${rem(56)};
  }
`;

export const Copy = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  min-width: 0;
`;

export const Title = styled.span`
  ${typography.Sans16}

  color: ${palette.pine2};
  font-weight: 700;
`;

export const Description = styled.span`
  ${typography.Sans14}

  color: ${palette.slate85};
`;
