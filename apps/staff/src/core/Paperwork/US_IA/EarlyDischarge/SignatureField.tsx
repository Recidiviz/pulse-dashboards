// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Button } from "@recidiviz/design-system";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { PartialRecord } from "../../../../utils/typeUtils";
import { UsIaEarlyDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { UsIaEarlyDischargeDraftData } from "../../../../WorkflowsStore/Opportunity/UsIa";
import { FormUsIaEarlyDischargeInput } from "./FormComponents";

const SignatureButton = styled(Button)`
  font-size: 6pt;
  padding: 0.25rem 0.25rem;

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
  signatureField,
  displaySignatureButton,
  idField,
  signatureFieldType,
  formType,
  fieldsToPopulate = {},
  additionalFieldsToSave = [],
}: {
  form: UsIaEarlyDischargeForm;
  signatureField: keyof UsIaEarlyDischargeDraftData;
  displaySignatureButton: boolean;
  idField: keyof UsIaEarlyDischargeDraftData;
  signatureFieldType: "officer" | "approver";
  formType: "cbc" | "parole";
  fieldsToPopulate?: PartialRecord<
    keyof UsIaEarlyDischargeDraftData,
    string | boolean
  >;
  additionalFieldsToSave?: (keyof UsIaEarlyDischargeDraftData)[];
}) {
  const { userStore, analyticsStore } = useRootStore();

  const isSigned = !!form.formData[signatureField];

  const onClickButton = () => {
    runInAction(() => {
      if (!isSigned) {
        form.updateDraftData(
          signatureField,
          userStore.userFullNameFromAdminPanel ?? "",
        );
        // Save whatever is in shown in the form into the
        // draft data so that it will be available
        // when the supervisor goes to review it.
        additionalFieldsToSave.forEach((field) => {
          form.updateDraftData(field, form.formData[field] ?? "");
        });
        form.updateDraftData(
          idField,
          userStore.userAppMetadata?.externalId ?? "",
        );
        // Save any additional fields that need to be populated when signed
        Object.entries(fieldsToPopulate).forEach(([field, value]) => {
          if (value === undefined) return;

          form.updateDraftData(
            field as keyof UsIaEarlyDischargeDraftData,
            value,
          );
        });
        analyticsStore.trackUsIaEarlyDischargeReferralFormSignatureAdded({
          justiceInvolvedPersonId: form.opportunity.person.pseudonymizedId,
          formType,
          signatureField: signatureFieldType,
        });
      } else {
        // Remove all edits to the fields related to the officer signature
        // so that they don't override the fields if a different
        // supervising officer tries to sign this form.
        form.clearDraftData(signatureField);
        additionalFieldsToSave.forEach((field) => {
          form.clearDraftData(field);
        });
        form.clearDraftData(idField);
        // Clear any additional fields that were populated when signed
        Object.entries(fieldsToPopulate).forEach(([field, value]) => {
          form.clearDraftData(field as keyof UsIaEarlyDischargeDraftData);
        });
        analyticsStore.trackUsIaEarlyDischargeReferralFormSignatureRemoved({
          justiceInvolvedPersonId: form.opportunity.person.pseudonymizedId,
          formType,
          signatureField: signatureFieldType,
        });
      }
    });
  };

  const buttonText = isSigned ? "Remove Signature" : "Click to Sign";

  const buttonStyle = isSigned
    ? { fontFamily: "Snell Roundhand, cursive" }
    : { fontFamily: "Arial, sans-serif" };

  let placeholderText: string | undefined = undefined;
  if (!isSigned) {
    placeholderText =
      signatureFieldType === "officer"
        ? "Supervising Officer's Signature"
        : "Director's Signature";
  }

  const officerSignatureButton = displaySignatureButton ? (
    <SignatureButton onClick={onClickButton}>{buttonText}</SignatureButton>
  ) : null;

  return (
    <SignatureContainer>
      <FormUsIaEarlyDischargeInput
        // changing the key forces it to rerender when we add a signature
        // which triggers the animation effect
        key={isSigned ? "signed" : "unsigned"}
        name={signatureField}
        placeholder={placeholderText}
        style={buttonStyle}
        readOnly
      />
      {officerSignatureButton}
    </SignatureContainer>
  );
});

export default SignatureField;
