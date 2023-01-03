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

import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { EarnedDischargeDraftData } from "../../../../WorkflowsStore/Opportunity/EarnedDischargeReferralRecord";
import DOCXFormInput, { DOCXFormInputProps } from "../../DOCXFormInput";

const CrimeTable = styled.table`
  border: black solid 1.5px;
  margin-top: 1rem;
  width: 100%;

  & th {
    background: rgb(227, 227, 226);
    font-weight: 500;
    padding-top: 0.2rem;
  }

  & th,
  td {
    padding-left: 0.4rem;
  }
`;

type ColProps = {
  width: number;
};

const Col = styled.col<ColProps>`
  width: ${(p) => p.width}%;
`;

const InputCell = (props: DOCXFormInputProps<EarnedDischargeDraftData>) => (
  <td>
    <DOCXFormInput<EarnedDischargeDraftData> {...props} />
  </td>
);

const TableLabel = styled.div`
  font-weight: 600;
`;

const FormCrimeTable = () => {
  return (
    <div>
      <TableLabel>Crime:</TableLabel>
      <CrimeTable>
        <colgroup>
          <Col width={35} />
          <Col width={28} />
          <Col width={15} />
          <Col width={21} />
        </colgroup>
        <thead>
          <tr>
            <th>Crime</th>
            <th>Judge</th>
            <th>Case Number</th>
            <th>Sentence Date</th>
          </tr>
          <tr>
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <th />
            <th>County</th>
            <th>Sentence</th>
            <th>FTRD</th>
          </tr>
          <tr>
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <th />
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <th />
            <th>(min/max)</th>
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <th />
          </tr>
        </thead>
        <tbody>
          <tr>
            <InputCell name="crimeName" placeholder="Crime" />
            <InputCell name="sentencingJudge" placeholder="Sentencing judge" />
            <InputCell name="caseNumber" placeholder="Case #" />
            <InputCell name="sentencingDate" placeholder="Sentence date" />
          </tr>
          <tr>
            <td />
            <InputCell
              name="sentencingCounty"
              placeholder="Sentencing county"
            />
            <InputCell name="sentenceMin" placeholder="Sentence min" />
            <InputCell name="sentenceFTRD" placeholder="FTRD" />
          </tr>
          <tr>
            <td />
            <td />
            <InputCell name="sentenceMax" placeholder="Sentence max" />
            <td />
          </tr>
          <tr>
            <InputCell name="crimeName2" placeholder="Crime" />
            <InputCell name="sentencingJudge2" placeholder="Sentencing judge" />
            <InputCell name="caseNumber2" placeholder="Case #" />
            <InputCell name="sentencingDate2" placeholder="Sentence date" />
          </tr>
          <tr>
            <td />
            <InputCell
              name="sentencingCounty2"
              placeholder="Sentencing county"
            />
            <InputCell name="sentenceMin2" placeholder="Sentence min" />
            <InputCell name="sentenceFTRD2" placeholder="FTRD" />
          </tr>
          <tr>
            <td />
            <td />
            <InputCell name="sentenceMax2" placeholder="Sentence max" />
            <td />
          </tr>
        </tbody>
      </CrimeTable>
    </div>
  );
};

export default observer(FormCrimeTable);
