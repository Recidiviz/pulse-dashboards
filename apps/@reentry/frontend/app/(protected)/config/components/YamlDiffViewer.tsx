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

import { useEffect, useState } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

import { $api } from "~@reentry/frontend/api";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { isActiveRecidivizUser } from "~@reentry/frontend/lib/auth/permissions";

interface ConfigOption {
  id: string;
  code: string;
  version: number;
  display_name: string;
  state_code?: string;
  status: string;
}

interface YamlDiffViewerProps {
  currentYaml: string;
  currentConfigId: string;
  currentConfigName: string;
  isOutputConfig: boolean;
  onClose: () => void;
}

export const YamlDiffViewer = ({
  currentYaml,
  currentConfigId,
  currentConfigName,
  isOutputConfig,
  onClose,
}: YamlDiffViewerProps) => {
  const auth = useAuth();
  const userEmail = auth.authStore?.user?.email;

  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [compareConfigName, setCompareConfigName] = useState<string>("");
  const [splitView, setSplitView] = useState(true);

  // Fetch assessment configs using openapi-react-query
  const { data: assessmentConfigsData, isLoading: isLoadingAssessmentConfigs } =
    $api.useQuery(
      "get",
      "/config-management/assessments",
      {
        params: {
          query: { size: 100 },
        },
      },
      {
        enabled: isActiveRecidivizUser(userEmail) && !isOutputConfig,
      },
    );

  // Fetch output configs using openapi-react-query
  const { data: outputConfigsData, isLoading: isLoadingOutputConfigs } =
    $api.useQuery(
      "get",
      "/config-management/outputs",
      {
        params: {
          query: { size: 100 },
        },
      },
      {
        enabled: isActiveRecidivizUser(userEmail) && isOutputConfig,
      },
    );

  // Fetch selected assessment config detail
  const { data: selectedAssessmentConfig, isLoading: isLoadingAssessmentYaml } =
    $api.useQuery(
      "get",
      "/config-management/assessments/{config_id}",
      {
        params: {
          path: { config_id: selectedConfigId },
        },
      },
      {
        enabled:
          isActiveRecidivizUser(userEmail) &&
          !isOutputConfig &&
          !!selectedConfigId,
      },
    );

  // Fetch selected output config detail
  const { data: selectedOutputConfig, isLoading: isLoadingOutputYaml } =
    $api.useQuery(
      "get",
      "/config-management/outputs/{config_id}",
      {
        params: {
          path: { config_id: selectedConfigId },
        },
      },
      {
        enabled:
          isActiveRecidivizUser(userEmail) &&
          isOutputConfig &&
          !!selectedConfigId,
      },
    );

  // Unified loading and data states
  const isLoadingConfigs = isOutputConfig
    ? isLoadingOutputConfigs
    : isLoadingAssessmentConfigs;
  const isLoadingYaml = isOutputConfig
    ? isLoadingOutputYaml
    : isLoadingAssessmentYaml;
  const configsData = isOutputConfig
    ? outputConfigsData
    : assessmentConfigsData;
  const selectedConfigData = isOutputConfig
    ? selectedOutputConfig
    : selectedAssessmentConfig;

  // Filter out current config from available configs
  const availableConfigs: ConfigOption[] = (configsData?.items || [])
    .filter((c) => c.id !== currentConfigId)
    .map((c) => ({
      id: c.id,
      code: c.code,
      version: c.version,
      display_name: c.display_name,
      state_code: "state_code" in c ? c.state_code : undefined,
      status: c.status,
    }));

  const compareYaml = selectedConfigData?.config_yaml ?? null;

  // Update compare config name when selection changes
  useEffect(() => {
    if (selectedConfigId && availableConfigs.length > 0) {
      const config = availableConfigs.find((c) => c.id === selectedConfigId);
      if (config) {
        setCompareConfigName(
          `${config.display_name} v${config.version} (${config.status})`,
        );
      }
    } else {
      setCompareConfigName("");
    }
  }, [selectedConfigId, availableConfigs]);

  // Group configs by code for easier navigation
  const groupedConfigs = availableConfigs.reduce(
    (acc, config) => {
      const key = isOutputConfig
        ? config.code
        : `${config.state_code}/${config.code}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(config);
      return acc;
    },
    {} as Record<string, ConfigOption[]>,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] max-w-7xl h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Compare Configurations
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">View:</label>
              <button
                onClick={() => setSplitView(true)}
                className={`px-3 py-1 text-sm rounded ${
                  splitView
                    ? "bg-[#003331] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setSplitView(false)}
                className={`px-3 py-1 text-sm rounded ${
                  !splitView
                    ? "bg-[#003331] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Unified
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Config Selector */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Config (Left)
              </label>
              <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700">
                {currentConfigName}
              </div>
            </div>
            <div className="flex items-center pt-6">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare With (Right)
              </label>
              {isLoadingConfigs ? (
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500">
                  Loading configs...
                </div>
              ) : (
                <select
                  value={selectedConfigId}
                  onChange={(e) => setSelectedConfigId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003331] focus:border-transparent"
                >
                  <option value="">Select a config to compare...</option>
                  {Object.entries(groupedConfigs).map(([groupKey, configs]) => (
                    <optgroup key={groupKey} label={groupKey}>
                      {configs
                        .sort((a, b) => b.version - a.version)
                        .map((config) => (
                          <option key={config.id} value={config.id}>
                            v{config.version} - {config.display_name} (
                            {config.status})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Diff Viewer */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedConfigId && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg
                className="w-16 h-16 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <p className="text-lg font-medium">Select a config to compare</p>
              <p className="text-sm">
                Choose a configuration from the dropdown above to see the
                differences
              </p>
            </div>
          )}

          {selectedConfigId && isLoadingYaml && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-gray-500">
                <svg
                  className="animate-spin h-6 w-6"
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
                <span>Loading config...</span>
              </div>
            </div>
          )}

          {selectedConfigId && !isLoadingYaml && compareYaml !== null && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex border-b border-gray-200 bg-gray-50 text-sm">
                <div
                  className={`${splitView ? "w-1/2" : "w-full"} px-4 py-2 font-medium text-gray-700`}
                >
                  {currentConfigName}
                </div>
                {splitView && (
                  <div className="w-1/2 px-4 py-2 font-medium text-gray-700 border-l border-gray-200">
                    {compareConfigName}
                  </div>
                )}
              </div>
              <ReactDiffViewer
                oldValue={currentYaml}
                newValue={compareYaml}
                splitView={splitView}
                useDarkTheme={false}
                compareMethod={DiffMethod.LINES}
                leftTitle=""
                rightTitle=""
                styles={{
                  variables: {
                    light: {
                      diffViewerBackground: "#fff",
                      diffViewerColor: "#24292e",
                      addedBackground: "#e6ffec",
                      addedColor: "#24292e",
                      removedBackground: "#ffebe9",
                      removedColor: "#24292e",
                      wordAddedBackground: "#acf2bd",
                      wordRemovedBackground: "#fdb8c0",
                      addedGutterBackground: "#cdffd8",
                      removedGutterBackground: "#ffdce0",
                      gutterBackground: "#f6f8fa",
                      gutterBackgroundDark: "#f0f1f3",
                      highlightBackground: "#fffbdd",
                      highlightGutterBackground: "#fff5b1",
                      codeFoldGutterBackground: "#dbedff",
                      codeFoldBackground: "#f1f8ff",
                      emptyLineBackground: "#fafbfc",
                      gutterColor: "#6a737d",
                      addedGutterColor: "#22863a",
                      removedGutterColor: "#b31d28",
                      codeFoldContentColor: "#0366d6",
                      diffViewerTitleBackground: "#f6f8fa",
                      diffViewerTitleColor: "#24292e",
                      diffViewerTitleBorderColor: "#e1e4e8",
                    },
                  },
                  line: {
                    padding: "4px 8px",
                    fontSize: "13px",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  },
                  gutter: {
                    padding: "0 8px",
                    minWidth: "40px",
                  },
                  contentText: {
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {compareYaml !== null && (
              <>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-100 rounded"></span>
                  Removed
                </span>
                <span className="inline-flex items-center gap-1 ml-4">
                  <span className="w-3 h-3 bg-green-100 rounded"></span>
                  Added
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
