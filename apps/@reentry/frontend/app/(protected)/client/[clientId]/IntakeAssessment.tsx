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

import React, { useState } from "react";

import AudioRecordings from "~@reentry/frontend/(protected)/client/[clientId]/AudioRecordings";
import IntakeArtifacts from "~@reentry/frontend/(protected)/client/[clientId]/IntakeArtifacts";
import { $api } from "~@reentry/frontend/api";
import {RemoveAssessmentIcon} from "~@reentry/frontend/components/icons/CloseIcon";
import WarningCircleIcon from "~@reentry/frontend/components/icons/WarningCircleIcon";
import RemoveAssessmentModal from "~@reentry/frontend/components/intake/RemoveAssessmentModal";
import RetryProcessing from "~@reentry/frontend/components/intake/RetryProcessing";
import StatusBadge from "~@reentry/frontend/components/intake/StatusBadge";
import {useAuth} from "~@reentry/frontend/lib/auth/authContext";
import {formatDateReadableDate} from "~@reentry/frontend/utils";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";
import { components } from "~@reentry/openapi-types";



interface IntakeAssessmentProps {
    clientData: components["schemas"]["ClientRecordResponse"];
    intakeInfo: | components["schemas"]["IntakeHistoryResponse"]
        | null
        | undefined;
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
    const assessmentStatus = intakeInfo?.status
    const [removeAssessmentModalOpen, setRemoveAssessmentModalOpen] = useState(false);
    const auth = useAuth();


    const { data: intakeStatus } = $api.useQuery(
    "get",
    "/intake/admin/{intake_id}/processing-status", {
        params: {
            path: {
                intake_id: intakeInfo?.id as string,
            },
        },
        headers: {
            Authorization: `Bearer ${useAuth().getAccessToken()}`,
            "Content-Type": "application/json",
        },
    },{enabled:!!intakeInfo?.id}
    );

    const {
      data: recordingSession,
      error: recordingSessionError,
      isLoading: recordingSessionLoading,
      refetch: recordingSessionRefetch
    } = $api.useQuery(
      "get",
      "/recordings/by_intake/{intake_id}",
      {
          params: { path: { intake_id: intakeInfo?.id as string } },
          headers: {
              Authorization: `Bearer ${useAuth().getAccessToken()}`,
              "Content-Type": "application/json",
          },
      }, {
        enabled: intakeInfo?.intake_type === "transcription"
      });

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
            enabled: !!recordingSession?.id && intakeInfo?.intake_type === "transcription"
        }
    );

    const { mutateAsync: deleteIntakeMutation, isPending: isDeletingInProgress } = $api.useMutation("delete", "/intake/admin/{intake_id}");

    const handleDeleteIntake = async (
        intake_id: string
    ) => {
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

    if (intakeLoading) { return "Loading intake data..."; }

    return (
        <div className={`flex flex-1 flex-col justify-center gap-2.5 max-w-7xl w-full self-stretch bg-white p-6 md:p-9 rounded-[5px] border border-solid border-[#2b5469]/20`}>
            <div className="w-full  flex flex-col gap-4">
                { intakeInfo && intakeStatus?.processing_status === "needs_retry" && (

                    transcriptionData && transcriptionData.conversation.length === 0 ? (
                        <div className="flex pl-5 pr-4 py-3 bg-[#FFF3E1] border-l-4 border-[#C78F38] flex-col justify-center items-start gap-4 overflow-hidden mb-2">
                            <div className="flex flex-col justify-start items-start gap-2">
                                <div className="inline-flex justify-start items-center gap-2">
                                    <WarningCircleIcon />
                                    <div className="font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
                                        Insufficient recording content to generate outputs
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <RetryProcessing
                            intakeId={intakeInfo?.id}
                        />
                    )
                )}
          {intakeInfo && (
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-4">
                <span className="font-medium text-[24px] leading-[1] text-black">
                    {`${intakeInfo?.assessment_config_display_name}`}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    intakeFrontendStatus={intakeStatus?.frontend_status}
                  />
                </div>
                <div className={"flex ml-auto  gap-10"}>
                    {assessmentStatus != "completed" && intakeInfo.intake_type === "transcription" && (
                        <AudioRecordings
                          recordingSession={recordingSession || undefined}
                          recordingSessionError={!!recordingSessionError}
                          recordingSessionLoading={recordingSessionLoading}
                          recordingSessionRefetch={recordingSessionRefetch}
                          intakeId={intakeInfo.id}
                          clientPseudoId={clientData?.pseudonymized_client_id}
                        />

                    )}
                    {(assessmentStatus === "created" && !(intakeInfo?.intake_type === "transcription" && (recordingSession?.chunk_count ?? 0) > 0)) && (
                        <>
                            <RemoveAssessmentIcon
                                onClick={() => {setRemoveAssessmentModalOpen(true)}}
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
                    {(assessmentStatus === "created" || assessmentStatus === "in_progress") && intakeInfo?.intake_type === "conversation" && (
                        <>
                            Assessment may be completed at{" "}
                            <span className="font-semibold text-[#006c67]">
                                {`${cleanedBaseUrl}/assessment.`}
                            </span>
                        </>
                    )}

                    {assessmentStatus === "created" && intakeInfo?.intake_type === "transcription" && (
                        <>Record an assessment to generate a transcript, summary, and action plan.&nbsp;</>
                    )}

                    {assessmentStatus === "completed" && (
                        <>Intake results are ready for your review below.&nbsp;</>
                    )}

                    {assessmentStatus && (
                        <>Last updated: {intakeInfo?.updated_at ? formatDateReadableDate(intakeInfo?.updated_at) : "N/A"}</>
                    )}
                </p>
            </div>
            { intakeInfo?.status && (
                <IntakeArtifacts
                    clientData={clientData}
                    intakeInfo={intakeInfo}
                    recordingSession={ recordingSession|| undefined}
                />
            )}
            </div>
        </div>
    );
}
