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

import { Card, palette, spacing, typography } from "~design-system";

export const Wrapper = styled(Card)`
  align-items: center;
  border-color: ${palette.slate20};
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

export const IconCircle = styled.span`
  height: ${rem(32)};
  width: ${rem(32)};
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  align-items: center;
  background: ${rgba(palette.signal.highlight, 0.1)};
  border-radius: 50%;
  color: ${palette.pine2};
`;

export const Content = styled.div`
  flex: 1 1 auto;
`;

export const Heading = styled.p`
  ${typography.Sans14}

  color: ${palette.pine2};
  font-weight: 700;
  line-height: ${rem(20)};
  margin: 0;
`;

export const Description = styled.p`
  ${typography.Sans14}

  color: ${palette.pine2};
  font-weight: 400;
  line-height: ${rem(20)};
  margin: 0;
`;
