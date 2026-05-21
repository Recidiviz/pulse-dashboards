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

import { Box, CircularProgress, LinearProgress } from "@mui/material";
import {
  Bookmark,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

import AdminIntakeHistory from "~@reentry/frontend/(protected)/intake/[intakeId]/chat-history/AdminIntakeHistory";
import { $api } from "~@reentry/frontend/api";
import styles from "~@reentry/frontend/components/shared/styles/markdown.module.css";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import ChatTemplateEditor from "./ChatTemplateEditor";

type ActiveTab = "chat" | "summary" | "action-plan";

const AIIntakeStatusPage = () => {
  const params = useParams();
  const { getAccessToken } = useAuth();
  const triggerId = params["executionId"] as string;
  const [isRetrying, setIsRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const searchParams = useSearchParams();
  const fromClient = searchParams.get("from") === "client";
  const backClientId = searchParams.get("clientId") ?? "";
  const rawClientName = searchParams.get("clientName");
  const backClientName = rawClientName ? decodeURIComponent(rawClientName) : "";

  // Poll status every 2 seconds
  const {
    data: status,
    isLoading,
    refetch: refetchStatus,
  } = $api.useQuery(
    "get",
    "/ai-personas/ai-intakes/{trigger_id}/trigger-status",
    {
      params: { path: { trigger_id: triggerId } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      refetchInterval: (query) => {
        // Stop polling when completed or failed
        const data = query.state.data;
        if (
          data?.status === "completed" ||
          data?.status === "failed" ||
          data?.status === "COMPLETED" ||
          data?.status === "FAILED"
        ) {
          return false;
        }
        return 2000; // Poll every 2 seconds
      },
    },
  );

  const intakeId = status?.intake_id ?? "";
  const personaId = status?.persona_id ?? "";

  const { data: persona } = $api.useQuery(
    "get",
    "/ai-personas/{persona_id}",
    {
      params: { path: { persona_id: personaId } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: !!personaId },
  );

  const { data: intakeData, refetch: refetchIntake } = $api.useQuery(
    "get",
    "/intake/admin/{intake_id}",
    { params: { path: { intake_id: intakeId } } },
    { enabled: !!intakeId },
  );

  const { data: clientData } = $api.useQuery(
    "get",
    "/clients/{client_pseudo_id}",
    {
      params: {
        path: { client_pseudo_id: intakeData?.client_pseudo_id as string },
      },
    },
    { enabled: !!intakeData?.client_pseudo_id },
  );

  const { data: addressData } = $api.useQuery(
    "get",
    "/intake/admin/{intake_id}/address",
    { params: { path: { intake_id: intakeId } } },
    { enabled: !!intakeId },
  );

  const { data: planData, isLoading: isPlanLoading } = $api.useQuery(
    "get",
    "/plans/by-intake/{intake_id}",
    { params: { path: { intake_id: intakeId } } },
    { enabled: !!intakeId },
  );

  const planId = planData?.id ?? "";

  const { data: summaryAsset, isLoading: isSummaryLoading } = $api.useQuery(
    "get",
    "/plans/{id}/assets/by-filename/{filename}",
    {
      params: {
        path: { id: planId, filename: "summary.md" },
        query: { include_data: true },
      },
    },
    { enabled: !!planId && activeTab === "summary" },
  );

  const retryMutation = $api.useMutation(
    "post",
    "/ai-personas/ai-intakes/{trigger_id}/retry",
  );

  const toggleTemplateMutation = $api.useMutation(
    "post",
    "/ai-personas/ai-intakes/{trigger_id}/toggle-template",
  );

  const isTemplate = status?.is_template ?? false;
  const isFromTemplate = status?.from_template ?? false;

  const handleToggleTemplate = async () => {
    try {
      await toggleTemplateMutation.mutateAsync({
        params: { path: { trigger_id: triggerId } },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      const label = isTemplate
        ? "removed from templates"
        : "marked as template";
      showSuccessToast(`Trigger ${label}.`);
      await refetchStatus();
    } catch {
      showErrorToast("Failed to update template status");
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchStatus(),
      intakeId ? refetchIntake() : Promise.resolve(),
    ]);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryMutation.mutateAsync({
        params: { path: { trigger_id: triggerId } },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });
      showSuccessToast("Retrying AI intake...");
      await refetchStatus();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to retry AI intake";
      showErrorToast(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading && !status) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress size={40} />
        <div className="mt-4 text-gray-600">Loading status...</div>
      </Box>
    );
  }

  const statusValue = status?.status?.toLowerCase() || "pending";
  const isCompleted =
    statusValue === "completed" || statusValue === "COMPLETED";
  const isFailed = statusValue === "failed" || statusValue === "FAILED";
  const isInProgress =
    statusValue === "in_progress" || statusValue === "IN_PROGRESS";

  // Parse output if available
  interface ExecutionOutput {
    status?: string;
    message_count?: number;
    completed_sections?: string[];
    error?: string;
  }
  let output: ExecutionOutput | null = null;
  try {
    if (status?.output) {
      output = JSON.parse(status.output) as ExecutionOutput;
    }
  } catch {
    // Ignore parse errors
  }

  let statusColorClass = "bg-gray-100 text-gray-800";
  if (isCompleted) {
    statusColorClass = "bg-green-100 text-green-800";
  } else if (isFailed) {
    statusColorClass = "bg-red-100 text-red-800";
  } else if (isInProgress) {
    statusColorClass = "bg-blue-100 text-blue-800";
  }

  const renderChatHistory = () => {
    if (
      clientData &&
      intakeData &&
      intakeData.intake_sections &&
      intakeData.intake_sections.length > 0 &&
      intakeData.status !== "created"
    ) {
      return (
        <div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          style={{ height: 800 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="text-lg font-medium text-gray-900">
              Intake Conversation History
            </div>
          </div>
          <div className="h-[calc(100%-61px)]">
            <AdminIntakeHistory clientRecord={clientData} intake={intakeData} />
          </div>
        </div>
      );
    }
    if (intakeId) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center h-[300px]">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <CircularProgress size={32} />
            <div className="text-sm">Loading conversation history...</div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center h-[300px]">
        <div className="text-sm text-gray-500 text-center">
          Conversation history will appear here once the intake is started.
        </div>
      </div>
    );
  };

  const renderSummaryContent = () => {
    if (!intakeId) {
      return (
        <div className="flex items-center justify-center h-[200px] text-sm text-gray-500">
          Summary will appear here once the intake is completed.
        </div>
      );
    }
    if (isPlanLoading || isSummaryLoading) {
      return (
        <div className="flex flex-col items-center gap-3 text-gray-500 py-12">
          <CircularProgress size={32} />
          <div className="text-sm">Loading summary...</div>
        </div>
      );
    }
    if (summaryAsset?.data) {
      return (
        <Markdown className={styles["markdown"]}>{summaryAsset.data}</Markdown>
      );
    }
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-gray-500">
        {planId
          ? "Summary not yet available for this intake."
          : "No plan found for this intake."}
      </div>
    );
  };

  const renderActionPlanContent = () => {
    if (!intakeId) {
      return (
        <div className="flex items-center justify-center h-[200px] text-sm text-gray-500">
          Action plan will appear here once the intake is completed.
        </div>
      );
    }
    if (isPlanLoading) {
      return (
        <div className="flex flex-col items-center gap-3 text-gray-500 py-12">
          <CircularProgress size={32} />
          <div className="text-sm">Loading action plan...</div>
        </div>
      );
    }
    if (planData?.latest_generation?.markdown_result) {
      return (
        <Markdown className={styles["markdown"]}>
          {planData.latest_generation.markdown_result}
        </Markdown>
      );
    }
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-gray-500">
        {planId
          ? "Action plan not yet generated for this intake."
          : "No plan found for this intake."}
      </div>
    );
  };

  return (
    <div className="w-full p-6 md:p-14 bg-[#f9fafa] min-h-screen">
      <div className="w-full max-w-screen-xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {fromClient ? (
              <Link
                href={`/client/${backClientId}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Go back to {backClientName || "Client"}
              </Link>
            ) : (
              <Link
                href="/ai-test-harness/personas"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Personas
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-black text-2xl font-medium">
              AI Intake Status
            </h1>
            <div className="flex items-center gap-3">
              {!isFromTemplate && (
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              )}
              {isCompleted && !isFromTemplate && (
                <button
                  onClick={handleToggleTemplate}
                  disabled={toggleTemplateMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                    isTemplate
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isTemplate ? "fill-amber-600" : ""}`}
                  />
                  {isTemplate ? "Remove Template" : "Mark as Template"}
                </button>
              )}
              {isCompleted && !isFromTemplate && intakeData && clientData && (
                <button
                  onClick={() => setShowTemplateEditor(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Export as a Template
                </button>
              )}
              {isFailed && !isFromTemplate && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003331] text-white rounded-full text-sm font-medium hover:bg-gray-950 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isRetrying ? "Retrying..." : "Retry Execution"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main content: side by side */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Status Card */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0 bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium text-gray-900">
                Execution Status
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusColorClass}`}
              >
                {statusValue}
              </span>
            </div>

            {/* Config Code */}
            {status?.assessment_config_code && (
              <div className="border-t border-gray-200 pt-4 flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  {status.assessment_config_code}
                </span>
                {status.assessment_config_name && (
                  <span className="text-sm text-gray-600">
                    {status.assessment_config_name}
                  </span>
                )}
              </div>
            )}

            {/* Persona Card */}
            {persona && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="text-sm font-medium text-gray-700">Persona</div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-900">
                      {persona.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                      Age {persona.age}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-medium text-blue-900">
                        Background:{" "}
                      </span>
                      <span className="text-blue-800">
                        {persona.background}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Challenges:{" "}
                      </span>
                      <span className="text-blue-800">
                        {persona.challenges}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Communication:{" "}
                      </span>
                      <span className="text-blue-800">
                        {persona.communication_style}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {!isCompleted && !isFailed && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{status?.progress || 0}%</span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={status?.progress || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#e5e7eb",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#003331",
                      borderRadius: 4,
                    },
                  }}
                />
              </div>
            )}

            {/* Current Message */}
            {status?.message && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Current Status:
                </div>
                <div className="text-sm text-gray-600">{status.message}</div>
              </div>
            )}

            {/* Client Info */}
            {clientData && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="text-sm font-medium text-gray-700">Client</div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
                  {clientData?.full_name && (
                    <div className="text-sm font-semibold text-gray-900">
                      {clientData.full_name.given_names}{" "}
                      {clientData.full_name.surname}
                    </div>
                  )}
                  <div className="text-xs font-mono text-gray-500 break-all">
                    {clientData.pseudonymized_client_id}
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {addressData && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="text-sm font-medium text-gray-700">Address</div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-0.5">
                  {addressData.street_address && (
                    <div className="text-sm text-gray-800">
                      {addressData.street_address}
                    </div>
                  )}
                  <div className="text-sm text-gray-800">
                    {addressData.city}, {addressData.state}
                  </div>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Trigger ID
                </div>
                <div className="text-sm text-gray-600 font-mono mt-1 break-all">
                  {triggerId}
                </div>
              </div>
              {status?.intake_id && (
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Intake ID
                  </div>
                  <div className="text-sm text-gray-600 font-mono mt-1 break-all">
                    {status.intake_id}
                  </div>
                </div>
              )}
            </div>

            {/* Output/Results */}
            {isCompleted && output && (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="text-lg font-medium text-gray-900">Results</div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-900">
                      Message Count
                    </div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      {output.message_count || 0}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-900">
                      Completed Sections
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {output.completed_sections?.length || 0}
                    </div>
                  </div>
                </div>

                {output.completed_sections &&
                  output.completed_sections.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Sections Completed:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {output.completed_sections.map((section, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Error */}
            {isFailed && output?.error && (
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-900 mb-1">
                    Error:
                  </div>
                  <div className="text-sm text-red-700">{output.error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Tabbed Content Panel */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex gap-2">
              {(
                [
                  { id: "chat", label: "Chat History" },
                  { id: "summary", label: "Summary" },
                  { id: "action-plan", label: "Action Plan" },
                ] as { id: ActiveTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#003331] text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chat History Tab */}
            {activeTab === "chat" && renderChatHistory()}

            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="text-lg font-medium text-gray-900">
                    Intake Summary
                  </div>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 760 }}>
                  {renderSummaryContent()}
                </div>
              </div>
            )}

            {/* Action Plan Tab */}
            {activeTab === "action-plan" && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="text-lg font-medium text-gray-900">
                    Action Plan
                  </div>
                </div>
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 760 }}>
                  {renderActionPlanContent()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTemplateEditor && intakeData && clientData && (
        <ChatTemplateEditor
          intake={intakeData}
          configDisplayName={status?.assessment_config_name ?? null}
          onClose={() => setShowTemplateEditor(false)}
        />
      )}
    </div>
  );
};

export default AIIntakeStatusPage;
