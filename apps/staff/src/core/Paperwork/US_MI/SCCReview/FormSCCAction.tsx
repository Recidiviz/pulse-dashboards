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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { FormCheckbox, FormInput } from "./FormUtils";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(12, 1fr) / 16% 30% 30% 24%;
  height: 170px;
  margin-bottom: ${rem(spacing.xs)};
  border: 1px solid black;
`;

const HeaderRow = styled.div`
  grid-area: 1 / 1 / span 1 / end;
  background-color: #a4cbfa;
  border-bottom: 0.5px solid black;
  padding-left: 2px;
`;

type CellProps = {
  row: number;
  col: number;
  rowSpan?: number | string;
  colSpan?: number | string;
};

const Cell = styled.div<CellProps>`
  grid-area: ${({ row }) => row} / ${({ col }) => col} / span
    ${({ rowSpan }) => rowSpan ?? 1} / span ${({ colSpan }) => colSpan ?? 1};
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 2px;
  line-height: 0.95;
  border-style: solid;
  border-color: black;
  border-width: 0 0 ${({ row }) => (row === 12 ? 0 : 0.5)}px
    ${({ col }) => (col === 1 ? 0 : 0.5)}px;
`;

const FormSCCAction: React.FC = () => {
  return (
    <ContentContainer>
      <HeaderRow>
        <b>
          SECURITY CLASSIFICATION COMMITTEE ACTION: Interview & Recommendation
        </b>
      </HeaderRow>
      <Cell row={2} col={1} colSpan={"end"}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
            }}
          >
            Prisoner Participated in Interview:
            <div style={{ paddingLeft: "10px" }}>
              <FormCheckbox name="participated" label="Yes" toggleable />
            </div>
            <div style={{ paddingLeft: "10px" }}>
              <FormCheckbox name="participated" label="No" invert toggleable />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              paddingRight: "2px",
            }}
          >
            SCC Stop at Cell if Prisoner Refused?
            <div style={{ paddingLeft: "10px" }}>
              <FormCheckbox name="sccStop" toggleable />
              Yes
            </div>
            <div style={{ paddingLeft: "10px" }}>
              <FormCheckbox name="sccStop" label="No" invert toggleable />
            </div>
          </div>
        </div>
      </Cell>
      <Cell row={3} col={1} rowSpan={2}>
        Prisoner's comment:
      </Cell>
      <Cell row={3} col={2} rowSpan={2} colSpan={"end"}>
        <FormInput name="comment" maxWidth="450px" />
      </Cell>
      <Cell row={5} col={1}>
        Expectations:
      </Cell>
      <Cell row={5} col={2}>
        <div>
          <FormCheckbox name="misconductFree" label="Remain Misconduct Free" />
        </div>
      </Cell>
      <Cell row={5} col={3}>
        <div>
          <FormCheckbox name="IISP" label="Participate/Advance in IISP" />
        </div>
      </Cell>
      <Cell row={5} col={4}>
        <div>
          <FormCheckbox name="other" label="Other:" />
          <FormInput name="otherText" />
        </div>
      </Cell>

      <Cell row={6} col={1} colSpan={2}>
        Potential to honor the trust implicit in less restrictive confinement:
      </Cell>

      <Cell row={6} col={3} colSpan={"end"}>
        <div>
          Evaluation:
          <FormInput name="potential" />
        </div>
      </Cell>
      <Cell row={7} col={1} colSpan={"end"}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          Recommendation:
          <div>
            <FormCheckbox name="continue" label="Continue Segregation" />
          </div>
          <div>
            <FormCheckbox
              name="reclassify"
              label="Reclassify to General Population"
            />
          </div>
          <div>
            <FormCheckbox name="transfer" label="Transfer" />
          </div>
          <div>
            <FormCheckbox name="protection" label="Protection" />
          </div>
        </div>
      </Cell>
      <Cell row={8} col={1} colSpan={"end"}>
        <div>
          Reason for Continued Segregation:
          <FormInput name="reason" maxWidth="400px" />
        </div>
      </Cell>
      <Cell row={9} col={1} colSpan={3}>
        Prisoner's Signature:
      </Cell>
      <Cell row={9} col={4}>
        Date:
      </Cell>

      <Cell row={10} col={1} colSpan={2}>
        <div>
          Staff Name & Title:
          <FormInput name="staffName1" maxWidth="150px" />
        </div>
      </Cell>
      <Cell row={11} col={1} colSpan={2}>
        <div>
          Staff Name & Title:
          <FormInput name="staffName2" maxWidth="150px" />
        </div>
      </Cell>
      <Cell row={12} col={1} colSpan={2}>
        <div>
          QMHP Name & Title:
          <FormInput name="QMHP" maxWidth="150px" />
        </div>
      </Cell>
      <Cell row={10} col={3}>
        Signature:
      </Cell>
      <Cell row={10} col={4}>
        Date:
      </Cell>
      <Cell row={11} col={3}>
        Signature:
      </Cell>
      <Cell row={11} col={4}>
        Date:
      </Cell>
      <Cell row={12} col={3}>
        Signature:
      </Cell>
      <Cell row={12} col={4}>
        Date:
      </Cell>
    </ContentContainer>
  );
};

export default FormSCCAction;
