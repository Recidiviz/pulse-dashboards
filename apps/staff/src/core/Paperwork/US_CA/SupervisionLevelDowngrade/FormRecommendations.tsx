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
import { UsCaSupervisionLevelDowngradeDraftData } from "../../../../WorkflowsStore/Opportunity/UsCa";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import FormInput from "./FormInput";
import { MainLabelTextStyle, SectionRow, SquareInputSelector } from "./styles";

const NOTIFICATION_METHODS: [
  keyof UsCaSupervisionLevelDowngradeDraftData,
  string
][] = [
  ["notifiedInPerson", "IN-PERSON"],
  ["notifiedByMail", "MAIL"],
  ["notifiedByPhone", "BY TELEPHONE"],
  ["notifiedByEmail", "E-MAIL"],
  ["notifiedByLetter", "LETTER LEFT AT RESIDENCE"],
];

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

const SmallerCheckboxRow = styled(CheckboxRow)`
  font-size: 6.4pt;
  & > label {
    margin-left: unset;
    & > input {
      margin-right: 1px !important;
    }
  }
`;

const RecommendationSection = styled(SectionRow)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const RecommendationRow = styled.div`
  ${MainLabelTextStyle};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const FormRecommendations = observer(function FormRecommendations() {
  const { firestoreStore } = useRootStore();
  const opportunityForm =
    useOpportunityFormContext() as UsCaSupervisionLevelDowngradeForm;

  const { formData } = opportunityForm;

  const onCheckField =
    (field: keyof UsCaSupervisionLevelDowngradeDraftData, invert = false) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      firestoreStore.updateFormDraftData(
        opportunityForm,
        field,
        invert ? !event.target.checked : event.target.checked
      );
    };

  return (
    <RecommendationSection>
      <RecommendationRow>
        <div>SUPPORT FOR RECOMMENDATION:</div>
        <CheckboxRow>
          <label>
            <input
              type="checkbox"
              onChange={onCheckField("form1650Attached")}
              checked={!!formData.form1650Attached}
            />
            CDCR FORM 1650-D ATTACHED
          </label>
          <label>
            <input
              type="checkbox"
              onChange={onCheckField("additionalReportAttached")}
              checked={!!formData.additionalReportAttached}
            />
            ADDITIONAL REPORT ATTACHED
          </label>
        </CheckboxRow>
      </RecommendationRow>
      <RecommendationRow>
        <div>PAROLE AGENT RECOMMENDATION:</div>
        <CheckboxRow>
          <label>
            <input
              type="radio"
              name="moveToNewCategory"
              onChange={onCheckField("moveToNewCategory", true)}
              checked={!formData.moveToNewCategory}
            />
            REMAIN IN CURRENT CATEGORY
          </label>
          <label>
            <input
              type="radio"
              name="moveToNewCategory"
              onChange={onCheckField("moveToNewCategory")}
              checked={!!formData.moveToNewCategory}
            />
            MOVE TO CATEGORY:
          </label>
          <FormInput name="newCategory" />
        </CheckboxRow>
      </RecommendationRow>
      <RecommendationRow>
        <div>DATE PAROLEE NOTIFIED:</div>
        <FormInput name="dateNotified" style={{ width: "75px" }} />
        <SmallerCheckboxRow>
          <div>METHOD OF NOTIFICATION:</div>
          {NOTIFICATION_METHODS.map(([dataKey, label]) => (
            <label key={dataKey}>
              <input
                type="checkbox"
                key={dataKey}
                name={dataKey}
                onChange={onCheckField(dataKey)}
                checked={!!formData[dataKey]}
              />
              {label}
            </label>
          ))}
        </SmallerCheckboxRow>
      </RecommendationRow>
    </RecommendationSection>
  );
});

export default FormRecommendations;
