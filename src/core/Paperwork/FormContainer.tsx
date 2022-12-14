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

import {
  Button,
  palette,
  Sans12,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { rem, rgba } from "polished";
import { useState } from "react";
import styled from "styled-components/macro";

import { OpportunityBase } from "../../WorkflowsStore/Opportunity/OpportunityBase";
import { FormLastEdited } from "../FormLastEdited";

const FormHeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.pine2};
  margin-bottom: ${rem(spacing.lg)};
  position: sticky;
  top: 0;
  background-color: ${palette.pine1};
`;

const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const FormHeading = styled(Sans24)`
  color: ${palette.marble1};
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

const FormContainerElement = styled.div`
  background-color: ${palette.pine1};
  color: ${palette.marble1};
  min-height: 100vh;
  padding-bottom: ${rem(spacing.xl)};
`;

const FormPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)} 10%;
  width: 100%;
`;

type FormHeaderProps = {
  agencyName: string;
  heading: string;
  onClickDownload: () => Promise<void>;
  downloadButtonLabel: string;
  opportunity: OpportunityBase<any, any>;
  children: React.ReactNode;
};

export const FormContainer = ({
  downloadButtonLabel,
  heading,
  onClickDownload,
  agencyName,
  opportunity,
  children,
}: FormHeaderProps): React.ReactElement => {
  const [isDownloading, setIsDownloading] = useState(false);

  return (
    <FormContainerElement>
      <FormHeaderBar>
        <FormHeaderSection>
          <div>
            <FormHeading>{heading}</FormHeading>
            <LastEditedMessage>
              <FormLastEdited agencyName={agencyName} form={opportunity.form} />
            </LastEditedMessage>
          </div>
        </FormHeaderSection>
        <FormHeaderSection>
          <DownloadButton
            disabled={isDownloading}
            onClick={async () => {
              setIsDownloading(true);
              try {
                await onClickDownload();
              } catch (e) {
                Sentry.captureException(e);
              }
              setIsDownloading(false);
            }}
          >
            {isDownloading ? "Downloading..." : downloadButtonLabel}
          </DownloadButton>
        </FormHeaderSection>
      </FormHeaderBar>
      <FormPreviewContainer>{children}</FormPreviewContainer>
    </FormContainerElement>
  );
};
