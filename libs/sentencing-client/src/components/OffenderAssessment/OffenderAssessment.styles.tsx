// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import styled from "styled-components";

import { palette, typography } from "~design-system";

export const DomainsTitle = styled.h2`
  color: #012322;
  font-family: "Public Sans";
  font-size: 1.125rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.0225rem;
  flex: 1 0 0;
  margin: 0;
`;

export const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const StaticNoteLabel = styled.p`
  ${typography.Sans14}
  margin: 0;
  color: ${palette.slate80};
`;

export const StaticNoteBody = styled.p`
  ${typography.Body14}
  margin: 0;
  color: ${palette.slate85};
`;
