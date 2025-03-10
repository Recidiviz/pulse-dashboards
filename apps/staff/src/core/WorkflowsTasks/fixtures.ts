// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  SUPERVISION_NEED_TYPES,
  SUPERVISION_TASK_TYPES,
  SupervisionNeedType,
} from "../../WorkflowsStore/Task/types";

export const TEMPORAL_TASK_CATEGORIES = [
  "ALL_TASKS",
  "OVERDUE",
  "DUE_THIS_WEEK",
  "DUE_THIS_MONTH",
] as const;

export const SUPERVISION_TASK_CATEGORIES = [
  "ALL_TASKS_OLD",
  ...TEMPORAL_TASK_CATEGORIES,
  ...SUPERVISION_TASK_TYPES,
  ...SUPERVISION_NEED_TYPES,
] as const;
export type SupervisionTaskCategory =
  (typeof SUPERVISION_TASK_CATEGORIES)[number];

export const TASK_SELECTOR_LABELS: Record<SupervisionTaskCategory, string> = {
  ALL_TASKS: "All tasks",
  ALL_TASKS_OLD: "Due this month",
  OVERDUE: "Overdue",
  DUE_THIS_WEEK: "Due this week",
  DUE_THIS_MONTH: "Due this month",
  assessment: "Risk Assessments",
  contact: "Contacts",
  homeVisit: "Home Contacts",
  employment: "Employment Verification",
  employmentNeed: "Unemployed",
  usTxHomeContactScheduled: "Home Contacts (Scheduled)",
  usTxHomeContactUnscheduled: "Home Contacts (Unscheduled)",
  usTxFieldContactScheduled: "Field Contacts (Scheduled)",
  usTxFieldContactUnscheduled: "Field Contacts (Unscheduled)",
  usTxElectronicContactScheduled: "Electronic Contacts (Scheduled)",
  usTxElectronicContactUnscheduled: "Electronic Contacts (Unscheduled)",
  usTxAssessment: "Assessments",
};

export const NEED_DISPLAY_NAME: Record<SupervisionNeedType, string> = {
  employmentNeed: "Unemployed",
} as const;
