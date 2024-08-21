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

import {
  Button,
  Icon,
  Loading,
  Modal,
  palette,
  Sans16,
  Sans24,
  spacing,
  typography,
} from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { startOfToday } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components/macro";

import AcknowledgementCheckbox from "../../../../src/components/Checkbox";
import { useRootStore } from "../../../components/StoreProvider";
import { formatDateToISO, formatWorkflowsDate } from "../../../utils";
import {
  Client,
  DenialConfirmationModalProps,
  Opportunity,
} from "../../../WorkflowsStore";
import { OTHER_KEY } from "../../../WorkflowsStore/utils";

const Acknowledgement = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: ${rem(spacing.lg)};
`;

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.xl)};
    max-width: 85vw;
    width: ${rem(600)};
    display: flex;
    flex-direction: column;
  }
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const ModalTitle = styled(Sans24)`
  color: ${palette.pine1};
  padding: ${rem(spacing.md)} ${rem(spacing.xl)};
  text-align: center;
`;

const ModalControls = styled.div`
  padding: 0 0 ${rem(spacing.sm)};
  text-align: right;
`;

const ActionButton = styled(Button).attrs({ kind: "primary", shape: "block" })`
  margin: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
  flex: none;
`;

const ModalText = styled(Sans16)`
  color: ${palette.slate80};
  margin: ${rem(spacing.sm)} 0;
`;

const ConfirmationContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  align-items: stretch;
`;

const ConfirmationLabel = styled.dt`
  ${typography.Sans16}
  color: rgba(53, 83, 98, 0.5);
  margin-bottom: ${rem(spacing.xs)};
`;

const ConfirmationField = styled.dd.attrs({ className: "fs-exclude" })`
  ${typography.Sans16}
  color: rgba(53, 83, 98, 0.9);
`;

type JustificationReason = { code: string; description: string };

export function buildJustificationReasons(
  opportunity: Opportunity,
  reasons: string[],
  otherReason: string,
): JustificationReason[] {
  const out: JustificationReason[] = [];
  Object.entries(opportunity.config.denialReasons).forEach(
    ([code, description]) => {
      if (reasons.includes(code)) {
        out.push({
          code,
          description: code === OTHER_KEY ? otherReason : description,
        });
      }
    },
  );
  return out;
}

const createDocstarsRequestBody = (
  opportunity: Opportunity,
  userEmail: string,
  reasons: string[],
  otherReason: string,
  snoozeUntilDate: Date,
) => ({
  personExternalId: opportunity.person.externalId,
  userEmail,
  earlyTerminationDate: formatDateToISO(snoozeUntilDate),
  justificationReasons: buildJustificationReasons(
    opportunity,
    reasons,
    otherReason,
  ),
});

export const DocstarsDenialModal = observer(function DocstarsDenialModal({
  opportunity,
  reasons,
  otherReason,
  snoozeUntilDate: maybeSnoozeUntilDate,
  showModal,
  onCloseFn,
  onSuccessFn,
}: DenialConfirmationModalProps) {
  const {
    apiStore,
    firestoreStore,
    userStore: { stateCode: userStateCode },
    workflowsStore: { currentUserEmail, featureVariants },
  } = useRootStore();

  const snoozeUntilDate =
    reasons.length === 0 || !maybeSnoozeUntilDate
      ? startOfToday()
      : maybeSnoozeUntilDate;

  useEffect(() => {
    if (!featureVariants.usNdWriteToDocstars && showModal) onSuccessFn();
  });

  // Rather than using opportunity.omsSnoozeStatus directly, we keep track
  // of our own status, with a defined set of allowable transitions.
  const [phase, setPhase] = useState<
    "REVIEWING" | "SUBMITTED" | "FAILED" | "SUCCEEDED"
  >("REVIEWING");

  const [isAcknowledgementChecked, setIsAcknowledgementChecked] =
    useState(false);

  const handleAcknowledgementCheckboxChange = () => {
    setIsAcknowledgementChecked(!isAcknowledgementChecked);
  };

  // Whenever the modal opens, reset to REVIEWING
  useEffect(() => {
    if (showModal) setPhase("REVIEWING");
  }, [showModal]);

  useEffect(() => {
    const { omsSnoozeStatus } = opportunity;
    // phase is set to SUMBITTED inside onSubmitButtonClick after
    // omsSnoozeStatus is set to PENDING
    if (phase === "SUBMITTED" && omsSnoozeStatus === "FAILURE")
      setPhase("FAILED");
    else if (phase === "SUBMITTED" && omsSnoozeStatus === "SUCCESS") {
      setPhase("SUCCEEDED");
      toast("Note successfully synced to DOCSTARS");
      onSuccessFn();
    }
  }, [opportunity, phase, onSuccessFn]);

  const onSubmitButtonClick = async () => {
    const submittedTimestamp = Timestamp.fromDate(new Date());

    await firestoreStore.updateOmsSnoozeStatus(
      opportunity,
      currentUserEmail,
      userStateCode,
      opportunity.person.recordId,
      formatDateToISO(snoozeUntilDate),
      submittedTimestamp,
      "PENDING",
    );

    setPhase("SUBMITTED");

    const requestBody = createDocstarsRequestBody(
      opportunity,
      currentUserEmail,
      reasons,
      otherReason,
      snoozeUntilDate,
    );

    try {
      await apiStore.post(
        `${import.meta.env.VITE_NEW_BACKEND_API_URL}/workflows/external_request/${opportunity.person.stateCode}/update_docstars_early_termination_date`,
        requestBody,
      );
    } catch (e) {
      firestoreStore.updateOmsSnoozeStatus(
        opportunity,
        currentUserEmail,
        userStateCode,
        opportunity.person.recordId,
        formatDateToISO(snoozeUntilDate),
        submittedTimestamp,
        "FAILURE",
        (e as Error)?.message,
      );
      Sentry.captureException(e);
    }
  };

  const closeButtonControls = (
    <ModalControls>
      <Button kind="link" onClick={onCloseFn}>
        <Icon kind="Close" size="14" color={palette.pine2} />
      </Button>
    </ModalControls>
  );

  const submissionModal = (
    <div data-testid="docstars-confirmation-screen">
      {closeButtonControls}
      <ConfirmationContainer>
        <ModalTitle>Confirm DOCSTARS Note</ModalTitle>
        <dl>
          <ConfirmationLabel>Client Name</ConfirmationLabel>{" "}
          <ConfirmationField>
            {opportunity.person.displayPreferredName}
          </ConfirmationField>
          <ConfirmationLabel>Client ID</ConfirmationLabel>{" "}
          <ConfirmationField>{opportunity.person.externalId}</ConfirmationField>
          <ConfirmationLabel>Supervision End Date</ConfirmationLabel>
          <ConfirmationField>
            {formatWorkflowsDate((opportunity.person as Client).expirationDate)}
          </ConfirmationField>
          <ConfirmationLabel>New Early Termination Date</ConfirmationLabel>
          <ConfirmationField>
            {formatWorkflowsDate(snoozeUntilDate)}
          </ConfirmationField>
          <ConfirmationLabel>Justification Reasons</ConfirmationLabel>
          <ConfirmationField>
            <ul>
              {buildJustificationReasons(opportunity, reasons, otherReason).map(
                ({ code, description }) => (
                  <li key={code}>
                    {code}: {description}
                  </li>
                ),
              )}
            </ul>
          </ConfirmationField>
          <ConfirmationLabel>Staff ID</ConfirmationLabel>{" "}
          <ConfirmationField>{currentUserEmail}</ConfirmationField>
        </dl>
        {featureVariants.usNdCheckboxDocstars && (
          <Acknowledgement>
            <AcknowledgementCheckbox
              name={"acknowledgement-checkbox"}
              checked={isAcknowledgementChecked}
              value={"acknowledgement-checkbox"}
              onChange={handleAcknowledgementCheckboxChange}
            />
            <Sans16>
              By clicking this box, I confirm that I have consulted with my
              direct supervisor regarding the client's ineligibility for early
              termination due to the reasons indicated on the previous screen.
            </Sans16>
          </Acknowledgement>
        )}
        <ActionButton
          data-testid="docstars-submit-button"
          onClick={onSubmitButtonClick}
          disabled={
            featureVariants.usNdCheckboxDocstars
              ? !isAcknowledgementChecked
              : false
          }
        >
          Acknowledge and Save to DOCSTARS
        </ActionButton>
      </ConfirmationContainer>
    </div>
  );

  const loadingModal = (
    <CenteredContainer data-testid="docstars-loading-screen">
      {/* Styled components don't seem to work with <Loading>, which expands to fill all available area.
      Put a non-flex div around it to reduce the size of the container it's filling. */}
      <div>
        <Loading showMessage={false} />
      </div>
      <ModalTitle>Syncing note to DOCSTARS...</ModalTitle>
      <ModalText>Do not refresh the page.</ModalText>
    </CenteredContainer>
  );

  const failureModal = (
    <div data-testid="docstars-failure-screen" style={{ width: "100%" }}>
      {closeButtonControls}
      <CenteredContainer>
        <ModalTitle>
          Currently unable to save your change and add chrono to DOCSTARS.
        </ModalTitle>
        <ModalText>Please try again later.</ModalText>
      </CenteredContainer>
    </div>
  );

  const modalContent: Record<typeof phase, JSX.Element> = {
    REVIEWING: submissionModal,
    SUBMITTED: loadingModal,
    SUCCEEDED: loadingModal, // Continue to show loader as the modal fades out
    FAILED: failureModal,
  };

  return (
    <StyledModal isOpen={showModal} onRequestClose={onCloseFn}>
      {modalContent[phase]}
    </StyledModal>
  );
});
