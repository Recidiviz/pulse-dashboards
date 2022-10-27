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
  palette,
  Sans12,
  Sans14,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { rem } from "polished";
import { useState } from "react";
import useClipboard from "react-use-clipboard";
import styled from "styled-components/macro";

import { trackReferralFormCopiedToClipboard } from "../../analytics";
import { useRootStore } from "../../components/StoreProvider";
import { FormLastEdited } from "../FormLastEdited";
import { connectComponentToOpportunityForm } from "../Paperwork/OpportunityFormContext";
import { LSUFormFieldBaseProps, LSUFormFields } from "../Paperwork/US_ID/LSU";
import template from "../Paperwork/US_ID/LSU/Chrono";
import WebFormField from "../Paperwork/WebFormField";
import PillNav from "../PillNav";

const LSUFormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} 0;
  border-bottom: 1px solid ${palette.marble5};
  margin-bottom: ${rem(spacing.lg)};
`;

const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const FormHeading = styled(Sans24)`
  color: ${palette.pine1};
`;

const LSUFormContainer = styled.div`
  margin: 0 ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.xl)};
`;

const LastEditedMessage = styled(Sans12)`
  color: ${palette.slate85};
`;

const NotePreview = styled.article`
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
  white-space: pre;
  max-width: ${rem(960)};
`;

const LSUChronoPreview = styled(Sans14)`
  display: grid;
  grid-template-columns: minmax(min-content, 100px) 1fr;
  grid-template-rows: min-content;
  gap: ${rem(spacing.md)};
`;
const ChronoField = styled.strong`
  color: black;
`;

const WorkflowsLSUForm: React.FC = () => {
  const { workflowsStore } = useRootStore();
  const opportunity = workflowsStore?.selectedClient?.opportunities?.LSU;
  const [selectedFormSection, setSelectedFormSection] = useState(0);
  const chrono = template(opportunity?.form.formData);

  const [isCopied, copyToClipboard] = useClipboard(chrono, {
    successDuration: animation.extendedDurationMs,
  });

  if (!opportunity) {
    return null;
  }
  const form = (
    <>
      {LSUFormFields.map((props) => (
        <WebFormField
          {...LSUFormFieldBaseProps}
          {...props}
          key={props.name}
          style={{ marginTop: rem(spacing.md) }}
        />
      ))}
    </>
  );
  const preview = (
    <LSUChronoPreview>
      <ChronoField>Note Title: </ChronoField> <span>LSU Transfer Chrono</span>
      <ChronoField>Note: </ChronoField> <NotePreview>{chrono}</NotePreview>
    </LSUChronoPreview>
  );

  const onCopyButtonClick = () => {
    copyToClipboard();
    opportunity.setCompletedIfEligible();
    trackReferralFormCopiedToClipboard({
      clientId: opportunity.client.pseudonymizedId,
      opportunityType: opportunity.type,
    });
  };

  return (
    <LSUFormContainer>
      <LSUFormHeader>
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
      </LSUFormHeader>
      {selectedFormSection === 0 ? form : preview}
    </LSUFormContainer>
  );
};

export default connectComponentToOpportunityForm(WorkflowsLSUForm, "LSU");
