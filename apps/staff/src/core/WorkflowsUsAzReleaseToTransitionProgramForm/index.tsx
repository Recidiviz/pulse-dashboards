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

import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { UsAzReleaseToTransitionProgramDraftData } from "../../WorkflowsStore/Opportunity/UsAz/UsAzReleaseToTransitionProgramBaseSchema";
import { FormContainer } from "../Paperwork/FormContainer";
import {
  fillAndSavePDF,
  PDFFillerFunc,
  SetFunc,
} from "../Paperwork/PDFFormFiller";
import previewImage from "./assets/ADCRR1001-11preview.png";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const fillerFunc: PDFFillerFunc = async (
  formData: Partial<UsAzReleaseToTransitionProgramDraftData>,
  set: SetFunc,
): Promise<void> => {
  set("Drug Transition Program", formData.isDTPRelease);
  set("Standard Transition Program", !formData.isDTPRelease);

  set("understand that by", formData.residentNameAndAdcNumber);
  set("INMATE NAME Last First MI Please Print", formData.residentNameLastFirst);
  set("ADCRR NUMBER", formData.adcNumber);
  set("Date1_af_date.0", formData.date);

  set(
    "STAFF VERIFICATION Last First MI Please Print",
    formData.staffNameLastFirst,
  );

  // TODO(#6873) fill in the employee ID if and when we receive this data
  set("Date1_af_date.1", formData.date);
};

const WorkflowsUsAzReleaseToTransitionProgramForm = observer(
  function WorkflowsUsAzReleaseToTransitionProgramForm({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const { getTokenSilently } = useRootStore();

    const onClickDownload = async () => {
      const formData = opportunity?.form?.formData;
      if (!formData) return;

      await fillAndSavePDF(
        `${opportunity.person.displayName} - Transition Program Agreement.pdf`,
        "US_AZ",
        "ADCRR1001-11.pdf",
        fillerFunc,
        formData,
        getTokenSilently,
      );
    };

    if (!opportunity) {
      return null;
    }
    return (
      <FormContainer
        agencyName="ADCRR"
        heading="Transition Program Application and Agreement"
        onClickDownload={onClickDownload}
        downloadButtonLabel="Download PDF"
        opportunity={opportunity}
        dataProviso="When downloaded, the transition program type, names, ADCRR #, and date will be filled in."
      >
        <FormPreviewPage
          src={previewImage}
          alt={`Transition Program Application and Agreement form preview`}
        />
      </FormContainer>
    );
  },
);

export default WorkflowsUsAzReleaseToTransitionProgramForm;
