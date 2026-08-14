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

import { palette, spacing, typography } from "~design-system";

const BOOK_COVER_WIDTH = 112;
const BOOK_COVER_HEIGHT = 160;
const BOOK_COVER_LEFT = 16;
const ROW_PADDING_LEFT = BOOK_COVER_LEFT + BOOK_COVER_WIDTH + spacing.md;

export const BannerContainer = styled.div<{ $bgImage: string }>`
  position: relative;
  isolation: isolate;
  background: ${palette.pine1};
  border-radius: ${rem(8)};
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    z-index: 0;
    inset: ${rem(-32)};
    background-image: url(${({ $bgImage }) => $bgImage});
    background-position: center 40%;
    background-size: cover;
    filter: blur(22px) saturate(1.65);
    mix-blend-mode: soft-light;
    transform: scale(1.08);
  }

  &::after {
    content: "";
    position: absolute;
    z-index: 1;
    inset: 0;
    background: rgba(1, 35, 34, 0.18);
  }
`;

export const BannerRow = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  min-height: ${rem(128)};
  padding: ${rem(spacing.md)} ${rem(spacing.xxl)} ${rem(spacing.md)}
    ${rem(ROW_PADDING_LEFT)};
`;

export const BannerCoverImage = styled.img`
  position: absolute;
  z-index: 2;
  top: ${rem(16)};
  left: ${rem(BOOK_COVER_LEFT)};
  width: ${rem(BOOK_COVER_WIDTH)};
  height: ${rem(BOOK_COVER_HEIGHT)};
  object-fit: cover;
  border-radius: ${rem(4)};
`;

export const BannerCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

export const BannerTitle = styled.p`
  ${typography.Sans16}
  font-weight: 600;
  color: ${palette.white};
  margin: 0;
`;

export const BannerText = styled.p`
  ${typography.Sans14}
  color: ${palette.white};
  margin: 0;
  opacity: 0.85;
`;

export const DismissButton = styled.button`
  position: absolute;
  z-index: 3;
  top: ${rem(4)};
  right: ${rem(4)};
  background: none;
  border: none;
  padding: 0 ${rem(spacing.sm)};
  height: ${rem(32)};
  display: flex;
  align-items: center;
  cursor: pointer;
  ${typography.Sans14}
  color: ${palette.white};
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;
