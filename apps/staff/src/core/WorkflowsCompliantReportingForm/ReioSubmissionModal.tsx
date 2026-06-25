// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Loading, Sans16, Sans24, spacing } from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { Timestamp } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components";

import { Button, Icon, palette } from "~design-system";
import { FIRESTORE_GENERAL_COLLECTION_MAP } from "~firestore-config";

import { CharacterCountTextField } from "../../components/CharacterCountTextField";
import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { DialogModal } from "../DialogModal";
import {
  buildContactNoteRequestBody,
  chunkCommentToContactNote,
  contactNoteFirestoreDocId,
  generateContactNoteId,
  TOMIS_COMMENT_MAX_CHARS,
  TOMIS_COMMENT_MIN_CHARS,
} from "../OpportunityDenial/UsTn/utils";
import { OpportunityStatusUpdateToast } from "../opportunityStatusUpdateToast";

type ReioSubmissionModalProps = {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => Promise<void>;
  isDownloadDisabled?: boolean;
};

type Phase = "EDITING" | "SUBMITTING" | "SUCCESS" | "FAILED";

const ModalContainer = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  display: flex;
  flex-direction: column;
  min-height: 400px;
`;

const ModalControls = styled.div`
  text-align: right;
`;

const ModalTitle = styled(Sans24)`
  color: ${palette.pine1};
  text-align: center;
  margin-bottom: ${rem(spacing.sm)};
`;

const ModalText = styled(Sans16)`
  color: ${palette.slate80};
  margin: ${rem(spacing.sm)} 0;
`;

const TextAreaLabel = styled(Sans16)`
  color: ${palette.slate80};
  font-weight: 700;
  margin-bottom: ${rem(spacing.xs)};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};
  margin-top: ${rem(spacing.lg)};
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const SuccessCheckmark = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${palette.signal.highlight};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${rem(spacing.md)};
`;

const FullWidthButton = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})`
  margin-top: ${rem(spacing.lg)};
  padding: ${rem(spacing.md)};
`;

function captureReioSubmissionException(
  error: unknown,
  step: string,
  context: Record<string, unknown>,
) {
  Sentry.captureException(error, (scope) => {
    scope.setTag("reioSubmissionStep", step);
    scope.setContext("reioSubmission", context);
    return scope;
  });
}

export const ReioSubmissionModal = observer(function ReioSubmissionModal({
  opportunity,
  isOpen,
  onClose,
  onDownload,
  isDownloadDisabled = false,
}: ReioSubmissionModalProps) {
  const {
    analyticsStore,
    apiStore,
    firestoreStore,
    workflowsStore: { user },
  } = useRootStore();

  const staffId = user?.info?.staffExternalId ?? "";

  const [comment, setComment] = useState("");
  const [phase, setPhase] = useState<Phase>("EDITING");

  useEffect(() => {
    if (isOpen) {
      setPhase("EDITING");
      setComment("");
    }
  }, [isOpen]);

  const isCommentValid =
    comment.length >= TOMIS_COMMENT_MIN_CHARS &&
    comment.length <= TOMIS_COMMENT_MAX_CHARS;

  const handleClose = () => {
    onClose();
  };

  const trackDownload = () => {
    analyticsStore.trackReferralFormDownloaded({
      justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
      opportunityType: opportunity.type,
      opportunityId: opportunity.sentryTrackingId,
    });
  };

  const handleDownloadOnly = async () => {
    if (isDownloadDisabled) return;

    try {
      await onDownload();
      trackDownload();
      handleClose();
    } catch (e) {
      captureReioSubmissionException(e, "download_pdf_only", {
        recordId: opportunity.person.recordId,
        stateCode: opportunity.person.stateCode,
      });
    }
  };

  const handleSubmit = async () => {
    if (isDownloadDisabled) return;

    setPhase("SUBMITTING");

    const contactNoteDateTime = new Date();
    const contactNoteId = generateContactNoteId();
    const contactTypeCodes = ["REIO"];
    const contactNote = chunkCommentToContactNote(comment);
    const docId = contactNoteFirestoreDocId(opportunity);
    const { recordId } = opportunity.person;
    const docRef = firestoreStore.doc(
      { key: FIRESTORE_GENERAL_COLLECTION_MAP.clientUpdatesV2 },
      `${recordId}/${FIRESTORE_GENERAL_COLLECTION_MAP.clientOpportunityUpdates}/${docId}`,
    );
    const sentryContext = {
      contactNoteId,
      contactTypeCodes,
      docId,
      recordId,
      stateCode: opportunity.person.stateCode,
      submittedAt: contactNoteDateTime.toISOString(),
    };

    try {
      await firestoreStore.updateClientUpdatesV2Document(recordId, docRef, {
        contactNote: {
          [contactNoteId]: {
            status: "PENDING",
            submitted: { date: Timestamp.fromDate(contactNoteDateTime) },
            noteStatus: {},
            note: contactNote,
            contactTypeCodes,
          },
        },
      });
    } catch (e) {
      captureReioSubmissionException(
        e,
        "precreate_contact_note_status",
        sentryContext,
      );
      setPhase("FAILED");
      return;
    }

    const requestBody = buildContactNoteRequestBody(
      opportunity,
      staffId,
      contactTypeCodes,
      comment,
      contactNoteId,
      contactNoteDateTime.toISOString(),
    );

    try {
      await apiStore.postExternalRequest(
        opportunity.person.stateCode,
        "insert_contact_note",
        requestBody,
      );
    } catch (e) {
      captureReioSubmissionException(e, "submit_contact_note", sentryContext);
      await firestoreStore
        .updateClientUpdatesV2Document(recordId, docRef, {
          contactNote: {
            [contactNoteId]: {
              status: "FAILURE",
              submitted: { date: Timestamp.fromDate(contactNoteDateTime) },
              note: contactNote,
              contactTypeCodes,
            },
          },
        })
        .catch((updateError) =>
          captureReioSubmissionException(
            updateError,
            "mark_contact_note_status_failure",
            sentryContext,
          ),
        );
      setPhase("FAILED");
      return;
    }

    try {
      analyticsStore.trackReferralFormSubmitted({
        justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
        opportunityType: opportunity.type,
        opportunityId: opportunity.sentryTrackingId,
      });

      const message = await opportunity.markSubmittedAndGenerateToast();
      if (message) {
        toast(<OpportunityStatusUpdateToast toastText={message} />, {
          position: "bottom-left",
        });
      }
    } catch (e) {
      captureReioSubmissionException(
        e,
        "mark_opportunity_submitted",
        sentryContext,
      );
    }

    try {
      await onDownload();
      trackDownload();
    } catch (e) {
      captureReioSubmissionException(e, "download_pdf_after_submit", {
        ...sentryContext,
        tomisSubmissionSucceeded: true,
      });
    }

    setPhase("SUCCESS");
  };

  const editingContent = (
    <ModalContainer>
      <ModalControls>
        <Button kind="link" onClick={handleClose}>
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalControls>
      <ModalTitle>Submit Compliant Reporting Referral Note (REIO)</ModalTitle>
      <TextAreaLabel>Other comments</TextAreaLabel>
      <CharacterCountTextField
        value={comment}
        placeholder="Please specify a reason..."
        maxLength={TOMIS_COMMENT_MAX_CHARS}
        onChange={setComment}
      />
      <ButtonRow>
        <Button
          kind="secondary"
          shape="block"
          disabled={isDownloadDisabled}
          onClick={handleDownloadOnly}
          data-testid="reio-download-only-button"
        >
          Download only
        </Button>
        <Button
          kind="primary"
          shape="block"
          disabled={!isCommentValid || isDownloadDisabled}
          onClick={handleSubmit}
          data-testid="reio-submit-button"
        >
          Download and submit REIO Note to TOMIS
        </Button>
      </ButtonRow>
    </ModalContainer>
  );

  const submittingContent = (
    <ModalContainer>
      <CenteredContainer data-testid="reio-loading-screen">
        <div>
          <Loading showMessage={false} />
        </div>
        <ModalTitle>Submitting REIO note to TOMIS...</ModalTitle>
        <ModalText>Do not refresh the page.</ModalText>
      </CenteredContainer>
    </ModalContainer>
  );

  const successContent = (
    <ModalContainer>
      <ModalControls>
        <Button kind="link" onClick={handleClose}>
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalControls>
      <CenteredContainer data-testid="reio-success-screen">
        <SuccessCheckmark>
          <Icon kind="Check" size="32" color={palette.marble1} />
        </SuccessCheckmark>
        <ModalTitle>Note Submitted</ModalTitle>
        <ModalText>REIO Note has been submitted to TOMIS</ModalText>
        <FullWidthButton onClick={handleClose}>Close</FullWidthButton>
      </CenteredContainer>
    </ModalContainer>
  );

  const failureContent = (
    <ModalContainer>
      <ModalControls>
        <Button kind="link" onClick={handleClose}>
          <Icon kind="Close" size="14" color={palette.pine2} />
        </Button>
      </ModalControls>
      <CenteredContainer data-testid="reio-failure-screen">
        <ModalTitle>Currently unable to submit REIO note to TOMIS.</ModalTitle>
        <ModalText>Please try again later.</ModalText>
      </CenteredContainer>
    </ModalContainer>
  );

  const content: Record<Phase, JSX.Element> = {
    EDITING: editingContent,
    SUBMITTING: submittingContent,
    SUCCESS: successContent,
    FAILED: failureContent,
  };

  return (
    <DialogModal isOpen={isOpen} onRequestClose={handleClose}>
      {content[phase]}
    </DialogModal>
  );
});
