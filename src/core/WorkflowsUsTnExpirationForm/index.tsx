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
import {
  animation,
  Button,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import useClipboard from "react-use-clipboard";

import { trackReferralFormCopiedToClipboard } from "../../analytics";
import { useRootStore } from "../../components/StoreProvider";
import {
  FormContainer,
  FormHeaderSection,
  FormHeading,
  LastEditedMessage,
  NoteFormHeader,
  NotePreviewContainer,
  PageFieldTitle,
  PagePreviewWithHover,
} from "../controls/WorkflowsNotePreview";
import { FormLastEdited } from "../FormLastEdited";
import { connectComponentToOpportunityForm } from "../Paperwork/OpportunityFormContext";
import {
  UsTnExpirationFormFieldBaseProps,
  UsTnExpirationFormFields,
} from "../Paperwork/US_TN/Expiration";
import tepeTemplate, {
  charLimitedNote,
  paginatedTEPENoteByLine,
  paginateTEPENote,
} from "../Paperwork/US_TN/Expiration/TEPENote";
import WebFormField from "../Paperwork/WebFormField";
import PillNav from "../PillNav";
import { WriteToTOMISModal } from "./WriteToTOMISModal";

const WorkflowsUsTnExpirationForm: React.FC = observer(
  function WorkflowsUsTnExpirationForm() {
    const { workflowsStore } = useRootStore();
    const opportunity =
      workflowsStore?.selectedClient?.verifiedOpportunities?.usTnExpiration;
    const [selectedFormSection, setSelectedFormSection] = useState(0);
    const completedTEPENOTE = tepeTemplate(opportunity?.form.formData);
    const fullCharLimitedTEPENote = charLimitedNote(completedTEPENOTE, 70);
    const paginatedNote = paginateTEPENote(fullCharLimitedTEPENote, 10);
    const [isCopied, copyToClipboard] = useClipboard(
      paginatedNote.join("\n---\n"),
      {
        successDuration: animation.extendedDurationMs,
      }
    );
    const [pageToCopy, setPageToCopy] = useState("");
    const [isPageCopied, copyPageToClipboard] = useClipboard(pageToCopy, {
      successDuration: animation.extendedDurationMs,
    });
    const [pageNumberCopied, setPageNumberCopied] = useState(-1);
    const [showTOMISPreviewModal, setShowTOMISPreviewModal] = useState(false);

    useEffect(() => {
      if (pageToCopy) {
        copyPageToClipboard();
        setPageToCopy("");
      }
    }, [pageToCopy, copyPageToClipboard]);

    if (!opportunity) {
      return null;
    }
    const form = (
      <>
        {UsTnExpirationFormFields.map((props) => (
          <WebFormField
            {...UsTnExpirationFormFieldBaseProps}
            {...props}
            key={props.name}
            style={{ marginTop: rem(spacing.md) }}
          />
        ))}
      </>
    );

    const handleCopiedText = (page: string, index: number) => {
      setPageToCopy(page);
      setPageNumberCopied(index);
      markCompleted();
    };

    const markCompleted = () => {
      opportunity.setCompletedIfEligible();
      trackReferralFormCopiedToClipboard({
        justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
        opportunityType: opportunity.type,
      });
    };

    const preview = (
      <NotePreviewContainer className="formPreview">
        <PageFieldTitle>Note Title: </PageFieldTitle> <span>TEPE</span>
        <>
          {paginatedNote.map((page, index) => (
            <>
              <PageFieldTitle>
                Page {index + 1} of {paginatedNote.length}:
              </PageFieldTitle>
              <TooltipTrigger
                contents={
                  isPageCopied && index === pageNumberCopied
                    ? `Page ${index + 1} copied to clipboard`
                    : "Click to copy to clipboard"
                }
              >
                <PagePreviewWithHover
                  onClick={() => {
                    handleCopiedText(page, index);
                  }}
                >
                  {page}
                </PagePreviewWithHover>
              </TooltipTrigger>
            </>
          ))}
        </>
      </NotePreviewContainer>
    );

    const onCopyButtonClick = () => {
      copyToClipboard();
      markCompleted();
    };

    return (
      <FormContainer className="WorkflowsFormContainer">
        <NoteFormHeader>
          <FormHeaderSection>
            <FormHeading>
              TEPE Note
              <br />
              <LastEditedMessage>
                <FormLastEdited agencyName="TDOC" form={opportunity.form} />
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
            <Button
              kind="primary"
              shape="block"
              onClick={() => setShowTOMISPreviewModal(true)}
            >
              Submit to TOMIS
            </Button>
          </FormHeaderSection>
        </NoteFormHeader>
        {selectedFormSection === 0 ? form : preview}
        <WriteToTOMISModal
          showModal={showTOMISPreviewModal}
          onCloseFn={() => setShowTOMISPreviewModal(false)}
          paginatedNote={paginatedTEPENoteByLine(fullCharLimitedTEPENote, 10)}
          opportunity={opportunity}
        />
      </FormContainer>
    );
  }
);

export default connectComponentToOpportunityForm(
  WorkflowsUsTnExpirationForm,
  "usTnExpiration"
);
