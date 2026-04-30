// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { Opportunity } from "../../../../WorkflowsStore";
import { FormBase } from "../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage } from "../../styles";
import FormFooter from "../SCCReview/FormFooter";
import FormHistory from "../SCCReview/FormHistory";
import FormInterviews from "../SCCReview/FormInterviews";
import FormReview from "../SCCReview/FormReview";
import FormHeadingV2 from "../SCCReviewV2/FormHeadingV2";
import sccReviewTemplate from "../SCCReviewV2/scc_review_template_v2.docx";
import FormCommunicationMethod from "./FormCommunicationMethod";
import FormGeneralInfoV2 from "./FormGeneralInfoV2";
import FormSCCActionV2 from "./FormSCCActionV2";
import FormTeamEvaluationV2 from "./FormTeamEvaluationV2";

const FormPage = styled.div`
  font-family: "Arial";
  display: flex;
  height: 100%;
  flex-direction: column;
  font-size: ${rem(9)};
  color: black;
  background-color: white;
`;

const formDownloader = async (
  form: FormBase<Record<string, any>>,
): Promise<void> => {
  let contents: Record<string, unknown> = {};
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(form.formData),
    };
  });

  // Extra fields to distingish a checked `NO` from no check
  contents.participatedNo = contents.participated === false;
  contents.sccStopNo = contents.sccStop === false;
  contents.wardenApprovalNo = contents.wardenApproval === false;

  await downloadSingle(
    `${form.person?.displayName} - Form 283.docx`,
    sccReviewTemplate,
    contents,
  );
  return;
};

export const FormUsMiSCCReviewV2 = observer(function FormUsMiSCCReviewV2({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const formRef = React.useRef<HTMLDivElement>(null);

  const opportunityForm = useOpportunityFormContext();

  if (!opportunity) {
    return null;
  }

  return (
    <FormContainer
      heading="283 Form"
      agencyName="MDOC"
      onClickDownload={() => formDownloader(opportunityForm)}
      opportunity={opportunity}
      downloadButtonLabel="Download as .DOCX"
    >
      <FormViewer formRef={formRef}>
        <PrintablePage>
          <FormPage>
            <FormHeadingV2 />
            <FormGeneralInfoV2 />
            <FormHistory />
            <FormTeamEvaluationV2 />
            <FormSCCActionV2 />
            <FormReview />
            <FormInterviews />
            <FormCommunicationMethod />
            <FormFooter />
          </FormPage>
        </PrintablePage>
      </FormViewer>
    </FormContainer>
  );
});
