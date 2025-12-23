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

export const ProgressContainer = styled.div`
  position: fixed;
  top: 0rem;
  left: 0;
  right: 0;
  height: 1rem;
  background: rgb(234, 238, 240); /* Opaque version of slate10 over white */
  z-index: 9999;
`;

export const ProgressFill = styled.div<{ percentage: number }>`
  height: 1rem;
  background: #00c49d;
  width: ${(props) => props.percentage}%;
  transition: width 0.3s ease;
`;
