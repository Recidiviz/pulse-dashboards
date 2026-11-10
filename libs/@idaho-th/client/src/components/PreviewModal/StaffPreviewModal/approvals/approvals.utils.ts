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

import type { ApprovalsDecisions } from "~@idaho-th/client/interfaces/common";
import { deriveApprovalsOutcome } from "~@idaho-th/shared";

import { APPROVALS_ACTION, type ApprovalsAction } from "../../constants";

/**
 * The action a Save implies, given the saved decision merged over the persisted
 * values of the others. Null means the value is stored and the case keeps
 * waiting, so no confirmation is needed. The gate itself is the server's.
 */
export function resolveApprovalsAction(
  decisions: ApprovalsDecisions,
  { isRider, hasHomePlan }: { isRider: boolean; hasHomePlan: boolean },
): ApprovalsAction | null {
  const outcome = deriveApprovalsOutcome({
    ...decisions,
    isRider,
    hasHomePlan,
  });

  if (outcome.type === "CLOSE") return APPROVALS_ACTION.CLOSE_CASE;
  if (outcome.type === "ADVANCE") return APPROVALS_ACTION.ADVANCE_TO_RELEASE;
  return null;
}

/**
 * A local draft of one decision group. Re-seeds itself whenever the persisted
 * value changes, so a successful save greys out that group's Save button while
 * a cancelled confirmation leaves the selection on screen.
 */
export function useDecisionDraft<T>(persisted: T | null) {
  const [draft, setDraft] = useState<T | null>(persisted);
  const [lastPersisted, setLastPersisted] = useState<T | null>(persisted);

  if (lastPersisted !== persisted) {
    setLastPersisted(persisted);
    setDraft(persisted);
  }

  return { draft, setDraft, isDirty: draft !== persisted };
}
