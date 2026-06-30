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
import { Pressable, View } from "react-native";
import OutlineThumbDownIcon from "react-native-heroicons/outline/ThumbDownIcon";
import OutlineThumbUpIcon from "react-native-heroicons/outline/ThumbUpIcon";

import { MeetingDetails } from "~@meetings/app/entities/meeting";
import { trpc } from "~@meetings/app/shared/api";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import type { OutputVoteTab, OutputVoteValue } from "~@meetings/trpc-types";

import { Tab } from "./MeetingTabs";
import OutputVoteMessageModal from "./OutputVoteMessageModal";

type OutputVoteSupportedTab =
  | Tab.DraftCaseNotes
  | Tab.ActionItems
  | Tab.StaffFeedback;

const TAB_TO_OUTPUT_VOTE_TAB = {
  [Tab.DraftCaseNotes]: "DRAFT_CASE_NOTES",
  [Tab.ActionItems]: "ACTION_ITEMS",
  [Tab.StaffFeedback]: "STAFF_FEEDBACK",
} as const satisfies Record<OutputVoteSupportedTab, OutputVoteTab>;

type OutputVoteProps = {
  meetingDetails: MeetingDetails;
  tab: OutputVoteSupportedTab;
};

const OutputVote = ({ meetingDetails, tab }: OutputVoteProps) => {
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const utils = trpc.useUtils();
  const submitOutputVote = trpc.v1.meeting.submitOutputVote.useMutation({
    onSettled: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId: meetingDetails.id });
    },
  });

  const handleOutputVote = (vote: OutputVoteValue) => {
    if (submitOutputVote.isPending) return;
    submitOutputVote.mutate({
      meetingId: meetingDetails.id,
      vote,
      tab: TAB_TO_OUTPUT_VOTE_TAB[tab],
    });
  };

  const outputVoteTab = TAB_TO_OUTPUT_VOTE_TAB[tab];
  const currentVote = meetingDetails.currentOutputVotes?.[outputVoteTab]?.vote;
  const votedDown = currentVote === "DOWN";
  const hasOutputVoteMessage =
    !!meetingDetails.currentOutputVotes?.[outputVoteTab]?.message;

  if (hasOutputVoteMessage || currentVote === "UP") return null;

  return (
    <>
      <View className="flex-row items-center justify-between pt-2">
        <Typography className="text-base text-primary">
          Was this helpful?
        </Typography>
        {votedDown ? (
          <Pressable
            accessibilityLabel="Give feedback"
            onPress={() => setIsMessageModalVisible(true)}
            className="items-center justify-center rounded-full bg-secondary px-5 py-2.5"
          >
            <Typography className="text-sm font-medium text-primary">
              Give feedback
            </Typography>
          </Pressable>
        ) : (
          <View className="flex-row gap-2">
            <Pressable
              accessibilityLabel="Thumbs up"
              onPress={() => handleOutputVote("UP")}
              className="size-10 items-center justify-center rounded-full bg-secondary"
            >
              <OutlineThumbUpIcon className="size-5 stroke-tertiary" />
            </Pressable>
            <Pressable
              accessibilityLabel="Thumbs down"
              onPress={() => handleOutputVote("DOWN")}
              className="size-10 items-center justify-center rounded-full bg-secondary"
            >
              <OutlineThumbDownIcon className="size-5 stroke-tertiary" />
            </Pressable>
          </View>
        )}
      </View>
      <OutputVoteMessageModal
        visible={isMessageModalVisible}
        onClose={() => setIsMessageModalVisible(false)}
        meetingId={meetingDetails.id}
        tab={outputVoteTab}
      />
    </>
  );
};

export default OutputVote;
