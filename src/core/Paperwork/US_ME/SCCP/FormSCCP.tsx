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
import * as Sentry from "@sentry/react";
import { runInAction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
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
import p1 from "./assets/p1.png";
import p2 from "./assets/p2.png";
import p3 from "./assets/p3.png";
import p4 from "./assets/p4.png";
import p5 from "./assets/p5.png";
import p6 from "./assets/p6.png";

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.pine2};
  margin-bottom: ${rem(spacing.lg)};
`;

const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const FormHeading = styled(Sans24)`
  color: ${palette.marble1};
`;

const FormContainer = styled.div`
  background-color: ${palette.pine1};
  color: ${palette.marble1};
  min-height: 100vh;
  padding-bottom: ${rem(spacing.xl)};
`;

const LastEditedMessage = styled(Sans12)`
  color: ${palette.marble1};
  margin-top: ${rem(spacing.sm)};
`;

const DownloadButton = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})`
  background-color: ${rgba(palette.marble1, 0.1)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
`;

const FormPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)} 10%;
  width: 100%;
`;

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const previewImages = [p1, p2, p3, p4, p5, p6];

const formDownloader = async (resident: Resident): Promise<void> => {
  await new Promise((resolve) =>
    setTimeout(resolve, REACTIVE_INPUT_UPDATE_DELAY)
  );

  let contents: FileGeneratorArgs[2];
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(resident.verifiedOpportunities.usMeSCCP?.form?.formData),
    };
  });

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
          <div>
            <FormHeading>SCCP Program Plan</FormHeading>
            <LastEditedMessage>
              <FormLastEdited agencyName="MDOC" form={opportunity.form} />
            </LastEditedMessage>
          </div>
        </FormHeaderSection>
        <FormHeaderSection>
          <DownloadButton
            disabled={isDownloading}
            onClick={async () => {
              setIsDownloading(true);
              try {
                await formDownloader(resident);
              } catch (e) {
                Sentry.captureException(e);
              }
              setIsDownloading(false);
            }}
          >
            {isDownloading ? "Downloading..." : "Download .DOCX"}
          </DownloadButton>
        </FormHeaderSection>
      </FormHeader>
      <FormPreviewContainer>
        {previewImages.map((imageUrl, index) => (
          <FormPreviewPage
            key={imageUrl}
            src={imageUrl}
            alt={`SCCP Program Plan preview, page ${index + 1}`}
          />
        ))}
      </FormPreviewContainer>
    </FormContainer>
  );
});

export const FormSCCP = connectComponentToOpportunityForm(Form, "usMeSCCP");
