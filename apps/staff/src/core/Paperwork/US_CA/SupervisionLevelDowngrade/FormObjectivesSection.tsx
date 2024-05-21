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
import React from "react";
import styled from "styled-components/macro";

import { UsCaSupervisionLevelDowngradeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsCaSupervisionLevelDowngradeForm";
import { UsCaSupervisionLevelDowngradeDraftData } from "../../../../WorkflowsStore/Opportunity/UsCa";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import FormInput from "./FormInput";
import {
  Border,
  MainLabelTextStyle,
  NarrowFont,
  SectionHeader,
  SectionRow,
  SmallTextStyle,
  SquareInputSelector,
  TextStyle,
} from "./styles";

const OBJECTIVES = [
  {
    description:
      "The parolee has maintained residence stability in a positive living environment.",
    outcomes: [
      "Has been in the same pro-social living situation for the review period, or when the most recent move was to improve " +
        "overall living conditions, and will continue to be available to the parolee.",
      "Has been in two or more living situations for the review period with any move not improving the living conditions.",
      "Has demonstrated an unstable living environment, is transient or routinely difficult to see at the residence of record.",
    ],
  },
  {
    description:
      "The parolee’s time has been structured around pro-social activities geared towards self-reliance.",
    outcomes: [
      "Time is highly structured and focused on pro-social activities.",
      "Time is moderately structured and generally focused on pro-social activities.",
      "Time is unstructured and generally unaccounted for; involvement in pro-social activities is not evident.",
    ],
  },
  {
    description:
      "The parolee has been compliant with his or her general and special conditions of parole.",
    outcomes: [
      "No violation has been substantiated for the review period.",
      "Has only one technical violation and demonstrated a positive response to the imposed sanction.",
      "Has not met the rating standard for #1 or #2 above.",
    ],
  },
  {
    description:
      "The parolee was referred and participated in programming for his or her top three criminogenic needs.",
    outcomes: [
      "Attended, participated, and completed programming.",
      "Attended and partially participated in programming.",
      "Failed to participate or complete programming.",
    ],
  },
  {
    description:
      "The parolee has affiliated himself or herself with other pro-social individuals.",
    outcomes: [
      "Relationships are primarily pro-social and supportive of a crime free lifestyle.",
      "Time is moderately structured and generally focused on pro-social activities.",
      "Time is unstructured and generally unaccounted for; involvement in pro-social activities is not evident.",
    ],
  },
];

const ObjectivesWrapper = styled(SectionRow)`
  display: flex;
  flex-direction: column;

  & > *:not(:last-child) {
    ${Border};
    border-width: 0 0 1px 0;
  }
`;

const HeaderSubtext = styled.span`
  ${TextStyle};
  font-size: 6.2pt;
`;

const ReviewBoxContainer = styled.div`
  ${NarrowFont};
  ${SmallTextStyle};
  display: flex;
  flex-direction: row;
  margin-left: auto;
  width: 35%;
  align-items: center;

  ${SquareInputSelector};

  & > input[type="text"] {
    width: 70px;
  }
`;

const ObjectiveScoreContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  ${SquareInputSelector};
  padding: 0;
  flex-grow: 1;

  & > label {
    flex-grow: 1;
    align-items: stretch;

    &:not(:last-child) {
      ${Border};
      border-width: 0;
      border-bottom-width: 1px;
    }

    & > div {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    & > div:not(:first-child) {
      ${Border};
      border-width: 0;
      border-left-width: 1px;

      &:last-child {
        width: auto;
      }
    }
  }
`;

const ObjectiveRow = styled.div`
  display: flex;
  flex-direction: row;

  & > *:first-child {
    ${Border};
    border-width: 0;
    border-right-width: 1px;
    min-width: 20%;
    width: 20%;
  }

  & > *:nth-child(2) {
    width: auto;
  }

  & div:not(${ObjectiveScoreContainer}) {
    padding: 1.5px;
  }
`;

const ObjectiveSelectionRow = styled(ObjectiveRow)`
  ${MainLabelTextStyle};
  display: flex;
  flex-direction: row;
`;

const ObjectiveDescription = styled.div`
  text-align: justify;
`;

const ScoreTotalRow = styled(SectionRow)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ScoreTotalSection = styled.div`
  ${MainLabelTextStyle};
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${SquareInputSelector};

  > label {
    font-size: 6.4pt;
  }
`;

const ScoreTotal = styled.div`
  ${Border};
  border-width: 0;
  border-bottom-width: 1px;
  width: 30px;
  display: flex;
  justify-content: center;
  margin-bottom: 3px;
`;

const DischargeReviewBox = observer(function DischargeReviewBox() {
  const opportunityForm =
    useOpportunityFormContext() as UsCaSupervisionLevelDowngradeForm;
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    opportunityForm.updateDraftData("seeDischargeReport", event.target.checked);
  };

  const {
    formData: { seeDischargeReport },
  } = opportunityForm;
  return (
    <ReviewBoxContainer>
      <label>
        <input
          type="checkbox"
          checked={!!seeDischargeReport}
          onChange={onChange}
        />{" "}
        SEE DISCHARGE REPORT DATED:
      </label>
      <FormInput name="dischargeReportDate" />
    </ReviewBoxContainer>
  );
});

type ObjectiveOutcomeProps = {
  objectiveNumber: number;
  objectiveDescription: string;
  outcomeDescriptions: string[];
};

const ObjectiveOutcome = observer(function ObjectiveOutcome({
  objectiveNumber,
  objectiveDescription,
  outcomeDescriptions,
}: ObjectiveOutcomeProps) {
  const formRecordKey =
    `objectiveScore${objectiveNumber}` as keyof UsCaSupervisionLevelDowngradeDraftData;

  const opportunityForm =
    useOpportunityFormContext() as UsCaSupervisionLevelDowngradeForm;
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    opportunityForm.updateDraftData(
      formRecordKey,
      parseInt(event.target.value),
    );
  };

  const formRecordValue = opportunityForm.formData[formRecordKey];

  return (
    <ObjectiveSelectionRow>
      <ObjectiveDescription>
        OBJECTIVE {objectiveNumber}: {objectiveDescription}
      </ObjectiveDescription>
      <ObjectiveScoreContainer>
        {outcomeDescriptions.map((text, index) => (
          <label key={text}>
            <div>
              <input
                type="radio"
                name={formRecordKey}
                value={index + 1}
                onChange={onChange}
                checked={formRecordValue === index + 1}
              />
            </div>
            <div>{index + 1}</div>
            <div>{text}</div>
          </label>
        ))}
      </ObjectiveScoreContainer>
    </ObjectiveSelectionRow>
  );
});

const ObjectivesTotal = observer(function ObjectivesTotal() {
  const opportunityForm =
    useOpportunityFormContext() as UsCaSupervisionLevelDowngradeForm;

  const { formData } = opportunityForm;

  let scoreTotal: number | null = 0;

  for (let i = 1; i <= OBJECTIVES.length; i += 1) {
    const scoreKey =
      `objectiveScore${i}` as keyof UsCaSupervisionLevelDowngradeDraftData;
    const objectiveScore = formData[scoreKey];

    // if any objective hasn't been score yet, don't display a total
    if (!(typeof objectiveScore === "number")) {
      scoreTotal = null;
      break;
    }
    scoreTotal += objectiveScore;
  }

  return (
    <ScoreTotalRow>
      <ScoreTotalSection>
        TOTAL OBJECTIVES SCORE: <ScoreTotal>{scoreTotal}</ScoreTotal>
      </ScoreTotalSection>
      <ScoreTotalSection>
        <label>
          <input
            type="radio"
            name="scoreTotal"
            checked={scoreTotal === 5 || scoreTotal === 6}
            readOnly
          />
          5–6 REDUCTION MAY BE WARRANTED
        </label>
        <label>
          <input
            type="radio"
            name="scoreTotal"
            checked={!!scoreTotal && scoreTotal >= 7 && scoreTotal <= 10}
            readOnly
          />
          7–10 NO CHANGE WARRANTED
        </label>
        <label>
          <input
            type="radio"
            name="scoreTotal"
            checked={!!scoreTotal && scoreTotal > 10}
            readOnly
          />
          11–15 INCREASE MAY BE WARRANTED
        </label>
      </ScoreTotalSection>
    </ScoreTotalRow>
  );
});

const FormObjectivesSection = () => {
  return (
    <ObjectivesWrapper>
      <ObjectiveRow>
        <SectionHeader>OBJECTIVES</SectionHeader>
        <SectionHeader>
          OBJECTIVES RATING SCORES{" "}
          <HeaderSubtext>[ONE SCORE PER OBJECTIVE]</HeaderSubtext>
        </SectionHeader>
        <DischargeReviewBox />
      </ObjectiveRow>
      {OBJECTIVES.map(({ description, outcomes }, index) => (
        <ObjectiveOutcome
          key={description}
          objectiveNumber={index + 1}
          objectiveDescription={description}
          outcomeDescriptions={outcomes}
        />
      ))}
      <ObjectivesTotal />
    </ObjectivesWrapper>
  );
};

export default FormObjectivesSection;
