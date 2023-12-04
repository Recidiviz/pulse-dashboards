// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  Modal,
  palette,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../utils";
import { DenialConfirmationModalProps } from "../../../WorkflowsStore";

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    padding: 0;
    max-width: 85vw;
    width: ${rem(740)};
    min-height: ${rem(500)};
    display: flex;
    flex-direction: column;
  }
`;

const ModalTitle = styled(Sans24)`
  color: ${palette.pine1};
  padding: ${rem(spacing.md)} ${rem(spacing.xl)};
`;

const ModalControls = styled.div`
  padding: ${rem(spacing.lg)} ${rem(spacing.lg)} ${rem(spacing.sm)};
  text-align: right;
`;

const ActionButton = styled(Button).attrs({ kind: "primary", shape: "block" })`
  margin: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
  align-self: flex-start;
  flex: none;
`;

export const DocstarsDenialModal = observer(function DocstarsDenialModal({
  opportunity,
  reasons,
  otherReason,
  snoozeUntilDate,
  showModal,
  onCloseFn,
  onSuccessFn,
}: DenialConfirmationModalProps) {
  const {
    workflowsStore: {
      currentUserEmail,
      featureVariants: { usNdWriteToDocstars },
    },
  } = useRootStore();

  useEffect(() => {
    if (!usNdWriteToDocstars && showModal) onSuccessFn();
  }, [onSuccessFn, showModal, usNdWriteToDocstars]);

  const closeButtonControls = (
    <ModalControls>
      <Button kind="link" onClick={onCloseFn}>
        <Icon kind="Close" size="14" color={palette.pine2} />
      </Button>
    </ModalControls>
  );

  const submissionModal = (
    <>
      {closeButtonControls}
      {/* TODO(#4372) Finalize copy and format */}
      <ModalTitle>Confirm</ModalTitle>
      Reasons: {reasons}
      otherReason:{otherReason}
      Snooze until: {formatWorkflowsDate(snoozeUntilDate)}
      sid: {opportunity.person.externalId}
      user: {currentUserEmail}
      <ActionButton onClick={onSuccessFn}>Submit note to DOCSTARS</ActionButton>
    </>
  );

  return (
    <StyledModal isOpen={showModal} onRequestClose={onCloseFn}>
      {submissionModal}
    </StyledModal>
  );
});
