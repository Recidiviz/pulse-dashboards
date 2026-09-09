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

import { MeetingDetails } from "~@meetings/app/entities/meeting";
import {
  type ApprovableSectionKey,
  useApproveSection,
} from "~@meetings/app/features/meeting-section-approval";

import { Tab } from "../ui/MeetingTabs";
import { getSectionApprovalByTab } from "./getSectionApprovalByTab";

// Shared between MeetingDesktop and MeetingMobile: tracks the "I've reviewed
// this" checkbox — a single local, pre-approval toggle (same behavior for
// both Draft Case Notes and Action Items). Nothing here touches the backend;
// the only real request is submitted by handleConfirmApproval.
export function useApprovalFooter(
  meetingId: string,
  activeTab: Tab,
  meetingDetails: MeetingDetails,
  isMeetingCreator: boolean,
) {
  const [isApprovalChecked, setIsApprovalChecked] = useState(false);

  // Reset when switching tabs so one section's "reviewed" state doesn't
  // leak into another's.
  useEffect(() => {
    setIsApprovalChecked(false);
  }, [activeTab]);

  const approveSection = useApproveSection(meetingId);

  const activeSectionApproval = getSectionApprovalByTab(
    activeTab,
    meetingDetails.approvals,
  );

  // The reviewer must have actually changed something before they can mark
  // it reviewed — untouched LLM output can't be "confirmed accurate".
  const hasBeenEdited =
    activeTab === Tab.DraftCaseNotes
      ? meetingDetails.caseNoteEditedAt !== null
      : meetingDetails.meetingActionItems.some(
          (item) => item.editedTask !== null,
        );

  const isFooterChecked = isApprovalChecked;

  const handleFooterCheckedChange = () => {
    if (!hasBeenEdited) return;
    setIsApprovalChecked(!isApprovalChecked);
  };

  const handleConfirmApproval = () => {
    if (approveSection.isPending) return;

    let section: ApprovableSectionKey | null = null;
    if (activeTab === Tab.DraftCaseNotes) section = "caseNote";
    if (activeTab === Tab.ActionItems) section = "actionItems";
    if (!section) return;

    approveSection.setApproval(section, "APPROVED");
  };

  // Only Draft Case Notes and Action Items have an approvable section
  // (activeSectionApproval is undefined for Transcript/Staff Feedback).
  const shouldShowFooter =
    activeSectionApproval !== undefined &&
    (activeSectionApproval.isApproved || isMeetingCreator);

  return {
    activeSectionApproval,
    isFooterChecked,
    hasBeenEdited,
    handleFooterCheckedChange,
    handleConfirmApproval,
    isConfirmPending: approveSection.isPending,
    shouldShowFooter,
  };
}
