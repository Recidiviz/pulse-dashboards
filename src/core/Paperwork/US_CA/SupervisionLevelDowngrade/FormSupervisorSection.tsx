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

import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { UsCaSupervisionLevelDowngradeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsCaSupervisionLevelDowngradeForm";
import { UsCaSupervisionLevelDowngradeDraftData } from "../../../../WorkflowsStore/Opportunity/UsCaSupervisionLevelDowngradeReferralRecord";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import FormInput from "./FormInput";
import FormTextarea from "./FormTextarea";
import { SectionRow, SmallTextStyle, SquareInputSelector } from "./styles";

const CheckboxRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  & > label {
    margin-left: 15px;
  }
  ${SquareInputSelector};
`;

const SupervisorSection = styled(SectionRow)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const SupervisorRow = styled.div`
  ${SmallTextStyle};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const FormSupervisorSection = observer(function FormSupervisorSection() {
  const { firestoreStore } = useRootStore();
  const opportunityForm =
    useOpportunityFormContext() as UsCaSupervisionLevelDowngradeForm;

  const { formData } = opportunityForm;

  const onChange =
    (field: keyof UsCaSupervisionLevelDowngradeDraftData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      firestoreStore.updateFormDraftData(
        opportunityForm,
        field,
        event.target.value
      );
    };

  return (
    <>
      <SupervisorSection>
        <SupervisorRow>SUPERVISOR’S COMMENTS AND INSTRUCTIONS:</SupervisorRow>
        <FormTextarea name="supervisorComments" minRows={2} />
      </SupervisorSection>
      <SupervisorSection>
        <SupervisorRow>
          <div>SUPERVISOR’S DECISION:</div>
          <CheckboxRow>
            <label>
              <input
                type="radio"
                value="REMAIN"
                onChange={onChange("supervisorDecision")}
                checked={formData.supervisorDecision === "REMAIN"}
              />
              REMAIN IN CURRENT CATEGORY
            </label>
            <label>
              <input
                type="radio"
                value="MOVE"
                onChange={onChange("supervisorDecision")}
                checked={formData.supervisorDecision === "MOVE"}
              />
              MOVE TO CATEGORY:
            </label>
            <FormInput name="supervisorNewCategory" style={{ width: "8em" }} />
            <label htmlFor="supervisorEffectiveDate">
              EFFECTIVE DATE:
              <FormInput
                name="supervisorEffectiveDate"
                style={{ width: "8em" }}
              />
            </label>
            <label>
              <input
                type="radio"
                value="SCHEDULE"
                onChange={onChange("supervisorDecision")}
                checked={formData.supervisorDecision === "SCHEDULE"}
              />
              SCHEDULE FOR CCR
            </label>
          </CheckboxRow>
        </SupervisorRow>
      </SupervisorSection>
    </>
  );
});

export default FormSupervisorSection;
