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
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { Opportunity } from "../../../../WorkflowsStore";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage } from "../../styles";

const FormPage = styled.div`
  font-family: "Arial";
  display: flex;
  height: 100%;
  flex-direction: column;
  font-size: ${rem(9)};
  color: black;
  background-color: white;
`;

export const FormUsTnInitialClassification2026 = observer(
  function FormUsTnInitialClassification2026({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

    return (
      <FormContainer
        heading="Form heading"
        agencyName="TDOC"
        onClickDownload={async () => alert("Download clicked")}
        opportunity={opportunity}
        downloadButtonLabel="Download as .DOCX"
      >
        <FormViewer formRef={formRef}>
          <PrintablePage landscape>
            <FormPage>I am a page</FormPage>
          </PrintablePage>
        </FormViewer>
      </FormContainer>
    );
  },
);
