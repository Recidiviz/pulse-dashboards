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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components";

import { palette } from "~design-system";

export const Container = styled.div`
  display: flex;
  width: 50rem;
  padding: 2rem 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  font-family: "Public Sans";
  padding: 2rem 1.5rem 2rem 1.5rem;
`;

export const InfoContainer = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  align-self: stretch;
`;

export const SectionTitle = styled.h3`
  ${typography.Sans16}
  color: ${palette.pine1};
  font-weight: 600;
  margin: 0;
  padding-left: 2.5rem;
`;

export const Subtitle = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  padding-left: 2.5rem;
  margin-top: -0.5rem;
`;
