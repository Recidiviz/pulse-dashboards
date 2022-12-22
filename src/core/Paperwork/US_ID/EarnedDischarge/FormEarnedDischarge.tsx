/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { FormContainer } from "../../FormContainer";
import { connectComponentToOpportunityForm } from "../../OpportunityFormContext";
import { DIMENSIONS_PX } from "../../PDFFormGenerator";

const FORM_FONT_FAMILY = `"Times New Roman", serif`;
const FORM_LINE_HEIGHT = 1.3;

const FormPage = styled.div`
  font-family: ${FORM_FONT_FAMILY};
  line-height: ${FORM_LINE_HEIGHT};
  letter-spacing: 0;
  font-size: ${rem(11)};
  color: black;
  background-color: white;
  box-sizing: content-box;

  min-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  padding: ${rem(18)};

  ol li {
    margin-bottom: ${rem(spacing.xs)};
  }
`;

const Form = observer(function FormEarnedDischarge() {
  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore?.selectedPerson?.verifiedOpportunities?.earnedDischarge;

  if (!opportunity) {
    return null;
  }

  return (
    <FormContainer
      heading="Earned Discharge"
      agencyName="IDOC"
      downloadButtonLabel="Download .DOCX"
      onClickDownload={async () => {
        /* do nothing for now */
      }}
      opportunity={opportunity}
    >
      <FormPage>Hi! I am a form. I will have more content later</FormPage>
    </FormContainer>
  );
});

export const FormEarnedDischarge = connectComponentToOpportunityForm(
  Form,
  "earnedDischarge"
);
