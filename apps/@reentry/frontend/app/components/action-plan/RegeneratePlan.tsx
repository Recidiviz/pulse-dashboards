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

import type { PathsWithMethod } from "openapi-typescript-helpers";
import { useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { InfoTooltip } from "~@reentry/frontend/components/base/InfoTooltip";
import PrimaryButton from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useAuth } from "~@reentry/frontend/lib/auth";
import type { components, paths } from "~@reentry/frontend/recidiviz-schema";

const RegeneratePlan = ({
  planId,
  startPolling,
  setRegenerationMessage,
  dataDetailPlan,
  isPolling = false,
  clientRecord,
}) => {
  const { getAccessToken } = useAuth();
  const { track } = useAnalytics();
  const [prompt, setPrompt] = useState<string>("");
  const { mutateAsync: generatePlanMutation } = $api.useMutation(
    "post",
    "/plans/{id}/generate" as PathsWithMethod<paths, "post">,
  );
  const planEditedManually = dataDetailPlan?.edited_manually;
  const handleRegenerate = async () => {
    track("action_plan_regeneration_triggered", {
      justiceInvolvedPersonId: clientRecord.pseudonymized_client_id,
      planId: planId,
    });
    setRegenerationMessage(`Regenerating plan with new prompt: ${prompt}`);
    const response: components["schemas"]["PlanGenerationResponseCreate"] =
      await generatePlanMutation({
        params: {
          path: {
            id: planId as string,
          },
        },
        // @ts-expect-error: body is optional
        body: {
          prompt: prompt || "",
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
    startPolling(response.execution_id);
    setPrompt("");
  };

  return (
    <div className="self-stretch h-auto px-2 md:px-8 py-6 border-b border-[#2b5469]/20 flex-col justify-start items-start gap-3 flex">
      {planEditedManually && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
          <div className="flex items-start">
            <div>
              <h3 className="font-medium text-amber-800 text-[12px]">
                Regeneration Unavailable
              </h3>
              <p className="text-amber-700 text-[10px] mt-1">
                This action plan has been manually edited and cannot be
                regenerated. Manual edits would be lost if regenerated.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`justify-start items-center gap-1 md:gap-2 inline-flex ${planEditedManually && "opacity-50"}`}
      >
        <div className="text-[#002321] text-sm font-medium leading-[16.80px]">
          Prompt to Regenerate Plan
        </div>
        <InfoTooltip
          text="Update this plan by prompting AI to make edits."
          position="top"
        />
      </div>
      <div
        className={`self-stretch flex-col justify-start items-start gap-2 flex ${planEditedManually && "opacity-50"}`}
      >
        <textarea
          className={`text-[#002321] text-sm rounded-lg border border-[#2b5469]/20 w-full px-2 ${planEditedManually && "bg-gray-100"}`}
          rows={4}
          cols={30}
          value={prompt}
          disabled={planEditedManually || isPolling}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <PrimaryButton
          className={"!max-w-[300px] !self-center !w-full"}
          buttonText="Regenerate"
          disabled={!prompt || planEditedManually || isPolling}
          onClick={handleRegenerate}
        />
      </div>
    </div>
  );
};

export default RegeneratePlan;
