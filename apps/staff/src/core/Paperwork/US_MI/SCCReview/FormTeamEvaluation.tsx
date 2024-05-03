/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
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
import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { FormCheckbox, FormInput } from "./FormUtils";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(11, 1fr) / 16% 14% repeat(4, 1fr);
  height: 145px;
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
            <FormCheckbox name="IISP1" />
          </div>
          I
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP2" />
          </div>
          II
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP3" />
          </div>
          III
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP4" />
          </div>
          IV
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP5" />
          </div>
          V
          <div style={{ paddingLeft: "8px" }}>
            <FormCheckbox name="IISP6" />
          </div>
          VI
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
          <FormCheckbox name={`good${suffix}`} />
        </div>
        Good
        <div style={{ paddingLeft: "6px" }}>
          <FormCheckbox name={`adequate${suffix}`} />
        </div>
        Adequate
        <div style={{ paddingLeft: "6px" }}>
          <FormCheckbox name={`poor${suffix}`} />
        </div>
        Poor
      </div>
    </Cell>
  );
};

type NRSRCellProps = CellProps & {
  suffix: "1" | "2" | "3" | "4";
};

const NRSRCell = ({ suffix, ...props }: NRSRCellProps) => {
  return (
    <Cell {...props}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div>
          <FormCheckbox name={`never${suffix}`} />
        </div>
        Never
        <div style={{ paddingLeft: "6px" }}>
          <FormCheckbox name={`rarely${suffix}`} />
        </div>
        Rarely
        <div style={{ paddingLeft: "6px" }}>
          <FormCheckbox name={`sometimes${suffix}`} />
        </div>
        Sometimes
        <div style={{ paddingLeft: "6px" }}>
          <FormCheckbox name={`regularly${suffix}`} />
        </div>
        Regularly
      </div>
    </Cell>
  );
};

const FormTeamEvaluation: React.FC = () => {
  return (
    <ContentContainer>
      <HeaderRow>
        <b>HOUSING UNIT TEAM EVALUATION</b>
      </HeaderRow>
      <IISPCell />
      <Cell row={2} col={3} colSpan={"end"} style={{ alignItems: "center" }}>
        <b>Housing Unit Officers</b>
      </Cell>

      <Cell row={3} col={3} colSpan={2}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <b>AM </b> (print name):
          <FormInput name="amOfficer" />
        </div>
      </Cell>
      <Cell row={3} col={5} colSpan={2}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <b>PM</b> (print name):
          <FormInput name="pmOfficer" />
        </div>
      </Cell>
      <Cell row={4} col={1} rowSpan={6}>
        Appropriate Behavior and Attitude:
      </Cell>
      <Cell row={4} col={2} rowSpan={2}>
        With Staff:
      </Cell>
      <NRSRCell row={4} col={3} rowSpan={2} colSpan={2} suffix="1" />
      <NRSRCell row={4} col={5} rowSpan={2} colSpan={2} suffix="2" />
      <Cell row={6} col={2} rowSpan={2}>
        With Prisoners:
      </Cell>
      <NRSRCell row={6} col={3} rowSpan={2} colSpan={2} suffix="3" />
      <NRSRCell row={6} col={5} rowSpan={2} colSpan={2} suffix="4" />
      <Cell row={8} col={2} rowSpan={2}>
        Housekeeping and Personal Hygiene:
      </Cell>
      <GAPCell row={8} col={3} rowSpan={2} colSpan={2} suffix="1" />
      <GAPCell row={8} col={5} rowSpan={2} colSpan={2} suffix="2" />
      <Cell row={10} col={1} colSpan={2}>
        Regular Housing Unit Officers:
      </Cell>
      <Cell row={10} col={3} colSpan={2}>
        Signature:
      </Cell>
      <Cell row={10} col={5} colSpan={2}>
        Signature:
      </Cell>
      <Cell row={11} col={1} colSpan={3}>
        <div style={{ display: "flex", alignItems: "center" }}>
          ARUS/PC Name & Title:
          <FormInput name="pcName" />
        </div>
      </Cell>
      <Cell row={11} col={4} colSpan={2}>
        Signature:
      </Cell>
      <Cell row={11} col={6}>
        Date:
      </Cell>
    </ContentContainer>
  );
};

export default FormTeamEvaluation;
