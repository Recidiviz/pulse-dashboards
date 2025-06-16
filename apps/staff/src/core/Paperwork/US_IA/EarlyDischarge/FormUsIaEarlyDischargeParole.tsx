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
import React from "react";

import { Opportunity } from "../../../../WorkflowsStore";
import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage, PrintablePageMargin } from "../../styles";

const formDownloader = async (
  opportunity: UsIaEarlyDischargeOpportunity,
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
    `${client?.displayName} - CBC Discharge Report.docx`,
    client.stateCode,
    "cbc_discharge_report_template.docx",
    contents,
    client.rootStore.getTokenSilently,
  );
};
export const FormUsIaEarlyDischargeParole = observer(
  function FormUsIaEarlyDischargeParole({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

    if (!(opportunity instanceof UsIaEarlyDischargeOpportunity)) {
      return null;
    }

    return (
      <FormContainer
        heading={"Early Discharge from Parole"}
        agencyName={"IDOC"}
        downloadButtonLabel={"Download Form"}
        onClickDownload={async () => {
          formDownloader(opportunity);
        }}
        opportunity={opportunity}
      >
        <FormViewer formRef={formRef}>
          <PrintablePageMargin>
            <PrintablePage>
              <div>
                <h1>Iowa Early Discharge Form -- Parole</h1>
                <p>Form is still in development</p>
                <p>Access gated behing the FV usIaEarlyDischargeForms</p>
                <p>You can download a filled out form</p>
              </div>
            </PrintablePage>
          </PrintablePageMargin>
        </FormViewer>
      </FormContainer>
    );
  },
);
