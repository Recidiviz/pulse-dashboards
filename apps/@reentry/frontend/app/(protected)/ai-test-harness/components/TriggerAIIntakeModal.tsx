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

import { FileJson, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "react-modal";

import { $api } from "~@reentry/frontend/api";
import { FormSelect } from "~@reentry/frontend/components/clients/AddClientModal/FormSelect";
import { LoadingSpinner } from "~@reentry/frontend/components/clients/AddClientModal/LoadingSpinner";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  FullAddressForm,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import { components } from "~@reentry/openapi-types";

type ClientData = components["schemas"]["ClientRecordResponse"];

type Mode = "persona" | "template" | "json";

type ChatTemplateSection = {
  title: string;
  messages: Array<{ from_role: string; content: string }>;
};

type ParsedJsonTemplate = {
  sections: ChatTemplateSection[];
  config_display_name: string | null;
};

const validateJsonTemplate = (data: unknown): ParsedJsonTemplate | null => {
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;

  // Support both old format (bare array) and new format ({ sections, config_display_name })
  const sections: unknown = Array.isArray(data) ? data : obj["sections"];
  const configDisplayName =
    typeof obj["config_display_name"] === "string"
      ? obj["config_display_name"]
      : null;

  if (!Array.isArray(sections) || sections.length === 0) return null;
  for (const section of sections) {
    if (typeof section.title !== "string" || !Array.isArray(section.messages))
      return null;
    for (const msg of section.messages) {
      if (typeof msg.from_role !== "string" || typeof msg.content !== "string")
        return null;
    }
  }
  return {
    sections: sections as ChatTemplateSection[],
    config_display_name: configDisplayName,
  };
};

interface TriggerAIIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: components["schemas"]["IntakeHistoryResponse"];
  clientData?: ClientData | null;
}

export const TriggerAIIntakeModal = ({
  isOpen,
  onClose,
  assessment,
  clientData,
}: TriggerAIIntakeModalProps) => {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [mode, setMode] = useState<Mode>("persona");
  const [personaId, setPersonaId] = useState("");
  const [selectedTemplateTriggerId, setSelectedTemplateTriggerId] =
    useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [jsonTemplate, setJsonTemplate] = useState<
    ChatTemplateSection[] | null
  >(null);
  const [jsonConfigName, setJsonConfigName] = useState<string | null>(null);
  const [jsonFileName, setJsonFileName] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [filterByConfig, setFilterByConfig] = useState(true);
  const [showPersonaDetails, setShowPersonaDetails] = useState(false);

  const { data: personasData } = $api.useQuery("get", "/ai-personas", {
    params: { query: { page: 1, size: 1000 } },
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
  });

  const { data: templateTriggers } = $api.useQuery(
    "get",
    "/ai-personas/ai-intakes/templates",
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
  );

  // Persona preview in "persona" mode
  const { data: selectedPersona } = $api.useQuery(
    "get",
    "/ai-personas/{persona_id}",
    {
      params: { path: { persona_id: personaId } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: mode === "persona" && !!personaId },
  );

  const triggerMutation = $api.useMutation(
    "post",
    "/ai-personas/ai-intakes/trigger",
  );

  const handleModeChange = (next: Mode) => {
    setMode(next);
    setPersonaId("");
    setSelectedTemplateTriggerId("");
    setJsonTemplate(null);
    setJsonConfigName(null);
    setJsonFileName(null);
    setJsonError(null);
    setError(null);
    setFilterByConfig(true);
    setShowPersonaDetails(false);
  };

  const currentConfigName = assessment.assessment_config_code ?? null;

  let visibleTemplates: NonNullable<typeof templateTriggers> = [];
  if (templateTriggers) {
    visibleTemplates =
      filterByConfig && currentConfigName
        ? templateTriggers.filter(
            (t) => t.assessment_config_code === currentConfigName,
          )
        : templateTriggers;
  }

  // Persona preview in "template" mode — derived from personasData
  const selectedTemplate = visibleTemplates.find(
    (t) => t.trigger_id === selectedTemplateTriggerId,
  );
  const templatePersona = selectedTemplate
    ? personasData?.items?.find((p) => p.id === selectedTemplate.persona_id)
    : null;

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonFileName(file.name);
    setJsonError(null);
    setJsonTemplate(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const validated = validateJsonTemplate(parsed);
        if (!validated) {
          setJsonError(
            "Invalid format. Expected an array of sections with title and messages.",
          );
        } else {
          setJsonTemplate(validated.sections);
          setJsonConfigName(validated.config_display_name);
        }
      } catch {
        setJsonError("Could not parse file. Make sure it is valid JSON.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-uploaded
    e.target.value = "";
  };

  const handleClose = () => {
    setMode("persona");
    setPersonaId("");
    setSelectedTemplateTriggerId("");
    setJsonTemplate(null);
    setJsonConfigName(null);
    setJsonFileName(null);
    setJsonError(null);
    setStreetAddress("");
    setCity("");
    setState("");
    setError(null);
    setAddressError(null);
    setShowPersonaDetails(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "persona" && !personaId) {
      setError("Please select a persona.");
      return;
    }
    if (mode === "template" && !selectedTemplateTriggerId) {
      setError("Please select a template.");
      return;
    }
    if (mode === "json" && !jsonTemplate) {
      setError("Please upload a valid JSON template.");
      return;
    }
    if (!isFormValid) {
      setError("Please fill in the address.");
      return;
    }

    try {
      const baseAddress = {
        intake_id: assessment.id,
        street_address: streetAddress || null,
        city,
        state,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body: any;
      if (mode === "persona") {
        body = { ...baseAddress, persona_id: personaId };
      } else if (mode === "template") {
        body = {
          ...baseAddress,
          template_trigger_id: selectedTemplateTriggerId,
        };
      } else {
        body = { ...baseAddress, chat_template: jsonTemplate };
      }

      const result = await triggerMutation.mutateAsync({
        body,
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      showSuccessToast("AI Intake triggered successfully!");
      const clientId = clientData?.pseudonymized_client_id ?? "";
      const clientName = encodeURIComponent(
        `${clientData?.full_name?.given_names ?? ""} ${clientData?.full_name?.surname ?? ""}`.trim(),
      );
      const backQuery = clientData
        ? `?from=client&clientId=${clientId}&clientName=${clientName}`
        : "";
      router.push(`/ai-test-harness/status/${result.trigger_id}${backQuery}`);
      handleClose();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to trigger AI intake";
      showErrorToast(errorMessage);
      setError(errorMessage);
    }
  };

  const isLoading = triggerMutation.isPending;

  // The persona card to show — differs by mode
  const personaPreview =
    mode === "persona" ? selectedPersona : templatePersona ?? null;
  const previewConfigName =
    mode === "template"
      ? selectedTemplate?.assessment_config_code ?? null
      : assessment.assessment_config_code ?? null;

  let modeInvalid: boolean;
  if (mode === "persona") {
    modeInvalid = !personaId;
  } else if (mode === "template") {
    modeInvalid = !selectedTemplateTriggerId;
  } else {
    modeInvalid = !jsonTemplate;
  }
  const isSubmitDisabled = isLoading || !isFormValid || modeInvalid;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="outline-none w-full max-w-2xl mx-auto"
      overlayClassName="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
      ariaHideApp={false}
    >
      <div className="w-full bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_0px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_0px_rgba(43,84,105,0.10)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="self-stretch px-4 py-3 border-b border-[#2b5469]/20 flex justify-between items-center">
          <div className="text-[#002321] text-base font-medium font-['Public_Sans'] leading-tight">
            Trigger AI Intake
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={handleClose}
            aria-label="Close modal"
            type="button"
            disabled={isLoading}
          >
            <X size={14} className="text-[#004D48]" />
          </button>
        </div>

        {/* Body */}
        <div className="self-stretch p-4 flex flex-col gap-4">
          {error && (
            <div className="text-red-700 text-sm font-medium p-2 rounded bg-red-50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Mode toggle */}
            <div className="flex rounded-full border border-gray-300 p-0.5 w-full">
              <button
                type="button"
                onClick={() => handleModeChange("persona")}
                disabled={isLoading}
                className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  mode === "persona"
                    ? "bg-[#003331] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Use AI Persona
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("template")}
                disabled={isLoading || !templateTriggers?.length}
                className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-40 ${
                  mode === "template"
                    ? "bg-[#003331] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Use Template
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("json")}
                disabled={isLoading}
                className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  mode === "json"
                    ? "bg-[#003331] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Use JSON Template
              </button>
            </div>

            {/* Persona mode */}
            {mode === "persona" && (
              <div className="w-full">
                <label
                  htmlFor="persona-select"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  AI Persona *
                </label>
                <FormSelect
                  id="persona-select"
                  value={personaId}
                  onChange={setPersonaId}
                  placeholder="Select a persona"
                  disabled={isLoading}
                  options={
                    personasData?.items?.map((p) => ({
                      value: p.id,
                      label: `${p.name} (Age: ${p.age})`,
                    })) || []
                  }
                />
              </div>
            )}

            {/* Template mode */}
            {mode === "template" && (
              <div className="w-full flex flex-col gap-3">
                {/* Config filter toggle */}
                {currentConfigName && (
                  <div className="flex rounded-full border border-gray-200 p-0.5 w-full text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterByConfig(true);
                        setSelectedTemplateTriggerId("");
                      }}
                      disabled={isLoading}
                      className={`flex-1 py-1.5 rounded-full font-medium transition-colors ${
                        filterByConfig
                          ? "bg-[#003331] text-white"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {currentConfigName} only
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterByConfig(false);
                        setSelectedTemplateTriggerId("");
                      }}
                      disabled={isLoading}
                      className={`flex-1 py-1.5 rounded-full font-medium transition-colors ${
                        !filterByConfig
                          ? "bg-[#003331] text-white"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      All configs
                    </button>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="template-select"
                    className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                  >
                    Template *
                  </label>
                  <FormSelect
                    id="template-select"
                    value={selectedTemplateTriggerId}
                    onChange={setSelectedTemplateTriggerId}
                    placeholder="Select a template"
                    disabled={isLoading}
                    options={visibleTemplates.map((t) => {
                      const persona = personasData?.items?.find(
                        (p) => p.id === t.persona_id,
                      );
                      const personaLabel = persona
                        ? `${persona.name} (Age ${persona.age})`
                        : t.persona_id;
                      const configLabel = t.assessment_config_code ?? "";
                      return {
                        value: t.trigger_id,
                        label: `${personaLabel} — ${new Date(t.created_at).toLocaleDateString()}${configLabel ? ` — ${configLabel}` : ""}`,
                      };
                    })}
                  />
                </div>
              </div>
            )}

            {/* JSON template mode */}
            {mode === "json" && (
              <div className="flex flex-col gap-3">
                <label className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] text-left">
                  Chat Template JSON *
                </label>

                {/* Upload area */}
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-600 font-medium">
                    {jsonFileName ?? "Click to upload JSON file"}
                  </span>
                  <span className="text-xs text-gray-400">
                    Must match the exported chat template format
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileChange}
                    disabled={isLoading}
                    className="sr-only"
                  />
                </label>

                {/* Error */}
                {jsonError && (
                  <div className="text-red-700 text-sm p-3 rounded-lg bg-red-50 border border-red-200">
                    {jsonError}
                  </div>
                )}

                {/* Valid template summary */}
                {jsonTemplate &&
                  (() => {
                    const totalMessages = jsonTemplate.reduce(
                      (sum, s) => sum + s.messages.length,
                      0,
                    );
                    const mismatch = !!(
                      jsonConfigName &&
                      currentConfigName &&
                      jsonConfigName !== currentConfigName
                    );
                    return (
                      <div className="border border-green-200 rounded-xl overflow-hidden">
                        {/* Header row */}
                        <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-b border-green-200">
                          <div className="flex items-center gap-2">
                            <FileJson className="w-4 h-4 text-green-700" />
                            <span className="text-sm font-semibold text-green-800">
                              Valid template
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {jsonConfigName && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  mismatch
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {jsonConfigName}
                                {mismatch && " ⚠"}
                              </span>
                            )}
                            <span className="text-xs text-green-700 font-medium">
                              {jsonTemplate.length} sections · {totalMessages}{" "}
                              messages
                            </span>
                          </div>
                        </div>
                        {/* Scrollable section list */}
                        <div className="overflow-y-auto max-h-[140px] divide-y divide-green-100 bg-white">
                          {jsonTemplate.map((section) => (
                            <div
                              key={section.title}
                              className="flex items-center justify-between px-4 py-2"
                            >
                              <span className="text-sm text-gray-700">
                                {section.title}
                              </span>
                              <span className="text-xs text-gray-400 tabular-nums">
                                {section.messages.length}{" "}
                                {section.messages.length === 1 ? "msg" : "msgs"}
                              </span>
                            </div>
                          ))}
                        </div>
                        {mismatch && (
                          <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700">
                            Config mismatch — this template was created for{" "}
                            <strong>{jsonConfigName}</strong>, but the current
                            intake uses <strong>{currentConfigName}</strong>.
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Persona preview card — shown in both modes once a selection is made */}
            {personaPreview && (
              <div className="mt-1 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 p-3">
                  <span className="text-sm font-semibold text-blue-900">
                    {personaPreview.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                    Age {personaPreview.age}
                  </span>
                  {previewConfigName && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {previewConfigName}
                    </span>
                  )}
                  {mode === "template" && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      from template
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPersonaDetails((v) => !v)}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showPersonaDetails ? "Hide details" : "Show details"}
                  </button>
                </div>
                {showPersonaDetails && (
                  <div className="overflow-y-auto max-h-[120px] px-3 pb-3 border-t border-blue-200 space-y-2 text-sm pt-2">
                    <div>
                      <span className="font-medium text-blue-900">
                        Background:
                      </span>
                      <p className="text-blue-800 mt-0.5">
                        {personaPreview.background}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Challenges:
                      </span>
                      <p className="text-blue-800 mt-0.5">
                        {personaPreview.challenges}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">
                        Communication Style:
                      </span>
                      <p className="text-blue-800 mt-0.5">
                        {personaPreview.communication_style}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Address Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Address Information
              </h3>
              <div className="space-y-4 [&>div]:mb-0 [&_label]:text-[16px] [&_label]:tracking-[-0.02em] [&_label]:text-[#012322] [&_label]:font-medium [&_input]:p-3 [&_input]:rounded-lg [&_input]:border-gray-300 [&_input]:focus:border-gray-900 [&_button]:p-3 [&_button]:rounded-lg [&_button]:border-gray-300 [&_button]:focus:border-gray-900">
                <FullAddressForm
                  addressValue={streetAddress}
                  cityValue={city}
                  stateValue={state}
                  onAddressChange={(value) => {
                    setStreetAddress(value);
                    setAddressError(null);
                  }}
                  onCityChange={setCity}
                  onStateChange={setState}
                  disabled={isLoading}
                  addressError={addressError}
                  onFormValidChange={setIsFormValid}
                  twoColumns={true}
                  getAccessToken={getAccessToken}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-full py-2 w-full disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="hover:bg-gray-950 text-white rounded-full py-2 w-full disabled:opacity-50 bg-[#003331]"
              >
                {isLoading ? <LoadingSpinner /> : "Start AI Intake"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default TriggerAIIntakeModal;
