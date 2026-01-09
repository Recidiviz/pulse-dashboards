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

import { useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";
import { components } from "~@reentry/openapi-types";

interface CreateIntakeProps {
  clientData: components["schemas"]["ClientRecordResponse"];
  onIntakeUpdate: () => void;
  assessmentConfigData: components["schemas"]["AssessmentConfigResponse"];
}

export default function CreateIntake({
  clientData,
  onIntakeUpdate,
  assessmentConfigData,
}: CreateIntakeProps) {
  const [linkLoading, setLinkLoading] = useState(false);
  const auth = useAuth();
  const { trackClientIntakeManuallyEnabled } = useAnalytics();

  const { mutateAsync: startIntakeAsync } = $api.useMutation(
    "post",
    "/intake/admin",
  );

  const startIntake = async () => {
    setLinkLoading(true);
    try {
      trackClientIntakeManuallyEnabled({
        justiceInvolvedPersonId: clientData.pseudonymized_client_id,
      });
      await startIntakeAsync({
        body: {
          client_pseudo_id: clientData.pseudonymized_client_id,
          assessment_config_id: assessmentConfigData.id,
        },
        headers: {
          Authorization: `Bearer ${auth.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      onIntakeUpdate();
      showSuccessToast("Intake enabled successfully");
    } catch {
      showErrorToast("Failed to start intake process");
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <button
      disabled={linkLoading}
      type={"button"}
      onClick={startIntake}
      className="w-full px-4 py-2 text-left hover:bg-[rgba(43,84,105,0.10)] text-cyan-900/80 text-sm font-medium leading-4 font-['Public_Sans']"
    >
      {assessmentConfigData.display_name}
    </button>
  );
}
