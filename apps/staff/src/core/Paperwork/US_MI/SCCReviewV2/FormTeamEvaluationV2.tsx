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
import styled from "styled-components";

import { FormCheckbox, FormInput } from "../SCCReview/FormUtils";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(4, 1fr) / 16% 14% repeat(4, 1fr);
  height: 60px;
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
  border-width: 0 0 ${({ row }) => (row === 11 ? 0 : 0.5)}px
    ${({ col }) => (col === 1 ? 0 : 0.5)}px;
`;

const IISPCell = () => {
  return (
    <>
      <Cell row={2} col={1} colSpan={2} style={{ border: "none" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          IISP STAGE: N/A
          <div style={{ paddingLeft: "2px" }}>
            <FormCheckbox name="IISPNA" />
          </div>
        </div>
      </Cell>
      <Cell row={3} col={1} colSpan={2}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>
            <FormCheckbox name="IISP1" label="I" />
          </div>
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP2" label="II" />
          </div>
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP3" label="III" />
          </div>
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP4" label="IV" />
          </div>
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP5" label="V" />
          </div>
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP6" label="VI" />
          </div>
        </div>
      </Cell>
    </>
  );
};

type GAPCellProps = CellProps & {
  suffix: "1" | "2";
};

const GAPCell = ({ suffix, ...props }: GAPCellProps) => {
  return (
    <Cell {...props}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>
          <FormCheckbox name={`good${suffix}`} label="Good" />
        </div>
        <div style={{ paddingLeft: "6px" }}>
          <FormCheckbox name={`adequate${suffix}`} label="Adequate" />
        </div>
        <div style={{ paddingLeft: "6px" }}>
          <FormCheckbox name={`poor${suffix}`} label="Poor" />
        </div>
      </div>
    </Cell>
  );
};

const FormTeamEvaluationV2: React.FC = () => {
  return (
    <ContentContainer>
      <HeaderRow>
        <b>HOUSING UNIT TEAM EVALUATION</b>
      </HeaderRow>
      <IISPCell />
      <Cell row={2} col={3} colSpan={"end"} style={{ alignItems: "center" }}>
        <b>Housing Unit Officer</b>
      </Cell>

      <Cell row={3} col={3} colSpan={2}>
        <div style={{ display: "flex", alignItems: "center" }}>
          (Print Name):
          <FormInput name="officerName" maxWidth="120px" />
        </div>
      </Cell>
      <Cell row={3} col={5} colSpan={1}>
        <div style={{ display: "flex", alignItems: "center" }}>Signature:</div>
      </Cell>
      <Cell row={3} col={6} colSpan={1}>
        <div style={{ display: "flex", alignItems: "center" }}>Date:</div>
      </Cell>
      <Cell row={4} col={1} colSpan={2}>
        Appropriate Behavior and Attitude:
      </Cell>
      <GAPCell row={4} col={3} colSpan={2} suffix="1" />
      <GAPCell row={4} col={5} colSpan={2} suffix="2" />
    </ContentContainer>
  );
};

export default FormTeamEvaluationV2;
