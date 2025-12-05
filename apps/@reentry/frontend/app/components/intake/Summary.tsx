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

import { Grid, Paper } from "@mui/material";
import { useState } from "react";

import { $api } from "~@reentry/frontend/api";
import AudioRecordings from "~@reentry/frontend/components/intake/VoiceIntake/AudioRecordings";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { trpc } from "~@reentry/frontend/trpc";
import {
  PrimaryButton,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

interface ClientSummaryCardProps {
  clientRecord: components["schemas"]["ClientRecordResponse"];
  onIntakeUpdate: () => void;
  intake:
    | components["schemas"]["IntakeWithSectionsResponse"]
    | null
    | undefined;
}

interface SummaryBodyProps {
  clientRecord: components["schemas"]["ClientRecordResponse"];
  intake:
    | components["schemas"]["IntakeWithSectionsResponse"]
    | null
    | undefined;
  intakeStatus?: string;
  isIntakeEnabled: boolean;
  linkLoading: boolean;
  startIntake: () => Promise<void>;
  cleanedBaseUrl: string;
}

const SummaryBody: React.FC<SummaryBodyProps> = ({
  clientRecord,
  linkLoading,
  startIntake,
}) => {
  return (
    <div className="w-full">
      <Paper square={false} elevation={0} className="w-full max-w-7xl mx-auto">
        <div className="">
          <Grid container>
            {clientRecord.state_code !== "US_AZ" ? (
              <PrimaryButton
                buttonText="Enable Intake"
                disabled={linkLoading}
                className="inline-flex items-center px-5 py-2 text-white text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case"
                onClick={startIntake}
              />
            ) : (
              <AudioRecordings
                clientPseudoId={clientRecord.pseudonymized_client_id}
                onIntakeUpdate={() => {
                  console.log("Intake updated");
                }}
              />
            )}
          </Grid>
        </div>
      </Paper>
    </div>
  );
};

// V1 (non-tRPC) component
const ClientSummaryCardLegacy: React.FC<ClientSummaryCardProps> = ({
  clientRecord,
  onIntakeUpdate,
  intake,
}) => {
  const [linkLoading, setLinkLoading] = useState(false);
  const auth = useAuth();
  const { trackClientIntakeManuallyEnabled } = useAnalytics();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const { mutateAsync: startIntakeAsync } = $api.useMutation(
    "post",
    "/intake/admin/{client_pseudo_id}",
  );

  const startIntake = async () => {
    setLinkLoading(true);
    try {
      trackClientIntakeManuallyEnabled({
        justiceInvolvedPersonId: clientRecord.pseudonymized_client_id,
      });
      await startIntakeAsync({
        params: {
          path: { client_pseudo_id: clientRecord.pseudonymized_client_id },
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

  const cleanedBaseUrl = baseUrl.replace(/^https?:\/\//, "");

  return (
    <SummaryBody
      clientRecord={clientRecord}
      intake={intake}
      isIntakeEnabled={Boolean(intake)}
      linkLoading={linkLoading}
      startIntake={startIntake}
      cleanedBaseUrl={cleanedBaseUrl}
    />
  );
};

// V2 (tRPC-enabled) component
const ClientSummaryCardV2: React.FC<ClientSummaryCardProps> = ({
  clientRecord,
  intake,
}) => {
  const auth = useAuth();
  const { trackClientIntakeManuallyEnabled } = useAnalytics();
  const [linkLoading, setLinkLoading] = useState(false);
  const clientPseudoId = clientRecord.pseudonymized_client_id;
  const staffPseudoId = auth.userAppMetadata?.pseudonymizedId || "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const utils = trpc.useUtils();

  const { data: intakeInfo, isLoading } = trpc.staff.getIntakeEnabled.useQuery({
    clientPseudoId,
  });
  const { data: clientStatusOverride, isLoading: isLoadingClientStatus } =
    trpc.staff.getClientIntakeStatus.useQuery({
      staffPseudoId,
      clientPseudoId,
    });

  const toggleIntake = trpc.staff.toggleIntake.useMutation({
    onSettled: () => {
      utils.staff.getIntakeEnabled.invalidate({ clientPseudoId });
      utils.staff.getClientIntakeStatus.invalidate({ clientPseudoId });
    },
  });

  const startIntake = async () => {
    trackClientIntakeManuallyEnabled({
      justiceInvolvedPersonId: clientPseudoId,
    });
    setLinkLoading(true);
    try {
      await toggleIntake.mutateAsync({
        clientPseudoId,
        enable: true,
      });
      showSuccessToast("Intake enabled successfully");
    } catch {
      showErrorToast("Failed to start intake process");
    } finally {
      setLinkLoading(false);
    }
  };

  const cleanedBaseUrl = baseUrl.replace(/^https?:\/\//, "");

  if (isLoading || isLoadingClientStatus) {
    return <Loading />;
  }

  return (
    <SummaryBody
      clientRecord={clientRecord}
      intake={intake}
      intakeStatus={clientStatusOverride}
      isIntakeEnabled={Boolean(intakeInfo?.intakeEnabled)}
      linkLoading={linkLoading}
      startIntake={startIntake}
      cleanedBaseUrl={cleanedBaseUrl}
    />
  );
};

const ClientSummaryCard: React.FC<ClientSummaryCardProps> = IS_V2_INTAKE_CHAT
  ? ClientSummaryCardV2
  : ClientSummaryCardLegacy;

export default ClientSummaryCard;
