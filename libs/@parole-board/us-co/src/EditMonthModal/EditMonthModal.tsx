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

import { hideVisually, rem } from "polished";
import { useId, useRef } from "react";
import styled from "styled-components";

import {
  ModalActionRow,
  modalCloseProps,
  ModalError,
  ParoleBoardButton,
  semantics,
  useRestoreFocusAfterSubmit,
} from "~@parole-board/common";
import { Modal, ModalHeading } from "~design-system";

const { space, status, text, type } = semantics;

/**
 * The inline error for a failure the editor can retry. monthLabel is the
 * month as it reads, such as "September 2026".
 */
export function editMonthFailedMessage(monthLabel: string) {
  return `We couldn't move ${monthLabel} to draft. Try again or contact Recidiviz support.`;
}

const Eyebrow = styled.div`
  ${type.Sans12}
  color: ${status.error};
  text-transform: uppercase;
`;

const Title = styled(ModalHeading)`
  margin: ${rem(space.sm)} 0 ${rem(space.md)};
`;

const Body = styled.p`
  ${type.Sans14}
  color: ${text.secondary};
  margin: 0;
`;

const VisuallyHidden = styled.div`
  ${hideVisually()}
`;

export type EditMonthModalProps = {
  isOpen: boolean;
  /** The month's title, such as "September 2026". */
  monthLabel: string;
  /** True while months.unpublish is in flight. */
  isUnpublishing: boolean;
  /** A message to show inline when the request failed and can be retried. */
  error?: string;
  onConfirm: () => void;
  /** Called by Cancel, Escape and a click outside, except while unpublishing. */
  onCancel: () => void;
};

/**
 * Asks the editor to confirm moving a published month back to draft so it can
 * be edited, which takes it off the public calendar until it is published
 * again. It keeps the layout of the "Remove [Month Year]?" confirmation
 * on the Public Calendar screen in the Calendar Unit Dashboard design, in the
 * ~design-system Modal at its default width, with the design's red eyebrow
 * and destructive confirm button.
 *
 * Focus starts on the dialog itself, which react-modal focuses on open, so
 * neither button looks focused and pressing Enter by reflex does nothing.
 * While the request runs, Escape and outside clicks do nothing and focus
 * stays on the dialog; when a failure leaves it open, focus returns to the
 * confirm button, which the error describes.
 */
export function EditMonthModal({
  isOpen,
  monthLabel,
  isUnpublishing,
  error,
  onConfirm,
  onCancel,
}: EditMonthModalProps) {
  const titleId = useId();
  const bodyId = useId();
  const errorId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useRestoreFocusAfterSubmit(isUnpublishing, {
    hold: dialogRef,
    restore: [confirmRef],
  });

  return (
    <Modal
      isOpen={isOpen}
      role="alertdialog"
      aria={{ labelledby: titleId, describedby: bodyId }}
      contentRef={(node) => {
        dialogRef.current = node;
      }}
      {...modalCloseProps(isUnpublishing, onCancel)}
    >
      <Eyebrow>Edit published month</Eyebrow>
      <Title id={titleId}>{`Edit ${monthLabel}?`}</Title>
      <Body id={bodyId}>
        {`Editing takes ${monthLabel} off the public calendar. It won't be visible outside the Calendar Unit until you publish it again.`}
      </Body>
      {error && <ModalError id={errorId}>{error}</ModalError>}
      <VisuallyHidden role="status">
        {isUnpublishing ? `Taking ${monthLabel} off the public calendar` : ""}
      </VisuallyHidden>
      <ModalActionRow>
        <ParoleBoardButton
          kind="secondary"
          onClick={onCancel}
          disabled={isUnpublishing}
        >
          Cancel
        </ParoleBoardButton>
        <ParoleBoardButton
          ref={confirmRef}
          kind="destructive"
          onClick={onConfirm}
          waiting={isUnpublishing}
          aria-describedby={error ? errorId : undefined}
        >
          Edit month
        </ParoleBoardButton>
      </ModalActionRow>
    </Modal>
  );
}
