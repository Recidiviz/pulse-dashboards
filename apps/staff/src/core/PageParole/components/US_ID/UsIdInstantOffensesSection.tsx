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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components";

import { ParoleOffense } from "~datatypes";

import { Hr, SubsectionTitle } from "../shared";

const InstantOffenseList = styled.ul`
  ${typography.Sans14}
  margin: 0;
  padding-left: 1.25rem;
`;

const InstantOffenseItem = styled.li`
  & + & {
    margin-top: 0.5rem;
  }
`;

export function UsIdInstantOffensesSection({
  offenses,
}: {
  offenses: Array<ParoleOffense>;
}) {
  return (
    <>
      <Hr />
      <div>
        <SubsectionTitle>Instant Offenses</SubsectionTitle>
        <InstantOffenseList>
          {offenses.map((offense) => (
            <InstantOffenseItem key={`${offense.docket}-${offense.conviction}`}>
              {offense.conviction}
            </InstantOffenseItem>
          ))}
        </InstantOffenseList>
      </div>
    </>
  );
}
