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
import { Platform, View } from "react-native";
import OutlineThumbDownIcon from "react-native-heroicons/outline/ThumbDownIcon";
import OutlineThumbUpIcon from "react-native-heroicons/outline/ThumbUpIcon";

import type {
  CaseNoteInsightsSummary,
  CaseNoteSummarySegment,
} from "~@meetings/app/entities/case-note-summary";
import { Person, trpc } from "~@meetings/app/shared/api";
import { Button } from "~@meetings/app/shared/ui/Button";
import { FeedbackMessageModal } from "~@meetings/app/shared/ui/FeedbackMessageModal";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import type { AppRouter, OutputVoteValue } from "~@meetings/trpc-types";

type CNIFeedbackSnapshot =
  inferRouterInputs<AppRouter>["v1"]["client"]["submitCNIVote"]["snapshot"];

type Props = {
  person: Person;
  summaries: CaseNoteInsightsSummary[];
  segments: CaseNoteSummarySegment[];
};

export function CaseNoteSummaryFeedbackButtons({
  person,
  summaries,
  segments,
}: Props) {
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const { showSnackbar } = useSnackbar();

  const snapshot: CNIFeedbackSnapshot = {
    displayText: segments.map(({ content }) => content).join(""),
    summarySnapshots: summaries.map(({ id, cniFields, cniRunIds }) => ({
      summaryId: id,
      cniSnapshot: cniFields,
      cniRunIDs: cniRunIds,
    })),
  };

  const submitCNIVote = trpc.v1.client.submitCNIVote.useMutation({
    onError: () => {
      showSnackbar(
        "Something went wrong while submitting your feedback. Please try again.",
      );
    },
  });

  const submitCNIVoteMessage = trpc.v1.client.submitCNIVoteMessage.useMutation({
    onSuccess: () => {
      setIsMessageModalVisible(false);
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

  const handleVote = (nextVote: OutputVoteValue) => {
    if (submitCNIVote.isPending) return;
    submitCNIVote.mutate({
      clientId: person.personId,
      vote: nextVote,
      snapshot,
    });
  };

  const feedbackId = submitCNIVote.data?.id;

  return (
    <>
      <View className="shrink-0 flex-row items-center gap-2">
        {feedbackId ? (
          <Button
            onPress={() => setIsMessageModalVisible(true)}
            variant="secondary"
            className="px-5 py-2.5"
          >
            Give feedback
          </Button>
        ) : (
          <>
            <Button
              onPress={() => handleVote("UP")}
              variant="secondary"
              shape="circle"
              icon={{
                icon: () => (
                  <OutlineThumbUpIcon className="size-5 stroke-tertiary" />
                ),
              }}
            />
            <Button
              onPress={() => handleVote("DOWN")}
              variant="secondary"
              shape="circle"
              icon={{
                icon: () => (
                  <OutlineThumbDownIcon className="size-5 stroke-tertiary" />
                ),
              }}
            />
          </>
        )}
      </View>
      {feedbackId && (
        <FeedbackMessageModal
          title="Give feedback"
          description={`Let us know why this insight is incorrect or incomplete.${Platform.OS === "web" ? "\n" : " "} Your feedback helps us improve AI accuracy`}
          visible={isMessageModalVisible}
          onClose={() => setIsMessageModalVisible(false)}
          onSubmit={(message) =>
            submitCNIVoteMessage.mutate({ feedbackId, message })
          }
          isSubmitting={submitCNIVoteMessage.isPending}
        />
      )}
    </>
  );
}
