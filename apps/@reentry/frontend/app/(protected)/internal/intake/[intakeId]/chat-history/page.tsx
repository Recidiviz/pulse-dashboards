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

"use client";

import { ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";

import AdminIntakeHistory from "~@reentry/frontend/(protected)/intake/[intakeId]/chat-history/AdminIntakeHistory";
import { $api } from "~@reentry/frontend/api";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

const InternalIntakeChatHistoryPage = () => {
  const { intakeId } = useParams() as { intakeId: string };
  const accessToken = useAuth().getAccessToken();

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const { data: intakeData, isLoading: intakeLoading } = $api.useQuery(
    "get",
    "/intake/internal/{intake_id}",
    { params: { path: { intake_id: intakeId } }, headers },
  );

  const { data: clientData, isLoading: clientLoading } = $api.useQuery(
    "get",
    "/clients/{client_pseudo_id}",
    {
      params: {
        path: { client_pseudo_id: intakeData?.client_pseudo_id as string },
      },
      headers,
    },
    { enabled: !!intakeData },
  );

  if (intakeLoading || (clientLoading && !clientData) || !intakeData) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-t-[#006B66] border-[#e0f2f1] rounded-full animate-spin" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-8 text-center text-gray-600">
        <p>No client data found for this intake.</p>
      </div>
    );
  }

  return (
    <>
      <PageView />
      <div className="w-full bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm font-medium">
        <ShieldAlert size={16} className="shrink-0" />
        This page is for Recidiviz internal safety review of the guardrailed
        conversation history.
      </div>
      <div className="w-full p-6 md:px-6 md:py-2 flex flex-col items-center gap-2 bg-[#f9fafa] h-[calc(100vh-97px)] overflow-hidden">
        <ProfileDetail
          clientRecord={clientData}
          isExpanded={undefined}
          setIsExpanded={() => undefined}
          hideBackButton
        />
        <div className="flex flex-col flex-1 min-h-0 px-0 md:px-10 pb-6 w-full max-w-7xl">
          {intakeData.intake_sections &&
          intakeData.intake_sections.length > 0 ? (
            <AdminIntakeHistory
              clientRecord={clientData}
              intake={intakeData}
              isRecidivizInternalView
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No conversation history available
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InternalIntakeChatHistoryPage;
