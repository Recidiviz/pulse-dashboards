// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { UsCaSupervisionLevelDowngradeDraftData } from "../../../../WorkflowsStore/Opportunity/UsCaSupervisionLevelDowngradeReferralRecord";
import FormInput from "./FormInput";
import {
  FormSection,
  NarrowFont,
  SectionHeader,
  SectionRow,
  SmallTextStyle,
} from "./styles";

const SummaryRow = styled(SectionRow)`
  display: flex;
  flex-direction: row;
  height: 2rem;
`;

const InputCell = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1px;

  &:not(:last-child) {
    border-right: 1px solid black;
  }
`;

const InputHeader = styled.div`
  ${SmallTextStyle};
  ${NarrowFont};
`;

const RowInput = ({
  header,
  width,
  name,
}: {
  header: string;
  width: number;
  name: keyof UsCaSupervisionLevelDowngradeDraftData;
}) => {
  return (
    <InputCell style={{ width: `${width}%` }}>
      <InputHeader>{header}:</InputHeader>
      <FormInput name={name} />
    </InputCell>
  );
};

const FormSectionOne = () => {
  return (
    <FormSection>
      <SectionHeader>
        SECTION I &emsp; SUMMARY OF PAROLE ADJUSTMENT - TO BE COMPLETED BY
        PAROLE AGENT
      </SectionHeader>
      <SummaryRow>
        <RowInput header="CDC NUMBER" width={18.5} name="cdcNumber" />
        <RowInput
          header="PRINT NAME (LAST, FIRST, MI)"
          width={40}
          name="fullName"
        />
        <RowInput
          header="LAST RELEASE DATE"
          width={18}
          name="lastReleaseDate"
        />
        <RowInput header="REGION/PAROLE UNIT" width={23.5} name="unit" />
      </SummaryRow>
      <SummaryRow>
        <RowInput header="COMMITMENT OFFENSE" width={49.5} name="offense" />
        <RowInput header="CSRA SCORE" width={9} name="csraScore" />
        <RowInput
          header="SUPERVISION LEVEL"
          width={13}
          name="supervisionLevel"
        />
        <div />
      </SummaryRow>
    </FormSection>
  );
};

export default FormSectionOne;
