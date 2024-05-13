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
  grid-template: repeat(11, 1fr) / 17% 9% 17% 6% 11% 6% 17% 17%;
  height: 160px;
  margin-bottom: ${rem(spacing.xs)};
  border: 1px solid black;
`;

const HeaderRow = styled.div`
  grid-area: 1 / 1 / span 1 / end;
  background-color: #a4cbfa;
  border-bottom: 0.5px solid black;
  padding-left: 2px;
`;

const STGCell = styled.div`
  grid-area: 10 / 1 / span 1 / span 4;
  display: flex;
  align-items: center;
  padding-left: 2px;
  border-style: solid;
  border-color: black;
  border-width: 0 0 0.5px 0;
`;
const ApprovalCell = styled.div`
  grid-area: 10 / 4 / span 1 / span end;
  display: flex;
  align-items: center;
  padding-left: 2px;
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
  line-height: 0.95;
  border-style: solid;
  border-color: black;
  border-width: 0 0 ${({ row }) => (row === 11 ? 0 : 0.5)}px
    ${({ col }) => (col === 1 ? 0 : 0.5)}px;
`;

type InputProps = CellProps & {
  title: string;
  name: Extract<keyof UsMiSCCReviewDraftData, string>;
  placeholder?: string;
  maxWidth: string;
};

const InputField = (props: InputProps) => {
  return (
    <>
      <Cell {...props} style={{ alignItems: "center" }}>
        {props.title}
      </Cell>
      <Cell {...props} row={props.row + 1}>
        <FormInput {...props} />
      </Cell>
    </>
  );
};

const FormHistory: React.FC = () => {
  return (
    <ContentContainer>
      <HeaderRow>
        <b>PRISONER HISTORY</b> &emsp;Format Note: Use Charge Code and
        Month/Year Example: (032), 12/06; (027 & 020), 03/07
      </HeaderRow>
      <Cell row={2} col={1} colSpan={"end"}>
        <div style={{ display: "flex", alignItems: "center" }}>
          Misconduct Reports Since Last Review:
          <FormInput name="reportsSinceReview" maxWidth="360px" />
        </div>
      </Cell>
      <Cell row={3} col={1} rowSpan={2}>
        Summary of Misconducts - # for each code:
      </Cell>
      <InputField
        row={3}
        col={2}
        colSpan={4}
        title="Bondable Misconducts (Last 6 Months):"
        name="bondableOffensesWithin6Months"
        maxWidth="160px"
      />
      <InputField
        row={3}
        col={6}
        colSpan={"end"}
        title="Non-Bondable Misconducts (Past Year):"
        name="nonbondableOffensesWithin1Year"
        maxWidth="160px"
      />
      <Cell row={5} col={1} rowSpan={2} style={{ lineHeight: "-1em" }}>
        Previously Classified to Segregation (Last 3 Years):
      </Cell>
      <Cell row={5} col={2}>
        Date(s):
      </Cell>
      <Cell row={5} col={3}>
        <FormInput name="adSegDate1" />
      </Cell>
      <Cell row={5} col={4} colSpan={3}>
        <FormInput name="adSegDate2" />
      </Cell>
      <Cell row={5} col={7}>
        <FormInput name="adSegDate3" />
      </Cell>
      <Cell row={5} col={8}>
        <FormInput name="adSegDate4" />
      </Cell>
      <Cell row={6} col={2}>
        Reason(s):
      </Cell>
      <Cell row={6} col={3}>
        <FormInput name="adSegReason1" />
      </Cell>
      <Cell row={6} col={4} colSpan={3}>
        <FormInput name="adSegReason2" />
      </Cell>
      <Cell row={6} col={7}>
        <FormInput name="adSegReason3" />
      </Cell>
      <Cell row={6} col={8}>
        <FormInput name="adSegReason4" />
      </Cell>
      <Cell row={7} col={1} rowSpan={3}>
        Nature of What Led to Segregation Placement / Relevant Behavior in
        Segregation:
      </Cell>
      <Cell row={7} col={2} rowSpan={3} colSpan={"end"}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <FormInput name="segNature" maxWidth="450px" />
        </div>
      </Cell>
      <STGCell>
        <div style={{ marginRight: "8px" }}>STG:</div>
        <div style={{ marginRight: "8px" }}>
          <FormCheckbox name="STG1" label="I" />
        </div>
        <div>
          <FormCheckbox name="STG2" label="II" />
        </div>
      </STGCell>
      <ApprovalCell>
        <div style={{ marginRight: "8px" }}>Approval Required for Release?</div>
        <div style={{ marginRight: "8px" }}>
          <FormCheckbox name="DD" label="DD" />
        </div>
        <div style={{ marginRight: "8px" }}>
          <FormCheckbox name="CMO" label="CMO" />
        </div>
        <div style={{ marginRight: "8px" }}>
          <FormCheckbox name="ADD" label="ADD" />
        </div>
        <div>
          <FormCheckbox name="NA" label="N/A" />
        </div>
      </ApprovalCell>
      <Cell row={11} col={1} colSpan={4}>
        <div style={{ display: "flex", alignItems: "center" }}>
          Date of Last Warden Interview:
          <FormInput name="lastWardenInterview" />
        </div>
      </Cell>
      <Cell row={11} col={4} colSpan={"end"}>
        <div style={{ display: "flex", alignItems: "center" }}>
          Date of Last ADD Interview:
          <FormInput name="lastADDInterview" />
        </div>
      </Cell>
    </ContentContainer>
  );
};

export default FormHistory;
