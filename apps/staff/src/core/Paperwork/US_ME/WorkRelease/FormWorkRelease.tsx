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

import {
  Opportunity,
  UsMeWorkReleaseOpportunity,
} from "../../../../WorkflowsStore";
import {
  DocxTemplateFormContents,
  FileGeneratorArgs,
  renderMultipleDocx,
} from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import { downloadZipFile } from "../../utils";
import p1 from "./assets/p1.png";
import p2 from "./assets/p2.png";
import p3 from "./assets/p3.png";
import p4 from "./assets/p4.png";
import p5 from "./assets/p5.png";
import p6 from "./assets/p6.png";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const previewImages = [p1, p2, p3, p4, p5, p6];

const formDownloader = async (
  opportunity: UsMeWorkReleaseOpportunity,
): Promise<void> => {
  let contents: DocxTemplateFormContents;
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(opportunity?.form?.formData),
    };
  });

  const resident = opportunity.person;

  const fileInputs: FileGeneratorArgs[] = [
    "WorkRelease_48hour_review",
    "WorkRelease_program_application",
    "WorkRelease_program_review",
    "WorkRelease_agreement_conditions",
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
  downloadZipFile(`${resident.displayName} Work Release Packet.zip`, documents);
};

export const FormWorkRelease = observer(function FormWorkRelease({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  if (!(opportunity instanceof UsMeWorkReleaseOpportunity)) {
    return null;
  }

  return (
    <FormContainer
      heading="Work Release Application"
      agencyName="MDOC"
      downloadButtonLabel="Download .DOCX"
      onClickDownload={() => formDownloader(opportunity)}
      opportunity={opportunity}
    >
      {previewImages.map((imageUrl, index) => (
        <FormPreviewPage
          key={imageUrl}
          src={imageUrl}
          alt={`Work Release Application preview, page ${index + 1}`}
        />
      ))}
    </FormContainer>
  );
});
