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
  grid-template: repeat(15, 1fr) / 16% 30% 30% 24%;
  height: 210px;
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
  border-width: 0 0 ${({ row }) => (row === 15 ? 0 : 0.5)}px
    ${({ col }) => (col === 1 ? 0 : 0.5)}px;
`;

const FormSCCActionV2: React.FC = () => {
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
              alignItems: "center",
            }}
          >
            Prisoner Participated in Interview:
            <div style={{ paddingLeft: "10px" }}>
              <FormCheckbox name="participated" label="Yes" toggleable />
            </div>
            <div style={{ paddingLeft: "10px" }}>
              <FormCheckbox name="participated" label="No" invert toggleable />
            </div>
            <div style={{ paddingLeft: "5px" }}>- Why Not?</div>
            <div style={{ paddingLeft: "10px" }}>
              <FormInput name="whyNot" />
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
        Prisoner's Comment/Personal Goal:
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
          <FormCheckbox name="other1" label="Other:" />
          <FormInput name="otherText1" />
        </div>
      </Cell>

      <Cell row={6} col={1} colSpan={2}>
        Potential to honor the trust implicit in less restrictive confinement:
      </Cell>

      <Cell
        row={6}
        col={3}
        colSpan={"end"}
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <div>Evaluation:</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>
            <FormCheckbox name={`low`} label="Low" />
          </div>
          <div style={{ paddingLeft: "6px" }}>
            <FormCheckbox name={`medium`} label="Medium" />
          </div>
          <div style={{ paddingLeft: "6px" }}>
            <FormCheckbox name={`high`} label="High" />
          </div>
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
      <Cell row={8} col={1} rowSpan={4}>
        <div>Reason for Continued Segregation:</div>
      </Cell>
      <Cell row={8} col={2} colSpan={2} rowSpan={4}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div>
            <FormCheckbox name="SER" label="Serious Escape Risk" />
          </div>
          <div>
            <FormCheckbox
              name="CCBD"
              label="Control Communicable Bloodborne Disease"
            />
          </div>
          <div>
            <FormCheckbox
              name="UIOA"
              label="Under Investigation-Outside Authority-Felony Susp."
            />
          </div>
          <div>
            <FormCheckbox
              name="MRTD"
              label="Misconduct-Risk of Transmitting Disease"
            />
          </div>
          <div>
            <FormCheckbox name="PAP" label="Pending Alternate Placement" />
          </div>
          <div>
            <FormCheckbox
              name="PRPS"
              label="Pending Request/Placement in START"
            />
          </div>
        </div>
      </Cell>
      <Cell row={8} col={4} colSpan={"end"} rowSpan={4}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>
            <FormCheckbox name="other2" label="Other: " />
          </div>
          <div>
            <FormInput name="otherText2" maxWidth="400px" />
          </div>
        </div>
      </Cell>
      <Cell row={12} col={1} colSpan={3}>
        Prisoner's Signature:
      </Cell>
      <Cell row={12} col={4}>
        Date:
      </Cell>

      <Cell row={13} col={1} colSpan={2}>
        <div>
          Staff Name & Title:
          <FormInput name="staffName1" maxWidth="150px" />
        </div>
      </Cell>
      <Cell row={14} col={1} colSpan={2}>
        <div>
          Staff Name & Title:
          <FormInput name="staffName2" maxWidth="150px" />
        </div>
      </Cell>
      <Cell row={13} col={3}>
        Signature:
      </Cell>
      <Cell row={13} col={4}>
        Date:
      </Cell>
      <Cell row={14} col={3}>
        Signature:
      </Cell>
      <Cell row={14} col={4}>
        Date:
      </Cell>
      <Cell row={15} col={1} colSpan={2}>
        <div>
          QMHP Name & Title:
          <FormInput name="QMHP" maxWidth="150px" />
        </div>
      </Cell>
      <Cell row={15} col={3}>
        Signature:
      </Cell>
      <Cell row={15} col={4}>
        Date:
      </Cell>
    </ContentContainer>
  );
};

export default FormSCCActionV2;
