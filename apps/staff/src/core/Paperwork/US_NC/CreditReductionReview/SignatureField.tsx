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

import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { Button, spacing } from "~design-system";

import { useFeatureVariants } from "../../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../../utils";
import { UsNcCreditReductionReviewForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsNcCreditReductionReviewForm";
import { UsNcCRRInput } from "./FormComponents";

const SignatureButton = styled(Button)`
  font-size: 6pt;
  padding: 0.25rem 0.25rem;
  margin-left: ${rem(spacing.xs)};
  min-width: unset;
  min-height: unset;
`;

const SignatureContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const SignatureField = observer(function SignatureField({
  form,
  signatureType,
  enableSignatureButton,
}: {
  form: UsNcCreditReductionReviewForm;
  signatureType: "ppo" | "cppo";
  enableSignatureButton: boolean;
}) {
  const { usNcCrrApprover } = useFeatureVariants();

  const nameField = `${signatureType}Name`;
  const dateField = `${signatureType}SignDate`;
  const signatureField: "ppoSignature" | "cppoSignature" =
    `${signatureType}Signature`;

  const signeeName = form.draftData[nameField];
  const isSigned = !!form.formData[signatureField];

  const onClickButton = () => {
    runInAction(async () => {
      if (!isSigned) {
        // Sign Form
        await form.updateDraftData(signatureField, signeeName);
        await form.updateDraftData(dateField, formatWorkflowsDate(new Date()));
      } else {
        // Clear Signature
        [signatureField, nameField, dateField].forEach((field) =>
          form.clearDraftData(field),
        );
      }
    });
  };

  const buttonText = isSigned ? "Remove Signature" : "Add Signature";

  return (
    <SignatureContainer>
      <UsNcCRRInput
        // changing the key forces it to rerender when we add a signature
        // which triggers the animation effect
        key={isSigned ? "signed" : "unsigned"}
        name={signatureField}
        style={{ fontFamily: "Snell Roundhand, cursive" }}
        readOnly
      />
      <SignatureButton
        disabled={
          (!enableSignatureButton && !isSigned) ||
          (!usNcCrrApprover && signatureType === "cppo")
        }
        onClick={onClickButton}
      >
        {buttonText}
      </SignatureButton>
    </SignatureContainer>
  );
});

export default SignatureField;
