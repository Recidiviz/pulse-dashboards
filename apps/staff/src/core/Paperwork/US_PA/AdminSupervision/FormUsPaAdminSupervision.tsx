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

import { Opportunity } from "../../../../WorkflowsStore";
import { UsPaAdminSupervisionOpportunity } from "../../../../WorkflowsStore/Opportunity/UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionOpportunity";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import {
  FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY,
  strings,
  worksheetSectionsCopy,
} from "./constants";
import CriteriaChecklist from "./CriteriaChecklist";
import Footer from "./Footer";
import FormClientDetails from "./FormClientDetails";
import FormHeading from "./FormHeading";
import OffenseHistoryChecklist from "./OffenseHistoryChecklist";
import SignOffSection from "./SignOffSection";
import WorksheetHeader from "./WorksheetHeader";
import WorksheetSection from "./WorksheetSection";

const FormPage = styled.div`
  font-family: ${FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY};
  display: flex;
  height: 100%;
  justify-content: space-between;
  flex-direction: column;
  font-size: ${rem(9)};
  color: black;
  background-color: white;
  padding: 0 ${rem(18)};
`;

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const formDownloader = async (
  opportunity: UsPaAdminSupervisionOpportunity,
): Promise<void> => {
  let contents: Record<string, unknown> = {};
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(opportunity?.form?.formData),
    };
  });

  const client = opportunity.person;

  // Extra fields to distingish a checked `NO` from no check
  contents.criteriaHighSanctionNo = contents.criteriaHighSanction === false;
  contents.criteriaFulfilledTreatmentRequirementsNo =
    contents.criteriaFulfilledTreatmentRequirements === false;
  contents.criteriaFulfilledSpecialConditionsNo =
    contents.criteriaFulfilledSpecialConditions === false;
  contents.criteriaFinancialEffortsNo =
    contents.criteriaFinancialEfforts === false;
  contents.unreportedDispositionsNo = contents.unreportedDispositions === false;
  contents.eligibleForAdministrativeParoleNo =
    contents.eligibleForAdministrativeParole === false;

  await downloadSingle(
    `${client?.displayName} - Form DC-P 402.docx`,
    client.stateCode,
    "admin_supervision_template.docx",
    contents,
    client.rootStore.getTokenSilently,
  );
};

export const FormUsPaAdminSupervision = observer(
  function FormUsPaAdminSupervision({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

    if (
      !opportunity ||
      !(opportunity instanceof UsPaAdminSupervisionOpportunity)
    ) {
      return null;
    }

    const showProviso = opportunity.record?.formInformation?.drugCharge;

    const client = opportunity.person;

    return (
      <FormContainer
        heading="DC-P 402"
        agencyName="PDOC"
        onClickDownload={() => formDownloader(opportunity)}
        opportunity={opportunity}
        downloadButtonLabel="Download DOCX"
        dataProviso={
          showProviso
            ? `${client.displayName} is serving a drug offense that may be eligible for Administrative Supervision. Fill out both the 402 and 402a forms.`
            : undefined
        }
      >
        <FormViewer formRef={formRef}>
          <PrintablePageMargin>
            <PrintablePage>
              <FormPage>
                <FormContent>
                  <FormHeading />
                  <FormClientDetails />
                  <OffenseHistoryChecklist />
                  <CriteriaChecklist />
                  <SignOffSection />
                </FormContent>
                <Footer text={strings.footer} />
              </FormPage>
            </PrintablePage>
          </PrintablePageMargin>
          <PrintablePageMargin>
            <PrintablePage>
              <FormPage>
                <FormContent>
                  <WorksheetHeader />
                  {worksheetSectionsCopy.map((section) => {
                    return (
                      <WorksheetSection
                        key={section.sectionNumber}
                        {...section}
                      />
                    );
                  })}
                </FormContent>
                <Footer text={strings.addendumFooter} />
              </FormPage>
            </PrintablePage>
          </PrintablePageMargin>
        </FormViewer>
      </FormContainer>
    );
  },
);
