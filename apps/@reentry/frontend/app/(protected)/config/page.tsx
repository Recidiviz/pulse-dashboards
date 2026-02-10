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
import { useMemo, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { BACKEND_URL } from "~@reentry/frontend/constants";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { isInternalUser } from "~@reentry/frontend/lib/auth/permissions";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import { ConfigTable } from "./components/ConfigTable";

const ConfigManagementPage = () => {
  const auth = useAuth();
  const userEmail = auth.authStore?.user?.email;

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");

  // Fetch assessment configs using openapi-react-query
  const {
    data: assessmentData,
    isLoading: assessmentLoading,
    error: assessmentError,
  } = $api.useQuery(
    "get",
    "/config-management/assessments",
    {
      params: {
        query: {
          page: 1,
          size: 100,
          ...(statusFilter && { status: [statusFilter] }),
          ...(stateFilter && { state_code: stateFilter }),
        },
      },
    },
    {
      enabled: isInternalUser(userEmail),
    }
  );

  // Fetch output configs using openapi-react-query
  const {
    data: outputData,
    isLoading: outputLoading,
    error: outputError,
  } = $api.useQuery(
    "get",
    "/config-management/outputs",
    {
      params: {
        query: {
          page: 1,
          size: 100,
          ...(statusFilter && { status: [statusFilter] }),
        },
      },
    },
    {
      enabled: isInternalUser(userEmail),
    }
  );

  // Extract unique states from assessment configs for the filter dropdown
  const availableStates = useMemo(() => {
    if (!assessmentData?.items) return [];
    const states = new Set(assessmentData.items.map((item) => item.state_code));
    return Array.from(states).sort();
  }, [assessmentData]);

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

  // Export needs to use fetch directly because it returns a blob (YAML file)
  const handleExportAssessment = async (configId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/config-management/assessments/${configId}/export`,
        {
          headers: {
            Authorization: `Bearer ${auth.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename =
        contentDisposition?.match(/filename="?(.+)"?/)?.[1] || "config.yaml";

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

  // Export needs to use fetch directly because it returns a blob (YAML file)
  const handleExportOutput = async (configId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/config-management/outputs/${configId}/export`,
        {
          headers: {
            Authorization: `Bearer ${auth.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename =
        contentDisposition?.match(/filename="?(.+)"?/)?.[1] || "config.yaml";

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

  if (assessmentLoading || outputLoading) {
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
          Loading configs...
        </Typography>
      </Box>
    );
  }

  return (
    <div className="w-full p-6 md:p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] min-h-screen">
      <div className="w-full max-w-6xl flex-col justify-start items-start gap-8 flex">
        {/* Header */}
        <div className="self-stretch flex-col justify-start items-start gap-4 flex">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-black text-2xl font-medium">
              Config Management
            </h1>
            <Link
              href="/config/import"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Import YAML
            </Link>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">State:</label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All States</option>
                {availableStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Assessment Configs Section */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Assessment Configs
            </h2>
            <span className="text-sm text-gray-500">
              {assessmentData?.items?.length || 0} configs
            </span>
          </div>

          {assessmentError ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              Failed to load assessment configs. Please try again.
            </div>
          ) : (
            <ConfigTable
              type="assessment"
              data={assessmentData?.items || []}
              isLoading={assessmentLoading}
              onExport={handleExportAssessment}
            />
          )}
        </div>

        {/* Output Configs Section */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Output Configs</h2>
            <span className="text-sm text-gray-500">
              {outputData?.items?.length || 0} configs
            </span>
          </div>

          {outputError ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              Failed to load output configs. Please try again.
            </div>
          ) : (
            <ConfigTable
              type="output"
              data={outputData?.items || []}
              isLoading={outputLoading}
              onExport={handleExportOutput}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigManagementPage;
