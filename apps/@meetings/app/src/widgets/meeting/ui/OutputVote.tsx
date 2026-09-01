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

import clsx from "clsx";
import { useEffect, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import OutlineThumbDownIcon from "react-native-heroicons/outline/ThumbDownIcon";
import OutlineThumbUpIcon from "react-native-heroicons/outline/ThumbUpIcon";

import { MeetingDetails } from "~@meetings/app/entities/meeting";
import { trpc } from "~@meetings/app/shared/api";
import { FadeContainer } from "~@meetings/app/shared/ui/FadeContainer";
import { FeedbackMessageModal } from "~@meetings/app/shared/ui/FeedbackMessageModal";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import type { OutputVoteTab, OutputVoteValue } from "~@meetings/trpc-types";

import { Tab } from "./MeetingTabs";

const FADE_DURATION_MS = 400;
/** How long the colored icon is held before the row fades out. */
const VOTE_CONFIRMATION_MS = 600;

type OutputVoteSupportedTab =
  | Tab.DraftCaseNotes
  | Tab.ActionItems
  | Tab.StaffFeedback;

const TAB_TO_OUTPUT_VOTE_TAB = {
  [Tab.DraftCaseNotes]: "DRAFT_CASE_NOTES",
  [Tab.ActionItems]: "ACTION_ITEMS",
  [Tab.StaffFeedback]: "STAFF_FEEDBACK",
} as const satisfies Record<OutputVoteSupportedTab, OutputVoteTab>;

const VOTE_BUTTONS = {
  UP: {
    label: "Thumbs up",
    Icon: OutlineThumbUpIcon,
    selectedClassName: "bg-brand-light",
    selectedIconClassName: "stroke-brand",
  },
  DOWN: {
    label: "Thumbs down",
    Icon: OutlineThumbDownIcon,
    selectedClassName: "bg-attention-light-secondary",
    selectedIconClassName: "stroke-attention",
  },
} as const satisfies Record<OutputVoteValue, unknown>;

type VoteButtonProps = {
  vote: OutputVoteValue;
  isSelected: boolean;
  onPress: () => void;
};

const VoteButton = ({ vote, isSelected, onPress }: VoteButtonProps) => {
  const { label, Icon, selectedClassName, selectedIconClassName } =
    VOTE_BUTTONS[vote];

  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      className={clsx(
        "size-10 items-center justify-center rounded-full",
        isSelected ? selectedClassName : "bg-screen",
      )}
    >
      <Icon
        className={clsx(
          "size-5",
          isSelected ? selectedIconClassName : "stroke-tertiary",
        )}
      />
    </Pressable>
  );
};

type OutputVoteProps = {
  meetingDetails: MeetingDetails;
  tab: OutputVoteSupportedTab;
};

const OutputVote = ({ meetingDetails, tab }: OutputVoteProps) => {
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [pendingVote, setPendingVote] = useState<{
    vote: OutputVoteValue;
    isSettled: boolean;
  } | null>(null);
  const utils = trpc.useUtils();
  const { showSnackbar } = useSnackbar();
  const submitOutputVote = trpc.v1.meeting.submitOutputVote.useMutation({
    onSuccess: (_, { vote }) => {
      utils.v1.meeting.getDetails.invalidate({ meetingId: meetingDetails.id });
      if (vote === "UP") {
        showSnackbar(
          "Thanks for your feedback! This helps us improve our tool.",
        );
      }
    },
    onError: () => {
      setPendingVote(null);
      showSnackbar(
        "Something went wrong while submitting your feedback. Please try again.",
      );
    },
  });

  const submitOutputVoteMessage =
    trpc.v1.meeting.submitOutputVoteMessage.useMutation({
      onSuccess: () => {
        utils.v1.meeting.getDetails.invalidate({
          meetingId: meetingDetails.id,
        });
        setIsMessageModalVisible(false);
        showSnackbar(
          "Thanks for your feedback! You’re helping us make the product better",
        );
      },
      onError: () => {
        showSnackbar(
          "Something went wrong while submitting your feedback. Please try again.",
        );
      },
    });

  useEffect(() => {
    if (!pendingVote || pendingVote.isSettled) return;
    const timeout = setTimeout(
      () => setPendingVote({ ...pendingVote, isSettled: true }),
      VOTE_CONFIRMATION_MS + FADE_DURATION_MS,
    );
    return () => clearTimeout(timeout);
  }, [pendingVote]);

  const handleOutputVote = (vote: OutputVoteValue) => {
    if (pendingVote || submitOutputVote.isPending) return;
    setPendingVote({ vote, isSettled: false });
    submitOutputVote.mutate({
      meetingId: meetingDetails.id,
      vote,
      tab: TAB_TO_OUTPUT_VOTE_TAB[tab],
    });
  };

  const outputVoteTab = TAB_TO_OUTPUT_VOTE_TAB[tab];
  const isVoteFadingOut = !!pendingVote && !pendingVote.isSettled;
  const isUpVoteFadingOut = isVoteFadingOut && pendingVote?.vote === "UP";
  const isDownVoteFadingOut = isVoteFadingOut && pendingVote?.vote === "DOWN";
  const currentVote = isVoteFadingOut
    ? undefined
    : pendingVote?.vote ??
      meetingDetails.currentOutputVotes?.[outputVoteTab]?.vote;
  const votedDown = currentVote === "DOWN";
  const hasOutputVoteMessage =
    !!meetingDetails.currentOutputVotes?.[outputVoteTab]?.message;

  if (hasOutputVoteMessage || currentVote === "UP") return null;

  return (
    <>
      <FadeContainer
        isVisible={!isUpVoteFadingOut}
        duration={FADE_DURATION_MS}
        delay={VOTE_CONFIRMATION_MS}
      >
        <View className="min-h-10 flex-row items-center justify-between pt-2">
          <Typography variant="body-m-regular">Was this helpful?</Typography>
          <FadeContainer
            isVisible={!isDownVoteFadingOut}
            duration={FADE_DURATION_MS}
            delay={VOTE_CONFIRMATION_MS}
          >
            {votedDown ? (
              <Pressable
                accessibilityLabel="Give feedback"
                onPress={() => setIsMessageModalVisible(true)}
                className="items-center justify-center rounded-full bg-secondary px-5 py-2.5"
              >
                <Typography variant="body-s-medium">Give feedback</Typography>
              </Pressable>
            ) : (
              <View className="flex-row gap-2">
                <VoteButton
                  vote="UP"
                  isSelected={pendingVote?.vote === "UP"}
                  onPress={() => handleOutputVote("UP")}
                />
                <VoteButton
                  vote="DOWN"
                  isSelected={pendingVote?.vote === "DOWN"}
                  onPress={() => handleOutputVote("DOWN")}
                />
              </View>
            )}
          </FadeContainer>
        </View>
      </FadeContainer>
      <FeedbackMessageModal
        title="Anything else you'd like to tell us?"
        description={`Let us know why this client context is incorrect or incomplete.${Platform.OS === "web" ? "\n" : " "} Your feedback helps us improve AI accuracy`}
        visible={isMessageModalVisible}
        onClose={() => setIsMessageModalVisible(false)}
        onSubmit={(message) =>
          submitOutputVoteMessage.mutate({
            meetingId: meetingDetails.id,
            tab: outputVoteTab,
            message,
          })
        }
        isSubmitting={submitOutputVoteMessage.isPending}
      />
    </>
  );
};

export default OutputVote;
