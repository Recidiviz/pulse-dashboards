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

const CrimeTable = styled(FormEDTable)`
  & thead {
    background: ${FORM_US_ID_EARLY_DISCHARGE_BACKGROUND_COLOR};
    font-weight: 500;
    padding-top: 0.2rem;
  }
`;

type ColProps = {
  width: number;
};

const Col = styled.col<ColProps>`
  width: ${(p) => p.width}%;
`;

export const FormCrimeTable: React.FC = () => {
  return (
    <div>
      <FormEDSectionLabel>Crime:</FormEDSectionLabel>
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
          <tr>
            <FormEDInputCell name="crimeName" placeholder="Crime" />
            <FormEDInputCell
              name="sentencingJudge"
              placeholder="Sentencing judge"
            />
            <FormEDInputCell name="caseNumber" placeholder="Case #" />
            <FormEDInputCell
              name="sentencingDate"
              placeholder="Sentence date"
            />
          </tr>
          <tr>
            <td />
            <FormEDInputCell
              name="sentencingCounty"
              placeholder="Sentencing county"
            />
            <FormEDInputCell name="sentenceMin" placeholder="Sentence min" />
            <FormEDInputCell name="sentenceFTRD" placeholder="FTRD" />
          </tr>
          <tr>
            <td />
            <td />
            <FormEDInputCell name="sentenceMax" placeholder="Sentence max" />
            <td />
          </tr>
          <tr>
            <FormEDInputCell name="crimeName2" placeholder="Crime" />
            <FormEDInputCell
              name="sentencingJudge2"
              placeholder="Sentencing judge"
            />
            <FormEDInputCell name="caseNumber2" placeholder="Case #" />
            <FormEDInputCell
              name="sentencingDate2"
              placeholder="Sentence date"
            />
          </tr>
          <tr>
            <td />
            <FormEDInputCell
              name="sentencingCounty2"
              placeholder="Sentencing county"
            />
            <FormEDInputCell name="sentenceMin2" placeholder="Sentence min" />
            <FormEDInputCell name="sentenceFTRD2" placeholder="FTRD" />
          </tr>
          <tr>
            <td />
            <td />
            <FormEDInputCell name="sentenceMax2" placeholder="Sentence max" />
            <td />
          </tr>
        </tbody>
      </CrimeTable>
    </div>
  );
};
