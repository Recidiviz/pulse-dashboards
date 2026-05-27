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

import { FormCheckbox } from "../SCCReview/FormUtils";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(5, 1fr) / 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  border: 1px solid black;

  margin-bottom: ${rem(spacing.xs)};
  font-size: ${rem(7)};
  height: 60px;
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

const FormCommunicationMethod: React.FC = () => {
  return (
    <ContentContainer>
      <Cell row={1} col={1}>
        Barrier to communication:
      </Cell>
      <Cell row={1} col={2}>
        <FormCheckbox name="none" label="None" />
      </Cell>
      <Cell row={1} col={3}>
        <FormCheckbox name="BLV" label="Blind/Low Vision" />
      </Cell>
      <Cell row={1} col={4}>
        <FormCheckbox name="DHH" label="D/HH" />
      </Cell>
      <Cell row={1} col={5} colSpan={"end"}>
        <FormCheckbox name="other3" label="Other" />
      </Cell>
      <Cell row={2} col={1}>
        Primary method of communication:
      </Cell>
      <Cell row={2} col={2}>
        <FormCheckbox name="ASL" label="ASL" />
      </Cell>
      <Cell row={2} col={3}>
        <FormCheckbox name="VWHA" label="Voice w/ HA" />
      </Cell>
      <Cell row={2} col={4}>
        <FormCheckbox name="VWOHA" label="Voice w/o HA" />
      </Cell>
      <Cell row={2} col={5}>
        <FormCheckbox name="slate" label="Slate" />
      </Cell>
      <Cell row={2} col={6}>
        <FormCheckbox name="staffRead" label="Staff Read" />
      </Cell>
      <Cell row={2} col={7}>
        <FormCheckbox name="other4" label="Other" />
      </Cell>
      <Cell row={3} col={1} colSpan={3}>
        If primary method not used, what overriding factor(s) preclude use:
      </Cell>
      <Cell row={3} col={4}>
        <FormCheckbox name="emergency" label="Emergency" />
      </Cell>
      <Cell row={3} col={5}>
        <FormCheckbox name="security" label="Security" />
      </Cell>
      <Cell row={3} col={6} colSpan={"end"}>
        <FormCheckbox name="other5" label="Other Equally Effective Means" />
      </Cell>
      <Cell row={4} col={1} colSpan={"end"}>
        Method used:
      </Cell>
      <Cell row={4} col={2}>
        <FormCheckbox name="methodASL" label="ASL" />
      </Cell>
      <Cell row={4} col={3}>
        <FormCheckbox name="methodVWHA" label="Voice w/ HA" />
      </Cell>
      <Cell row={4} col={4}>
        <FormCheckbox name="methodVWOHA" label="Voice w/o HA" />
      </Cell>
      <Cell row={4} col={5}>
        <FormCheckbox name="methodSlate" label="Slate" />
      </Cell>
      <Cell row={4} col={6}>
        <FormCheckbox name="methodStaffRead" label="Staff Read" />
      </Cell>
      <Cell row={4} col={7}>
        <FormCheckbox name="other6" label="Other" />
      </Cell>
      <Cell row={5} col={1} colSpan={2}>
        How was effectiveness of communication verified?
      </Cell>
      <Cell row={5} col={3} colSpan={2}>
        <FormCheckbox name="VA" label="Verbally Acknowledged" />
      </Cell>
      <Cell row={5} col={5} colSpan={"end"}>
        <FormCheckbox
          name="responded"
          label="Responded and/or Asked Appropriate Questions"
        />
      </Cell>
    </ContentContainer>
  );
};

export default FormCommunicationMethod;
