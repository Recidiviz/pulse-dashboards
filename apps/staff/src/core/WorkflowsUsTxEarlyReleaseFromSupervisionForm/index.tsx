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

import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { UsTxEarlyReleaseFromSupervisionOpportunity } from "../../WorkflowsStore/Opportunity/UsTx/UsTxEarlyReleaseFromSupervisionOpportunity/UsTxEarlyReleaseFromSupervisionOpportunity";
import { UsTxEarlyReleaseFromSupervisionDraftData } from "../../WorkflowsStore/Opportunity/UsTx/UsTxEarlyReleaseFromSupervisionOpportunityReferralRecord";
import { FormContainer } from "../Paperwork/FormContainer";
import {
  fillAndSavePDF,
  PDFFillerFunc,
  SetFunc,
} from "../Paperwork/PDFFormFiller";
import previewImage from "./assets/ERS-Checklist-preview.png";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const fillerFunc: PDFFillerFunc = async (
  formData: Partial<UsTxEarlyReleaseFromSupervisionDraftData>,
  set: SetFunc,
): Promise<void> => {
  set("{clientName}", formData.clientName);
  set("{clientId}", formData.clientId);
  set("{eligibilityMonth}", formData.eligibilityMonthString);
  set("{Y1}", formData.atLeastHalfTimeCheck);
  set("{Y2}", formData.minimumThreeYearsSupervisionCheck);
  set("{Y3}", formData.goodFaithFeesAndEducationCheck);
  set("{Y4}", formData.restitutionObligationsCheck);
  set("{Y5}", formData.warrantCheck);
  set("{Y6}", formData.noViolationsCertificateCheck);
  set("{Y7}", formData.societyBestInterestCheck);
  set("{officerName}", formData.officerName);
};

const WorkflowsUsTxEarlyReleaseFromSupervisionForm = observer(
  function WorkflowsUsTxEarlyReleaseFromSupervisionForm({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const { getTokenSilently } = useRootStore();

    if (!(opportunity instanceof UsTxEarlyReleaseFromSupervisionOpportunity)) {
      return null;
    }

    const onClickDownload = async () => {
      const formData = opportunity.form.formData;
      if (!formData) return;

      await fillAndSavePDF(
        `${opportunity.person.displayName} - Early Release From Supervision Form.pdf`,
        "US_TX",
        "ERSChecklist.pdf",
        fillerFunc,
        formData,
        getTokenSilently,
      );
    };

    return (
      <FormContainer
        agencyName="TDCJ"
        heading={opportunity.config.label}
        onClickDownload={onClickDownload}
        downloadButtonLabel="Download Form"
        opportunity={opportunity}
      >
        <FormPreviewPage
          src={previewImage}
          alt={`Early Release From Supervision Form preview`}
        ></FormPreviewPage>
      </FormContainer>
    );
  },
);

export default WorkflowsUsTxEarlyReleaseFromSupervisionForm;
