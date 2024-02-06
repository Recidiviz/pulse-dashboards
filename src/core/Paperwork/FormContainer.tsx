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

import {
  Button,
  palette,
  Sans12,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import { OpportunityBase } from "../../WorkflowsStore/Opportunity/OpportunityBase";
import { FormLastEdited } from "../FormLastEdited";
import { REACTIVE_INPUT_UPDATE_DELAY } from "./utils";

const FormHeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.pine2};
  margin-bottom: ${rem(spacing.lg)};
  position: sticky;
  top: 0;
  background-color: ${palette.pine1};
  z-index: 999;
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
  width: 70%;
`;

export const DownloadButton = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})`
  background-color: ${rgba(palette.marble1, 0.1)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  width: max-content;
`;

const FormContainerElement = styled.div`
  background-color: ${palette.pine1};
  color: ${palette.marble1};
  min-height: 100vh;
  height: 100%;
  padding-bottom: ${rem(spacing.xl)};
`;

const FormPreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)} 10%;
  width: 100%;
  height: 100%;
  background-color: ${palette.pine1};
`;

export type FormHeaderProps = {
  agencyName: string;
  dataProviso?: string;
  heading: string;
  isMissingContent?: boolean;
  onClickDownload: () => Promise<void>;
  downloadButtonLabel: string;
  opportunity: OpportunityBase<any, any>;
  children: React.ReactNode;
};

export const RevertButton = DownloadButton;

export const FormContainer = observer(function FormContainer({
  downloadButtonLabel,
  heading,
  isMissingContent,
  onClickDownload,
  agencyName,
  dataProviso,
  opportunity,
  children,
}: FormHeaderProps): React.ReactElement {
  const {
    form,
    rootStore: { firestoreStore },
  } = opportunity;
  const isDownloadButtonDisabled = isMissingContent || false;
  const { formRevertButton } = useFeatureVariants();

  if (!form) return <div />;

  const handleDownloadClick = async () => {
    form.markDownloading();

    // Wait for any inputs to save their state
    await new Promise((resolve) =>
      setTimeout(resolve, REACTIVE_INPUT_UPDATE_DELAY)
    );

    try {
      if (!isMissingContent) {
        await onClickDownload();
        form.recordSuccessfulDownload();
      }
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      form.formIsDownloading = false;
    }
  };

  const createDownloadLabel = (
    formIsDownloading: boolean,
    buttonIsDisabled: boolean | undefined
  ): string => {
    if (buttonIsDisabled) return "Download Unavailable";
    return formIsDownloading ? "Downloading..." : downloadButtonLabel;
  };

  return (
    <FormContainerElement>
      <FormHeaderBar>
        <FormHeaderSection>
          <div>
            <FormHeading>{heading}</FormHeading>
            <LastEditedMessage>
              <FormLastEdited
                agencyName={agencyName}
                dataProviso={dataProviso}
                form={form}
              />
            </LastEditedMessage>
          </div>
        </FormHeaderSection>
        <FormHeaderSection>
          {formRevertButton && form.allowRevert && (
            <RevertButton
              disabled={!form.formLastUpdated}
              className="WorkflowsFormRevertButton"
              onClick={() => firestoreStore.clearFormDraftData(form)}
            >
              Revert All Edits
            </RevertButton>
          )}
          <DownloadButton
            className="WorkflowsFormDownloadButton"
            disabled={isDownloadButtonDisabled || form.formIsDownloading}
            onClick={handleDownloadClick}
          >
            {createDownloadLabel(
              form.formIsDownloading,
              isDownloadButtonDisabled
            )}
          </DownloadButton>
        </FormHeaderSection>
      </FormHeaderBar>
      <FormPreviewContainer>{children}</FormPreviewContainer>
    </FormContainerElement>
  );
});
