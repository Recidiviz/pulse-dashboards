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
import FormCommitteeSection from "./FormCommitteeSection";
import FormInput from "./FormInput";
import FormSupervisorSection from "./FormSupervisorSection";
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
  name?: keyof UsCaSupervisionLevelDowngradeDraftData;
}) => {
  return (
    <InputCell style={{ width: `${width}%` }}>
      <InputHeader>{header}:</InputHeader>
      {name && <FormInput name={name} />}
    </InputCell>
  );
};

const FormSectionTwo = () => {
  return (
    <FormSection>
      <SectionHeader>
        SECTION II &emsp; SUMMARY/CERTIFICATION - TO BE COMPLETED BY UNIT
        SUPERVISOR
      </SectionHeader>
      <FormSupervisorSection />
      <FormCommitteeSection />
      <SummaryRow>
        <RowInput header="UNIT SUPERVISOR SIGNATURE" width={70} />
        <RowInput
          header="BADGE NUMBER"
          width={15}
          name="supervisorSignatureBadge"
        />
        <RowInput header="DATE" width={15} name="supervisorSignatureDate" />
      </SummaryRow>
    </FormSection>
  );
};

export default FormSectionTwo;
