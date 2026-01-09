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

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { $api } from "~@reentry/frontend/api";
import WarningCircleIcon from "~@reentry/frontend/components/icons/WarningCircleIcon";
import { useExecutionPolling } from "~@reentry/frontend/hooks/useExecutionPolling";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

interface RetryProcessingProps {
  intakeId: string;
}

const RetryProcessing: React.FC<RetryProcessingProps> = ({ intakeId }) => {
  const { getAccessToken } = useAuth();
  const { startPolling, isPolling, isCompleted } = useExecutionPolling({
    interval: 2000,
  });
  const router = useRouter();

  // Mutation for retry processing
  const { mutateAsync: retryProcessingMutation, isPending: isRetrying } =
    $api.useMutation("post", "/intake/admin/{intake_id}/retry-processing");

  const handleRetryProcessing = async () => {
    try {
      console.log("Starting retry processing for intake:", intakeId);

      const response = await retryProcessingMutation({
        params: {
          path: {
            intake_id: intakeId,
          },
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Retry processing initiated");
      const executionId = response.id;

      if (executionId) {
        console.log("Starting polling for execution:", executionId);
        startPolling(executionId);
      } else {
        console.error("retry-processing did NOT return execution_id");
      }
    } catch (error) {
      console.error("Error retrying processing:", error);
    }
  };

  useEffect(() => {
    if (isCompleted) {
      router.refresh();
    }
  }, [isCompleted]);

  return (
    <div className="flex pl-5 pr-4 py-3 bg-[#FFF3E1] border-l-4 border-[#C78F38] flex-col justify-center items-start gap-4 overflow-hidden mb-2">
      <div className="flex flex-col justify-start items-start gap-2">
        <div className="inline-flex justify-start items-center gap-2">
          <WarningCircleIcon />
          <div className="font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
            The assessment has failed to process.
          </div>

          {isRetrying || isPolling ? (
            <span className="font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
              Retrying...
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRetryProcessing}
              disabled={isRetrying}
              className=" inline-flex items-center gap-2 px-4 py-2 rounded-full
                      border border-[#006B66]/30
                      bg-[#006B66]/5
                      text-[#006c67]
                      text-sm font-medium
                      transition-all
                      hover:bg-[#006c67]/15
                      hover:border-[#006c67]/50
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006c67]/40
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
            >
              <span className="leading-[120%] tracking-[-0.14px]">
                retry processing
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetryProcessing;
