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


import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import IntakeAssessment from "~@reentry/frontend/(protected)/clients/intake/[id]/IntakeAssessment";
import { $api } from "~@reentry/frontend/api";
import BackButton from "~@reentry/frontend/components/base/BackButton";
import ClientMetadata from "~@reentry/frontend/components/clients/ClientMetadata";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import { PageView } from "~@reentry/frontend/components/PageView";
import AssessmentTypeDropdown from "~@reentry/frontend/components/profile/AssessmentTypeDropdown";
import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import {useClientDelete} from "~@reentry/frontend/hooks/useClientDelete";
import {useClientReset} from "~@reentry/frontend/hooks/useClientReset";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {isFeatureEnabled} from "~@reentry/frontend/utils/featureFlagsRuntime";


const ClientProfilePage = () => {
    const { id } = useParams() as { id: string };
    const { handleResetClient, isResettingInProgress } = useClientReset();
    const { handleDeleteClient, isDeletingInProgress } = useClientDelete();
    const router = useRouter();
    const [isDeletingClient, setIsDeletingClient] = useState(false);


    const { data: clientData, isLoading: clientLoading } = $api.useQuery(
        "get",
        "/clients/{client_pseudo_id}",
        {
            params: {
                path: { client_pseudo_id: id },
            },
            headers: {
                Authorization: `Bearer ${useAuth().getAccessToken()}`,
                "Content-Type": "application/json",
            },
        },
    );

    const { data: intakeData, isLoading: intakeLoading, refetch: refetchIntakeData } = $api.useQuery(
        "get",
        "/intake/admin/{client_pseudo_id}",
        {
            params: {
                path: { client_pseudo_id: id },
            },
            headers: {
                Authorization: `Bearer ${useAuth().getAccessToken()}`,
                "Content-Type": "application/json",
            },
        },
        { enabled: !IS_V2_INTAKE_CHAT },
    );


    if (clientLoading && !clientData) {
        return (
            <div className="w-full max-w-6xl mx-auto p-6 flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-t-[#006B66] border-[#e0f2f1] rounded-full animate-spin" />
            </div>
        );
    }

    if (!clientData) {
        return (
            <div className="max-w-6xl mx-auto px-4 pt-8 text-center text-gray-600">
                <p className="mb-4">
                    No client data found. Please go back and try again.
                </p>
            </div>
        );
    }

    return (
        <>
            <PageView />
            <div className="w-full p-6 md:px-6 md:py-2 flex-col  items-center gap-2 inline-flex bg-[#f9fafa] min-h-[calc(100vh-65px)]">
                <div className="flex w-full justify-between items-center mt-2 max-w-[100rem]">
                    <BackButton href={`/clients/`} buttonText={"Home"} />
                    <div className={"flex w-full max-w-7xl  justify-end gap-2"}>
                        {isFeatureEnabled("INTAKE_RESET") && intakeData &&
                            intakeData?.status !== "created" && (
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-5 py-2 text-white text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case"
                                        role="menuitem"
                                        onClick={() => handleResetClient(
                                            clientData?.pseudonymized_client_id,
                                            () => location.reload(),
                                        )}
                                        disabled={isResettingInProgress}
                                    >
                                        {isResettingInProgress? "Resetting..." : "Reset Client"}
                                    </button>
                            )
                        }
                        {isFeatureEnabled("CLIENT_DELETION") &&
                             (
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-5 py-2 text-white text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 normal-case"
                                        role="menuitem"
                                        onClick={() => handleDeleteClient(
                                            clientData.full_name.given_names,
                                            clientData.full_name.surname,
                                            clientData.birthdate,
                                            () => router.push("/clients/"),
                                            setIsDeletingClient
                                        )}
                                        disabled={isDeletingInProgress}
                                    >
                                        {isDeletingInProgress ? "Deleting..." : "Delete Client"}
                                    </button>
                            )
                        }
                    </div>

                    {isDeletingClient && (
                        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <Loading message="Deleting client..." />
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Detail */}
                <div className={"flex flex-col w-full px-2 md:px-14 max-w-7xl flex-1"}>
                    <div className={"flex mt-4 w-full justify-center"}>
                        <ClientMetadata
                            clientData={clientData}
                            intakeAddress={intakeData?.address}
                        />
                    </div>
                    <div className="w-full justify-between items-center gap-2 inline-flex mt-12">
                        <div className="justify-center text-black text-2xl font-medium font-['Public_Sans'] leading-7">Assessments</div>
                        { !intakeData?.status && (
                            <AssessmentTypeDropdown
                                clientData={clientData}
                                refetchIntakeData={refetchIntakeData}
                            />
                        )}
                    </div>

                    <div className={`flex my-10 w-full justify-center ${!intakeData && "flex-1"}`}>
                        <IntakeAssessment
                            intakeData={intakeData}
                            clientData={clientData}
                            intakeLoading={intakeLoading}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClientProfilePage;