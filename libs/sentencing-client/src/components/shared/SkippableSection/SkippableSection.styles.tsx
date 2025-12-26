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

// Re-export shared skip-related styles
export {
  HeaderContainer,
  SkipCheckbox,
  SkipContainer,
  SkipLabel,
  Title,
} from "../styles/SkipStyles";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  align-self: stretch;
  position: relative;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
`;

export const ContentContainer = styled.div<{ skipped?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  align-self: stretch;
  opacity: ${({ skipped }) => (skipped ? 0.5 : 1)};
  pointer-events: ${({ skipped }) => (skipped ? "none" : "auto")};
`;
