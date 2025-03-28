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

import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components/macro";

import {
  EarnedDischargeCrimeTableKeys,
  EarnedDischargeDraftData,
} from "../../../../WorkflowsStore/Opportunity/UsId";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import {
  FORM_US_ID_EARLY_DISCHARGE_BACKGROUND_COLOR,
  FormColGroup,
  FormEDInputCell,
  FormEDSectionLabel,
  FormEDTable,
} from "./FormComponents";

const CrimeTable = styled(FormEDTable)`
  & thead {
    background: ${FORM_US_ID_EARLY_DISCHARGE_BACKGROUND_COLOR};
    font-weight: 500;
    padding-top: 0.2rem;
  }
`;

type CrimeTableInputCellProps = {
  index: number;
  field: EarnedDischargeCrimeTableKeys;
  placeholder: string;
  style?: React.InputHTMLAttributes<HTMLInputElement>["style"];
};

const CrimeTableInputCell: React.FC<CrimeTableInputCellProps> = ({
  index,
  field,
  placeholder,
  style,
}) => {
  return (
    <FormEDInputCell
      name={`${field}${index}`}
      placeholder={placeholder}
      style={style}
    />
  );
};

type CrimeRowsProps = {
  index: number;
};

const CrimeRows: React.FC<CrimeRowsProps> = ({ index }) => {
  return (
    <>
      <tr>
        <CrimeTableInputCell
          index={index}
          field="chargeDescriptions"
          placeholder="Crime"
          style={{ maxWidth: "160px" }}
        />
        <CrimeTableInputCell
          index={index}
          field="judgeNames"
          placeholder="Sentencing Judge"
          style={{ maxWidth: "126px" }}
        />
        <CrimeTableInputCell
          index={index}
          field="caseNumbers"
          placeholder="Case #"
          style={{ maxWidth: "67px" }}
        />
        <CrimeTableInputCell
          index={index}
          field="dateImposed"
          placeholder="Sentence date"
          style={{ maxWidth: "91px" }}
        />
      </tr>
      <tr>
        <td />
        <CrimeTableInputCell
          index={index}
          field="countyNames"
          placeholder="Sentencing county"
          style={{ maxWidth: "126px" }}
        />
        <CrimeTableInputCell
          index={index}
          field="sentenceMin"
          placeholder="Sentence min"
          style={{ maxWidth: "67px" }}
        />
        <CrimeTableInputCell
          index={index}
          field="fullTermReleaseDates"
          placeholder="FTRD"
          style={{ maxWidth: "91px" }}
        />
      </tr>
      <tr>
        <td />
        <td />
        <CrimeTableInputCell
          index={index}
          field="sentenceMax"
          placeholder="Sentence max"
          style={{ maxWidth: "67px" }}
        />
        <td />
      </tr>
    </>
  );
};

export const FormCrimeTable = observer(function FormCrimeTable() {
  const formData = useOpportunityFormContext()
    .formData as Partial<EarnedDischargeDraftData>;

  const numCrimeEntries = formData.numCrimeEntries || 1;

  return (
    <div>
      <FormEDSectionLabel>Crime:</FormEDSectionLabel>
      <CrimeTable>
        <FormColGroup widths={[35, 28, 15, 21]} />
        <thead>
          <tr>
            <th>Crime</th>
            <th>Judge</th>
            <th>Case Number</th>
            <th>Sentence Date</th>
          </tr>
          <tr>
            <td />
            <th>County</th>
            <th>Sentence</th>
            <th>FTRD</th>
          </tr>
          <tr>
            <td />
            <td />
            <th>(min/max)</th>
            <td />
          </tr>
        </thead>
        <tbody>
          {Array.from(Array(numCrimeEntries).keys()).map((i) => (
            <CrimeRows index={i} key={i} />
          ))}
        </tbody>
      </CrimeTable>
    </div>
  );
});
