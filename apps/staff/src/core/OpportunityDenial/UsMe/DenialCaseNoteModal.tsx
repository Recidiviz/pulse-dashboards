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

import { animation, Button, Icon, Modal, Sans24, spacing } from "@recidiviz/design-system";
import { startOfToday } from "date-fns";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import useCopyClipboard from "react-use-clipboard";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { formatDate, formatDateToISO } from "../../../utils";
import { DenialConfirmationModalProps } from "../DenialConfirmationModals";

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.xl)};
    max-width: 85vw;
    width: ${rem(600)};
    display: flex;
    flex-direction: column;
  }
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

const NotePreview = styled.article`
  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate30};
  color: ${palette.pine1};
  line-height: ${rem(18)};
  padding: ${rem(spacing.md)} ${rem(spacing.lg)};
  white-space: pre;
  max-width: ${rem(960)};
`;

const ModalButton = styled(Button)`
  margin: 0.75rem 0;
`;

export const DenialCaseNoteModal = observer(function DenialCaseNoteModal({
  opportunity,
  reasons,
  otherReason,
  snoozeUntilDate: maybeSnoozeUntilDate,
  showModal,
  onCloseFn,
  onSuccessFn,
  onAlternativeSubmissionFn,
}: DenialConfirmationModalProps) {
  const {
    workflowsStore: { currentUserEmail },
    analyticsStore,
  } = useRootStore();
  const { usMeCaseNoteSnooze } = useFeatureVariants();

  // Bypass if user doesn't have the FV
  useEffect(() => {
    if (showModal && !usMeCaseNoteSnooze) onSuccessFn();
  });

  const snoozeUntilDate =
    reasons.length === 0 || !maybeSnoozeUntilDate
      ? startOfToday()
      : maybeSnoozeUntilDate;

  // If you make changes here, ensure they're reflected in usMeDenialMetadataSchema (just camelCased)
  const noteText = JSON.stringify(
    {
      is_recidiviz_snooze_note: true,
      person_external_id: opportunity.person.displayId,
      opportunity_type: opportunity.type,
      officer_email: currentUserEmail,
      start_date: formatDateToISO(startOfToday()),
      end_date: formatDateToISO(snoozeUntilDate),
      denial_reasons: reasons,
      other_text: otherReason,
    },
    null,
    4,
  );

  const [justCopied, copyToClipboard] = useCopyClipboard(noteText, {
    successDuration: animation.extendedDurationMs,
  });

  const [hasCopied, setHasCopied] = useState(false);
  useEffect(() => {
    if (showModal) setHasCopied(false);
  }, [showModal]);

  const onClickCopy = () => {
    copyToClipboard();
    setHasCopied(true);
  };

  const onClickSubmitted = () => {
    analyticsStore.trackOpportunitySnoozeCaseNoteCopied({
      opportunityType: opportunity.type,
      opportunityStatus: opportunity.reviewStatus,
      justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
      snoozeUntil: formatDateToISO(snoozeUntilDate),
      reasons,
      opportunityId: opportunity.sentryTrackingId,
    });
    onAlternativeSubmissionFn();
  };

  return (
    <StyledModal isOpen={showModal} onRequestClose={onCloseFn}>
      <ModalControls>
        <Button kind="link" onClick={onCloseFn}>
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalControls>
      <ModalTitle>Copy the note below into CORIS</ModalTitle>
      You must copy & paste this exact text in the case note in CORIS.
      <NotePreview>{noteText}</NotePreview>
      <ModalButton kind="primary" shape="block" onClick={onClickCopy}>
        {justCopied ? "Note Copied!" : "Copy Note"}
      </ModalButton>
      Note: Once the case note is created in CORIS, within 1-2 days this client
      will be automatically moved to 'Marked Ineligible' status.{" "}
      {opportunity.person.displayName} may be surfaced again on or after{" "}
      {formatDate(snoozeUntilDate)}.
      {hasCopied && (
        <ModalButton kind="primary" shape="block" onClick={onClickSubmitted}>
          I Have Created the Case Note in CORIS
        </ModalButton>
      )}
    </StyledModal>
  );
});
