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
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { BACKEND_URL } from "~@reentry/frontend/constants";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { isInternalUser } from "~@reentry/frontend/lib/auth/permissions";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import { ValidationStatus } from "../components/ValidationStatus";

const getCharCountColor = (currentLength: number, maxLength: number): string => {
  if (currentLength > maxLength) return "text-red-500";
  if (currentLength > maxLength - 50) return "text-amber-500";
  return "text-gray-400";
};

interface ValidationResult {
  valid: boolean;
  parsed_config?: {
    state_code?: string;
    code: string;
    version: number;
    display_name: string;
    output_type?: string;
  };
  existing_version?: number;
  errors: string[];
  warnings: string[];
}

const ImportConfigPage = () => {
  const router = useRouter();
  const auth = useAuth();
  const userEmail = auth.authStore?.user?.email;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [configType, setConfigType] = useState<"assessment" | "output">(
    "assessment"
  );
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [autoActivate, setAutoActivate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  const MAX_CHARS = 500;

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
        setSelectedFile(file);
        setValidationResult(null);
      } else {
        showErrorToast("Please select a YAML file (.yaml or .yml)");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
        setSelectedFile(file);
        setValidationResult(null);
      } else {
        showErrorToast("Please select a YAML file (.yaml or .yml)");
      }
    }
  };

  // File upload validation/import use FormData which requires fetch
  // (openapi-react-query doesn't handle multipart/form-data well)
  const handleValidate = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const endpoint =
        configType === "assessment"
          ? "/config-management/assessments/import/validate"
          : "/config-management/outputs/import/validate";

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.getAccessToken()}`,
        },
        body: formData,
      });

      const result = await response.json();
      setValidationResult(result);

      if (result.valid) {
        showSuccessToast("YAML validation passed");
      }
    } catch {
      showErrorToast("Failed to validate YAML");
    } finally {
      setIsValidating(false);
    }
  };

  // File upload import uses FormData which requires fetch
  const handleImport = async () => {
    if (!selectedFile || !validationResult?.valid || !changeNote.trim()) return;

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const params = new URLSearchParams({
        auto_activate: String(autoActivate),
        change_note: changeNote.trim(),
      });

      const endpoint =
        configType === "assessment"
          ? `/config-management/assessments/import?${params}`
          : `/config-management/outputs/import?${params}`;

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.getAccessToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Import failed");
      }

      const result = await response.json();
      showSuccessToast(result.message || "Config imported successfully");

      // Navigate to the imported config
      const query = configType === "output" ? "?type=output" : "";
      router.push(`/config/${result.id}${query}`);
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Failed to import config"
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full p-6 md:p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] min-h-screen">
      <div className="w-full max-w-3xl flex-col justify-start items-start gap-6 flex">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/config" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <h1 className="text-xl font-medium text-gray-900">Import Config</h1>
        </div>

        {/* Config Type Selection */}
        <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Config Type
          </h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="configType"
                value="assessment"
                checked={configType === "assessment"}
                onChange={() => {
                  setConfigType("assessment");
                  setValidationResult(null);
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Assessment Config</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="configType"
                value="output"
                checked={configType === "output"}
                onChange={() => {
                  setConfigType("output");
                  setValidationResult(null);
                }}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Output Config</span>
            </label>
          </div>
        </div>

        {/* File Upload */}
        <div className="w-full">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Upload YAML File
          </h2>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white"
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-700 font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setValidationResult(null);
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-gray-600">
                  Drop YAML file here or click to browse
                </p>
                <input
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Validate Button */}
        {selectedFile && !validationResult && (
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isValidating ? "Validating..." : "Validate YAML"}
          </button>
        )}

        {/* Validation Results */}
        {validationResult && (
          <div className="w-full space-y-4">
            <ValidationStatus
              valid={validationResult.valid}
              errors={validationResult.errors}
              warnings={validationResult.warnings}
            />

            {/* Parsed Config Preview */}
            {validationResult.valid && validationResult.parsed_config && (
              <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Parsed Config Preview
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {validationResult.parsed_config.state_code && (
                    <div>
                      <span className="text-gray-500">State:</span>
                      <p className="font-medium">
                        {validationResult.parsed_config.state_code}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Code:</span>
                    <p className="font-medium">
                      {validationResult.parsed_config.code}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Version:</span>
                    <p className="font-medium">
                      v{validationResult.parsed_config.version}
                      {validationResult.existing_version !== undefined && (
                        <span className="text-gray-500 ml-1">
                          (previous: v{validationResult.existing_version})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Display Name:</span>
                    <p className="font-medium">
                      {validationResult.parsed_config.display_name}
                    </p>
                  </div>
                  {validationResult.parsed_config.output_type && (
                    <div>
                      <span className="text-gray-500">Output Type:</span>
                      <p className="font-medium capitalize">
                        {validationResult.parsed_config.output_type.replace(
                          "_",
                          " "
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Change Note */}
            {validationResult.valid && (
              <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Change Note <span className="text-red-500">*</span>
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Describe the purpose of this import (e.g., migrating from staging, updating config for new requirements)
                </p>
                <textarea
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Describe the purpose of this import..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003331] focus:border-transparent resize-none ${
                    changeNote.length > MAX_CHARS ? "border-red-500" : "border-gray-300"
                  }`}
                  rows={3}
                  maxLength={MAX_CHARS + 50}
                />
                <div
                  className={`flex justify-end text-xs mt-1 ${
                    getCharCountColor(changeNote.length, MAX_CHARS)
                  }`}
                >
                  {MAX_CHARS - changeNote.length} characters remaining
                </div>
              </div>
            )}

            {/* Import Options */}
            {validationResult.valid && (
              <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Import Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="importOption"
                      checked={!autoActivate}
                      onChange={() => setAutoActivate(false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-sm text-gray-700 font-medium">
                        Import as draft
                      </span>
                      <p className="text-xs text-gray-500">
                        Review before activating
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="importOption"
                      checked={autoActivate}
                      onChange={() => setAutoActivate(true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-sm text-gray-700 font-medium">
                        Import and activate immediately
                      </span>
                      <p className="text-xs text-gray-500">
                        Publish and activate in one step
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Import Button */}
            {validationResult.valid && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setValidationResult(null);
                    setChangeNote("");
                  }}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || !changeNote.trim() || changeNote.length > MAX_CHARS}
                  title={!changeNote.trim() ? "Change note is required" : undefined}
                  className="px-6 py-2 bg-[#003331] text-white rounded-full hover:bg-gray-950 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? "Importing..." : "Import Config"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportConfigPage;
