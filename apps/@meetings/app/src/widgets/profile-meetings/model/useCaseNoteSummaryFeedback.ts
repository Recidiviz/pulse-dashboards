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

import type { inferRouterInputs } from "@trpc/server";
import { useState } from "react";

import type {
  CaseNoteInsightsSummary,
  CaseNoteSummarySegment,
} from "~@meetings/app/entities/case-note-summary";
import { Person, trpc } from "~@meetings/app/shared/api";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import type { AppRouter, OutputVoteValue } from "~@meetings/trpc-types";

type CNIFeedbackSnapshot =
  inferRouterInputs<AppRouter>["v1"]["client"]["submitCNIVote"]["snapshot"];

type Params = {
  person: Person;
  summaries: CaseNoteInsightsSummary[] | null | undefined;
  segments: CaseNoteSummarySegment[] | null | undefined;
};

export function useCaseNoteSummaryFeedback({
  person,
  summaries,
  segments,
}: Params) {
  const [isMessageFormVisible, setIsMessageFormVisible] = useState(false);
  const { showSnackbar } = useSnackbar();

  const submitCNIVote = trpc.v1.client.submitCNIVote.useMutation({
    onError: () => {
      showSnackbar(
        "Something went wrong while submitting your feedback. Please try again.",
      );
    },
  });

  const submitCNIVoteMessage = trpc.v1.client.submitCNIVoteMessage.useMutation({
    onSuccess: () => {
      setIsMessageFormVisible(false);
      showSnackbar(
        "Thanks for your feedback! You're helping us make the product better",
      );
      submitCNIVote.reset();
    },
    onError: () => {
      showSnackbar(
        "Something went wrong while submitting your feedback. Please try again.",
      );
    },
  });

  const vote = (nextVote: OutputVoteValue) => {
    if (submitCNIVote.isPending || !segments || !summaries) return;
    const snapshot: CNIFeedbackSnapshot = {
      displayText: segments.map(({ content }) => content).join(""),
      summarySnapshots: summaries.map(({ id, cniFields }) => ({
        summaryId: id,
        cniSnapshot: cniFields,
      })),
    };
    submitCNIVote.mutate({
      clientId: person.personId,
      vote: nextVote,
      snapshot,
    });
  };

  const feedbackId = submitCNIVote.data?.id;

  const submitMessage = (message: string) => {
    if (feedbackId) submitCNIVoteMessage.mutate({ feedbackId, message });
  };

  return {
    feedbackId,
    vote,
    isMessageFormVisible,
    openMessageForm: () => setIsMessageFormVisible(true),
    closeMessageForm: () => setIsMessageFormVisible(false),
    submitMessage,
    isSubmittingMessage: submitCNIVoteMessage.isPending,
  };
}

export type CaseNoteSummaryFeedback = ReturnType<
  typeof useCaseNoteSummaryFeedback
>;
