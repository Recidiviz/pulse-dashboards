/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import styled from "styled-components/macro";

import {
  FormEDInputCell,
  FormEDSectionLabel,
  FormEDTable,
} from "./FormComponents";

const LsirTable = styled(FormEDTable)`
  // force equal column widths
  table-layout: fixed;
  width: 100%;

  & th {
    text-align: right;
  }

  & td {
    padding-left: 1rem;
  }
`;

export const FormLsirTable: React.FC = () => {
  return (
    <div>
      <FormEDSectionLabel>LSI-R Assessment:</FormEDSectionLabel>
      <LsirTable>
        <tbody>
          <tr>
            <th>Initial Score:</th>
            <FormEDInputCell
              name="initialLsirScore"
              placeholder="Enter score"
            />
            <th>Current Score:</th>
            <FormEDInputCell
              name="currentLsirScore"
              placeholder="Enter score"
            />
          </tr>
          <tr>
            <th>Date:</th>
            <FormEDInputCell name="initialLsirDate" placeholder="Enter date" />
            <th>Date:</th>
            <FormEDInputCell name="currentLsirDate" placeholder="Enter date" />
          </tr>
        </tbody>
      </LsirTable>
    </div>
  );
};
