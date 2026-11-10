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

import { palette, spacing } from "../../../styles";

export const Header = styled.header`
  align-items: center;
  background-color: ${palette.background.primary};
  border-bottom: 0.0625rem solid ${palette.misc.slate10};
  display: flex;
  height: 4rem;
  padding: 0 clamp(1rem, 1.67vw, 1.5rem);
  width: 100%;
`;

export const Logo = styled.div`
  height: 2rem;
  overflow: hidden;
  width: 7.5rem;
`;

export const LogoContainer = styled.div`
  align-items: center;
  align-self: stretch;
  display: inline-flex;
  flex: 0 0 auto;
  gap: ${spacing[6]};
`;

export const RecidivizLogoImg = styled.img`
  display: block;
  height: 1.375rem;
  width: auto;
`;

export const ActionsContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1 0 auto;
  gap: ${spacing[6]};
  justify-content: flex-end;
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  color: ${palette.foreground.secondary};
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;

  &:hover {
    color: ${palette.foreground.brand};
  }
`;
