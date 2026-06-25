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
import { type JSX, useEffect, useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components";

import { Button, palette } from "~design-system";
import { FIRESTORE_GENERAL_COLLECTION_MAP } from "~firestore-config";

import { CharacterCountTextField } from "../../../components/CharacterCountTextField";
import { useRootStore } from "../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../utils";
import { DialogModal } from "../../DialogModal";
import { DialogModalControls, ModalText } from "../../DialogModal/DialogView";
import { OpportunityStatusUpdateToast } from "../../opportunityStatusUpdateToast";
import { DenialConfirmationModalProps } from "../DenialConfirmationModals";
import {
  buildContactNoteRequestBody,
  chunkCommentToContactNote,
  contactNoteFirestoreDocId,
  generateContactNoteId,
  TOMIS_COMMENT_MAX_CHARS,
  TOMIS_COMMENT_MIN_CHARS,
} from "./utils";

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

const ReviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 0 ${rem(spacing.xl)};
`;

const Subtitle = styled(Sans16)`
  color: ${palette.slate60};
  margin-bottom: ${rem(spacing.lg)};
  text-align: center;
`;

const DenialCodeBlock = styled.div`
  margin-bottom: ${rem(spacing.md)};
`;

const DenialCodeLabel = styled(Sans16)`
  color: ${palette.slate80};
  font-weight: 700;
  margin-bottom: ${rem(spacing.xs)};
`;

const CommentSection = styled.div`
  margin-top: ${rem(spacing.md)};
  margin-bottom: ${rem(spacing.md)};
`;

const SubmitButton = styled(Button).attrs({
  kind: "primary",
  shape: "block",
})`
  margin: ${rem(spacing.lg)} 0 ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
`;

export const TomisDenialModal = observer(function TomisDenialModal({
  opportunity,
  reasons,
  showModal,
  onCloseFn,
  onSuccessFn,
}: DenialConfirmationModalProps) {
  const {
    apiStore,
    firestoreStore,
    workflowsStore: { user },
  } = useRootStore();

  const staffId = user?.info?.id ?? "";

  const [phase, setPhase] = useState<"REVIEWING" | "SUBMITTING" | "FAILED">(
    "REVIEWING",
  );
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (showModal) {
      setPhase("REVIEWING");
      setComment("");
    }
  }, [showModal]);

  const denialReasons = opportunity.config.denialReasons;
  const tomisCodes = reasons.filter(
    (code) => code in denialReasons && !code.toUpperCase().includes("OTHER"),
  );
  const hasTomisCodes = tomisCodes.length > 0;

  const isCommentValid =
    comment.length >= TOMIS_COMMENT_MIN_CHARS &&
    comment.length <= TOMIS_COMMENT_MAX_CHARS;

  const onSubmitButtonClick = async () => {
    if (!hasTomisCodes) return;

    setPhase("SUBMITTING");

    const contactNoteDateTime = new Date();
    const contactNoteId = generateContactNoteId();
    const contactNote = chunkCommentToContactNote(comment);
    const docId = contactNoteFirestoreDocId(opportunity);
    const { recordId } = opportunity.person;
    const docRef = firestoreStore.doc(
      { key: FIRESTORE_GENERAL_COLLECTION_MAP.clientUpdatesV2 },
      `${recordId}/${FIRESTORE_GENERAL_COLLECTION_MAP.clientOpportunityUpdates}/${docId}`,
    );

    try {
      await firestoreStore.updateClientUpdatesV2Document(recordId, docRef, {
        contactNote: {
          [contactNoteId]: {
            status: "PENDING",
            submitted: { date: Timestamp.fromDate(contactNoteDateTime) },
            noteStatus: {},
            note: contactNote,
            contactTypeCodes: tomisCodes,
          },
        },
      });

      const requestBody = buildContactNoteRequestBody(
        opportunity,
        staffId,
        tomisCodes,
        comment,
        contactNoteId,
        contactNoteDateTime.toISOString(),
      );

      await apiStore.postExternalRequest(
        opportunity.person.stateCode,
        "insert_contact_note",
        requestBody,
      );

      toast(
        <OpportunityStatusUpdateToast
          toastText={`You have submitted denial codes to TOMIS for ${opportunity.person.displayPreferredName}`}
        />,
        { id: "tomis-denial-submitted", position: "bottom-left" },
      );
      onSuccessFn();
    } catch (e) {
      Sentry.captureException(e);
      await firestoreStore
        .updateClientUpdatesV2Document(recordId, docRef, {
          contactNote: {
            [contactNoteId]: {
              status: "FAILURE",
              submitted: { date: Timestamp.fromDate(contactNoteDateTime) },
              note: contactNote,
              contactTypeCodes: tomisCodes,
            },
          },
        })
        .catch(Sentry.captureException);
      setPhase("FAILED");
    }
  };

  const reviewingModal = (
    <div data-testid="tomis-confirmation-screen">
      <DialogModalControls onClose={onCloseFn} />
      <ReviewContainer>
        <ModalTitle>Compliant Reporting Denial Codes</ModalTitle>
        <Subtitle>
          Prefilled with data from TDOC on {formatWorkflowsDate(new Date())}
        </Subtitle>
        {tomisCodes.map((code) => {
          const description = denialReasons[code];
          return (
            <DenialCodeBlock key={code}>
              <DenialCodeLabel>
                {code} — {description}
              </DenialCodeLabel>
            </DenialCodeBlock>
          );
        })}
        <CommentSection>
          <CharacterCountTextField
            value={comment}
            placeholder="Enter at least 3 characters"
            maxLength={TOMIS_COMMENT_MAX_CHARS}
            onChange={setComment}
            label="Enter Contact Comments"
          />
        </CommentSection>
        <SubmitButton
          data-testid="tomis-submit-button"
          onClick={onSubmitButtonClick}
          disabled={!isCommentValid || !hasTomisCodes}
        >
          Submit Denial Codes to TOMIS
        </SubmitButton>
      </ReviewContainer>
    </div>
  );

  const loadingModal = (
    <CenteredContainer data-testid="tomis-loading-screen">
      <div>
        <Loading showMessage={false} />
      </div>
      <ModalTitle>Submitting denial codes to TOMIS...</ModalTitle>
      <ModalText>Do not refresh the page.</ModalText>
    </CenteredContainer>
  );

  const failureModal = (
    <div data-testid="tomis-failure-screen" style={{ width: "100%" }}>
      <DialogModalControls onClose={onCloseFn} />
      <CenteredContainer>
        <ModalTitle>
          Currently unable to submit denial codes to TOMIS.
        </ModalTitle>
        <ModalText>Please try again later.</ModalText>
      </CenteredContainer>
    </div>
  );

  const modalContent: Record<typeof phase, JSX.Element> = {
    REVIEWING: reviewingModal,
    SUBMITTING: loadingModal,
    FAILED: failureModal,
  };

  return (
    <DialogModal isOpen={showModal} onRequestClose={onCloseFn}>
      {modalContent[phase]}
    </DialogModal>
  );
});
