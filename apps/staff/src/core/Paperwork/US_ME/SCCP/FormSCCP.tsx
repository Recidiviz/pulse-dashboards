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

import p1 from "~shared-assets/images/form-previews/US_ME/SCCP/p1.png";
import p2 from "~shared-assets/images/form-previews/US_ME/SCCP/p2.png";
import p3 from "~shared-assets/images/form-previews/US_ME/SCCP/p3.png";
import p4 from "~shared-assets/images/form-previews/US_ME/SCCP/p4.png";
import p5 from "~shared-assets/images/form-previews/US_ME/SCCP/p5.png";
import p6 from "~shared-assets/images/form-previews/US_ME/SCCP/p6.png";
import p7 from "~shared-assets/images/form-previews/US_ME/SCCP/p7.png";
import p8 from "~shared-assets/images/form-previews/US_ME/SCCP/p8.png";
import p9 from "~shared-assets/images/form-previews/US_ME/SCCP/p9.png";
import p10 from "~shared-assets/images/form-previews/US_ME/SCCP/p10.png";

import { useRootStore } from "../../../../components/StoreProvider";
import { Resident } from "../../../../WorkflowsStore/Resident";
import {
  DocxTemplateFormContents,
  FileGeneratorArgs,
  renderMultipleDocx,
} from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import { downloadZipFile } from "../../utils";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const previewImages = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];

const formDownloader = async (resident: Resident): Promise<void> => {
  let contents: DocxTemplateFormContents;
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(resident.verifiedOpportunities.usMeSCCP?.form?.formData),
    };
  });

  const fileInputs: FileGeneratorArgs[] = [
    "SCCP_program_plan",
    "SCCP_warrantless_searches",
    "SCCP_extradition_waiver",
    "SCCP_disclosure",
    "SCCP_agreement",
  ].map((filename) => {
    return [
      `${resident.displayName} ${filename}.docx`,
      resident.stateCode,
      `${filename}.docx`,
      contents,
    ];
  });

  const documents = await renderMultipleDocx(
    fileInputs,
    resident.rootStore.getTokenSilently,
  );

  downloadZipFile(`${resident.displayName} SCCP Packet.zip`, documents);
};

export const FormSCCP = observer(function FormSCCP() {
  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore?.selectedPerson?.verifiedOpportunities?.usMeSCCP;

  if (!opportunity) {
    return null;
  }

  const resident = opportunity.person;

  return (
    <FormContainer
      heading="SCCP Program Plan"
      agencyName="MDOC"
      downloadButtonLabel="Download .DOCX"
      onClickDownload={() => formDownloader(resident)}
      opportunity={opportunity}
    >
      {previewImages.map((imageUrl, index) => (
        <FormPreviewPage
          key={imageUrl}
          src={imageUrl}
          alt={`SCCP Program Plan preview, page ${index + 1}`}
        />
      ))}
    </FormContainer>
  );
});
