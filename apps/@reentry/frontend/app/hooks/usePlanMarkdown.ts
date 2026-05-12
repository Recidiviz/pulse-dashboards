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

import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import { $api } from "../api";
import { useAuth } from "../lib/auth/authContext";
import type { AnalyticsContext } from "./analytics.types";

export const usePlanMarkdown = (
  planId: string,
  initialMarkdown: string | null | undefined,
  analyticsContext?: AnalyticsContext,
) => {
  const { getAccessToken } = useAuth();
  const { track } = useAnalytics();
  const [displayMarkdown, setDisplayMarkdown] = useState(initialMarkdown ?? "");
  const [draftMarkdown, setDraftMarkdown] = useState(initialMarkdown ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { mutateAsync: editPlanMutation } = $api.useMutation(
    "post",
    "/plans/{id}/edit",
  );

  // Re-initialise when data becomes available (e.g. after loading state).
  useEffect(() => {
    if (initialMarkdown != null) {
      setDisplayMarkdown(initialMarkdown);
      setDraftMarkdown(initialMarkdown);
    }
  }, [initialMarkdown]);

  const startEdit = () => {
    track("action_plan_edit_started", {
      planGenerationId: analyticsContext?.planGenerationId,
    });
    setDraftMarkdown(displayMarkdown);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveMarkdown = () => {
    track("action_plan_edited", {
      planGenerationId: analyticsContext?.planGenerationId,
    });
    const previousDisplay = displayMarkdown;
    setDisplayMarkdown(draftMarkdown);
    setIsEditing(false);
    setIsSaving(true);

    editPlanMutation({
      params: { path: { id: planId } },
      body: { markdown: draftMarkdown },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    }).then(
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
