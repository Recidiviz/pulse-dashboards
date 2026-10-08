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

import { format } from "date-fns";

import { SuccessPlanner, SuccessPlannerStatus } from "../model/successPlanner";
import { getSuccessPlannerProgress } from "./getSuccessPlannerProgress";

const STATUS_LABELS: Record<SuccessPlannerStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export function formatSenderName(assignedBy: string): string {
  const [localPart] = assignedBy.split("@");
  const [first, last] = localPart.split(".");

  if (!first || !last) return assignedBy;

  return `${first[0].toUpperCase()}. ${last[0].toUpperCase()}${last.slice(1)}`;
}

export type SuccessPlannerSummary = {
  status: SuccessPlannerStatus;
  statusLabel: string;
  title: string;
  subtitle: string;
  actionLabel: string;
};

export function getSuccessPlannerSummary(
  planner: SuccessPlanner,
): SuccessPlannerSummary {
  const { status, completedSectionCount, totalSectionCount } =
    getSuccessPlannerProgress(planner);
  const sender = formatSenderName(planner.assignedBy);
  const sentOn = format(planner.createdAt, "MMM d");

  switch (status) {
    case "NOT_STARTED":
      return {
        status,
        statusLabel: STATUS_LABELS[status],
        title: "120-Day Check-In",
        subtitle: `Sent to tablet by ${sender} on ${format(planner.createdAt, "MMM d, yyyy")}`,
        actionLabel: "Open",
      };
    case "IN_PROGRESS":
      return {
        status,
        statusLabel: STATUS_LABELS[status],
        title: `120-Day Check-In — ${completedSectionCount} of ${totalSectionCount} sections`,
        subtitle: `Sent by ${sender} on ${sentOn} · last updated ${format(planner.updatedAt, "MMM d, h:mmaaa")}`,
        actionLabel: "Open",
      };
    case "COMPLETED":
      return {
        status,
        statusLabel: STATUS_LABELS[status],
        title: `120-Day Check-In — completed ${planner.completedAt ? format(planner.completedAt, "MMM d, yyyy") : ""}`,
        subtitle: `Sent by ${sender} on ${sentOn} · all ${totalSectionCount} sections answered`,
        actionLabel: "View responses",
      };
  }
}
