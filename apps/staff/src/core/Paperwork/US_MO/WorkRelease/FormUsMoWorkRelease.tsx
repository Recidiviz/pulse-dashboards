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
import styled from "styled-components";

import { Opportunity } from "../../../../WorkflowsStore";
import { FormContainer } from "../../FormContainer";
import p1 from "./assets/page1.png";
import p2 from "./assets/page2.png";
import p3 from "./assets/page3.png";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

export const FormUsMoWorkRelease = observer(function FormUsMoWorkRelease({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const oppName = opportunity.config.label;

  return (
    <FormContainer
      agencyName="MODOC"
      heading={`${oppName} Screening Form`}
      onClickDownload={async () => opportunity.form?.fillAndSaveFile()}
      downloadButtonLabel="Download Form"
      opportunity={opportunity}
    >
      {[p1, p2, p3].map((imageUrl, index) => (
        <FormPreviewPage
          key={imageUrl}
          src={imageUrl}
          alt={`Form preview, page ${index + 1}`}
        />
      ))}
    </FormContainer>
  );
});
