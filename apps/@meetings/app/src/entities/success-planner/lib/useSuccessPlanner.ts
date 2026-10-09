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

import { jiiTrpc } from "~@meetings/app/shared/api";

import { SuccessPlanner } from "../model/successPlanner";
import { useIsSuccessPlannerVisible } from "./useIsSuccessPlannerVisible";

type UseSuccessPlannerResult = {
  planner: SuccessPlanner | null;
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

  if (!isVisible || !data) return { planner: null, isLoading, isError };

  return {
    planner: {
      id: data.id,
      assignedBy: data.assignedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      completedAt: data.completedAt,
      answers: data.answers,
    },
    isLoading,
    isError,
  };
}
