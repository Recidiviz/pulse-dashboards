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

import React from "react";

import IntakeArtifacts from "~@reentry/frontend/(protected)/clients/intake/[id]/IntakeArtifacts";
import {$api} from "~@reentry/frontend/api";
import RetryProcessing from "~@reentry/frontend/components/intake/RetryProcessing";
import StatusBadge from "~@reentry/frontend/components/intake/StatusBadge";
import AudioRecordings from "~@reentry/frontend/components/intake/VoiceIntake/AudioRecordings";
import {useAuth} from "~@reentry/frontend/lib/auth/authContext";
import {formatDateReadableDate} from "~@reentry/frontend/utils";
import { components } from "~@reentry/openapi-types";


interface IntakeAssessmentProps {
    clientData: components["schemas"]["ClientRecordResponse"];
    intakeData: | components["schemas"]["IntakeWithSectionsResponse"]
        | null
        | undefined;
    intakeLoading: boolean;
}

export default function IntakeAssessment({
     clientData,
     intakeData,
     intakeLoading,
 }: IntakeAssessmentProps) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const cleanedBaseUrl = baseUrl.replace(/^https?:\/\//, "");
    const assessmentStatus = intakeData?.status

    const {data: intakeStatus} = $api.useQuery(
    "get",
    "/clients/{intake_id}/intake-general-resources-status", {
        params: {
            path: {
                intake_id: intakeData?.id as string,
            },
        },
        headers: {
            Authorization: `Bearer ${useAuth().getAccessToken()}`,
            "Content-Type": "application/json",
        },
    },{enabled:!!intakeData?.id}
    );

    if (intakeLoading) { return "Loading intake data..."; }

    return (
        <div className={`flex flex-1 flex-col justify-center gap-2.5 max-w-7xl w-full self-stretch bg-white p-6 md:p-9 rounded-[5px] border border-solid border-[#2b5469]/20`}>
            <div className="w-full  flex flex-col gap-4">
                { intakeStatus?.processing_status === "needs_retry" && (
                    <RetryProcessing
                        clientData={clientData}
                    />
                )}
                { intakeData? (
                    <div className="flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-[24px] leading-[1] text-black">{`${clientData?.full_name?.given_names}'s Intake `}</span>
                            <div className="flex items-center gap-2">
                                <StatusBadge
                                    intakeFrontendStatus={intakeStatus?.frontend_status}
                                />
                            </div>
                            {assessmentStatus != "completed" && clientData.state_code === "US_AZ" && (
                                <div className={"flex ml-auto "}>
                                    <AudioRecordings
                                        clientPseudoId={clientData.pseudonymized_client_id}
                                        onIntakeUpdate={() => console.log("pending to implement")}
                                    />
                                </div>
                            )}

                            {/*Remove the assessment button commented out until configIO implementation done*/}
                            {/*{status === "created" && (*/}
                            {/*    <div className={"flex ml-auto"}>*/}
                            {/*        <RemoveAssessmentIcon*/}
                            {/*            onClick={() => {setRemoveAssessmentModalOpen(true)}}*/}
                            {/*        />*/}
                            {/*        <RemoveAssessmentModal*/}
                            {/*            assessmentName={`${clientData?.full_name?.given_names}'s Intake `}*/}
                            {/*            userName={clientData?.full_name?.given_names || ""}*/}
                            {/*            isOpen={removeAssessmentModalOpen}*/}
                            {/*            onClose={() => setRemoveAssessmentModalOpen(false)}*/}
                            {/*            onConfirm={() => console.log("pending to implement")}*/}
                            {/*        />*/}
                            {/*    </div>*/}
                            {/*)}*/}
                        </div>
                    </div>
                ): (
                    <div className="mt-12  md:p-14">
                        <div className="text-center text-[#012322] font-['Public_Sans'] text-2xl font-medium leading-[120%] tracking-[-0.48px]">There are no active or enabled assessments</div>
                        <div className="mt-2 text-center text-[rgba(43,84,105,0.85)] font-['Public_Sans'] text-lg font-medium leading-[120%] tracking-[-0.36px]">
                            Enable a new assessment for {clientData?.full_name?.given_names } by clicking <br/>  the “Enable New Assessment” button in the top right.
                        </div>
                    </div>
                )}

                <div className="w-full flex flex-col ">
                    <p className="font-medium text-[14px] md:text-[16px] leading-[1.2] text-[#012322] flex flex-wrap gap-x-1">
                        {assessmentStatus === "created" && clientData?.state_code !== "US_AZ" && (
                            <>
                                Assessment may be completed at{" "}
                                <span className="font-semibold text-[#006c67]">
                                    {`${cleanedBaseUrl}/assessment.`}
                                </span>
                            </>
                        )}

                        {assessmentStatus === "created" && clientData?.state_code === "US_AZ" && (
                            <>Record an assessment to generate a transcript, summary, and action plan.&nbsp;</>
                        )}

                        {assessmentStatus === "completed" && (
                            <>Intake results are ready for your review below.&nbsp;</>
                        )}

                        {assessmentStatus && (
                            <>Last updated: {intakeData?.updated_at ? formatDateReadableDate(intakeData?.updated_at) : "N/A"}</>
                        )}
                    </p>
                </div>
                { intakeData?.status && (
                    <IntakeArtifacts
                        clientData={clientData}
                        intakeData={intakeData}
                    />
                )}
            </div>
        </div>
    );
}