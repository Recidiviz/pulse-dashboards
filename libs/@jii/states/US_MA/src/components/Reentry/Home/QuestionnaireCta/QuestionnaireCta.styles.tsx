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

import { ButtonLink } from "~@jii/common-ui";
import { Card, palette, spacing, typography } from "~design-system";

export const StartButton = styled(ButtonLink)`
  justify-content: center;
`;

export const CompletedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const Wrapper = styled(Card)`
  background: ${palette.marble2};
  border: 1px solid ${palette.pine4};
  border-radius: ${rem(12)};
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.lg)};
`;

export const Heading = styled.h2`
  ${typography.Serif24}

  color: ${palette.pine1};
  margin: 0;
`;

export const Description = styled.p`
  ${typography.Sans16}

  color: ${palette.slate85};
  margin: 0;
`;

export const MetadataRow = styled.div`
  border-top: 1px solid ${palette.slate20};
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)} 0;
`;

export const MetadataItem = styled.div`
  ${typography.Sans14}

  align-items: center;
  color: ${palette.slate85};
  display: flex;
  gap: ${rem(spacing.xs)};
`;
