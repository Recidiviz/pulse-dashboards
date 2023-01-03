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
  FORM_US_ID_EARLY_DISCHARGE_BACKGROUND_COLOR,
  FormEDInputCell,
  FormEDSectionLabel,
  FormEDTable,
} from "./FormComponents";

const FeesTable = styled(FormEDTable)`
  // force equal column widths
  table-layout: fixed;
  width: 100%;

  & thead {
    background: ${FORM_US_ID_EARLY_DISCHARGE_BACKGROUND_COLOR};
  }
  & th:first-child {
    background: ${FORM_US_ID_EARLY_DISCHARGE_BACKGROUND_COLOR};
  }
  & tbody th {
    text-align: right;
  }
`;

export const FormFeesTable: React.FC = () => {
  return (
    <div>
      <FormEDSectionLabel>Restitution, fees, and fines:</FormEDSectionLabel>
      <FeesTable>
        <thead>
          <tr>
            <td />
            <th>Initial Amount</th>
            <th>Date of Last Payment</th>
            <th>Current Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Restitution:</th>
            <FormEDInputCell
              name="initialRestitution"
              placeholder="Enter amount"
            />
            <FormEDInputCell
              name="lastRestitutionPaymentDate"
              placeholder="Enter date"
            />
            <FormEDInputCell
              name="currentRestitutionBalance"
              placeholder="Enter amount"
            />
          </tr>
          <tr>
            <th>Fines:</th>
            <FormEDInputCell name="initialFines" placeholder="Enter amount" />
            <FormEDInputCell
              name="lastFinesPaymentDate"
              placeholder="Enter date"
            />
            <FormEDInputCell
              name="currentFinesBalance"
              placeholder="Enter amount"
            />
          </tr>
        </tbody>
      </FeesTable>
    </div>
  );
};
