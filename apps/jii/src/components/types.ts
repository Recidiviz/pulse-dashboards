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

/**
 * Simplified version of props for React Router Link
 */
export type SimpleLinkProps = {
  children: string;
  to: string;
};

/**
 * Simplified version of props for React Router NavLink.
 * Send end=true to match entire URL for active state, or false to match descendant links
 */
export type SimpleNavLinkProps = SimpleLinkProps & { end: boolean };
