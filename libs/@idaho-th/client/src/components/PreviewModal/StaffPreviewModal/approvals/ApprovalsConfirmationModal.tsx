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

import React from "react";

import { ConfirmationModal } from "../../../ConfirmationModal/ConfirmationModal";
import { APPROVALS_ACTION, type ApprovalsAction } from "../../constants";

interface ApprovalsConfirmationModalProps {
  isOpen: boolean;
  action: ApprovalsAction | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

// Keyed by action rather than by decision: one decision can imply different
// actions depending on what is already recorded in the other group.
const MODAL_CONTENT: Record<
  ApprovalsAction,
  {
    heading: string;
    subheading: string;
    secondaryBtnText: string;
    primaryBtnText: string;
    variant: "primary" | "destructive";
  }
> = {
  [APPROVALS_ACTION.CLOSE_CASE]: {
    heading: "Mark Application Complete",
    subheading:
      "This will close the case and can't be undone. To reopen the case, you'll need to create a new application.",
    secondaryBtnText: "Cancel",
    primaryBtnText: "Mark Application Complete",
    variant: "destructive",
  },
  [APPROVALS_ACTION.ADVANCE_TO_RELEASE]: {
    heading: "Advance case to Release stage?",
    subheading:
      "This will advance the case to the Release stage. This action can't be undone.",
    secondaryBtnText: "Go Back",
    primaryBtnText: "Advance to Release",
    variant: "primary",
  },
};

export const ApprovalsConfirmationModal: React.FC<
  ApprovalsConfirmationModalProps
> = ({ isOpen, action, onClose, onConfirm, isLoading }) => {
  const content = action ? MODAL_CONTENT[action] : null;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      heading={content?.heading ?? ""}
      subheading={content?.subheading}
      secondaryBtnText={content?.secondaryBtnText}
      primaryBtnText={content?.primaryBtnText}
      variant={content?.variant}
    />
  );
};
