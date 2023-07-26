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
import FormCheckbox from "./FormCheckbox";
import FormInput from "./FormInput";
import { MainLabelTextStyle, SectionRow, SquareInputSelector } from "./styles";

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

const PresenceSection = styled(SectionRow)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const PresenceRow = styled.div`
  ${MainLabelTextStyle};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const FormPresenceSection = observer(function FormPresenceSection() {
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
    <PresenceSection>
      <PresenceRow>
        <div>PAROLEE PRESENT FOR REVIEW:</div>
        <CheckboxRow>
          <label>
            <input
              type="radio"
              value="YES"
              onChange={onChange("paroleePresent")}
              checked={formData.paroleePresent === "YES"}
            />
            YES
          </label>
          <label>
            <input
              type="radio"
              value="NO"
              onChange={onChange("paroleePresent")}
              checked={formData.paroleePresent === "NO"}
            />
            NO (If no, cite reason below)
          </label>
          <label>
            <input
              type="radio"
              value="NOT_REQUIRED"
              onChange={onChange("paroleePresent")}
              checked={formData.paroleePresent === "NOT_REQUIRED"}
            />
            Not required to attend
          </label>
        </CheckboxRow>
      </PresenceRow>
      <PresenceRow>
        <CheckboxRow>
          <FormCheckbox
            name="paroleeParticipatedTelephonically"
            label="Parolee participated telephonically"
          />
          <FormCheckbox
            name="paroleeFailedToAppear"
            label="Parolee failed to appear"
          />
          <FormCheckbox
            name="paroleeDeclinedToParticipate"
            label="Parolee declined to participate"
          />
        </CheckboxRow>
      </PresenceRow>
      <PresenceRow>
        <CheckboxRow>
          <FormCheckbox
            name="paroleeDidNotRespond"
            label="Parolee did not respond to participation request"
          />
          <FormCheckbox
            name="cdcr1502DRProvided"
            label="Copy of CDCR 1502-DR provided to parolee"
          />
        </CheckboxRow>
      </PresenceRow>
      <PresenceRow>
        <CheckboxRow>
          <FormCheckbox
            name="reasonableAccommodationProvided"
            label="Reasonable accommodation provided"
          />
          <label htmlFor="accommodationDescription">
            (Describe):
            <FormInput name="accommodationDescription" />
          </label>
        </CheckboxRow>
      </PresenceRow>
    </PresenceSection>
  );
});

export default FormPresenceSection;
