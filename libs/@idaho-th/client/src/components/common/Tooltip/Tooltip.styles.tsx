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

import styled from "styled-components";

import { BodyS1, borderRadius, palette, spacing } from "../../../styles";

export const Trigger = styled.span`
  align-items: center;
  display: inline-flex;
  flex: none;
`;

export const Bubble = styled.div`
  background: ${palette.background.strong};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  max-width: 21.25rem;
  padding: ${spacing[4]};
  pointer-events: none;
  white-space: normal;
  width: max-content;
  z-index: 1000;
`;

export const Text = styled(BodyS1)`
  color: ${palette.foreground.onBrand};
`;
