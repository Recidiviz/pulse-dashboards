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

import React from "react";

import DocumentIcon from "../assets/document.svg?react";
import HomeIcon from "../assets/home.svg?react";
import BedIcon from "../assets/tabler-icon-bed.svg?react";
import CircleCheckIcon from "../assets/tabler-icon-circle-check.svg?react";
import NotesIcon from "../assets/tabler-icon-notes.svg?react";
import TimelineIcon from "../assets/timeline.svg?react";
import { ProvidersTabBadge } from "./StaffPreviewModal/ProvidersTabBadge";
import type { PreviewTab } from "./types";

export const TAB_IDS = {
  APPLICATION_DETAILS: "applicationDetails",
  PROVIDERS: "providers",
  APPROVALS: "approvals",
  HOME_PLAN: "homePlan",
  DOCUMENTS: "documents",
  TIMELINE: "timeline",
} as const;

export const APPROVALS_ACTION = {
  CLOSE_CASE: "CLOSE_CASE",
  ADVANCE_TO_RELEASE: "ADVANCE_TO_RELEASE",
} as const;

/** What a confirmed approvals Save does to the case. */
export type ApprovalsAction =
  (typeof APPROVALS_ACTION)[keyof typeof APPROVALS_ACTION];

export type TabDef = {
  id: PreviewTab;
  label: string;
  Icon: React.FC;
  Badge?: React.FC<{ detailLoaded?: boolean }>;
};

const APPLICATION_DETAILS_TAB: TabDef = {
  id: TAB_IDS.APPLICATION_DETAILS,
  label: "Application Details",
  Icon: NotesIcon,
};
const HOME_PLAN_TAB: TabDef = {
  id: TAB_IDS.HOME_PLAN,
  label: "Home Plan",
  Icon: HomeIcon,
};
const DOCUMENTS_TAB: TabDef = {
  id: TAB_IDS.DOCUMENTS,
  label: "Documents",
  Icon: DocumentIcon,
};

export const STAFF_TABS: TabDef[] = [
  APPLICATION_DETAILS_TAB,
  {
    id: TAB_IDS.PROVIDERS,
    label: "Providers",
    Icon: BedIcon,
    Badge: ProvidersTabBadge,
  },
  // Termer / Parole Violator cases only — see getVisibleStaffTabs.
  {
    id: TAB_IDS.APPROVALS,
    label: "Approvals",
    Icon: CircleCheckIcon,
  },
  HOME_PLAN_TAB,
  DOCUMENTS_TAB,
  {
    id: TAB_IDS.TIMELINE,
    label: "Timeline",
    Icon: TimelineIcon,
  },
];

export const PROVIDER_TABS: TabDef[] = [
  APPLICATION_DETAILS_TAB,
  HOME_PLAN_TAB,
  DOCUMENTS_TAB,
  {
    id: TAB_IDS.TIMELINE,
    label: "Timeline",
    Icon: TimelineIcon,
  },
];
