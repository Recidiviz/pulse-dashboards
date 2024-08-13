/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { Client, JusticeInvolvedPerson } from "../../../../WorkflowsStore";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import { DIMENSIONS_PX } from "../../PDFFormGenerator";
import { useResizeForm } from "../../utils";
import { FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY } from "./FormComponents";
import { FormCrimeTable } from "./FormCrimeTable";
import { FormFeesTable } from "./FormFeesTable";
import FormHeading from "./FormHeading";
import { FormLsirTable } from "./FormLsirTable";
import FormPrompts from "./FormPrompts";
import { FormStaticContent } from "./FormStaticContent";
import { FormSummarySection } from "./FormSummarySection";

const FORM_LINE_HEIGHT = 0.9;

const FormPage = styled.div`
  font-family: ${FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY};
  line-height: ${FORM_LINE_HEIGHT};
  display: flex;
  flex-direction: column;
  font-size: ${rem(9)};
  color: black;
  background-color: white;
  box-sizing: content-box;

  min-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  padding: ${rem(24)} ${rem(32)};

  & > * {
    margin-bottom: 0.5rem;
  }
`;

const FormTransformContainer = styled.section`
  transform-origin: 0 0;
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
`;

const formDownloader = async (client: Client): Promise<void> => {
  const contents = {
    ...toJS(
      client.verifiedOpportunities.earnedDischarge?.form?.prepareDataForTemplate(),
    ),
  };

  await downloadSingle(
    `${client.displayName} Earned Discharge Application.docx`,
    client.stateCode,
    "earned_discharge_template.docx",
    contents,
    client.rootStore.getTokenSilently,
  );
};

export const FormEarnedDischarge = observer(function FormEarnedDischarge({
  person: client,
}: {
  person?: JusticeInvolvedPerson;
}) {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const { resize } = useResizeForm(formRef, `${FormTransformContainer}`);

  const opportunity = client?.verifiedOpportunities?.earnedDischarge;

  if (!opportunity || !(client instanceof Client)) {
    return null;
  }

  return (
    <FormContainer
      heading="Earned Discharge"
      agencyName="IDOC"
      downloadButtonLabel="Download .DOCX"
      onClickDownload={async () => formDownloader(client)}
      opportunity={opportunity}
    >
      <div
        ref={formRef}
        onClickCapture={() => resize()}
        onKeyDownCapture={() => resize()}
        onChangeCapture={() => resize()}
      >
        <FormPrompts opportunity={opportunity} />
        <FormTransformContainer>
          <FormPage>
            <FormHeading />
            <FormSummarySection />
            <FormCrimeTable />
            <FormFeesTable />
            <FormLsirTable />
            <FormStaticContent />
          </FormPage>
        </FormTransformContainer>
      </div>
    </FormContainer>
  );
});
