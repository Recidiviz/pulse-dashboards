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

import { MutableRefObject, ReactNode } from "react";

import { modalCloseProps } from "~@parole-board/common";
import { Modal, ModalHeading } from "~design-system";

import { PUBLISH_COPY } from "./copy";
import { Description } from "./PublishMonthModal.styles";

export interface PublishMonthDialogProps {
  isOpen: boolean;
  /** The month as it reads, such as "September 2026". */
  monthLabel: string;
  /**
   * Called on Escape or a click outside the dialog. The caller closes it and
   * clears the checkbox.
   */
  onClose: () => void;
  /** True while the publish is in flight; Escape and outside clicks do nothing. */
  submitting?: boolean;
  /**
   * Receives the dialog's element, which PublishMonthReview holds focus on
   * while the publish runs.
   */
  dialogRef?: MutableRefObject<HTMLDivElement | null>;
  /** PublishMonthReview, or PublishMonthSkeleton while the preview loads. */
  children: ReactNode;
}

/**
 * The publish dialog's frame: the ~design-system Modal at its default width,
 * with the heading and description from the Calendar Unit Dashboard design's
 * publish modal. The heading and description depend only on the month, so
 * they show while the body loads.
 */
export function PublishMonthDialog({
  isOpen,
  monthLabel,
  onClose,
  submitting = false,
  dialogRef,
  children,
}: PublishMonthDialogProps) {
  const heading = PUBLISH_COPY.heading(monthLabel);

  return (
    <Modal
      isOpen={isOpen}
      contentLabel={heading}
      contentRef={(node) => {
        if (dialogRef) dialogRef.current = node;
      }}
      {...modalCloseProps(submitting, onClose)}
    >
      {/* One element child, because react-modal's types pin an older
          ReactNode that rejects this React's. */}
      <>
        <ModalHeading>{heading}</ModalHeading>
        <Description>{PUBLISH_COPY.description(monthLabel)}</Description>
        {children}
      </>
    </Modal>
  );
}
