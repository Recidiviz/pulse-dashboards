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

import AssessmentTypeDropdown from "~@reentry/frontend/(protected)/client/[clientId]/AssessmentTypeDropdown";
import IntakeAssessment from "~@reentry/frontend/(protected)/client/[clientId]/IntakeAssessment";
import { $api } from "~@reentry/frontend/api";
import BackButton from "~@reentry/frontend/components/base/BackButton";
import {PrimaryButton} from "~@reentry/frontend/components/buttons/PrimaryButton";
import ClientMetadata from "~@reentry/frontend/components/clients/ClientMetadata";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import { PageView } from "~@reentry/frontend/components/PageView";
import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import {useClientDelete} from "~@reentry/frontend/hooks/useClientDelete";
import {useClientReset} from "~@reentry/frontend/hooks/useClientReset";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {isFeatureEnabled} from "~@reentry/frontend/utils/featureFlagsRuntime";


const ClientProfilePage = () => {
    const { clientId } = useParams() as { clientId: string };
    const { handleResetClient, isResettingInProgress } = useClientReset();
    const { handleDeleteClient, isDeletingInProgress } = useClientDelete();
    const router = useRouter();
    const [isDeletingClient, setIsDeletingClient] = useState(false);


    const { data: clientData, isLoading: clientLoading } = $api.useQuery(
        "get",
        "/clients/{client_pseudo_id}",
        {
            params: {
                path: { client_pseudo_id: clientId },
            },
            headers: {
                Authorization: `Bearer ${useAuth().getAccessToken()}`,
                "Content-Type": "application/json",
            },
        },
    );

    const { data: intakeList, isLoading: intakeLoading, refetch: refetchIntakeData } = $api.useQuery(
        "get",
        "/clients/{client_pseudo_id}/intakes",
        {
            params: {
                path: { client_pseudo_id: clientId },
            },
            headers: {
                Authorization: `Bearer ${useAuth().getAccessToken()}`,
                "Content-Type": "application/json",
            },
        },
        { enabled: !IS_V2_INTAKE_CHAT },
    );

    if (clientLoading && !intakeList) {
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

    const has_data = intakeList && intakeList.length > 0

    return (
        <>
            <PageView />
            <div className="w-full p-6 md:px-6 md:py-2 flex-col items-center gap-2 inline-flex bg-[#f9fafa] min-h-[calc(100vh-65px)]">
                <div className="flex w-full justify-between items-center mt-2 max-w-[100rem]">
                    <BackButton href={`/clients/`} buttonText={"Home"} />
                    <div className={"flex w-full max-w-7xl  justify-end gap-2"}>
                        {isFeatureEnabled("INTAKE_RESET") && has_data && (
                              <PrimaryButton
                                  buttonText={
                                  isResettingInProgress ? (
                                      <div className="flex items-center gap-2">
                                          Resetting...
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2">
                                          Reset Client
                                      </div>
                                  )
                              }
                              className={`h-8 flex items-center gap-2 px-5 py-2 rounded-md text-white text-sm ${isResettingInProgress ? "bg-gray-400" : "bg-[#006B66] hover:bg-[#005c59]"}`}
                              onClick={() =>
                                  handleResetClient(
                                      clientData?.pseudonymized_client_id,
                                      () => location.reload()
                                  )
                              }
                              disabled={isResettingInProgress}
                              ignoreCapabilities={true}
                              />
                            )
                        }
                        {isFeatureEnabled("CLIENT_DELETION") &&
                             (
                                 <PrimaryButton
                                     buttonText={
                                         isDeletingInProgress ? (
                                             <div className="flex items-center gap-2">
                                                 Deleting...
                                             </div>
                                         ) : (
                                             <div className="flex items-center gap-2">
                                                 Delete Client
                                             </div>
                                         )
                                     }
                                     className={`h-8  flex items-center gap-2 px-5 py-2 rounded-md text-white text-sm ${isDeletingInProgress ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
                                     onClick={() =>
                                         handleDeleteClient(
                                             clientData.full_name.given_names,
                                             clientData.full_name.surname,
                                             clientData.birthdate,
                                             () => router.push("/clients/"),
                                             setIsDeletingClient
                                         )
                                     }
                                     disabled={isDeletingInProgress}
                                     ignoreCapabilities={true}
                                 />
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
                        />
                    </div>
                    <div className="w-full justify-between items-center gap-2 inline-flex mt-12">
                        <div className="justify-center text-black text-2xl font-medium font-['Public_Sans'] leading-7">Assessments</div>
                        {!intakeList?.find(i => i.status === "created" || i.status === "in_progress") && (
                            <AssessmentTypeDropdown
                                clientData={clientData}
                                refetchIntakeData={refetchIntakeData}
                            />
                        )}
                    </div>

                    <div className={`flex flex-col my-10 gap-10 w-full justify-center ${intakeList?.length == 0 && "flex-1"}`}>
                      {intakeList && intakeList?.length > 0 ? intakeList.map(intakeInfo => (
                        <IntakeAssessment
                          key={intakeInfo.id}
                          intakeInfo={intakeInfo}
                          clientData={clientData}
                          intakeLoading={intakeLoading}
                          refetchIntakeData={refetchIntakeData}
                        />
                      )) : (
                          <div className={`flex flex-1 flex-col justify-center gap-2.5 max-w-7xl w-full self-stretch bg-white p-6 md:p-9 rounded-[5px] border border-solid border-[#2b5469]/20`}>
                            <div className="w-full flex flex-col gap-4 text-center md:p-14">
                                <div className="text-center text-[#012322] font-['Public_Sans'] text-2xl font-medium leading-[120%] tracking-[-0.48px]">There are no active or enabled assessments</div>
                                <div className="mt-2 text-center text-[rgba(43,84,105,0.85)] font-['Public_Sans'] text-lg font-medium leading-[120%] tracking-[-0.36px]">
                                    Enable a new assessment for {clientData?.full_name?.given_names } by clicking <br/>  the “Enable New Assessment” button in the top right.
                                </div>
                            </div>
                          </div>
                      )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClientProfilePage;
