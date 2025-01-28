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

import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { UsPaAdminSupervisionDraftData } from "../../../../WorkflowsStore/Opportunity/UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";
import {
  GRID_ROW_COUNT,
  INJURY_OFFENSE_LABEL_INFO,
  LabelInfo,
  OTHER_OFFENSE_LABEL_INFO,
} from "./constants";
import FormCheckbox from "./FormCheckbox";
import {
  BasicCell,
  ColumnSubheaders,
  HeaderCell,
} from "./OffenseHistoryChecklistCell";

const CheckboxContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const ContentContainer = styled.div`
  display: grid;
  grid-template: 13px 13px repeat(${GRID_ROW_COUNT}, 1fr) / 36% 13% 3% 35% 13%;
  height: 425px;
  font-size: ${rem(8)};
`;

type RowProps = {
  row: number;
  label: string;
  labelSpan: number;
  columnStart: number;
  field?: keyof UsPaAdminSupervisionDraftData;
};

const CheckListRow = ({
  row,
  columnStart,
  label,
  labelSpan,
  field,
}: RowProps) => {
  return (
    <>
      <BasicCell
        column={columnStart}
        row={row}
        leftBorder={true}
        rowSpan={labelSpan}
      >
        <label htmlFor={field} style={{ marginBottom: "0" }}>
          {label}
        </label>
      </BasicCell>
      <BasicCell column={columnStart + 1} row={row} rowSpan={labelSpan}>
        {field && (
          <CheckboxContainer>
            <FormCheckbox name={field} />
          </CheckboxContainer>
        )}
      </BasicCell>
    </>
  );
};

type ColumnProps = {
  columnStart: number;
  header: string;
  infoList: LabelInfo[];
};

const ChecklistColumn = ({ columnStart, header, infoList }: ColumnProps) => {
  // Offset counter to handle varying heights of checklist rows. Initial offset accounts for the
  // two header rows.
  let rowOffset = 3;
  return (
    <>
      <HeaderCell columnStart={columnStart}>{header}</HeaderCell>
      <ColumnSubheaders columnStart={columnStart} />
      {infoList.map((info, index) => {
        const row = (
          <CheckListRow
            key={info.label ? info.label : index}
            columnStart={columnStart}
            row={index + rowOffset}
            label={info.label}
            labelSpan={info.rowSpan}
            field={info.field}
          />
        );
        rowOffset += info.rowSpan - 1;
        return row;
      })}
    </>
  );
};

const SeparatorColumn = styled.div`
  grid-area: 1 / 3 / end / span 1;
  border: 0.5px 0 0.5px 0 solid black;
  background-color: #353535;
`;

const OffenseHistoryChecklist: React.FC = () => {
  return (
    <ContentContainer>
      <ChecklistColumn
        columnStart={1}
        header="Personal Injury Crimes"
        infoList={INJURY_OFFENSE_LABEL_INFO}
      />
      <SeparatorColumn />
      <ChecklistColumn
        columnStart={4}
        header="Other"
        infoList={OTHER_OFFENSE_LABEL_INFO}
      />
    </ContentContainer>
  );
};

export default OffenseHistoryChecklist;
