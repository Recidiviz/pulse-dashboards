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

import { Sans14, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import styled from "styled-components";

import { palette } from "~design-system";

import useIsMobile from "../../../../../hooks/useIsMobile";

// How long the undo toast stays up. These match the undo toast for snoozing
// a task in Workflows.
export const UNDO_WINDOW_MS = 7000;
export const MOBILE_UNDO_WINDOW_MS = 4000;

const ToastBody = styled(Sans14)`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const UndoButton = styled.button.attrs({ type: "button" })`
  ${typography.Sans14}
  padding: 0;
  border: none;
  background: none;
  /* The Workflows undo toast uses this blue, which reads on the dark toast. */
  color: ${palette.logoBlue};
  cursor: pointer;
`;

/** A removal in progress: its write, and a function that undoes it. */
export type Removal = {
  done: Promise<void>;
  undo: () => Promise<void>;
};

/**
 * Removes items, such as report rows, with a chance to undo, the way the
 * Workflows snooze toast does. Removing writes right away and shows a toast
 * with an Undo button for a few seconds, and Undo writes the item back.
 * Since the removal is written first, it holds even if the PHI reloads or
 * closes the tab while the toast is up. The toast closes when the component
 * unmounts, so Undo isn't offered once the PHI leaves the page.
 *
 * @param removedMessage - The toast's text, such as "Past Action removed".
 * @param failedMessage - An error toast's text when a removal fails.
 * @param undoFailedMessage - An error toast's text when undoing fails.
 * @returns remove, which takes an item's id and a function that starts
 *   removing it. Removing an item that's already being removed does nothing.
 */
export function useRemoveWithUndo({
  removedMessage,
  failedMessage,
  undoFailedMessage,
}: {
  removedMessage: string;
  failedMessage: string;
  undoFailedMessage: string;
}): { remove: (id: string, removeItem: () => Removal) => void } {
  const { isMobile } = useIsMobile(true);
  const undoWindowMs = isMobile ? MOBILE_UNDO_WINDOW_MS : UNDO_WINDOW_MS;
  // Ids whose removal hasn't been saved yet.
  const removing = useRef(new Set<string>());
  const openToastIds = useRef(new Set<string>());

  useEffect(() => {
    const toastIds = openToastIds.current;
    return () => {
      toastIds.forEach((toastId) => toast.dismiss(toastId));
      toastIds.clear();
    };
  }, []);

  const remove = useCallback(
    (id: string, removeItem: () => Removal) => {
      if (removing.current.has(id)) return;
      removing.current.add(id);
      const { done, undo } = removeItem();

      const toastId = toast(
        (current) => (
          <ToastBody>
            {removedMessage}
            <UndoButton
              onClick={() => {
                toast.dismiss(current.id);
                openToastIds.current.delete(current.id);
                undo().catch(() => toast.error(undoFailedMessage));
              }}
            >
              Undo
            </UndoButton>
          </ToastBody>
        ),
        { duration: undoWindowMs },
      );
      openToastIds.current.add(toastId);

      done
        .catch(() => {
          toast.dismiss(toastId);
          openToastIds.current.delete(toastId);
          toast.error(failedMessage);
        })
        .finally(() => removing.current.delete(id));
    },
    [failedMessage, removedMessage, undoFailedMessage, undoWindowMs],
  );

  return { remove };
}
