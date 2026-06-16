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

"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import ResourceBankLayout from "~@reentry/frontend/components/action-plan/ResourceBankLayout";
import LoadingState from "~@reentry/frontend/components/auth/LoadingState";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useExecutionPolling } from "~@reentry/frontend/hooks/useExecutionPolling";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

const ActionPlanPage = () => {
  const { planId }: { planId: string } = useParams();
  const { getAccessToken } = useAuth();

  // Track if outputs are disabled (403 error)
  const [outputsDisabled, setOutputsDisabled] = useState(false);

  // ----------- Loading and regeneration reloading ------------
  const { isCompleted, startPolling } = useExecutionPolling({ interval: 5000 });

  const {
    data: dataDetailPlan,
    refetch: refetchDetailPlan,
    error: errorDetailPlan,
    isLoading: isLoadingDetailPlan,
  } = $api.useQuery("get", "/plans/{id}", {
    params: {
      path: {
        id: planId,
      },
    },
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  useEffect(() => {
    // Check if there's an active generation in progress
    const latestGeneration = dataDetailPlan?.latest_generation;
    const generationInProgress =
      latestGeneration?.status === "in_progress" ||
      latestGeneration?.status === "pending";

    // If generation is in progress and we have an execution ID, poll that
    if (generationInProgress && latestGeneration?.execution_id) {
      startPolling(latestGeneration.execution_id as string);
    }
    // Fallback to create execution for initial plan creation
    else if (
      (dataDetailPlan?.create_status === "in_progress" ||
        dataDetailPlan?.create_status === "pending") &&
      dataDetailPlan?.create_execution_id
    ) {
      startPolling(dataDetailPlan.create_execution_id as string);
    }
  }, [
    dataDetailPlan?.create_status,
    dataDetailPlan?.create_execution_id,
    dataDetailPlan?.latest_generation,
    startPolling,
  ]);

  const { mutate: markSeen } = $api.useMutation("post", "/seen-items");

  useEffect(() => {
    if (
      dataDetailPlan?.create_status == "completed" &&
      dataDetailPlan?.intake_id
    ) {
      markSeen({
        body: {
          intake_id: dataDetailPlan.intake_id,
          item_type: "action_plan",
          item_id: planId,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
    }
  }, [dataDetailPlan?.is_create_execution_finished, dataDetailPlan?.intake_id]);

  useEffect(() => {
    if (errorDetailPlan) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = errorDetailPlan as any;
      if (
        error?.detail ===
        "Outputs are disabled for this assessment because they are under revision"
      ) {
        setOutputsDisabled(true);
      }
    }
  }, [errorDetailPlan]);

  //----------- Resources --------------
  // Get current plan resources - from the API instead of parsing from markdown
  const { refetch: refetchPlanResources } = $api.useQuery(
    "get",
    "/plans/{id}/resources",
    {
      params: {
        path: {
          id: dataDetailPlan?.id as string,
        },
      },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: !!dataDetailPlan?.id },
  ); // Only enable when plan ID is available

  useEffect(() => {
    if (isCompleted) {
      refetchDetailPlan();
      refetchPlanResources();
    }
  }, [isCompleted, refetchDetailPlan, refetchPlanResources]);

  if (isLoadingDetailPlan) return <LoadingState />;

  if (outputsDisabled || !dataDetailPlan?.id)
    return (
      <div className="flex flex-col items-center space-y-4 w-full h-full justify-center ">
        <span className="text-[#003331] text-lg font-medium">
          {outputsDisabled
            ? "Outputs are disabled for this assessment because they are under revision"
            : "Failed to generate the plan, please try again or contact support."}
        </span>
      </div>
    );

  return (
    <>
      <PageView />
      <ResourceBankLayout planDetail={dataDetailPlan} />
    </>
  );
};

export default ActionPlanPage;
