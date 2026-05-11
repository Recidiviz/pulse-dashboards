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
import { useState } from "react";
import { FiMessageSquare } from "react-icons/fi";

import ChatTemplateEditor from "~@reentry/frontend/(protected)/ai-test-harness/status/[executionId]/ChatTemplateEditor";
import AdminIntakeHistory from "~@reentry/frontend/(protected)/intake/[intakeId]/chat-history/AdminIntakeHistory";
import { $api } from "~@reentry/frontend/api";
import ProfileDetail from "~@reentry/frontend/components/action-plan/ProfileDetail";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  createPDFPageStyles,
  extractCompleteCSS,
  generatePDF,
} from "~@reentry/frontend/utils/pdfGenerator";
import {
  AI_DISCLOSURE_PRINT_TEXT,
  AIDisclosure,
  AIDisclosureType,
  formatGuardrailDisplayNames,
  isGuardrailType,
  isHardStopGuardrailType,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

type IntakeMessage = components["schemas"]["IntakeMessageResponse"];

const IntakeManagementPage = () => {
  const { intakeId } = useParams() as { intakeId: string };
  const { getAccessToken, refreshToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

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

  const { data: clientData, isLoading: clientLoading } = $api.useQuery(
    "get",
    "/clients/{client_pseudo_id}",
    {
      params: {
        path: { client_pseudo_id: intakeData?.client_pseudo_id as string },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: !!intakeData },
  );

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

  const ensureAccessToken = async (): Promise<string | null | undefined> => {
    let accessToken = getAccessToken();
    if (!accessToken) {
      await refreshToken();
      accessToken = getAccessToken();
    }
    return accessToken;
  };

  const getClientFullName = (): string => {
    return clientData?.full_name
      ? `${clientData.full_name.given_names} ${clientData.full_name.surname}`.trim()
      : "Client";
  };

  const fetchSectionMessages = async (
    section: components["schemas"]["IntakeSectionResponse"],
    intakeId: string,
    accessToken: string,
  ) => {
    if (section.status === "not_started") {
      return { section, messages: [] };
    }

    const encodedSectionTitle = encodeURIComponent(section.title);
    try {
      const response = await fetch(
        `${process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8000"}/api/intake/admin/${intakeId}/${encodedSectionTitle}/messages`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const messages = await response.json();
        return { section, messages: messages || [] };
      }
      return { section, messages: [] };
    } catch (error) {
      console.error(
        `Failed to fetch messages for section ${section.title}:`,
        error,
      );
      return { section, messages: [] };
    }
  };

  const fetchAllSectionMessages = async (accessToken: string) => {
    if (!intakeData) return [];

    return Promise.all(
      (intakeData.intake_sections || []).map((section) =>
        fetchSectionMessages(section, intakeData.id, accessToken),
      ),
    );
  };

  const createMessageElement = (message: IntakeMessage): HTMLDivElement => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "mb-3";
    const isClient = message.from_role === "client";
    const senderLabel = isClient ? "Client" : "Chatbot";
    const guardrailedBy = message.guardrailed_by;
    const hardStopFlags = guardrailedBy?.filter(isHardStopGuardrailType);
    const isHardStop = !!hardStopFlags && hardStopFlags.length > 0;

    const contentDiv = document.createElement("div");
    contentDiv.className = `pl-[20px] ${isHardStop ? "text-red-700" : "text-gray-900"}`;

    const senderSpan = document.createElement("span");
    senderSpan.className = "font-bold";
    senderSpan.textContent = `${senderLabel}: `;

    contentDiv.appendChild(senderSpan);
    contentDiv.appendChild(document.createTextNode(message.content ?? ""));

    if (isHardStop) {
      const flagSpan = document.createElement("span");
      flagSpan.className = "ml-2 text-xs font-medium text-red-600";
      flagSpan.textContent = `⚠️ Flagged: ${formatGuardrailDisplayNames(hardStopFlags.filter(isGuardrailType))}`;
      contentDiv.appendChild(flagSpan);
    }

    messageDiv.appendChild(contentDiv);
    return messageDiv;
  };

  const createSectionMessagesElement = (
    section: components["schemas"]["IntakeSectionResponse"],
    messages: IntakeMessage[],
  ): HTMLDivElement => {
    const messagesDiv = document.createElement("div");
    messagesDiv.className = "section-messages mt-4";

    if (section.status === "not_started") {
      const notStartedDiv = document.createElement("div");
      notStartedDiv.className = "text-gray-500 my-4 pl-[20px]";
      notStartedDiv.textContent =
        "This section has not been started by the client.";
      messagesDiv.appendChild(notStartedDiv);
    } else if (messages.length === 0) {
      const noMessagesDiv = document.createElement("div");
      noMessagesDiv.className = "text-gray-500 my-4 pl-[20px]";
      noMessagesDiv.textContent = "No messages in this section";
      messagesDiv.appendChild(noMessagesDiv);
    } else {
      messages.forEach((message) => {
        messagesDiv.appendChild(createMessageElement(message));
      });
    }

    return messagesDiv;
  };

  const createSectionHeaderElement = (
    section: components["schemas"]["IntakeSectionResponse"],
    index: number,
    clientFullName: string,
    dateCompleted: string,
  ): HTMLDivElement => {
    const sectionHeader = document.createElement("div");
    sectionHeader.className =
      "section-header flex flex-col items-center pb-4 border-b mb-4 justify-left text-left";
    if (index === 0) {
      const h1Name = document.createElement("h1");
      h1Name.style.textAlign = "left";
      h1Name.style.width = "100%";
      h1Name.textContent = ` Intake Chat History, ${clientFullName} `;
      sectionHeader.appendChild(h1Name);

      const h1Date = document.createElement("h1");
      h1Date.style.textAlign = "left";
      h1Date.style.width = "100%";
      h1Date.textContent = ` Date completed: ${dateCompleted} `;
      sectionHeader.appendChild(h1Date);

      sectionHeader.appendChild(document.createElement("br"));
    }

    const h2 = document.createElement("h2");
    h2.className = "text-lg font-medium text-[#003331]";
    h2.style.textAlign = "left";
    h2.style.width = "100%";
    h2.textContent = `Section name: ${section.title}`;
    sectionHeader.appendChild(h2);

    return sectionHeader;
  };

  const createDocumentContainer = (
    sectionsWithMessages: Array<{
      section: components["schemas"]["IntakeSectionResponse"];
      messages: IntakeMessage[];
    }>,
    clientFullName: string,
  ): HTMLDivElement => {
    const tempContainer = document.createElement("div");
    tempContainer.id = "allChatsToDownload";
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.width = "800px";
    tempContainer.className = "bg-white p-6";

    const dateCompleted = intakeData?.completed_at
      ? new Date(intakeData.completed_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "In Progress";

    sectionsWithMessages.forEach(({ section, messages }, index) => {
      const sectionHeader = createSectionHeaderElement(
        section,
        index,
        clientFullName,
        dateCompleted,
      );
      tempContainer.appendChild(sectionHeader);

      const messagesDiv = createSectionMessagesElement(section, messages);
      tempContainer.appendChild(messagesDiv);
    });

    return tempContainer;
  };

  const createPDFStyles = (tempContainer: HTMLDivElement): string => {
    const extractedCSSResult = extractCompleteCSS(tempContainer, {
      includeChildren: true,
      includeMediaQueries: true,
      includeAnimations: true,
    });

    return `
            ${extractedCSSResult.combined}
            ${createPDFPageStyles(AI_DISCLOSURE_PRINT_TEXT)}

            body, html {
                margin: 0;
                padding: 0;
            }

            .header-first-section-wrapper {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            .section-header-wrapper {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                display: block !important;
            }

            .section-header-wrapper * {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                .header-first-section-wrapper {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }

                .section-header-wrapper {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                    display: block !important;
                }

                .section-header-wrapper * {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }
            }
        `;
  };

  const createPDFData = (tempContainer: HTMLDivElement, pdfCSS: string) => {
    return {
      html: tempContainer.innerHTML,
      css: [pdfCSS],
      options: {
        printBackground: true,
      } as Record<string, unknown>,
    };
  };

  const handleDownloadAllChats = async (): Promise<void> => {
    if (!intakeData || !clientData) return;

    setIsDownloading(true);

    try {
      const accessToken = await ensureAccessToken();
      if (!accessToken) {
        setIsDownloading(false);
        showErrorToast("Authentication required");
        return;
      }

      const clientFullName = getClientFullName();
      const sectionsWithMessages = await fetchAllSectionMessages(accessToken);
      const tempContainer = createDocumentContainer(
        sectionsWithMessages,
        clientFullName,
      );

      document.body.appendChild(tempContainer);

      const pdfCSS = createPDFStyles(tempContainer);
      const chatHistoryData = createPDFData(tempContainer, pdfCSS);
      const fileName = `${clientFullName}_intake_chat_history.pdf`;

      await generatePDF(
        chatHistoryData,
        fileName,
        accessToken,
        () => {
          showSuccessToast("Chat history PDF downloaded successfully");
          document.body.removeChild(tempContainer);
        },
        (error) => {
          showErrorToast(error);
          document.body.removeChild(tempContainer);
        },
      );
    } catch (error) {
      console.error("Failed to download chat history:", error);
      showErrorToast("Failed to download chat history");
    } finally {
      setIsDownloading(false);
    }
  };

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
