// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import p1 from "~shared-assets/images/form-previews/US_TN/SDS/p1.png";
import p2 from "~shared-assets/images/form-previews/US_TN/SDS/p2.png";

import {
  Opportunity,
  UsTnSuspensionOfDirectSupervisionOpportunity,
} from "../../../../WorkflowsStore";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const previewImages = [p1, p2];

const formDownloader = async (
  opportunity: UsTnSuspensionOfDirectSupervisionOpportunity,
): Promise<void> => {
  let contents: Record<string, unknown> = {};
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(opportunity?.form?.formData),
    };
  });

  const client = opportunity.person;
  await downloadSingle(
    `${client?.displayName} - CR4044.docx`,
    client.stateCode,
    "CR4044_template.docx",
    contents,
    client.rootStore.getTokenSilently,
  );
};

export const FormUsTnSuspensionOfDirectSupervision = observer(
  function FormUsTnSuspensionOfDirectSupervision({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    if (
      !(opportunity instanceof UsTnSuspensionOfDirectSupervisionOpportunity)
    ) {
      return null;
    }

    return (
      <FormContainer
        heading="Direct Supervision Suspension Request"
        agencyName="TDOC"
        downloadButtonLabel="Download .DOCX"
        onClickDownload={() => formDownloader(opportunity)}
        opportunity={opportunity}
        dataProviso="When downloaded some basic information will be pre-populated such as the client's name, district, and conviction information."
      >
        {previewImages.map((imageUrl, index) => (
          <FormPreviewPage
            key={imageUrl}
            src={imageUrl}
            alt={`CR4044 preview, page ${index + 1}`}
          />
        ))}
      </FormContainer>
    );
  },
);
