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

import { SlidersHorizontal } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMessageSquare } from "react-icons/fi";

import ChatTemplateEditor from "~@reentry/frontend/(protected)/ai-test-harness/status/[executionId]/ChatTemplateEditor";
import AdminIntakeHistory from "~@reentry/frontend/(protected)/intake/[intakeId]/chat-history/AdminIntakeHistory";
import { $api } from "~@reentry/frontend/api";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useChatHistoryPDF } from "~@reentry/frontend/hooks/usePDFDownload";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { AIDisclosure, AIDisclosureType } from "~@reentry/frontend-shared";

const IntakeManagementPage = () => {
  const { intakeId } = useParams() as { intakeId: string };
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const { getAccessToken } = useAuth();

  const { data: intakeData } = $api.useQuery(
    "get",
    "/intake/admin/{intake_id}",
    {
      params: {
        path: { intake_id: intakeId },
      },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
  );

  const { mutate: markSeen } = $api.useMutation("post", "/seen-items");

  useEffect(() => {
    if (intakeData?.status === "completed") {
      markSeen({
        body: {
          intake_id: intakeId,
          item_type: "intake_conversation",
          item_id: intakeId,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
    }
  }, [intakeData?.status]);

  const { data: clientData, isLoading: clientLoading } = $api.useQuery(
    "get",
    "/clients/{client_pseudo_id}",
    {
      params: {
        path: { client_pseudo_id: intakeData?.client_pseudo_id as string },
      },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: !!intakeData },
  );

  const clientFullName = clientData?.full_name
    ? `${clientData.full_name.given_names} ${clientData.full_name.surname}`.trim()
    : "Client";

  const { handleDownload: handleDownloadAllChats, isDownloading } =
    useChatHistoryPDF(intakeId, `${clientFullName}_intake_chat_history.pdf`);

  if ((clientLoading && !clientData) || !intakeData) {
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

  const getIntakeConvoHistoryCopy = () => {
    if (!intakeData) {
      return "No intake has been created for this client";
    }
    if (intakeData.status === "created") {
      return "Intake has been created but not started yet";
    }
    return "No conversation history available";
  };

  const intakeConvoHistoryCopy = getIntakeConvoHistoryCopy();

  return (
    <>
      <PageView />
      {showTemplateEditor && intakeData && clientData && (
        <ChatTemplateEditor
          intake={intakeData}
          configDisplayName={null}
          onClose={() => setShowTemplateEditor(false)}
        />
      )}
      <div className="w-full p-6 md:px-6 md:py-2 flex flex-col items-center gap-2 bg-[#f9fafa] h-[calc(100vh-65px)] overflow-hidden">
        {/* Profile Detail */}
        <ProfileDetail
          clientRecord={clientData}
          isExpanded={undefined}
          setIsExpanded={() => console.log("expanded")}
        />

        {intakeData?.intake_type === "transcription" ? (
          <div className="flex items-center justify-center flex-1 text-gray-500 w-full max-w-7xl">
            Not chat history available for recorded intakes.
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 px-0 md:px-10 pb-6 w-full max-w-7xl">
            <div className="flex items-start justify-between mb-4 gap-4 shrink-0">
              <div className="flex-1">
                <h2 className="text-lg font-medium text-[#003331] flex items-center mb-2">
                  <FiMessageSquare className="mr-2" /> Intake Conversation
                  History
                </h2>
                <AIDisclosure type={AIDisclosureType.ChatHistory} />
              </div>
              {intakeData &&
                intakeData.intake_sections &&
                intakeData.intake_sections.length > 0 &&
                intakeData.status !== "created" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplateEditor(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Export as a Template
                    </button>
                    <PrimaryButton
                      buttonText={
                        isDownloading ? "Downloading..." : "Download Chat"
                      }
                      onClick={handleDownloadAllChats}
                      disabled={isDownloading}
                      ignoreCapabilities={true}
                    />
                  </div>
                )}
            </div>
            <div className="flex-1 min-h-0">
              {clientData?.external_client_id &&
              intakeData &&
              intakeData.id &&
              intakeData.intake_sections &&
              intakeData.intake_sections.length > 0 &&
              intakeData.status !== "created" ? (
                <AdminIntakeHistory
                  clientRecord={clientData}
                  intake={intakeData}
                />
              ) : (
                intakeConvoHistoryCopy && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {intakeConvoHistoryCopy}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IntakeManagementPage;
