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

import { Pressable, View } from "react-native";
import OutlineThumbDownIcon from "react-native-heroicons/outline/ThumbDownIcon";
import OutlineThumbUpIcon from "react-native-heroicons/outline/ThumbUpIcon";
import SolidThumbDownIcon from "react-native-heroicons/solid/ThumbDownIcon";
import SolidThumbUpIcon from "react-native-heroicons/solid/ThumbUpIcon";

import type { MeetingDetails } from "~@meetings/app/entities/meeting";
import { trpc } from "~@meetings/app/shared/api";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type StaffFeedback = NonNullable<MeetingDetails["staffFeedback"]>;
type Vote = MeetingDetails["currentFeedbackVote"];

type Props = {
  meetingId: string;
  staffFeedback: StaffFeedback;
  currentVote: Vote;
  // Only the staff member who created the meeting can vote on feedback.
  canVote: boolean;
};

type SectionVariant = "positive" | "growth";

const SECTION_STYLES: Record<
  SectionVariant,
  { container: string; bar: string }
> = {
  positive: {
    container: "bg-[#EAF1FB]",
    bar: "bg-[#7FA5D9]",
  },
  growth: {
    container: "bg-[#FBF4E8]",
    bar: "bg-[#D9B97F]",
  },
};

const FeedbackCard = ({
  title,
  items,
  variant,
  emptyMessage,
}: {
  title: string;
  items: string[];
  variant: SectionVariant;
  emptyMessage: string;
}) => {
  const styles = SECTION_STYLES[variant];
  return (
    <View className={`gap-3 rounded-xl p-5 ${styles.container}`}>
      <Typography className="text-base text-primary">{title}</Typography>
      {items.length === 0 ? (
        <View className="flex-row gap-3">
          <View className={`w-0.5 self-stretch rounded-full ${styles.bar}`} />
          <Typography className="flex-1 text-base leading-6 tracking-[-0.32px] text-primary">
            {emptyMessage}
          </Typography>
        </View>
      ) : (
        items.map((item, index) => (
          <View key={index} className="flex-row gap-3">
            <View className={`w-0.5 self-stretch rounded-full ${styles.bar}`} />
            <Typography className="flex-1 text-base leading-6 tracking-[-0.32px] text-primary">
              {item}
            </Typography>
          </View>
        ))
      )}
    </View>
  );
};

const StaffFeedbackTab = ({
  meetingId,
  staffFeedback,
  currentVote,
  canVote,
}: Props) => {
  const utils = trpc.useUtils();
  const voteFeedback = trpc.v1.meeting.voteFeedback.useMutation({
    onSettled: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
    },
  });

  const handleVote = (vote: NonNullable<Vote>) => {
    if (voteFeedback.isPending) return;
    voteFeedback.mutate({ meetingId, vote });
  };

  const isUp = currentVote === "UP";
  const isDown = currentVote === "DOWN";

  return (
    <View className="flex-1 gap-5 pb-4">
      <Typography className="text-xl font-semibold text-primary">
        Staff Feedback
      </Typography>
      <FeedbackCard
        title="What you did well"
        items={staffFeedback.whatYouDidWell}
        variant="positive"
        emptyMessage="No highlights flagged for this meeting."
      />
      <FeedbackCard
        title="Growth opportunities"
        items={staffFeedback.growthOpportunities}
        variant="growth"
        emptyMessage="No growth opportunities flagged for this meeting."
      />
      {canVote && (
        <View className="flex-row items-center justify-between pt-2">
          <Typography className="text-base text-primary">
            Was this helpful?
          </Typography>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityLabel="Thumbs up"
              onPress={() => handleVote("UP")}
              className={`size-10 items-center justify-center rounded-full ${
                isUp ? "bg-primary" : "bg-secondary"
              }`}
            >
              {isUp ? (
                <SolidThumbUpIcon className="size-5 fill-on-strong" />
              ) : (
                <OutlineThumbUpIcon className="size-5 stroke-tertiary" />
              )}
            </Pressable>
            <Pressable
              accessibilityLabel="Thumbs down"
              onPress={() => handleVote("DOWN")}
              className={`size-10 items-center justify-center rounded-full ${
                isDown ? "bg-primary" : "bg-secondary"
              }`}
            >
              {isDown ? (
                <SolidThumbDownIcon className="size-5 fill-on-strong" />
              ) : (
                <OutlineThumbDownIcon className="size-5 stroke-tertiary" />
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default StaffFeedbackTab;
