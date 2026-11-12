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

import { observer } from "mobx-react-lite";
import { useState } from "react";

import { Opportunity } from "../../../../WorkflowsStore";
import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa";
import {
  FormContainer,
  SubmitButton,
  SubmitButtonText,
} from "../../FormContainer";
import { FormChargesStep } from "./FormChargesStep";
import { FormOrderStep } from "./FormOrderStep";
import { SubmitForApprovalModal } from "./SubmitForApprovalModal";

export const FormUsIaEarlyDischargeV2 = observer(
  function FormUsIaEarlyDischargeV2({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [emptySelectionAction, setEmptySelectionAction] = useState<
      "submit" | "print"
    >();

    if (!(opportunity instanceof UsIaEarlyDischargeOpportunity)) {
      return null;
    }

    const { form } = opportunity;
    const heading =
      opportunity.person.supervisionType === "PAROLE"
        ? "Early Discharge from Parole"
        : "Early Discharge from Probation";

    // Submit and Print stay enabled so officers aren't left stuck on a
    // disabled button; with no charge selected, Step 1 says what's missing.
    const handleSubmitClick = () => {
      if (form?.selectedChargeCount) setShowSubmitModal(true);
      else setEmptySelectionAction("submit");
    };
    const handlePrintClick = () => {
      if (form?.selectedChargeCount) window.print();
      else setEmptySelectionAction("print");
    };
    const submitButton = form && !opportunity.hasChargesInSupervisorReview && (
      <SubmitButton onClick={handleSubmitClick}>
        <SubmitButtonText>Submit for supervisor approval</SubmitButtonText>
      </SubmitButton>
    );

    return (
      <FormContainer
        heading={heading}
        agencyName="IDOC"
        opportunity={opportunity}
        hideDownloadButton
        downloadButtonLabel=""
        onClickDownload={async () => undefined}
        additionalHeaderButtons={submitButton}
        menuActions={[{ label: "Print", onClick: handlePrintClick }]}
        printable
      >
        <FormChargesStep emptySelectionAction={emptySelectionAction} />
        <FormOrderStep />
        {form && (
          <SubmitForApprovalModal
            isOpen={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            form={form}
          />
        )}
      </FormContainer>
    );
  },
);
