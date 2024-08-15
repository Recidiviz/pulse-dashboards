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

import { useRootStore } from "../../../../components/StoreProvider";
import { UsMeMediumTrusteeFormData } from "../../../../WorkflowsStore/Opportunity/Forms/UsMeMediumTrusteeForm";
import { Resident } from "../../../../WorkflowsStore/Resident";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import p1 from "./assets/p1.png";
import p2 from "./assets/p2.png";
const previewImages = [p1, p2];
const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const formDownloader = async (resident: Resident): Promise<void> => {
  let contents: Partial<UsMeMediumTrusteeFormData> = {};

  const { displayName, stateCode, rootStore, verifiedOpportunities } = resident;

  runInAction(() => {
    contents = {
      ...toJS(verifiedOpportunities.usMeMediumTrustee?.form?.formData),
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

function MediumTrustee() {
  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore.selectedResident?.verifiedOpportunities?.usMeMediumTrustee;

  if (!opportunity) {
    return null;
  }

  const resident = opportunity.resident;

  return (
    <FormContainer
      heading="Medium Trustee Form"
      agencyName="MDOC"
      downloadButtonLabel="Download Form"
      onClickDownload={() => formDownloader(resident)}
      opportunity={opportunity}
    >
      {previewImages.map((image, index) => (
        <FormPreviewPage key={index} src={image} />
      ))}
    </FormContainer>
  );
}

export default observer(MediumTrustee);
