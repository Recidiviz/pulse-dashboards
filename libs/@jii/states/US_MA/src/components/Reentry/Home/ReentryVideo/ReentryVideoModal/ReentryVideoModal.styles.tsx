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
import styled from "styled-components";

import { Modal, palette, spacing, typography } from "~design-system";

export const VideoModal = styled(Modal)`
  .ReactModal__Content {
    border-radius: ${rem(12)};
    box-shadow: 0 ${rem(24)} ${rem(60)} ${rgba(palette.pine1, 0.3)};
    overflow: hidden;
    padding: 0;
    width: ${rem(552)};
  }
`;

export const Header = styled.div`
  align-items: center;
  border-bottom: 1px solid ${palette.slate20};
  display: flex;
  gap: ${rem(spacing.md)};
  justify-content: space-between;
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
`;

export const Title = styled.h2`
  ${typography.Serif24}

  color: ${palette.pine2};
  font-weight: 700;
  margin: 0;
`;

export const CloseButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex: 0 0 auto;
  padding: ${rem(spacing.sm)};
`;

export const VideoContainer = styled.div`
  ${typography.Sans14}

  align-items: center;
  aspect-ratio: 16 / 9;
  background: ${palette.pine1};
  color: ${palette.white70};
  display: flex;
  justify-content: center;

  video {
    display: block;
    height: 100%;
    width: 100%;
  }
`;

export const Footer = styled.p`
  ${typography.Sans14}

  background: ${palette.marble3};
  color: ${palette.slate85};
  margin: 0;
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
`;
