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

import { Platform, View } from "react-native";
import OutlineThumbDownIcon from "react-native-heroicons/outline/ThumbDownIcon";
import OutlineThumbUpIcon from "react-native-heroicons/outline/ThumbUpIcon";

import { Button } from "~@meetings/app/shared/ui/Button";
import { FeedbackMessageModal } from "~@meetings/app/shared/ui/FeedbackMessageModal";

import type { CaseNoteSummaryFeedback } from "../model/useCaseNoteSummaryFeedback";

type Props = {
  feedback: CaseNoteSummaryFeedback;
};

export function CaseNoteSummaryFeedbackButtons({ feedback }: Props) {
  return (
    <View className="shrink-0 flex-row items-center gap-2">
      {feedback.feedbackId ? (
        <Button
          onPress={feedback.openMessageForm}
          variant="secondary"
          className="px-5 py-2.5"
        >
          Give feedback
        </Button>
      ) : (
        <>
          <Button
            onPress={() => feedback.vote("UP")}
            variant="secondary"
            shape="circle"
            icon={{
              icon: () => (
                <OutlineThumbUpIcon className="size-5 stroke-tertiary" />
              ),
            }}
          />
          <Button
            onPress={() => feedback.vote("DOWN")}
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
  );
}

export function CaseNoteSummaryFeedbackForm({ feedback }: Props) {
  if (!feedback.feedbackId) return null;

  return (
    <FeedbackMessageModal
      title="Give feedback"
      description={`Let us know why this insight is incorrect or incomplete.${Platform.OS === "web" ? "\n" : " "} Your feedback helps us improve AI accuracy`}
      visible={feedback.isMessageFormVisible}
      onClose={feedback.closeMessageForm}
      onSubmit={feedback.submitMessage}
      isSubmitting={feedback.isSubmittingMessage}
    />
  );
}
