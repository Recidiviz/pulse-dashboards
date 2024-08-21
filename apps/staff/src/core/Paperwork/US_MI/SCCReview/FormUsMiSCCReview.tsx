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
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { FormBase } from "../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import FormFooter from "./FormFooter";
import FormGeneralInfo from "./FormGeneralInfo";
import FormHeading from "./FormHeading";
import FormHistory from "./FormHistory";
import FormInterviews from "./FormInterviews";
import FormReview from "./FormReview";
import FormSCCAction from "./FormSCCAction";
import FormTeamEvaluation from "./FormTeamEvaluation";

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
    form.person.stateCode,
    "scc_review_template.docx",
    contents,
    form.person.rootStore.getTokenSilently,
  );
  return;
};

export const FormUsMiSCCReview = observer(function FormUsMiSCCReview() {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const opportunityForm = useOpportunityFormContext();

  const { opportunity } = opportunityForm;

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
        <PrintablePageMargin>
          <PrintablePage>
            <FormPage>
              <FormHeading />
              <FormGeneralInfo />
              <FormHistory />
              <FormTeamEvaluation />
              <FormSCCAction />
              <FormReview />
              <FormInterviews />
              <FormFooter />
            </FormPage>
          </PrintablePage>
        </PrintablePageMargin>
      </FormViewer>
    </FormContainer>
  );
});
