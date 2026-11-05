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

import { differenceInDays } from "date-fns";

import { jiiTrpc } from "~@meetings/app/shared/api";

import { SuccessPlanner } from "../model/successPlanner";
import { useIsSuccessPlannerVisible } from "./useIsSuccessPlannerVisible";

const RESEND_AFTER_DAYS = 90;

/**
 * Returns whether staff can send a new check-in to the tablet.
 *
 * Currently, we allow re-sending 90 days after the prior check-in's creation, and
 * only after the prior checkin is completed.
 */
export function canResendSuccessPlanner(
  planner: SuccessPlanner,
  now: Date = new Date(),
): boolean {
  if (!planner.completedAt) return false;
  return differenceInDays(now, planner.createdAt) >= RESEND_AFTER_DAYS;
}

type UseSuccessPlannerResult = {
  planner: SuccessPlanner | null;
  canResendSuccessPlanner: boolean;
  isLoading: boolean;
  isError: boolean;
};

export function useSuccessPlanner(
  pseudonymizedId: string,
): UseSuccessPlannerResult {
  const isVisible = useIsSuccessPlannerVisible();
  const { data, isLoading, isError } =
    jiiTrpc.meetingsStaff.usNe.getCheckIn.useQuery(
      { pseudonymizedId },
      { enabled: isVisible },
    );

  if (!isVisible || !data) {
    return {
      planner: null,
      canResendSuccessPlanner: false,
      isLoading,
      isError,
    };
  }

  const planner: SuccessPlanner = {
    id: data.id,
    assignedBy: data.assignedBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    completedAt: data.completedAt,
    answers: data.answers,
    version: data.version,
  };

  return {
    planner,
    canResendSuccessPlanner: canResendSuccessPlanner(planner),
    isLoading,
    isError,
  };
}
