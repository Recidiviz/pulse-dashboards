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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { ParoleOffense } from "~datatypes";
import { palette } from "~design-system";

import { UsIdFactLabel } from "./UsIdCaseProfileStyles";

const InstantOffensesField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

const InstantOffenseList = styled.ul`
  ${typography.Sans16}
  color: ${palette.pine1};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  margin: 0;
  padding-left: 1.25rem;
`;

/**
 * The sidebar's Instant Offenses field
 *
 * @param offenses - The resident's instant offenses.
 */
export function UsIdInstantOffensesSection({
  offenses,
}: {
  offenses: Array<ParoleOffense>;
}) {
  return (
    <InstantOffensesField>
      <UsIdFactLabel>Instant Offenses</UsIdFactLabel>
      <InstantOffenseList>
        {offenses.map((offense) => (
          <li key={`${offense.docket}-${offense.conviction}`}>
            {offense.conviction}
          </li>
        ))}
      </InstantOffenseList>
    </InstantOffensesField>
  );
}
