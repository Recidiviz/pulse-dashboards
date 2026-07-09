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

export const Badge = styled.span<{ $visible?: boolean }>`
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border: 1px solid
    ${({ theme }) => theme.badge?.borderColor ?? "rgba(0, 0, 0, 0.15)"};
  border-radius: 4px;
  font-family: ${({ theme }) =>
    theme.badge?.fontFamily ?? '"Public Sans", sans-serif'};
  font-weight: 700;
  font-size: 12px;
  line-height: 120%;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.badge?.color ?? "rgba(0, 0, 0, 0.4)"};
  visibility: ${({ $visible = true }) => ($visible ? "visible" : "hidden")};
`;
