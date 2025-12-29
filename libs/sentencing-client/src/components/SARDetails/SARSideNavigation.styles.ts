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

export const SideContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: fixed;
`;

export const AutosaveMessage = styled.div`
  color: ${palette.slate70};
  text-align: center;
  font-family: "Public Sans";
  font-size: 0.85rem;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  letter-spacing: -0.0075rem;
  position: sticky;
  top: 1rem; /* Account for progress bar height */
`;

export const SideNavigationContainer = styled.div`
  position: sticky;
  top: 1rem; /* Account for progress bar height */
  width: 16 rem;
  height: fit-content;
  max-height: calc(100vh - 1rem); /* Subtract progress bar height */
  gap: 1rem;
  background: ${palette.white};
  border: 1px solid ${palette.slate10};
  border-radius: 0.625rem;
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.35) inset;
  overflow: hidden;
`;

export const NavigationList = styled.nav`
  padding: 2rem 1.5rem 2rem 1.5rem;
  display: flex;
  align-items: center;
  align-self: stretch;
  flex-direction: column;
  gap: 1rem;
`;

export const NavigationItem = styled.button<{ isActive: boolean }>`
  width: 100%;
  display: flex;
  align-items: left;
  background: transparent;
  border: none;
  transition: all 0.2s ease;
  font-family: "Public Sans";
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.0225rem;
  color: ${({ isActive }) => (isActive ? palette.pine4 : palette.slate60)};
  text-align: left;

  &:hover {
    color: ${palette.pine3};
  }

  &:focus {
    outline: none;
  }
`;

export const Arrow = styled.span`
  margin-left: 8px;
  display: flex;
  align-items: center;
`;

export const StatusIconWrapper = styled.span`
  margin-right: 8px;
  margin-top: 3px;
  display: flex;
  align-items: center;
  min-width: 16px;
  height: 16px;

  /* Only take up space when there's content */
  &:empty {
    margin-right: 0;
    min-width: 0;
  }
`;

export const ButtonContainer = styled.div`
  width: 100%;
  padding: 16px;
  display: flex;
  gap: 8px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${palette.slate20};
  }
`;

export const NavButton = styled.button<{ variant: "primary" | "secondary" }>`
  flex: 1;
  padding: 10px 16px;
  border-radius: 4px;
  border: ${({ variant }) =>
    variant === "primary"
      ? `1px solid ${palette.signal.links}`
      : `1px solid ${palette.slate30}`};
  background: ${({ variant }) =>
    variant === "primary" ? palette.signal.links : palette.white};
  color: ${({ variant }) =>
    variant === "primary" ? palette.white : palette.slate85};
  ${typography.Sans14}
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
  }
`;

export const SubNavigationList = styled.ul`
  display: flex;
  padding-left: 0.75rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  align-self: stretch;
`;

export const SubNavigationItem = styled.li<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  align-self: stretch;
  color: ${palette.slate60};
  cursor: pointer;

  &:hover {
    color: ${palette.pine3};
  }
`;
