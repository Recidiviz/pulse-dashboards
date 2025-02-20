// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { runInAction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { Opportunity } from "../../../../WorkflowsStore";
import { UsMeMediumTrusteeFormData } from "../../../../WorkflowsStore/Opportunity/Forms/UsMeMediumTrusteeForm";
import { UsMeMediumTrusteeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMe/UsMeMediumTrusteeOpportunity";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import p1 from "./assets/p1.png";
import p2 from "./assets/p2.png";
const previewImages = [p1, p2];
const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const formDownloader = async (
  opportunity: UsMeMediumTrusteeOpportunity,
): Promise<void> => {
  let contents: Partial<UsMeMediumTrusteeFormData> = {};

  const { displayName, stateCode, rootStore } = opportunity.person;

  runInAction(() => {
    contents = {
      ...toJS(opportunity?.form?.formData),
    };
  });

  await downloadSingle(
    `${displayName} - Medium Trustee.docx`,
    stateCode,
    "medium_trustee_form.docx",
    contents,
    rootStore.getTokenSilently,
  );
};

function MediumTrustee({ opportunity }: { opportunity: Opportunity }) {
  if (!(opportunity instanceof UsMeMediumTrusteeOpportunity)) {
    return null;
  }

  return (
    <FormContainer
      heading="Medium Trustee Form"
      agencyName="MDOC"
      downloadButtonLabel="Download Form"
      onClickDownload={() => formDownloader(opportunity)}
      opportunity={opportunity}
    >
      {previewImages.map((image, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <FormPreviewPage key={index} src={image} />
      ))}
    </FormContainer>
  );
}

export default observer(MediumTrustee);
