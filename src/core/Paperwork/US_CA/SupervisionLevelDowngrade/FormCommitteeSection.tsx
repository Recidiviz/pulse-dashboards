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
import {
  NarrowFont,
  SectionRow,
  SmallTextStyle,
  SquareInputSelector,
} from "./styles";

const InputCell = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1px;
  border-left: 1px solid black;

  &:not(:last-child) {
    border-bottom: 1px solid black;
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

const CommitteeSection = styled(SectionRow)`
  ${SmallTextStyle};
  ${SquareInputSelector}
  display: flex;

  flex-direction: row;
  justify-content: space-between;
`;

const CommitteeCol = styled.div`
  ${SmallTextStyle};
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const FormCommitteeSection = observer(function FormCommitteeSection() {
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
    <CommitteeSection>
      <CommitteeCol
        style={{
          width: "40%",
        }}
      >
        <div>DISCHARGE CONSIDERATION COMMITTEE ACTION:</div>
        <label>
          <input
            type="radio"
            value="DISCHARGE"
            onChange={onChange("dischargeCommitteeAction")}
            checked={formData.dischargeCommitteeAction === "DISCHARGE"}
          />
          DISCHARGE
        </label>
        <label>
          <input
            type="radio"
            value="RETAIN"
            onChange={onChange("dischargeCommitteeAction")}
            checked={formData.dischargeCommitteeAction === "RETAIN"}
          />
          RETAIN ON PAROLE
        </label>
        <label>
          <input
            type="radio"
            value="DEFER"
            onChange={onChange("dischargeCommitteeAction")}
            checked={formData.dischargeCommitteeAction === "DEFER"}
          />
          DEFER
        </label>
      </CommitteeCol>
      <CommitteeCol>
        <RowInput
          header="PRESIDING AUTHORITY NAME(S)"
          width={100}
          name="presidingAuthorityName"
        />
        <RowInput
          header="COMMENTS"
          width={100}
          name="dischargeCommitteeComments"
        />
      </CommitteeCol>
    </CommitteeSection>
  );
});

export default FormCommitteeSection;
