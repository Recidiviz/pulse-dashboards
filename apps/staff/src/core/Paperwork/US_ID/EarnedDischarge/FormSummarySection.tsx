// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import styled from "styled-components/macro";

import { EarnedDischargeDraftData } from "../../../../WorkflowsStore/Opportunity/UsId";
import {
  FORM_US_ID_EARLY_DISCHARGE_LETTER_SPACING,
  FormEDInput,
} from "./FormComponents";

const SummaryContainer = styled.table`
  border: none;

  // force equal column widths
  table-layout: fixed;
  width: 100%;

  letter-spacing: ${FORM_US_ID_EARLY_DISCHARGE_LETTER_SPACING};
  white-space: nowrap;

  & td:nth-child(even) {
    padding-left: 0.5rem;
    text-align: left;
  }
  & td:nth-child(odd) {
    text-align: right;
  }

  // prevent long inputs from spilling into next column
  & input {
    max-width: 280px;
  }
`;

type ItemProps = {
  title: string;
  name: Extract<keyof EarnedDischargeDraftData, string>;
  placeholder?: string;
};

const Item = ({ title, name, placeholder }: ItemProps) => {
  return (
    <>
      <td>{title}:</td>
      <td>
        <FormEDInput name={name} placeholder={placeholder} />
      </td>
    </>
  );
};

export const FormSummarySection: React.FC = () => {
  return (
    <SummaryContainer>
      <tbody>
        <tr>
          <Item
            title="Client Name"
            name="clientName"
            placeholder="Client Name"
          />
          <Item
            title="Condition Compliance"
            name="conditionCompliance"
            placeholder="Y/N"
          />
        </tr>
        <tr>
          <Item title="IDOC #" name="idocNumber" placeholder="" />
          <Item
            title="Meets IDOC Requirements"
            name="meetsIdocRequirements"
            placeholder="Y/N"
          />
        </tr>
        <tr>
          <Item
            title="Full Term Release Date"
            name="ftrDate"
            placeholder="Enter Date"
          />
          <Item title="NCIC Check" name="ncicCheck" placeholder="Y/N" />
        </tr>
        <tr>
          <Item
            title="P&P Officer"
            name="probationOfficerFullName"
            placeholder="Supervisor Name"
          />
          <Item
            title="NCIC Check Date"
            name="ncicCheckDate"
            placeholder="Enter Date"
          />
        </tr>
      </tbody>
    </SummaryContainer>
  );
};
