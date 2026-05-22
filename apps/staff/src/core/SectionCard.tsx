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

import { Sans12, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

// Compound primitives for a card-styled section with a slate-tinted header
// bar. Compose freely: `<SectionCard><SectionCardHeader>…</SectionCardHeader>
// <SectionCardBody>…</SectionCardBody></SectionCard>`. Multiple header/body
// pairs inside one card are supported.

export const SectionCard = styled.div`
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
`;

export const SectionCardHeader = styled(Sans12)`
  background-color: ${palette.marble2};
  border-bottom: 1px solid ${palette.slate10};
  color: ${palette.slate70};
  font-weight: 700;
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  text-transform: uppercase;
`;

export const SectionCardBody = styled.div`
  padding: 0 ${rem(spacing.md)};
`;
