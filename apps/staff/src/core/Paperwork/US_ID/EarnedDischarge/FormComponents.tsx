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

import styled from "styled-components/macro";

import { EarnedDischargeDraftData } from "../../../../WorkflowsStore/Opportunity/UsId";
import DOCXFormInput, { DOCXFormInputProps } from "../../DOCXFormInput";

export const FORM_US_ID_EARLY_DISCHARGE_BACKGROUND_COLOR = "rgb(227, 227, 226)";
export const FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY = `Verdana, Geneva, sans-serif`;
export const FORM_US_ID_EARLY_DISCHARGE_LETTER_SPACING = `-0.02em`;

export type FormEDInputProps = DOCXFormInputProps<EarnedDischargeDraftData>;

export const FormEDInput = (props: FormEDInputProps): React.ReactElement => (
  <DOCXFormInput<EarnedDischargeDraftData> {...props} />
);

export const FormEDSeparator = styled.hr`
  border: 0.5px solid black;
  width: 100%;
`;

export const FormEDSectionLabel = styled.div`
  font-weight: 600;
  margin-bottom: 1rem;
`;

export const FormEDTable = styled.table`
  border: black solid 1.5px;
  width: 100%;

  & th,
  td {
    padding-left: 0.4rem;
  }
  & th {
    font-weight: normal;
  }
`;

type FormColGroupsProps = {
  widths: number[];
};

export const FormColGroup = ({
  widths,
}: FormColGroupsProps): React.ReactElement => {
  return (
    <colgroup>
      {widths.map((w, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <col style={{ width: `${w}%` }} key={`${w}-${index}`} />
      ))}
    </colgroup>
  );
};

export const FormEDInputCell = (
  props: FormEDInputProps,
): React.ReactElement => (
  <td>
    <FormEDInput {...props} />
  </td>
);
