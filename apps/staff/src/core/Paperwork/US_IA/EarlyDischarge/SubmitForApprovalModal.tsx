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

import * as Sentry from "@sentry/react";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { palette, typography } from "~design-system";
import { pluralize } from "~utils";

import { formatNameFirstLast } from "../../../../utils";
import { UsIaEarlyDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import {
  CancelButton,
  ModalFooter,
  ModalSection,
  ModalTitle,
  SendButton,
  StyledModal,
} from "../../ModalStyles";
import { ErrorMessage } from "./ErrorMessage";

const ModalText = styled.p`
  ${typography.Sans14};
  color: ${palette.slate85};
  margin: 0;
`;

const JurisdictionList = styled.ul`
  ${typography.Sans14};
  color: ${palette.pine1};
  list-style: none;
  margin: 0;
  padding: ${rem(12)};
  align-self: stretch;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
`;

const TITLE_ID = "us-ia-ed-submit-for-approval-title";

type SubmitForApprovalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  form: UsIaEarlyDischargeForm;
};

export const SubmitForApprovalModal = observer(function SubmitForApprovalModal({
  isOpen,
  onClose,
  form,
}: SubmitForApprovalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const { opportunity, selectedChargesByJurisdiction, selectedChargeCount } =
    form;
  const { person } = opportunity;

  const close = () => {
    setFailed(false);
    onClose();
  };

  const submit = async () => {
    setIsSubmitting(true);
    setFailed(false);
    try {
      // Narratives save as the PO types; the supervisor should see the last
      // keystroke, not the last save.
      await form.waitForPendingUpdates();
      await opportunity.submitForSupervisorReview(
        [...selectedChargesByJurisdiction.values()]
          .flat()
          .map((charge) => charge.chargeExternalId),
      );
      onClose();
    } catch (e) {
      Sentry.captureException(e);
      setFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={close}
      aria={{ labelledby: TITLE_ID }}
    >
      <ModalSection>
        <ModalTitle id={TITLE_ID}>Submit for supervisor approval</ModalTitle>
        <ModalText className="fs-exclude">
          {formatNameFirstLast(person.fullName)} · DOC ID {person.displayId}
        </ModalText>
        {/* TODO(IA-449): name the supervisor. */}
        <ModalText>
          {pluralize(selectedChargeCount, "charge")} across{" "}
          {pluralize(selectedChargesByJurisdiction.size, "jurisdiction")}. This
          goes to your supervisor for review.
        </ModalText>
        <JurisdictionList>
          {[...selectedChargesByJurisdiction].map(([jurisdiction, charges]) => (
            <li key={jurisdiction}>
              {jurisdiction} — {pluralize(charges.length, "charge")}
            </li>
          ))}
        </JurisdictionList>
        <ModalText>
          Your supervisor will submit them to ICON once approved. You can still
          see the request while it is with them.
        </ModalText>
        {failed && (
          <ErrorMessage>The report wasn't submitted. Try again.</ErrorMessage>
        )}
      </ModalSection>
      <ModalFooter>
        <CancelButton onClick={close}>Cancel</CancelButton>
        <SendButton disabled={isSubmitting} onClick={submit}>
          Submit for approval
        </SendButton>
      </ModalFooter>
    </StyledModal>
  );
});
