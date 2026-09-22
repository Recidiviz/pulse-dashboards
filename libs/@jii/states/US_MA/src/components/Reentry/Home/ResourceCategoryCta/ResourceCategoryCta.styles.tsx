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

import { Card, palette, spacing, typography } from "~design-system";

export const SectionLabel = styled.h2`
  ${typography.Sans14}

  color: ${palette.slate85};
  margin: 0 0 ${rem(spacing.sm)};
`;

export const CardsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const Wrapper = styled(Card)`
  border-radius: ${rem(12)};
  gap: ${rem(spacing.md)};
  overflow: hidden;
`;

export const IconBlock = styled.div`
  align-items: center;
  background: linear-gradient(
    135deg,
    ${palette.pine2} 0%,
    ${palette.slate60} 100%
  );
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  width: ${rem(200)};
`;

export const IconCircle = styled.div`
  align-items: center;
  background: ${palette.white40};
  border-radius: 50%;
  display: flex;
  height: ${rem(100)};
  justify-content: center;
  width: ${rem(100)};

  svg {
    color: ${palette.white};
  }
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.lg)};
`;

export const Heading = styled.h3`
  ${typography.Sans18}

  color: ${palette.pine1};
  margin: 0;
`;

export const Description = styled.p`
  ${typography.Sans14}

  color: ${palette.slate85};
  margin: 0;
`;
