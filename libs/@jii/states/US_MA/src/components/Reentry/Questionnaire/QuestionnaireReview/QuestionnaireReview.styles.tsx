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

import { Button, palette, spacing, typography } from "~design-system";

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

export const Entry = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  border-top: 1px solid ${palette.slate20};
  padding: ${rem(spacing.md)} 0;
`;

export const EntryText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const EntryQuestion = styled.span`
  ${typography.Sans14}

  color: ${palette.pine1};
  font-weight: 700;
`;

export const EntryAnswer = styled.span`
  ${typography.Sans14}

  color: ${palette.slate85};
`;

export const ChangeLink = styled(Button)`
  flex-shrink: 0;
`;
