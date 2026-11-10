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

import { useState } from "react";
import toast from "react-hot-toast";

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { useAdvanceApplicationStage } from "../../../../hooks/housingApplication";
import {
  type CloseApplicationReason,
  type ClosedOutcomeValue,
  CloseReasonModal,
  REASON_TO_CLOSED_OUTCOME,
} from "../../../CloseReasonModal";

export function useCloseApplication(applicationId: string | undefined) {
  const { mutate: advanceStage, isPending: isAdvancingStage } =
    useAdvanceApplicationStage();

  const [isCloseReasonModalOpen, setIsCloseReasonModalOpen] = useState(false);

  const openCloseApplicationConfirm = () => {
    if (!applicationId) return;
    setIsCloseReasonModalOpen(true);
  };

  const handleSubmitCloseReason = (
    reason: CloseApplicationReason,
    otherText?: string,
  ) => {
    if (!applicationId) return;
    const closedOutcome: ClosedOutcomeValue = REASON_TO_CLOSED_OUTCOME[reason];
    // Close atomically with the outcome so provider substages are resolved
    // once in advance-stage (selected → RELEASED, others stay CANCELED).
    advanceStage(
      {
        applicationId,
        targetStage: APPLICATION_STAGE.CLOSED,
        closedOutcome,
        closedOutcomeNote:
          reason === "other" && otherText ? otherText : undefined,
      },
      {
        onSuccess: () => {
          setIsCloseReasonModalOpen(false);
          toast("The case has been closed.");
        },
        onError: () => toast.error("Failed to close application."),
      },
    );
  };

  const modals = (
    <CloseReasonModal
      isOpen={isCloseReasonModalOpen}
      onClose={() => setIsCloseReasonModalOpen(false)}
      onSubmit={handleSubmitCloseReason}
      isLoading={isAdvancingStage}
    />
  );

  return { openCloseApplicationConfirm, modals, isAdvancingStage };
}
