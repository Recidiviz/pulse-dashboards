// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import {
  Button,
  palette,
  Sans12,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { Resident } from "../../../../WorkflowsStore/Resident";
import { FormLastEdited } from "../../../FormLastEdited";
import {
  downloadMultipleZipped,
  FileGeneratorArgs,
} from "../../DOCXFormGenerator";
import { connectComponentToOpportunityForm } from "../../OpportunityFormContext";
import { REACTIVE_INPUT_UPDATE_DELAY } from "../../utils";
import { WebForm } from "../../WebForm";
import { WebFormFieldProps } from "../../WebFormField";

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} 0;
  border-bottom: 1px solid ${palette.marble5};
  margin-bottom: ${rem(spacing.lg)};
`;

const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const FormHeading = styled(Sans24)`
  color: ${palette.pine1};
`;

const FormContainer = styled.div`
  margin: 0 ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.xl)};
`;

const LastEditedMessage = styled(Sans12)`
  color: ${palette.slate85};
`;

const SCCPFormFields: WebFormFieldProps[] = [
  { name: "residentName", label: "Resident's Name" },
  { name: "mdocNo", label: "MDOC No." },
  { name: "facilityHousingUnit", label: "Facility/Housing Unit" },
  { name: "caseManager", label: "Case Manager" },
];

const formDownloader = async (resident: Resident): Promise<void> => {
  await new Promise((resolve) =>
    setTimeout(resolve, REACTIVE_INPUT_UPDATE_DELAY)
  );

  const { usMeSCCP } = resident.verifiedOpportunities;

  const contents = {
    ...toJS(usMeSCCP?.form?.formData),
  };

  const fileInputs: FileGeneratorArgs[] = [
    "SCCP_program_plan",
    "SCCP_warrantless_searches",
    "SCCP_extradition_waiver",
    "SCCP_disclosure",
  ].map((filename) => {
    return [
      `${resident.displayName} ${filename}.docx`,
      `${process.env.REACT_APP_API_URL}/api/${resident.stateCode}/workflows/templates?filename=${filename}.docx`,
      contents,
    ];
  });

  await downloadMultipleZipped(
    `${resident.displayName} SCCP Packet.zip`,
    fileInputs,
    resident.rootStore.getTokenSilently
  );
};

const Form = observer(function FormSCCP() {
  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore?.selectedPerson?.verifiedOpportunities?.usMeSCCP;

  const [isDownloading, setIsDownloading] = useState(false);

  if (!opportunity) {
    return null;
  }

  const resident = opportunity.person;

  return (
    <FormContainer>
      <FormHeader>
        <FormHeaderSection>
          <FormHeading>
            SCCP Program Plan
            <br />
            <LastEditedMessage>
              <FormLastEdited agencyName="MDOC" form={opportunity.form} />
            </LastEditedMessage>
          </FormHeading>
        </FormHeaderSection>
        <FormHeaderSection>
          <Button
            kind="primary"
            shape="block"
            disabled={isDownloading}
            onClick={async () => {
              setIsDownloading(true);
              await formDownloader(resident);
              setIsDownloading(false);
            }}
          >
            {isDownloading ? "Downloading..." : "Download .DOCX"}
          </Button>
        </FormHeaderSection>
      </FormHeader>
      <WebForm fields={SCCPFormFields} />
    </FormContainer>
  );
});

export const FormSCCP = connectComponentToOpportunityForm(Form, "usMeSCCP");
