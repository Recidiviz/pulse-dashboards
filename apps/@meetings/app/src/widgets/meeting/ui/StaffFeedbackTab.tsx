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

import { ReactNode } from "react";
import { View } from "react-native";

import type { MeetingDetails } from "~@meetings/app/entities/meeting";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type StaffFeedback = NonNullable<MeetingDetails["staffFeedback"]>;

type Props = {
  staffFeedback: StaffFeedback;
  outputVote?: ReactNode;
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

const StaffFeedbackTab = ({ staffFeedback, outputVote }: Props) => {
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
      {outputVote}
    </View>
  );
};

export default StaffFeedbackTab;
