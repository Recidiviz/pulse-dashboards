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

import { startCase } from "lodash";
import { runInAction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { UsMeFurloughReleaseDraftData } from "../../../../WorkflowsStore";
import {
  DocxTemplateFormContents,
  FileGeneratorArgs,
  renderMultipleDocx,
} from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import { fillPDF, PDFFillerFunc } from "../../PDFFormFiller";
import { downloadZipFile } from "../../utils";
import p1 from "./assets/p1.png";
import p2 from "./assets/p2.png";
import p3 from "./assets/p3.png";
import p4 from "./assets/p4.png";
import p5 from "./assets/p5.png";
import p6 from "./assets/p6.png";
import p7 from "./assets/p7.png";
import p8 from "./assets/p8.png";
import p9 from "./assets/p9.png";
import p10 from "./assets/p10.png";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const previewImages = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];

const fillerFunc: (
  formData: Partial<UsMeFurloughReleaseDraftData>,
) => PDFFillerFunc = (formData) => async (set, form, doc) => {
  set("RESIDENTS NAME", formData.residentName);
  set("FACILITY HOUSING UNIT", formData.facilityHousingUnit);
  set("MDOC NUMBER", formData.mdocNo);
  set("CASE MANAGER", formData.caseManager);
};

export const FormFurloughRelease = observer(function FormWorkRelease() {
  const { workflowsStore, getTokenSilently } = useRootStore();
  const opportunity =
    workflowsStore?.selectedPerson?.verifiedOpportunities?.usMeFurloughRelease;

  if (!opportunity) {
    return null;
  }

  const resident = opportunity.person;

  const formDownloader = async (): Promise<void> => {
    let contents: DocxTemplateFormContents = {};
    // we are not mutating any observables here, just telling Mobx not to track this access
    runInAction(() => {
      contents = {
        ...toJS(
          resident.verifiedOpportunities.usMeFurloughRelease?.form?.formData,
        ),
      };
    });

    const { displayName } = resident;

    const fileNameFormatter = (
      filename: string,
      residentName: string,
    ): string => `${residentName} - ${startCase(filename)}`;

    const fileInputs: FileGeneratorArgs[] = [
      "furlough_leave_application",
      "furlough_pass_application",
      "furlough_disclosure",
      "furlough_program_agreement",
    ].map((filename) => {
      return [
        `${fileNameFormatter(filename, displayName)}.docx`,
        resident.stateCode,
        `${filename}.docx`,
        contents,
      ];
    });

    const pdfTemplateName = "furlough_program_review";

    if (!contents) return;

    const [pdfFileContents, docxFiles] = await Promise.all([
      fillPDF(
        resident.stateCode,
        `${pdfTemplateName}.pdf`,
        fillerFunc(contents),
        getTokenSilently,
      ),
      renderMultipleDocx(fileInputs, getTokenSilently),
    ]);

    downloadZipFile(`${resident.displayName} Furlough Release Packet.zip`, [
      {
        filename: `${fileNameFormatter(pdfTemplateName, displayName)}.pdf`,
        fileContents: pdfFileContents,
      },
      ...docxFiles,
    ]);
  };

  return (
    <FormContainer
      heading="Furlough Release Application"
      agencyName="MDOC"
      downloadButtonLabel="Download ZIP"
      onClickDownload={() => formDownloader()}
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
