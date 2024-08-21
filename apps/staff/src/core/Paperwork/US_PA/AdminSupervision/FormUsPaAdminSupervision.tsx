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

import { useRootStore } from "../../../../components/StoreProvider";
import { Client } from "../../../../WorkflowsStore";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import { FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY } from "./constants";
import CriteriaChecklist from "./CriteriaChecklist";
import Footer from "./Footer";
import FormClientDetails from "./FormClientDetails";
import FormHeading from "./FormHeading";
import OffenseHistoryChecklist from "./OffenseHistoryChecklist";
import SignOffSection from "./SignOffSection";

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

const formDownloader = async (client: Client): Promise<void> => {
  let contents: Record<string, unknown> = {};
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(
        client.verifiedOpportunities.usPaAdminSupervision?.form?.formData,
      ),
    };
  });

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
  function FormUsPaAdminSupervision() {
    const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

    const { workflowsStore } = useRootStore();
    const opportunity =
      workflowsStore?.selectedPerson?.verifiedOpportunities
        ?.usPaAdminSupervision;

    if (!opportunity) {
      return null;
    }

    const client = opportunity.person;

    return (
      <FormContainer
        heading="DC-P 402"
        agencyName="PDOC"
        onClickDownload={() => formDownloader(client)}
        opportunity={opportunity}
        downloadButtonLabel="Download DOCX"
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
                <Footer />
              </FormPage>
            </PrintablePage>
          </PrintablePageMargin>
        </FormViewer>
      </FormContainer>
    );
  },
);
