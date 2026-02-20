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

import { Box, CircularProgress, Typography } from "@mui/material";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { BACKEND_URL } from "~@reentry/frontend/constants";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { isInternalUser } from "~@reentry/frontend/lib/auth/permissions";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import { AuditLog, AuditLogEntry } from "../components/AuditLog";
import { ChangeNoteModal } from "../components/ChangeNoteModal";
import { StatusBadge } from "../components/StatusBadge";
import { TemplateVariableGuide } from "../components/TemplateVariableGuide";
import { ValidationStatus } from "../components/ValidationStatus";
import { YamlDiffViewer } from "../components/YamlDiffViewer";
import { YamlEditor } from "../components/YamlEditor";
import { configHeaders } from "../utils/configFetch";

// Debounce delay for validation (ms)
const VALIDATION_DEBOUNCE_MS = 500;

const ConfigDetailPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const userEmail = auth.authStore?.user?.email;

  const configId = params["id"] as string;
  const isOutputConfig = searchParams.get("type") === "output";

  const [editedYaml, setEditedYaml] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  // Modal states for change notes
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch assessment config using openapi-react-query
  const {
    data: assessmentConfig,
    isLoading: assessmentLoading,
    error: assessmentError,
    refetch: refetchAssessmentConfig,
  } = $api.useQuery(
    "get",
    "/config-management/assessments/{config_id}",
    {
      params: {
        path: { config_id: configId },
      },
    },
    {
      enabled: isInternalUser(userEmail) && !isOutputConfig,
    }
  );

  // Fetch output config using openapi-react-query
  const {
    data: outputConfig,
    isLoading: outputLoading,
    error: outputError,
    refetch: refetchOutputConfig,
  } = $api.useQuery(
    "get",
    "/config-management/outputs/{config_id}",
    {
      params: {
        path: { config_id: configId },
      },
    },
    {
      enabled: isInternalUser(userEmail) && isOutputConfig,
    }
  );

  // Fetch audit logs using openapi-react-query
  const {
    data: auditData,
    isLoading: auditLoading,
    refetch: refetchAuditLogs,
  } = $api.useQuery(
    "get",
    "/config-management/audit",
    {
      params: {
        query: {
          config_id: configId,
          config_type: isOutputConfig ? "output" : "assessment",
          page: 1,
          size: 20,
        },
      },
    },
    {
      enabled: isInternalUser(userEmail),
    }
  );

  // Mutations
  const { mutateAsync: updateAssessmentConfig, isPending: isSavingAssessment } =
    $api.useMutation("patch", "/config-management/assessments/{config_id}");

  const { mutateAsync: updateOutputConfig, isPending: isSavingOutput } =
    $api.useMutation("patch", "/config-management/outputs/{config_id}");

  const { mutateAsync: activateAssessmentConfig, isPending: isActivatingAssessment } =
    $api.useMutation("post", "/config-management/assessments/{config_id}/activate");

  const { mutateAsync: activateOutputConfig, isPending: isActivatingOutput } =
    $api.useMutation("post", "/config-management/outputs/{config_id}/activate");

  const { mutateAsync: deactivateAssessmentConfig, isPending: isDeactivatingAssessment } =
    $api.useMutation("post", "/config-management/assessments/{config_id}/deactivate");

  const { mutateAsync: deactivateOutputConfig, isPending: isDeactivatingOutput } =
    $api.useMutation("post", "/config-management/outputs/{config_id}/deactivate");

  const { mutateAsync: createNewAssessmentVersion, isPending: isCreatingAssessmentVersion } =
    $api.useMutation("post", "/config-management/assessments/{config_id}/new-version");

  const { mutateAsync: createNewOutputVersion, isPending: isCreatingOutputVersion } =
    $api.useMutation("post", "/config-management/outputs/{config_id}/new-version");

  const { mutateAsync: validateAssessmentYaml } =
    $api.useMutation("post", "/config-management/assessments/validate");

  const { mutateAsync: validateOutputYaml } =
    $api.useMutation("post", "/config-management/outputs/validate");

  // Unified config data
  const config = isOutputConfig ? outputConfig : assessmentConfig;
  const isLoading = isOutputConfig ? outputLoading : assessmentLoading;
  const error = isOutputConfig ? outputError : assessmentError;
  const refetchConfig = isOutputConfig ? refetchOutputConfig : refetchAssessmentConfig;

  // Unified pending states
  const isSaving = isOutputConfig ? isSavingOutput : isSavingAssessment;
  const isActivating = isOutputConfig ? isActivatingOutput : isActivatingAssessment;
  const isDeactivating = isOutputConfig ? isDeactivatingOutput : isDeactivatingAssessment;
  const isCreatingVersion = isOutputConfig ? isCreatingOutputVersion : isCreatingAssessmentVersion;

  // Wait for auth to finish loading before checking access
  if (auth.state.isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        className="bg-gray-50"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check internal user access (only after auth is loaded)
  if (!isInternalUser(userEmail)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        className="bg-gray-50"
      >
        <Typography variant="h5" className="text-gray-800 mb-2">
          Access Denied
        </Typography>
        <Typography className="text-gray-600">
          Config management is only available to Recidiviz staff.
        </Typography>
      </Box>
    );
  }

  // Validate YAML content against the backend using mutations
  const validateYaml = async (yamlContent: string) => {
    if (!yamlContent.trim()) {
      setValidationResult({
        valid: false,
        errors: ["YAML content cannot be empty"],
        warnings: [],
      });
      return;
    }

    setIsValidating(true);
    try {
      const validateMutation = isOutputConfig ? validateOutputYaml : validateAssessmentYaml;
      const result = await validateMutation({
        body: { yaml_content: yamlContent },
      });
      setValidationResult({
        valid: result.valid,
        errors: result.errors ?? [],
        warnings: result.warnings ?? [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Validation request failed";
      setValidationResult({
        valid: false,
        errors: [errorMessage],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Open save modal (validates first)
  const handleSaveDraftClick = async () => {
    if (!editedYaml) return;

    // Validate before showing modal
    if (!validationResult?.valid) {
      await validateYaml(editedYaml);
      if (!validationResult?.valid) {
        showErrorToast("Please fix validation errors before saving");
        return;
      }
    }
    setShowSaveModal(true);
  };

  // Actual save with change note using mutations
  const handleSaveDraftConfirm = async (changeNote: string) => {
    if (!editedYaml) return;

    try {
      const updateMutation = isOutputConfig ? updateOutputConfig : updateAssessmentConfig;
      await updateMutation({
        params: { path: { config_id: configId } },
        body: { config_yaml: editedYaml, change_note: changeNote },
      });

      showSuccessToast("Draft saved successfully");
      setEditedYaml(null);
      setValidationResult(null);
      setShowSaveModal(false);
      refetchConfig();
      refetchAuditLogs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save draft";
      showErrorToast(errorMessage);
    }
  };

  // Open activate modal (optional note)
  const handleActivateClick = () => {
    setShowActivateModal(true);
  };

  // Actual activate with optional change note using mutations
  const handleActivateConfirm = async (changeNote: string) => {
    try {
      const activateMutation = isOutputConfig ? activateOutputConfig : activateAssessmentConfig;
      await activateMutation({
        params: { path: { config_id: configId } },
        body: changeNote ? { change_note: changeNote } : {},
      });

      showSuccessToast("Config activated successfully");
      setShowActivateModal(false);
      refetchConfig();
      refetchAuditLogs();
    } catch {
      showErrorToast("Failed to activate config");
    }
  };

  const handleDeactivateClick = () => {
    setShowDeactivateModal(true);
  };

  // Actual deactivate with required change note using mutations
  const handleDeactivateConfirm = async (changeNote: string) => {
    try {
      const deactivateMutation = isOutputConfig ? deactivateOutputConfig : deactivateAssessmentConfig;
      await deactivateMutation({
        params: { path: { config_id: configId } },
        body: { change_note: changeNote },
      });

      showSuccessToast("Config deactivated");
      setShowDeactivateModal(false);
      refetchConfig();
      refetchAuditLogs();
    } catch {
      showErrorToast("Failed to deactivate config");
    }
  };

  // Open new version modal
  const handleNewVersionClick = () => {
    setShowNewVersionModal(true);
  };

  // Actual create new version with required change note using mutations
  const handleNewVersionConfirm = async (changeNote: string) => {
    try {
      const createVersionMutation = isOutputConfig ? createNewOutputVersion : createNewAssessmentVersion;
      const result = await createVersionMutation({
        params: { path: { config_id: configId } },
        body: { change_note: changeNote },
      });

      showSuccessToast("New version created as draft");
      setShowNewVersionModal(false);
      const query = isOutputConfig ? "?type=output" : "";
      router.push(`/config/${result.id}${query}`);
    } catch {
      showErrorToast("Failed to create new version");
    }
  };

  // Export needs to use fetch directly because it returns a blob (YAML file)
  const handleExport = async () => {
    try {
      const exportEndpoint = isOutputConfig
        ? `/config-management/outputs/${configId}/export`
        : `/config-management/assessments/${configId}/export`;

      const exportAccessToken = await auth.getAccessToken();
      const response = await fetch(`${BACKEND_URL}${exportEndpoint}`, {
        headers: configHeaders(exportAccessToken),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      // Extract filename from Content-Disposition header
      // Handles both: filename="name.yaml" and filename=name.yaml
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"|filename=([^\s;]+)/);
      const filename = filenameMatch?.[1] || filenameMatch?.[2] || "config.yaml";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccessToast("Config exported successfully");
    } catch {
      showErrorToast("Failed to export config");
    }
  };

  const handleYamlChange = (newValue: string) => {
    setEditedYaml(newValue);

    // Clear any pending validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Quick client-side check for empty content
    if (!newValue.trim()) {
      setValidationResult({
        valid: false,
        errors: ["YAML content cannot be empty"],
        warnings: [],
      });
      return;
    }

    // Set validating state and debounce the backend validation
    setIsValidating(true);
    validationTimeoutRef.current = setTimeout(() => {
      validateYaml(newValue);
    }, VALIDATION_DEBOUNCE_MS);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading config...
        </Typography>
      </Box>
    );
  }

  if (error || !config) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        className="bg-gray-50"
      >
        <Typography variant="h5" className="text-gray-800 mb-2">
          Config Not Found
        </Typography>
        <Link href="/config" className="text-blue-600 hover:underline">
          Back to Config Management
        </Link>
      </Box>
    );
  }

  const isDraft = config.status === "draft";
  const isActive = config.status === "active" || config.is_active;
  const isInactive = config.status === "inactive";

  const currentYaml = editedYaml ?? config.config_yaml;

  // Transform audit entries to handle null details
  const auditEntries: AuditLogEntry[] = (auditData?.items || []).map((item) => ({
    ...item,
    details: item.details ?? undefined,
  }));

  return (
    <div className="w-full p-6 md:p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] min-h-screen">
      <div className="w-full max-w-5xl flex-col justify-start items-start gap-6 flex">
        {/* Header */}
        <div className="flex items-start justify-between w-full gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <Link
              href="/config"
              className="text-gray-500 hover:text-gray-700 flex-shrink-0 pt-1"
            >
              ← Back
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1
                  className="text-xl font-medium text-gray-900 truncate"
                  title={config.display_name}
                >
                  {config.display_name}
                </h1>
                <span className="text-gray-500 flex-shrink-0 whitespace-nowrap">
                  v{config.version}
                </span>
                <div className="flex-shrink-0">
                  <StatusBadge
                    status={config.status}
                    isActive={config.is_active}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isOutputConfig
                  ? config.code
                  : `${"state_code" in config ? config.state_code : ""}/${config.code}`}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isDraft && (
              <>
                <button
                  onClick={() => setShowDiffViewer(true)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Compare
                </button>
                <button
                  onClick={handleSaveDraftClick}
                  disabled={
                    !editedYaml ||
                    isSaving ||
                    isValidating ||
                    (validationResult !== null && !validationResult.valid)
                  }
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    validationResult !== null && !validationResult.valid
                      ? "Fix validation errors before saving"
                      : undefined
                  }
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  onClick={handleActivateClick}
                  disabled={isActivating || !!editedYaml}
                  className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActivating ? "Activating..." : "Activate"}
                </button>
              </>
            )}
            {isInactive && (
              <>
                <button
                  onClick={() => setShowDiffViewer(true)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Compare
                </button>
                <button
                  onClick={handleActivateClick}
                  disabled={isActivating}
                  className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isActivating ? "Activating..." : "Reactivate"}
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Export YAML
                </button>
              </>
            )}
            {isActive && (
              <>
                <button
                  onClick={() => setShowDiffViewer(true)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Compare
                </button>
                <button
                  onClick={handleDeactivateClick}
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-full hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Deactivate
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Export YAML
                </button>
                <button
                  onClick={handleNewVersionClick}
                  disabled={isCreatingVersion}
                  className="px-4 py-2 bg-[#003331] text-white rounded-full hover:bg-gray-950 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isCreatingVersion ? "Creating..." : "Create New Version"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Version Info */}
        <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Version Info
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>
              <p className="font-medium">
                {new Date(config.created_at).toLocaleDateString()}
              </p>
              {config.created_by_email && (
                <p className="text-gray-500 text-xs">{config.created_by_email}</p>
              )}
            </div>
            {config.activated_at && (
              <div>
                <span className="text-gray-500">Activated:</span>
                <p className="font-medium">
                  {new Date(config.activated_at).toLocaleDateString()}
                </p>
                {config.activated_by_email && (
                  <p className="text-gray-500 text-xs">
                    {config.activated_by_email}
                  </p>
                )}
              </div>
            )}
            {config.imported_from_env && (
              <div>
                <span className="text-gray-500">Imported from:</span>
                <p className="font-medium">{config.imported_from_env}</p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Metadata</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {!isOutputConfig && "state_code" in config && config.state_code && (
              <div>
                <label className="text-gray-500">State Code</label>
                <p className="font-medium">{config.state_code}</p>
              </div>
            )}
            <div>
              <label className="text-gray-500">Code</label>
              <p className="font-medium">{config.code}</p>
            </div>
            {isOutputConfig && "output_type" in config && config.output_type && (
              <div>
                <label className="text-gray-500">Output Type</label>
                <p className="font-medium capitalize">
                  {config.output_type.replace("_", " ")}
                </p>
              </div>
            )}
            <div>
              <label className="text-gray-500">Display Name</label>
              <p className="font-medium">{config.display_name}</p>
            </div>
            {config.description && (
              <div className="col-span-2">
                <label className="text-gray-500">Description</label>
                <p className="font-medium">{config.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Template Variable Guide (for output configs when editing) */}
        {isOutputConfig && isDraft && "output_type" in config && (
          <TemplateVariableGuide
            outputType={config.output_type as "action_plan" | "intake_summary"}
          />
        )}

        {/* Validation Status (for drafts) */}
        {isDraft && editedYaml !== null && isValidating && (
          <div className="w-full">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-blue-800 font-medium">
                Validating YAML...
              </span>
            </div>
          </div>
        )}
        {isDraft && editedYaml !== null && !isValidating && validationResult && (
          <div className="w-full">
            <ValidationStatus
              valid={validationResult.valid}
              errors={validationResult.errors}
              warnings={validationResult.warnings}
            />
          </div>
        )}

        {/* YAML Editor */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700">
              Config Content
            </h2>
            {!isDraft && (
              <span className="text-xs text-gray-500">(Read-only)</span>
            )}
          </div>
          <YamlEditor
            value={currentYaml}
            onChange={isDraft ? handleYamlChange : undefined}
            readOnly={!isDraft}
            height="500px"
          />
        </div>

        {/* Audit History */}
        <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-700 mb-4">History</h2>
          <AuditLog entries={auditEntries} isLoading={auditLoading} />
        </div>
      </div>

      {/* Save Draft Modal */}
      <ChangeNoteModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSaveDraftConfirm}
        title="Save Draft"
        description="Describe what you changed in this draft."
        actionLabel="Save Draft"
        actionColor="primary"
        isLoading={isSaving}
        required={true}
      />

      {/* Activate Modal */}
      <ChangeNoteModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onConfirm={handleActivateConfirm}
        title="Activate Config"
        description="This will make this config active in production. You can optionally add a note about why you're activating it."
        actionLabel="Activate"
        actionColor="success"
        isLoading={isActivating}
        required={false}
      />

      {/* Deactivate Modal */}
      <ChangeNoteModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivateConfirm}
        title="Deactivate Config"
        description="Warning: This will leave no active config for this config code. Please explain why you're deactivating this config."
        actionLabel="Deactivate"
        actionColor="danger"
        isLoading={isDeactivating}
        required={true}
      />

      {/* Create New Version Modal */}
      <ChangeNoteModal
        isOpen={showNewVersionModal}
        onClose={() => setShowNewVersionModal(false)}
        onConfirm={handleNewVersionConfirm}
        title="Create New Version"
        description="This will create a new draft version based on this config. Describe why you're creating a new version."
        actionLabel="Create Version"
        actionColor="primary"
        isLoading={isCreatingVersion}
        required={true}
      />

      {/* Diff Viewer Modal */}
      {showDiffViewer && (
        <YamlDiffViewer
          currentYaml={currentYaml}
          currentConfigId={configId}
          currentConfigName={`${config.display_name} v${config.version} (${config.status})`}
          isOutputConfig={isOutputConfig}
          onClose={() => setShowDiffViewer(false)}
        />
      )}
    </div>
  );
};

export default ConfigDetailPage;
