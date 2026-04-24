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
import React from "react";

import { Opportunity } from "../../../../WorkflowsStore";
import { UsNcCreditReductionReviewDraftData } from "../../../../WorkflowsStore/Opportunity/Forms/UsNcCreditReductionReviewForm";
import { UsNcCreditReductionReviewOpportunity } from "../../../../WorkflowsStore/Opportunity/UsNc/UsNcCreditReductionReviewOpportunity";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage } from "../../styles";
import form183Template from "./form183_template.docx";
import FormBody from "./FormBody";
import FormHeading from "./FormHeading";

const formDownloader = async (
  opportunity: UsNcCreditReductionReviewOpportunity,
): Promise<void> => {
  let contents: Partial<UsNcCreditReductionReviewDraftData> = {};
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(opportunity?.form?.formData),
    };
  });

  const client = opportunity.person;

  // Extra fields to distingish a checked `NO` from no check
  contents.no1 = contents.yn1 === false;
  contents.no2 = contents.yn2 === false;
  contents.no3 = contents.yn3 === false;
  contents.no4 = contents.yn4 === false;
  contents.neg = contents.np === false;

  await downloadSingle(
    `${client?.displayName} - Form DCS-183.docx`,
    form183Template,
    {
      ...contents,
    },
  );
};

export const FormUsNcCreditReductionReview = observer(
  function FormUsNcCreditReductionReview({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef<HTMLDivElement>(null);
    if (!(opportunity instanceof UsNcCreditReductionReviewOpportunity)) {
      return null;
    }

    return (
      <FormContainer
        agencyName="OPUS"
        heading="Form DCS-183"
        onClickDownload={() => formDownloader(opportunity)}
        downloadButtonLabel="Download .DOCX"
        opportunity={opportunity}
      >
        <FormViewer formRef={formRef}>
          <PrintablePage>
            <FormHeading />
            <FormBody />
            {/* TODO(#obt4602): add signature component */}
          </PrintablePage>
        </FormViewer>
      </FormContainer>
    );
  },
);
