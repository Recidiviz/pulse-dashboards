// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Pressable, ScrollView } from "react-native";
import LockClosedIcon from "react-native-heroicons/solid/LockClosedIcon";

import type {
  FlaggedSection,
  FlaggedSections,
} from "~@meetings/app/entities/meeting";
import { ReviewIndicator } from "~@meetings/app/features/meeting-section-approval";
import { Typography } from "~@meetings/app/shared/ui/Typography";

export enum Tab {
  DraftCaseNotes = "Draft Case Notes",
  ActionItems = "Action Items",
  Transcript = "Transcript",
  StaffFeedback = "Staff Feedback",
}

type SectionApproval = { isApproved: boolean };

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isTranscriptionUnavailable?: boolean;
  showTranscription: boolean;
  showStaffFeedback: boolean;
  tabOrder?: Tab[];
  // Only Draft Case Notes and Action Items are approvable; other tabs never
  // show a review indicator regardless of this being set.
  approvals?: Record<FlaggedSection, SectionApproval>;
  flaggedSections?: FlaggedSections;
};

const TAB_TO_SECTION: Partial<Record<Tab, FlaggedSection>> = {
  [Tab.DraftCaseNotes]: "caseNote",
  [Tab.ActionItems]: "actionItems",
};

const MeetingTabs = ({
  activeTab,
  setActiveTab,
  isTranscriptionUnavailable,
  showTranscription,
  showStaffFeedback,
  tabOrder = Object.values(Tab),
  approvals,
  flaggedSections,
}: Props) => {
  const visibleTabs = tabOrder.filter((tab) => {
    if (tab === Tab.Transcript) return showTranscription;
    if (tab === Tab.StaffFeedback) return showStaffFeedback;
    return true;
  });

  const getReviewForTab = (tab: Tab) => {
    const section = TAB_TO_SECTION[tab];
    if (!section || !approvals) return undefined;
    return {
      isApproved: approvals[section].isApproved,
      isFlagged: flaggedSections?.[section].needsEdit,
    };
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-1 bg-screen rounded-full p-1"
    >
      {visibleTabs.map((tab) => {
        const review = getReviewForTab(tab);

        return (
          <Pressable
            key={tab}
            className={`shrink-0 flex-row items-center justify-center gap-2 rounded-full px-4 py-1.5 ${tab === activeTab ? "bg-primary" : "bg-transparent"}`}
            onPress={() => setActiveTab(tab)}
            disabled={tab === Tab.Transcript && isTranscriptionUnavailable}
            style={
              tab === activeTab
                ? {
                    shadowColor: "#000000",
                    shadowOffset: { width: 3, height: 5 },
                    shadowRadius: 30,
                    shadowOpacity: 0.05,
                    elevation: 5,
                  }
                : undefined
            }
          >
            {review && <ReviewIndicator {...review} />}
            <Typography
              className={`text-base ${tab === activeTab ? "text-primary" : "text-secondary"}`}
            >
              {tab}
            </Typography>
            {tab === Tab.Transcript && isTranscriptionUnavailable && (
              <LockClosedIcon className="size-3 fill-disabled" />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default MeetingTabs;
