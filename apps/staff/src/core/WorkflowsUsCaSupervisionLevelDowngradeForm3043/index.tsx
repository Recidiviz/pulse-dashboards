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
import { PDFForm } from "pdf-lib";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { UsCaSupervisionLevelDowngradeSharedDraftData } from "../../WorkflowsStore/Opportunity/UsCa";
import { FormContainer } from "../Paperwork/FormContainer";
import {
  fillAndSavePDF,
  fixRadioGroups,
  PDFFillerFunc,
  SetFunc,
} from "../Paperwork/PDFFormFiller";
import p1 from "./assets/p1.png";
import p2 from "./assets/p2.png";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const previewImages = [p1, p2];

const fillerFunc: PDFFillerFunc = async (
  formData: Partial<UsCaSupervisionLevelDowngradeSharedDraftData>,
  set: SetFunc,
  form?: PDFForm,
): Promise<void> => {
  if (!form) return Promise.resolve();

  set("CDCR #", formData.cdcNumber);
  set("SupervisedPersonsName Last FirstMIRow1", formData.fullName);
  set("Parole Unit", formData.unit);
  set("Supervision Level", formData.supervisionLevel);
  await fixRadioGroups(form);

  form.flatten();
};

const Form3043UsCaSupervisionLeveDowngrade = observer(
  function Form3043UsCaSupervisionLeveDowngrade({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const { getTokenSilently } = useRootStore();

    const onClickDownload = async () => {
      const formData = opportunity?.form?.formData;
      if (!formData) return;

      await fillAndSavePDF(
        `${opportunity.person.displayName} - CDCR 3043.pdf`,
        "US_CA",
        "CDCR3043.pdf",
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
        agencyName="CDCR"
        heading="Supervision Level Downgrade"
        onClickDownload={onClickDownload}
        downloadButtonLabel="Download PDF"
        opportunity={opportunity}
        dataProviso="Form 3043 is not currently editable in the tool. When downloaded some basic information will be pre-populated such as the client's name, CDCR #, parole unit, and current supervision level."
      >
        {previewImages.map((imageUrl, index) => (
          <FormPreviewPage
            key={imageUrl}
            src={imageUrl}
            alt={`CDCR 3043 form preview, page ${index + 1}`}
          />
        ))}
      </FormContainer>
    );
  },
);

export default Form3043UsCaSupervisionLeveDowngrade;
