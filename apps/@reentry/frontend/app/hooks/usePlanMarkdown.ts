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

import { useEffect, useState } from "react";

import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

// Phase 2: replace with real PATCH /plans/{id}/markdown call.
const mockSavePlanMarkdownApi = async (markdown: string): Promise<void> => {
  console.log("[mock] savePlanMarkdown", { markdown });
  return new Promise((resolve) => setTimeout(resolve, 500));
};

export const usePlanMarkdown = (initialMarkdown: string | null | undefined) => {
  const [displayMarkdown, setDisplayMarkdown] = useState(initialMarkdown ?? "");
  const [draftMarkdown, setDraftMarkdown] = useState(initialMarkdown ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Re-initialise when data becomes available (e.g. after loading state).
  useEffect(() => {
    if (initialMarkdown != null) {
      setDisplayMarkdown(initialMarkdown);
      setDraftMarkdown(initialMarkdown);
    }
  }, [initialMarkdown]);

  const startEdit = () => {
    setDraftMarkdown(displayMarkdown);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveMarkdown = () => {
    const previousDisplay = displayMarkdown;
    setDisplayMarkdown(draftMarkdown);
    setIsEditing(false);
    setIsSaving(true);

    mockSavePlanMarkdownApi(draftMarkdown).then(
      () => {
        setIsSaving(false);
        showSuccessToast("Plan saved.");
      },
      () => {
        setIsSaving(false);
        setDisplayMarkdown(previousDisplay);
        setIsEditing(true);
        showErrorToast("Failed to save plan. Your edits have been kept.");
      },
    );
  };

  return {
    displayMarkdown,
    draftMarkdown,
    setDraftMarkdown,
    isEditing,
    isSaving,
    startEdit,
    cancelEdit,
    saveMarkdown,
  };
};
