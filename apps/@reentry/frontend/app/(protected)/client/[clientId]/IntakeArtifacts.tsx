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

import { useRouter } from "next/navigation";

import { ClientRecord,IntakeInfo } from "~@reentry/frontend/(protected)/client/[clientId]/types";
import {$api} from "~@reentry/frontend/api";
import {PrimaryButton} from "~@reentry/frontend/components/buttons/PrimaryButton";
import {ArrowRight} from "~@reentry/frontend/components/icons/ArrowRight";
import Timeline, {TimelineItem} from "~@reentry/frontend/components/intake/TimelineIndicator";
import {useAuth} from "~@reentry/frontend/lib/auth/authContext";
import { components } from "~@reentry/openapi-types";

interface IntakeArtifactsProps {
    clientData: ClientRecord
    intakeInfo: IntakeInfo
    recordingSession: components["schemas"]["RecordingSessionResponse"] | undefined;
}

const TranscriptSection = ({ isDisabled, buttonText, onClick }) => (
    <div
        className={`flex flex-col gap-6 px-0 sm:px-6 py-6 sm:py-0 ${
            isDisabled && "opacity-40 pointer-events-none"
        }`}
    >
    <span className="text-[rgba(43,84,105,0.5)] font-public-sans text-[14px] font-bold leading-[1.2] tracking-[-0.14px] uppercase">
      TRANSCRIPT
    </span>

        <PrimaryButton
            buttonText={
                <div className="flex items-center gap-2">
                    {buttonText}
                    <ArrowRight />
                </div>
            }
            className="h-8 flex items-center gap-2 bg-[#006c67] px-4 py-2 rounded-[32px] text-white"
            onClick={onClick}
            ignoreCapabilities={true}
        />
    </div>
);


const mapIntakeToTimeline = (intakeInfo: IntakeInfo) => {
    if (!intakeInfo) return [];

    const userLocale = navigator.language;
    const timeline: TimelineItem[] = [];

    const formatTime = (date: Date) =>
        date.toLocaleTimeString(userLocale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

    const formatDate = (date: Date) =>
        date.toLocaleDateString(userLocale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    // todo: check why created_at is 5 hours a head, adding "z" fix it temporarily
    const createdAt = new Date(intakeInfo.created_at + 'Z');
    const assignedStep = {
        time: formatTime(createdAt),
        description: `Assigned ${formatTime(createdAt)} on ${formatDate(createdAt)}`,
        isCurrent: intakeInfo.status !== 'completed',
        isCompleted: true,
    };

    timeline.push(assignedStep);

    if (intakeInfo.status === 'completed') {
        const completedAt = new Date(intakeInfo?.completed_at + 'Z' );

        const completedStep = {
            time: formatTime(completedAt),
            description: `Completed ${formatTime(completedAt)} on ${formatDate(completedAt)}`,
            isCurrent: true,
            isCompleted: true,
        };
        timeline.push(completedStep);
        timeline[0].isCurrent = false;
    }
    return timeline;
};

export default function IntakeArtifacts({clientData, intakeInfo, recordingSession}: IntakeArtifactsProps) {
    const router = useRouter();

    const planIncluded = intakeInfo.assessment_config_outputs_action_plan_activated

    const timelineData = mapIntakeToTimeline(intakeInfo);

    const {
        data: planData, isLoading: isLoadingPlan} = $api.useQuery(
        "get",
        "/plans/by-intake/{intake_id}", {
            params: {
                path: {
                    intake_id: intakeInfo.id,
                },
            },
            headers: {
                Authorization: `Bearer ${useAuth().getAccessToken()}`,
                "Content-Type": "application/json",
            },
            enabled: intakeInfo?.status === "completed"
        });

    const { data: intakeSummary, isLoading: isLoadingSummary} = $api.useQuery(
        "get",
        "/plans/{id}/assets/by-filename/{filename}",
        {
            params: {
                path: {
                    id: planData?.id as string,
                    filename: "summary.md",
                },
                query: {
                    include_data: true,
                },
            },
            headers: {
                Authorization: `Bearer ${useAuth().getAccessToken()}`,
                "Content-Type": "application/json",
            },
        },
        { enabled: intakeInfo?.status === "completed" && !!(planData?.id)}
    );

    if(isLoadingPlan || isLoadingSummary){
        return <div>Loading...</div>;
    }

    return (
        <div className={"flex flex-col mt-3"}>
            <div className="flex w-full">
                <Timeline items={timelineData} />
            </div>

            <div className={`mt-3 sm:mt-8 w-full sm:grid ${planIncluded ? "sm:grid-cols-3" : "sm:grid-cols-2"}  divide-y sm:divide-x sm:divide-y-0  :divide-[#2b5469]/20 flex flex-col`}>
                {/* INTAKE TRANSCRIPT*/}
                {intakeInfo?.intake_type === "transcription" ? (
                        <TranscriptSection
                            isDisabled={
                                intakeInfo?.status !== "completed" &&
                                !((recordingSession?.chunk_count ?? 0) > 0)
                            }
                            buttonText="See transcript"
                            onClick={() => {
                                const recordingId = recordingSession?.id ?? "";
                                router.push(`/client/${clientData?.pseudonymized_client_id}/audio-recording/${recordingId}`);
                            }}
                        />
                    ) : (
                        <TranscriptSection
                            isDisabled={intakeInfo?.status === "created"}
                            buttonText="See chat history"
                            onClick={() => {
                                router.push(`/intake/${intakeInfo?.id}/chat-history`);
                            }}
                        />
                    )
                }

                {/* INTAKE SUMMARY*/}
                <div className={`flex flex-col gap-6 px-0 sm:px-6 py-6 sm:py-0 ${!intakeSummary ? "opacity-40 pointer-events-none" : ""}`}>
                    <div className="flex flex-col gap-2">
                        <span className="text-[rgba(43,84,105,0.5)] font-public-sans text-[14px] font-bold leading-[1.2] tracking-[-0.14px] uppercase">SUMMARY</span>
                    </div>

                    <PrimaryButton
                        buttonText={
                            <div className="flex items-center gap-2">
                                See summary <ArrowRight />
                            </div>
                        }
                        ignoreCapabilities={true}
                        className="h-8 flex items-center gap-2 bg-[#006c67] px-4 py-2 rounded-[32px] text-white"
                        onClick={() => router.push(`/client/${clientData?.pseudonymized_client_id}/intake-summary/${planData?.id}`)}
                    />
                </div>

                {
                    planIncluded && (
                        <>
                        {/* ACTION PLAN */}
                        <div className={`flex flex-col gap-6 px-0 sm:px-6 py-6 sm:py-0 ${planData && planData?.is_create_execution_finished ? "" : "opacity-40 pointer-events-none"}`}>
                            <div className="flex flex-col gap-2">
                                <span className="text-[rgba(43,84,105,0.5)] font-public-sans text-[14px] font-bold leading-[1.2] tracking-[-0.14px] uppercase">ACTION PLAN</span>
                            </div>

                            <PrimaryButton
                                buttonText={
                                    <div className="flex items-center gap-2">
                                        See action plan <ArrowRight  />
                                    </div>
                                }
                                className="h-8 flex items-center gap-2 bg-[#006c67] px-4 py-2 rounded-[32px] text-white"
                                onClick={() => router.push(`/action-plan/${planData?.id}`)}
                                ignoreCapabilities={true}
                            />
                        </div>
                        </>
                    )
                }
            </div>
        </div>
    );
}
