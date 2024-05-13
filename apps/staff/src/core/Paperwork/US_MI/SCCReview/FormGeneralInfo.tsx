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

import { UsMiSCCReviewDraftData } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiSCCReviewForm";
import { FormCheckbox, FormInput } from "./FormUtils";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(8, 1fr) / 1fr 2fr 1fr 1fr 1fr;
  height: 120px;
  border: 1px solid black;
  margin-bottom: ${rem(spacing.xs)};
`;

const HeaderRow = styled.div`
  grid-area: 1 / 1 / span 1 / end;
  background-color: #a4cbfa;
  border-bottom: 0.5px solid black;
  padding-left: 2px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const SegTypeHeading = styled.div`
  grid-area: 6 / 1 / span 1 / span 2;
  padding-left: 2px;
`;
const SegTypeCell = styled.div`
  grid-area: 7 / 1 / span 1 / end;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-bottom: 0.5px solid black;
`;

const OPTCell = styled.div`
  grid-area: 6 / 3 / span 1 / end;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-style: solid;
  border-color: black;
  border-width: 0 0 0.5px 0.5px;
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
  border-style: solid;
  border-color: black;
  border-width: 0 0 ${({ row }) => (row === 8 ? 0 : 0.5)}px
    ${({ col }) => (col === 1 ? 0 : 0.5)}px;
`;

type InputProps = CellProps & {
  title: string;
  name: Extract<keyof UsMiSCCReviewDraftData, string>;
  placeholder?: string;
  maxWidth: string;
  colSpan?: number;
};

const InputField = (props: InputProps) => {
  return (
    <>
      <Cell {...props}>{props.title}</Cell>
      <Cell {...props} row={props.row + 1}>
        <FormInput {...props} />
      </Cell>
    </>
  );
};

const FormGeneralInfo: React.FC = () => {
  return (
    <ContentContainer>
      <HeaderRow>
        <b>GENERAL INFORMATION</b>
      </HeaderRow>
      <Cell row={2} col={1} colSpan={2} rowSpan={2}>
        <div style={{ display: "flex", alignItems: "center" }}>
          Review Type:
          <FormInput name="reviewType" />
        </div>
      </Cell>
      <InputField row={2} col={3} title="ERD:" name="ERD" maxWidth="80px" />
      <InputField
        row={2}
        col={4}
        colSpan={2}
        title="AMX:"
        name="AMX"
        maxWidth="160px"
      />
      <InputField
        row={4}
        col={1}
        title="Prisoner Number:"
        name="prisonerNumber"
        maxWidth="80px"
      />
      <InputField
        row={4}
        col={2}
        title="Prisoner Name:"
        name="prisonerName"
        maxWidth="160px"
      />
      <InputField
        row={4}
        col={3}
        title="Facility Code:"
        name="facility"
        maxWidth="80px"
      />
      <InputField row={4} col={4} title="Lock:" name="lock" maxWidth="80px" />
      <Cell row={4} col={5}>
        Date:
      </Cell>
      <Cell row={5} col={5} />
      <SegTypeHeading>
        <b>Type of Segregation:</b> (Check All That Apply):
      </SegTypeHeading>
      <OPTCell>
        <div>OPT:</div>
        <div>
          <FormCheckbox name="OPT" label="YES" />
        </div>
        <div>
          <FormCheckbox name="OPT" label="NO" invert />
        </div>
      </OPTCell>
      <SegTypeCell>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ marginRight: "8px" }}>
            <FormCheckbox name="adminSeg" label="Administrative" />
          </div>
          Date Classified To:
          <FormInput name="adminSegDate" />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ marginRight: "8px" }}>
            <FormCheckbox name="punSeg" label="Punitive" />
          </div>
          Date Placed In:
          <FormInput name="punSegDate" />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ marginRight: "8px" }}>
            <FormCheckbox name="tempSeg" label="Temporary" />
          </div>
          Date Placed In:
          <FormInput name="tempSegDate" />
        </div>
      </SegTypeCell>
      <Cell row={8} col={1} colSpan={"end"}>
        <div style={{ display: "flex", alignItems: "center" }}>
          Reason for Segregation Classification:
          <FormInput name="segReason" />
        </div>
      </Cell>
    </ContentContainer>
  );
};

export default FormGeneralInfo;
