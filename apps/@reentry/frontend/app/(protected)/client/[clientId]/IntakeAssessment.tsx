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

import Link from "next/link";
import React, { useMemo, useState } from "react";

import TriggerAIIntakeModal from "~@reentry/frontend/(protected)/ai-test-harness/components/TriggerAIIntakeModal";
import AudioRecordings from "~@reentry/frontend/(protected)/client/[clientId]/AudioRecordings";
import IntakeArtifacts from "~@reentry/frontend/(protected)/client/[clientId]/IntakeArtifacts";
import { $api } from "~@reentry/frontend/api";
import { RemoveAssessmentIcon } from "~@reentry/frontend/components/icons/CloseIcon";
import IntakeSwitch from "~@reentry/frontend/components/intake/IntakeSwitchButton";
import RemoveAssessmentModal from "~@reentry/frontend/components/intake/RemoveAssessmentModal";
import RetryProcessing from "~@reentry/frontend/components/intake/RetryProcessing";
import StatusBadge from "~@reentry/frontend/components/intake/StatusBadge";
import TranscriptionValidationWarnings from "~@reentry/frontend/components/transcription/TranscriptionValidationWarnings";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { isInternalUser } from "~@reentry/frontend/lib/auth/permissions";
import { formatDateReadableDate } from "~@reentry/frontend/utils";
import { isFeatureEnabled } from "~@reentry/frontend/utils/featureFlagsRuntime";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";
import { components } from "~@reentry/openapi-types";

interface IntakeAssessmentProps {
  clientData: components["schemas"]["ClientRecordResponse"];
  intakeInfo: components["schemas"]["IntakeHistoryResponse"] | null | undefined;
  intakeLoading: boolean;
  refetchIntakeData: () => void;
}

export default function IntakeAssessment({
  clientData,
  intakeInfo,
  intakeLoading,
  refetchIntakeData,
}: IntakeAssessmentProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const cleanedBaseUrl = baseUrl.replace(/^https?:\/\//, "");
  const assessmentStatus = intakeInfo?.status;
  const [removeAssessmentModalOpen, setRemoveAssessmentModalOpen] =
    useState(false);
  const [isTriggerAIModalOpen, setIsTriggerAIModalOpen] = useState(false);
  const auth = useAuth();
  const userEmail = auth.authStore?.user?.email;

  const { data: intakeStatus } = $api.useQuery(
    "get",
    "/intake/admin/{intake_id}/processing-status",
    {
      params: {
        path: {
          intake_id: intakeInfo?.id as string,
        },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: !!intakeInfo?.id,
    },
  );

  const {
    data: recordingSession,
    error: recordingSessionError,
    isLoading: recordingSessionLoading,
    refetch: recordingSessionRefetch,
  } = $api.useQuery(
    "get",
    "/recordings/by_intake/{intake_id}",
    {
      params: { path: { intake_id: intakeInfo?.id as string } },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: intakeInfo?.intake_type === "transcription",
    },
  );

  const { data: transcriptionData } = $api.useQuery(
    "get",
    "/transcription/{recording_session_id}/transcription",
    {
      params: {
        path: {
          recording_session_id: recordingSession?.id || "",
        },
      },
      headers: {
        Authorization: `Bearer ${auth.getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled:
        !!recordingSession?.id &&
        recordingSession?.status === "completed" &&
        intakeInfo?.intake_type === "transcription",
    },
  );

  const { mutateAsync: deleteIntakeMutation, isPending: isDeletingInProgress } =
    $api.useMutation("delete", "/intake/admin/{intake_id}");

  const { mutateAsync: toggleOutputsMutation, isPending: isTogglingOutputs } =
    $api.useMutation("patch", "/intake/admin/{intake_id}/outputs-enabled", {
      onSuccess: () => {
        refetchIntakeData();
      },
    });

  const handleToggleOutputs = async () => {
    if (!intakeInfo?.id) return;

    try {
      const newOutputsEnabled = !intakeInfo.outputs_enabled;

      await toggleOutputsMutation({
        params: { path: { intake_id: intakeInfo.id } },
        body: { outputs_enabled: newOutputsEnabled },
        headers: {
          Authorization: `Bearer ${auth.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      showSuccessToast(
        newOutputsEnabled
          ? "Outputs enabled successfully"
          : "Outputs disabled successfully",
      );
    } catch (error) {
      console.error("Error toggling outputs:", error);
      showErrorToast("Failed to toggle outputs");
    }
  };

  const handleDeleteIntake = async (intake_id: string) => {
    try {
      console.log("Starting deletion for intake:", intake_id);

      await deleteIntakeMutation({
        params: { path: { intake_id: intake_id } },
        headers: {
          Authorization: `Bearer ${auth.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Intake deleted successfully");
      showSuccessToast("Intake deleted successfully");
      refetchIntakeData();
      setRemoveAssessmentModalOpen(false);
    } catch (error) {
      console.error("Error deleting Intake:", error);
      showErrorToast("Failed to delete Intake");
    }
  };

  if (intakeLoading) {
    return "Loading intake data...";
  }

  const VALIDATION_FIELDS = [
    "word_count",
    "no_prompt_injection",
    "diarization",
    "minimum_duration",
  ] as const;

  const isValidTranscription = useMemo(() => {
    if (intakeInfo?.intake_type !== "transcription") {
      return true;
    }
    const validation = transcriptionData?.validation;
    return (
      VALIDATION_FIELDS.every((field) => validation?.[field]) &&
      (transcriptionData?.transcription?.conversation?.length ?? 0) > 0
    );
  }, [transcriptionData]);

  return (
    <div
      className={`flex flex-1 flex-col justify-center gap-2.5 max-w-7xl w-full self-stretch bg-white p-6 md:p-9 rounded-[5px] border border-solid border-[#2b5469]/20`}
    >
      <div className="w-full  flex flex-col gap-4">
        {intakeInfo &&
          intakeStatus?.processing_status === "needs_retry" &&
          isValidTranscription && <RetryProcessing intakeId={intakeInfo?.id} />}
        {intakeInfo && (
          <div className="flex flex-col justify-center gap-2">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:items-center">
              <div className="flex items-center gap-2 md:gap-4">
                <span className="font-medium text-[24px] leading-[1] text-black">
                  {`${intakeInfo?.assessment_config_display_name}`}
                </span>
                <StatusBadge
                  intakeFrontendStatus={intakeStatus?.frontend_status}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 md:ml-auto md:items-center w-full md:w-auto">
                {isFeatureEnabled("TOGGLE_ENABLED_OUTPUTS") &&
                  isInternalUser(userEmail) && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs md:text-sm font-medium text-[#012322] whitespace-nowrap">
                        {intakeInfo.outputs_enabled
                          ? "Outputs Enabled"
                          : "Outputs Disabled"}
                      </span>
                      <IntakeSwitch
                        checked={intakeInfo.outputs_enabled ?? true}
                        onChange={handleToggleOutputs}
                        disabled={isTogglingOutputs}
                      />
                    </div>
                  )}
                {isInternalUser(userEmail) &&
                  intakeStatus?.frontend_status === "intake_enabled" &&
                  intakeInfo.intake_type !== "transcription" && (
                    <button
                      onClick={() => setIsTriggerAIModalOpen(true)}
                      className="px-4 py-2 bg-[#003331] text-white rounded-full hover:bg-gray-950 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      Trigger AI Intake
                    </button>
                  )}
                {isInternalUser(userEmail) &&
                  intakeInfo.trigger_id &&
                  intakeInfo.intake_type !== "transcription" && (
                    <Link
                      href={`/ai-test-harness/status/${intakeInfo.trigger_id}`}
                      className="px-4 py-2 border border-[#003331] text-[#003331] rounded-full hover:bg-gray-100 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      View AI Status
                    </Link>
                  )}
                {assessmentStatus != "completed" &&
                  intakeInfo.intake_type === "transcription" && (
                    <div className="w-full md:w-auto shrink-0">
                      <AudioRecordings
                        recordingSession={recordingSession || undefined}
                        recordingSessionError={!!recordingSessionError}
                        recordingSessionLoading={recordingSessionLoading}
                        recordingSessionRefetch={recordingSessionRefetch}
                        intakeId={intakeInfo.id}
                        clientPseudoId={clientData?.pseudonymized_client_id}
                      />
                    </div>
                  )}
                {assessmentStatus === "created" &&
                  !(
                    intakeInfo?.intake_type === "transcription" &&
                    (recordingSession?.chunk_count ?? 0) > 0
                  ) && (
                    <>
                      <RemoveAssessmentIcon
                        onClick={() => {
                          setRemoveAssessmentModalOpen(true);
                        }}
                      />
                      <RemoveAssessmentModal
                        assessmentName={`${intakeInfo?.assessment_config_display_name}`}
                        userName={clientData?.full_name?.given_names || ""}
                        isOpen={removeAssessmentModalOpen}
                        isDeletingInProgress={isDeletingInProgress}
                        onClose={() => setRemoveAssessmentModalOpen(false)}
                        onConfirm={() => handleDeleteIntake(intakeInfo?.id)}
                      />
                    </>
                  )}
              </div>
            </div>
          </div>
        )}
        <div className="w-full flex flex-col ">
          <p className="font-medium text-[14px] md:text-[16px] leading-[1.2] text-[#012322] flex flex-wrap gap-x-1">
            {(assessmentStatus === "created" ||
              assessmentStatus === "in_progress") &&
              intakeInfo?.intake_type === "conversation" && (
                <>
                  Assessment may be completed at{" "}
                  <span className="font-semibold text-[#006c67]">
                    {`${cleanedBaseUrl}/assessment.`}
                  </span>
                </>
              )}

            {assessmentStatus === "created" &&
              intakeInfo?.intake_type === "transcription" && (
                <>
                  Record an assessment to generate a transcript, summary, and
                  action plan.&nbsp;
                </>
              )}
            {isValidTranscription && (
              <>
                {assessmentStatus === "completed" && (
                  <>Intake results are ready for your review below.&nbsp;</>
                )}
              </>
            )}
            {assessmentStatus && (
              <>
                Last updated:{" "}
                {intakeInfo?.updated_at
                  ? formatDateReadableDate(intakeInfo?.updated_at)
                  : "N/A"}
              </>
            )}
          </p>
        </div>

        {/* Trigger AI Intake Modal */}
        {intakeInfo && (
          <TriggerAIIntakeModal
            isOpen={isTriggerAIModalOpen}
            onClose={() => setIsTriggerAIModalOpen(false)}
            assessment={intakeInfo}
          />
        )}

        {/* Validation warnings */}
        {transcriptionData?.validation && (
          <TranscriptionValidationWarnings
            validation={transcriptionData.validation}
            hasConversation={
              transcriptionData.transcription?.conversation?.length > 0
            }
            lastUpdated={
              intakeInfo?.updated_at
                ? formatDateReadableDate(intakeInfo?.updated_at)
                : "N/A"
            }
          />
        )}
        {intakeInfo?.status && (
          <IntakeArtifacts
            clientData={clientData}
            intakeInfo={intakeInfo}
            recordingSession={recordingSession || undefined}
            validTranscription={isValidTranscription}
            outputsEnabled={intakeInfo.outputs_enabled ?? true}
          />
        )}
      </div>
    </div>
  );
}
