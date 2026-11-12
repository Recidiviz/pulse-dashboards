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

import { RefObject, useEffect, useRef } from "react";

type FocusTarget = RefObject<HTMLElement | null>;

const canFocus = (element: HTMLElement | null | undefined) =>
  !!element && !(element instanceof HTMLButtonElement && element.disabled);

/**
 * Keeps keyboard focus inside a dialog while its request runs. A waiting
 * ParoleBoardButton is disabled, and a disabled button drops focus to the
 * page, so while submitting is true focus moves to hold, usually the dialog
 * itself. When the request ends and the dialog is still open, as after a
 * failure, focus returns to the first of restore that can take it, such as
 * the submit button, or to hold when none can.
 */
export function useRestoreFocusAfterSubmit(
  submitting: boolean,
  {
    hold,
    restore,
  }: {
    hold: FocusTarget;
    restore: readonly FocusTarget[];
  },
) {
  const wasSubmitting = useRef(submitting);
  // A ref, so a new array on each render doesn't rerun the effect.
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    if (submitting) {
      hold.current?.focus();
    } else if (wasSubmitting.current) {
      const target = restoreRef.current
        .map((ref) => ref.current)
        .find(canFocus);
      (target ?? hold.current)?.focus();
    }
    wasSubmitting.current = submitting;
  }, [submitting, hold]);
}
