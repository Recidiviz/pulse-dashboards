// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { animation, Button } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import useClipboard from "react-use-clipboard";

import { trackReferralFormCopiedToClipboard } from "../../analytics";
import { useRootStore } from "../../components/StoreProvider";
import {
  FormContainer,
  FormHeaderSection,
  FormHeading,
  LastEditedMessage,
  NoteFormHeader,
  NotePreview,
  NotePreviewContainer,
  PageFieldTitle,
} from "../controls/WorkflowsNotePreview";
import { FormLastEdited } from "../FormLastEdited";
import { connectComponentToOpportunityForm } from "../Paperwork/OpportunityFormContext";
import { LSUFormFieldBaseProps, LSUFormFields } from "../Paperwork/US_ID/LSU";
import template from "../Paperwork/US_ID/LSU/Chrono";
import { WebForm } from "../Paperwork/WebForm";
import PillNav from "../PillNav";

const WorkflowsLSUForm = observer(function WorkflowsLSUForm() {
  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore?.selectedClient?.verifiedOpportunities?.LSU;
  const [selectedFormSection, setSelectedFormSection] = useState(0);
  const chrono = template(opportunity?.form.formData);

  const [isCopied, copyToClipboard] = useClipboard(chrono, {
    successDuration: animation.extendedDurationMs,
  });

  if (!opportunity) {
    return null;
  }
  const formFields = LSUFormFields.map((props) => ({
    ...LSUFormFieldBaseProps,
    ...props,
  }));

  const preview = (
    <NotePreviewContainer>
      <PageFieldTitle>Note Title: </PageFieldTitle>{" "}
      <span>LSU Transfer Chrono</span>
      <PageFieldTitle>Note: </PageFieldTitle>{" "}
      <NotePreview>{chrono}</NotePreview>
    </NotePreviewContainer>
  );

  const onCopyButtonClick = () => {
    copyToClipboard();
    opportunity.setCompletedIfEligible();
    trackReferralFormCopiedToClipboard({
      justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
      opportunityType: opportunity.type,
    });
  };

  return (
    <FormContainer>
      <NoteFormHeader>
        <FormHeaderSection>
          <FormHeading>
            Transfer Chrono
            <br />
            <LastEditedMessage>
              <FormLastEdited agencyName="IDOC" form={opportunity.form} />
            </LastEditedMessage>
          </FormHeading>
        </FormHeaderSection>
        <FormHeaderSection>
          <PillNav
            items={["Form", "Preview"]}
            onChange={(index) => setSelectedFormSection(index)}
          />
          <Button kind="primary" shape="block" onClick={onCopyButtonClick}>
            {isCopied ? "Note text copied!" : "Copy to Clipboard"}
          </Button>
        </FormHeaderSection>
      </NoteFormHeader>
      {selectedFormSection === 0 ? <WebForm fields={formFields} /> : preview}
    </FormContainer>
  );
});

export default connectComponentToOpportunityForm(WorkflowsLSUForm, "LSU");
