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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components";

import { useFeatureVariants } from "../../../../components/StoreProvider";
import { UsNcCreditReductionReviewForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsNcCreditReductionReviewForm";
import { UsNcCRRInput } from "./FormComponents";
import SignatureField from "./SignatureField";

const Row = styled.div`
  display: flex;
  align-items: center;
  margin: ${rem(spacing.xs)};
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
`;

const Container = styled.div`
  display: flex;
  border: 1px solid black;
  padding: ${rem(spacing.xs)};
  font-weight: bold;
`;

const LabeledInput = styled.div`
  display: flex;
  gap: ${rem(spacing.sm)};
  align-items: center;
  flex-shrink: 0;
`;

const FormSignatures: React.FC<{ form: UsNcCreditReductionReviewForm }> =
  observer(function FormSignatures({
    form,
  }: {
    form: UsNcCreditReductionReviewForm;
  }) {
    const { usNcCrrApprover } = useFeatureVariants();
    return (
      <>
        <Row style={{ justifyContent: "center" }}>
          Enter your name in the relevant box, then select "Add Signature" when
          ready.
        </Row>
        <Container>
          <Column>
            <Row>
              <LabeledInput>
                PPO Name:
                <UsNcCRRInput name="ppoName" inputUpdateDelayMs={500} />
              </LabeledInput>
              {/* button */}
            </Row>
            <Row>
              <LabeledInput>
                PPO Signature:
                <SignatureField
                  form={form}
                  signatureType="ppo"
                  enableSignatureButton={!!form.draftData["ppoName"]}
                />
              </LabeledInput>
            </Row>
            <Row>
              <LabeledInput>
                Date:
                <UsNcCRRInput name="ppoSignDate" readOnly />
              </LabeledInput>
            </Row>
          </Column>
          <Column>
            <Row>
              <LabeledInput>
                CPPO Name:
                <UsNcCRRInput
                  name="cppoName"
                  readOnly={!usNcCrrApprover}
                  inputUpdateDelayMs={500}
                />
              </LabeledInput>
              {/* button */}
            </Row>
            <Row>
              <LabeledInput>
                CPPO Signature:
                <SignatureField
                  form={form}
                  signatureType="cppo"
                  enableSignatureButton={
                    !!form.draftData["cppoName"] && !!usNcCrrApprover
                  }
                />
              </LabeledInput>
            </Row>
            <Row>
              <LabeledInput>
                Date:
                <UsNcCRRInput name="cppoSignDate" readOnly />
              </LabeledInput>
            </Row>
          </Column>
        </Container>
      </>
    );
  });

export default FormSignatures;
