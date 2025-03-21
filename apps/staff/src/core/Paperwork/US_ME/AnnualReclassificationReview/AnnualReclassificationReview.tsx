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

import { Opportunity } from "../../../../WorkflowsStore";
import { UsMeAnnualReclassificationReviewData } from "../../../../WorkflowsStore/Opportunity/Forms/UsMeAnnualReclassificationReviewForm";
import { UsMeAnnualReclassificationOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMe/UsMeAnnualReclassificationOpportunity";
import { FileGeneratorArgs, renderMultipleDocx } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import { downloadZipFile } from "../../utils";
import p1 from "./assets/p1.png";
import p2 from "./assets/p2.png";
import p3 from "./assets/p3.png";
import p4 from "./assets/p4.png";
import p5 from "./assets/p5.png";
const previewImages = [p1, p2, p3, p4, p5];
const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const formDownloader = async (
  opportunity: UsMeAnnualReclassificationOpportunity,
): Promise<void> => {
  let contents: Partial<UsMeAnnualReclassificationReviewData> = {};

  const { displayName, stateCode, rootStore } = opportunity.person;

  runInAction(() => {
    contents = {
      ...toJS(opportunity?.form?.formData),
    };
  });

  const fileInputs: FileGeneratorArgs[] = [
    "classification_review_form",
    "48_hour_notice_of_classification_review",
  ].map((filename) => {
    return [
      `${displayName} - ${startCase(filename)}.docx`,
      stateCode,
      `${filename}.docx`,
      contents,
    ];
  });

  downloadZipFile(`${displayName} Classification Review Packet.zip`, [
    ...(await renderMultipleDocx(fileInputs, rootStore.getTokenSilently)),
  ]);
};

function AnnualClassificationReview({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  if (!(opportunity instanceof UsMeAnnualReclassificationOpportunity)) {
    return null;
  }

  return (
    <FormContainer
      heading="Classification Review Packet"
      agencyName="MDOC"
      downloadButtonLabel="Download ZIP"
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

export default observer(AnnualClassificationReview);
