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

import { useParams } from "next/navigation";
import { FiMessageSquare } from "react-icons/fi";

import AdminIntakeHistory from "~@reentry/frontend/(protected)/clients/intake/[id]/AdminIntakeHistory";
import { $api } from "~@reentry/frontend/api";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import Summary from "~@reentry/frontend/components/intake/Summary";
import { useAuth } from "~@reentry/frontend/lib/auth";

const IntakeManagementPage = () => {
  const { id } = useParams() as { id: string };

  const { data: clientData, isLoading: clientLoading } = $api.useQuery(
    "get",
    "/clients/{client_id}",
    {
      params: {
        path: { client_id: id },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
  );

  const { data: intakeData, refetch: refetchIntake } = $api.useQuery(
    "get",
    "/intake/admin/{client_id}",
    {
      params: {
        path: { client_id: id },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
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
    <div className="w-full p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] h-auto">
      {/* Profile Detail */}
      <ProfileDetail clientRecord={clientData} />

      {/* Summary Section */}
      <div className="flex-grow w-full flex justify-center items-center">
        <Summary
          clientRecord={clientData}
          intake={intakeData}
          onIntakeUpdate={refetchIntake}
        />
      </div>

      {clientData.state_code !== "US_AZ" && (
        <div className="mb-6 mt-8 w-full max-w-7xl">
          <h2 className="text-lg font-medium text-[#003331] mb-4 flex items-center">
            <FiMessageSquare className="mr-2" /> Intake Conversation History
          </h2>
          <div className="h-[600px]">
            {clientData?.external_client_id &&
            intakeData &&
            intakeData.id &&
            intakeData.client_intake_sections &&
            intakeData.client_intake_sections.length > 0 &&
            intakeData.status !== "created" ? (
              <AdminIntakeHistory
                clientRecord={clientData}
                intake={intakeData}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {/* eslint-disable-next-line no-nested-ternary */}
                {intakeData?.status === "created"
                  ? "Intake has been created but not started yet"
                  : !intakeData
                    ? "No intake has been created for this client"
                    : "No conversation history available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntakeManagementPage;
