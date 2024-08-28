// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { palette, Pill, Sans14, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

export const PrototypePill = styled(Pill).attrs({
  color: "#CFF5F6",
  textColor: "#0055BC",
  filled: true,
})`
  border-radius: ${rem(4)};
  border-color: #a2e5ef;
  font-size: ${rem(12)};
  text-transform: uppercase;
  height: ${rem(20)};
  padding: ${rem(2)} ${rem(6)};
`;

export const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const NoteTextDark = styled(Sans14)`
  color: ${palette.pine1};
`;

export const NoteAdditionalInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

export const NoteViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)};
`;

export const NoteTextLight = styled(Sans14)`
  color: ${palette.slate60};
  font-weight: 400;
`;
