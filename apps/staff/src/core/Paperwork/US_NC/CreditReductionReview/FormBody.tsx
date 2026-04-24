// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components";

import {
  UsNcCRRCheckbox,
  UsNcCRRInput,
  UsNcCRRTextArea,
} from "./FormComponents";

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  border: 1px solid black;
  flex-direction: column;
  padding: ${rem(spacing.xs)};
`;

const LabeledInput = styled.div`
  display: flex;
  gap: ${rem(spacing.sm)};
  align-items: center;
  flex-shrink: 0;
`;

const TextBlock = styled.div`
  padding: ${rem(spacing.xs)};
`;

const ConditionRow = styled.div`
  display: flex;
  padding: ${rem(spacing.xs)};
  gap: ${rem(spacing.sm)};
  align-items: center;
`;

const IndentedBlock = styled.div`
  margin-left: ${rem(spacing.lg)};
  margin-top: ${rem(spacing.sm)};
`;

const CheckboxContainer = styled.div`
  margin: 0 ${rem(spacing.md)};
  gap: ${rem(spacing.sm)};
  display: flex;
  flex-shrink: 0;
`;

type ValidIndex = "1" | "2" | "3" | "4" | "5";

const Condition = ({
  condition,
  index,
}: {
  condition: string;
  index: ValidIndex;
}) => {
  return (
    <div>
      <ConditionRow>
        <UsNcCRRCheckbox name={`condition${index}`} />
        {condition}
        <LabeledInput>
          Start Date:
          <UsNcCRRInput name={`start${index}`} />
        </LabeledInput>
      </ConditionRow>
      <LabeledInput style={{ marginLeft: rem(spacing.lg) }}>
        Comment:
        <UsNcCRRTextArea name={`comment${index}`} />
      </LabeledInput>
    </div>
  );
};

const CONDITIONS = [
  `Work faithfully at suitable employment or faithfully pursue a course of
        study or vocational training that will equip the supervisee for suitable
        employment.`,
  `Undergo available medical or psychiatric treatment and remain in a specified institution
if required for that purpose.`,
  `Attend or reside in a facility providing rehabilitation, instruction, recreation, or residence for
persons on post-release supervision`,
  `Support the supervisee's dependents and meet other family responsibilities.`,
  `In the case of a supervisee who attended a basic skills program during incarceration,
continue attending a basic skills program in pursuit of an adult high school equivalency
diploma or adult high school diploma.`,
];

const FormHeading: React.FC = () => {
  return (
    <Container>
      <Row>
        <LabeledInput>
          Offender Name:
          <UsNcCRRInput name="offenderName" />
        </LabeledInput>
        <LabeledInput>
          OPUS:
          <UsNcCRRInput name="OPUS" />
        </LabeledInput>
      </Row>
      <Row>
        <LabeledInput>
          Supervision Start Date:
          <UsNcCRRInput name="supStart" />
        </LabeledInput>
        <LabeledInput>
          Supervision End Date:
          <UsNcCRRInput name="supEnd" />
        </LabeledInput>
      </Row>
      <TextBlock>
        Pursuant to N.C.G.S. 15A-1368.2(d), Community Supervision has determined
        that the above offender has made diligent progress toward the
        reintegrative conditions of post-release supervision as listed in
        N.C.G.S 15A-1368.4(d) and is eligible to receive earned time credit
        toward the period of post-release supervision.
      </TextBlock>
      <TextBlock>
        CHECK ALL REINTEGRATIVE CONDITIONS THAT APPLY AND PROVIDE COMMENTS:
      </TextBlock>
      {CONDITIONS.map((c, i) => (
        <Condition
          condition={c}
          index={(i + 1) as unknown as ValidIndex}
          key={c}
        />
      ))}
      <IndentedBlock
        style={{ marginLeft: rem(spacing.lg), marginTop: rem(spacing.sm) }}
      >
        <TextBlock>
          Summary of compliance with other conditions of supervision:
        </TextBlock>{" "}
        <UsNcCRRTextArea name="comment6" />
      </IndentedBlock>
      <IndentedBlock>
        <Row>
          Has the offender violated during the current period of PRS?
          <CheckboxContainer>
            <UsNcCRRCheckbox name="yn1" label="No" invert toggleable />
            <UsNcCRRCheckbox name="yn1" label="Yes" toggleable />
          </CheckboxContainer>
        </Row>
      </IndentedBlock>
      <IndentedBlock>
        If yes, what were the violations?
        <UsNcCRRTextArea name="violations" />
      </IndentedBlock>
      <IndentedBlock>
        <Row>
          Pending Charges:
          <CheckboxContainer>
            <UsNcCRRCheckbox name="yn2" label="No" invert toggleable />
            <UsNcCRRCheckbox name="yn2" label="Yes" toggleable />
          </CheckboxContainer>
          (If yes, provide docket #, circumstances, and disposition of charges
          in the above summary.)
        </Row>
      </IndentedBlock>
      <IndentedBlock>
        <Row>
          Has a drug screen been completed in the past 30 days?
          <CheckboxContainer>
            <UsNcCRRCheckbox
              name="yn3"
              label="No (not eligible until completed)"
              toggleable
              invert
            />
            <UsNcCRRCheckbox name="yn3" label="Yes" toggleable />
          </CheckboxContainer>
        </Row>
        <Row>
          Results:
          <CheckboxContainer>
            <UsNcCRRCheckbox name="np" label="Negative" invert toggleable />
            <UsNcCRRCheckbox name="np" label="Positive" toggleable />
          </CheckboxContainer>
          <UsNcCRRTextArea name="comment7" />
        </Row>
      </IndentedBlock>
      <Row>
        <LabeledInput>
          Supervision Level:
          <UsNcCRRInput name="supLevel" />
        </LabeledInput>
        <LabeledInput>
          Sex Offender:
          <CheckboxContainer>
            <UsNcCRRCheckbox name="yn4" label="No" invert toggleable />
            <UsNcCRRCheckbox name="yn4" label="Yes" toggleable />
          </CheckboxContainer>
        </LabeledInput>
      </Row>
      <Row>
        <LabeledInput>
          Restitution:
          <UsNcCRRInput name="restitution" />
        </LabeledInput>
        <LabeledInput>
          Amount in Arrears:
          <UsNcCRRInput name="arrears" />
        </LabeledInput>
      </Row>
    </Container>
  );
};

export default FormHeading;
