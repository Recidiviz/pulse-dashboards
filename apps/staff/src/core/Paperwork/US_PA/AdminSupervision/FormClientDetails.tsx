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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { UsPaAdminSupervisionDraftData } from "../../../../WorkflowsStore/Opportunity/UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";
import DOCXFormInput from "../../DOCXFormInput";
import {
  FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY,
  ROW_INFO,
  strings,
} from "./constants";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(4, 1fr) / 27% 32% 41%;
  height: 66px;
  font-size: ${rem(8)};
  font-family: ${FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY};
  margin-bottom: 10px;
`;

type RowCellProps = {
  row: number;
};

const RowLabelCell = styled.div<RowCellProps>`
  grid-area: ${({ row }) => row} / 1 / span 1 / span 1;
  border: 0.5px solid black;
  ${({ row }) => row > 1 && `border-top: 0;`}
  padding: 2px 6px;
  font-size: ${rem(9)};
`;

const RowInputCell = styled.div<RowCellProps>`
  grid-area: ${({ row }) => row} / 2 / span 1 / span 1;
  border-bottom: 0.5px solid black;
  ${({ row }) => row === 1 && `border-top: 0.5px solid black;`}
  display: flex;
  align-items: center;
  padding-left: 2px;
`;

type RowProps = RowCellProps & {
  title: string;
  name: Extract<keyof UsPaAdminSupervisionDraftData, string>;
  placeholder?: string;
};

const Row = (props: RowProps) => {
  return (
    <>
      <RowLabelCell {...props}>{props.title}</RowLabelCell>
      <RowInputCell {...props}>
        <DOCXFormInput<UsPaAdminSupervisionDraftData>
          {...props}
          style={{ maxWidth: "160px" }}
        />
      </RowInputCell>
    </>
  );
};

const InstructionsCell = styled.div`
  grid-area: 1 / 3 / end / end;
  border: 0.5px solid black;
  padding: 6px;
  letter-spacing: 0.01em;
`;

const RedText = styled.span`
  color: red;
`;

const FormClientDetails: React.FC = () => {
  return (
    <ContentContainer>
      {ROW_INFO.map((info, n) => (
        <Row key={info.name} title={info.label} row={n + 1} name={info.name} />
      ))}
      <InstructionsCell>
        {strings.instructions}
        <RedText>{strings.instructionsRed}</RedText>
      </InstructionsCell>
    </ContentContainer>
  );
};

export default observer(FormClientDetails);
