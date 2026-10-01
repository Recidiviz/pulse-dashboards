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

import { palette, spacing, typography } from "~design-system";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${rem(spacing.xl)};
  padding-top: ${rem(spacing.lg)};
  text-align: center;
`;

export const IconHalo = styled.div`
  height: ${rem(72)};
  width: ${rem(72)};
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${rgba(palette.signal.highlight, 0.12)};
  border-radius: 50%;
`;

export const IconCircle = styled.div`
  height: ${rem(44)};
  width: ${rem(44)};
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${palette.signal.highlight};
  border-radius: 50%;
  color: ${palette.marble1};
`;

export const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const Heading = styled.h1`
  ${typography.Serif24}

  color: ${palette.pine1};
  margin: 0;
`;

export const Subheading = styled.p`
  ${typography.Sans16}

  color: ${palette.slate80};
  margin: 0;
`;

export const InfoCard = styled.div`
  ${typography.Sans16}

  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  background: ${palette.marble2};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(8)};
  color: ${palette.pine1};
  padding: ${rem(spacing.lg)};
  text-align: left;
  font-weight: 400;

  p {
    margin: 0;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${rem(spacing.lg)};
`;
