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

import { CopyWrapper } from "~@jii/common-ui";
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
  background: ${palette.pine4};
  border-radius: 50%;
  color: ${palette.marble1};
`;

export const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const Heading = styled.h1`
  ${typography.Serif34}

  color: ${palette.pine1};
`;

export const Subheading = styled.p`
  ${typography.Sans16}

  color: ${palette.slate85};
  margin: 0;
`;

export const InfoCopy = styled(CopyWrapper)`
  color: ${palette.slate85};
  margin-bottom: 0;

  & p:last-child {
    margin-bottom: 0;
  }
`;
