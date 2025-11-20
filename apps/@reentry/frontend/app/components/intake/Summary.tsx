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

import { Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { FiLink } from "react-icons/fi";

import { $api } from "~@reentry/frontend/api";
import AudioRecordings from "~@reentry/frontend/components/intake/VoiceIntake/AudioRecordings";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { trpc } from "~@reentry/frontend/trpc";
import { formatDateMMDDYYYY } from "~@reentry/frontend/utils/index";
import { getStateName } from "~@reentry/frontend/utils/states";
import {
  PrimaryButton,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

const formatAddress = (
  address: components["schemas"]["AddressSubmission"] | null | undefined,
): string | null => {
  if (!address) return null;
  const parts: string[] = [];
  if (address.street_address?.trim()) parts.push(address.street_address.trim());
  if (address.city?.trim()) parts.push(address.city.trim());
  if (address.state?.trim()) parts.push(address.state.trim());
  return parts.length > 0 ? parts.join(", ") : null;
};

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
  intake,
  intakeStatus,
  isIntakeEnabled,
  linkLoading,
  startIntake,
  cleanedBaseUrl,
}) => {
  const status = intakeStatus ?? intake?.status;

  return (
    <div className="px-4 sm:px-6 mb-6 w-full">
      <Paper
        square={false}
        elevation={0}
        sx={{ borderRadius: "24px", border: "1px solid #2B546933" }}
        className="w-full max-w-7xl mx-auto"
      >
        <div className="p-6 pb-4 flex items-center justify-between">
          <Typography
            variant="h6"
            className="text-[#003331] text-base font-semibold"
          >
            Summary
          </Typography>
        </div>
        <div className="border-t border-gray-200">
          <Grid container>
            <Grid item xs={12} md={5} className="border-r border-gray-200">
              <div className="p-6 space-y-4 max-w-sm m-auto">
                {[
                  [
                    "Full name",
                    `${clientRecord?.full_name?.given_names} ${clientRecord.full_name.surname}`,
                    "full_name",
                  ],
                  [
                    "Birth date",
                    formatDateMMDDYYYY(clientRecord.birthdate),
                    "birthdate",
                  ],
                  ["Address", formatAddress(intake?.address), "address"],
                  ["State", getStateName(clientRecord.state_code), "state"],
                ].map(([label, value, key]) => (
                  <div className="flex justify-between" key={key}>
                    <div>
                      <Typography className="text-[14px] font-medium leading-4 tracking-[-0.01em] text-[#012322] font-['Public_Sans']">
                        {label}
                      </Typography>
                    </div>
                    <div className="ml-2">
                      <Typography className="text-right text-[14px] font-medium leading-4 tracking-[-0.01em] font-['Public_Sans'] text-[#2B5469D9]">
                        {value || "—"}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            </Grid>
            {clientRecord.state_code !== "US_AZ" && (
              <Grid item xs={12} md={7} className="border-r border-gray-200">
                <div className="bg-white rounded-lg shadow-sm p-6 md:p-10">
                  {isIntakeEnabled ? (
                    <>
                      <div className="flex justify-between md:pl-5 gap-2 md:gap-0">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-700">Status:</span>
                          <span
                            className={`ml-3 px-3 py-1 rounded-full text-xs ${
                              // eslint-disable-next-line no-nested-ternary
                              status === "completed"
                                ? "bg-green-100 text-green-800"
                                : status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {status
                              ?.replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Last updated:{" "}
                          {new Date(
                            intake?.updated_at || Date.now(),
                          ).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {status === "completed" ? (
                        <Typography
                          component="div"
                          className="text-[#2B5469D9] font-['Public_Sans'] text-sm leading-[120%] tracking-[-0.01em]"
                        >
                          <h2 className="mb-3 font-bold mt-7">
                            Intake assessment has been completed.
                          </h2>

                          <p className="mb-4">
                            The intake results are ready for your review.
                          </p>
                        </Typography>
                      ) : (
                        <Typography
                          component="div"
                          className="text-[#2B5469D9] font-['Public_Sans'] text-sm leading-[120%] tracking-[-0.01em]"
                        >
                          <h2 className="mb-3 font-bold mt-7">
                            Intake assessment is enabled.
                          </h2>

                          <p className="mb-4">
                            <span className="underline">
                              If resident uses a computer lab
                            </span>
                            : resident can access the intake assessment on the
                            computer by going to{" "}
                            <strong>{`${cleanedBaseUrl}/assessment`}</strong>
                          </p>

                          <p className="mb-3">
                            <span className="underline">
                              If resident has a tablet
                            </span>
                            : resident can access intake assessment via the{" "}
                            <strong>Opportunities</strong> button within the
                            Edovo app on the tablet.
                          </p>

                          <p className="italic text-[13px]">
                            Note: for tablet users, the{" "}
                            <strong>Opportunities</strong> button may take up to
                            5 business days to appear in the resident&#39;s
                            Edovo app after you enable the intake here.
                          </p>
                        </Typography>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FiLink className="h-6 w-6 text-[#006B66] mx-auto mb-1" />
                      <Typography className="text-center text-[14px] font-bold leading-[120%] tracking-[-0.01em] text-[#2B5469D9] font-['Public_Sans'] !mb-8">
                        Intake Assessment not enabled
                      </Typography>

                      <PrimaryButton
                        buttonText="Enable Intake"
                        disabled={linkLoading}
                        className="inline-flex items-center px-5 py-2 text-white text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case"
                        onClick={startIntake}
                      />

                      <div className="text-center text-[14px] font-medium leading-[120%] tracking-[-0.01em] text-[#2B5469D9] font-['Public_Sans'] mt-3">
                        Once enabled, the client will be able to access the
                        intake assessment via computer lab or tablet.
                      </div>
                    </div>
                  )}
                </div>
              </Grid>
            )}
            {clientRecord.state_code === "US_AZ" && (
              <Grid item xs={12} md={7}>
                <AudioRecordings
                  clientPseudoId={clientRecord.pseudonymized_client_id}
                />
              </Grid>
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
