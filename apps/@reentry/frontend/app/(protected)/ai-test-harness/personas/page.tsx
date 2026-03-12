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

import { ArrowDropDown, FilterList, Search } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { IconInput } from "~@reentry/frontend/components/base/SortingInput";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { isInternalUser } from "~@reentry/frontend/lib/auth/permissions";

import { PersonaFormModal } from "./components/PersonaFormModal";
import { PersonaTable } from "./components/PersonaTable";
import { TestPersonaModal } from "./components/TestPersonaModal";

const STATUS_FILTER_OPTIONS: [string, string][] = [
  ["All Statuses", ""],
  ["Active", "active"],
  ["Inactive", "inactive"],
];

const AIPersonaLibraryPage = () => {
  const auth = useAuth();
  const { getAccessToken } = auth;
  const userEmail = auth.authStore?.user?.email;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingPersona, setTestingPersona] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const {
    data: personasData,
    isLoading: personasLoading,
    error: personasError,
    refetch,
  } = $api.useQuery(
    "get",
    "/ai-personas",
    {
      params: {
        query: {
          page: 1,
          size: 100,
        },
      },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    {
      enabled: isInternalUser(userEmail),
    },
  );

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
          AI Test Harness is only available to Recidiviz staff.
        </Typography>
      </Box>
    );
  }

  const allPersonas = personasData?.items || [];

  const filteredPersonas = allPersonas.filter((persona) => {
    const matchesSearch =
      !searchTerm ||
      persona.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && persona.is_active) ||
      (statusFilter === "inactive" && !persona.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    setEditingPersona(null);
    refetch();
  };

  const handleEdit = (personaId: string) => {
    setEditingPersona(personaId);
    setIsModalOpen(true);
  };

  const handleTest = (personaId: string) => {
    setTestingPersona(personaId);
    setIsTestModalOpen(true);
  };

  const renderPersonasContent = () => {
    if (personasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          Failed to load AI personas. Please try again.
        </div>
      );
    }
    if (personasLoading) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          py={8}
        >
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading personas...
          </Typography>
        </Box>
      );
    }
    return (
      <>
        {searchTerm && (
          <div className="text-sm text-gray-600 px-4 pt-4 pb-2">
            Showing {filteredPersonas.length} result
            {filteredPersonas.length !== 1 ? "s" : ""} for{" "}
            <strong>{searchTerm}</strong>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="ml-2 text-blue-500 underline text-xs"
            >
              Clear search
            </button>
          </div>
        )}
        <PersonaTable
          data={filteredPersonas}
          isLoading={personasLoading}
          onEdit={handleEdit}
          onTest={handleTest}
          onDeleteSuccess={refetch}
        />
      </>
    );
  };

  return (
    <>
      <PageView />
      <div className="w-full p-6 md:p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] flex-grow">
        <div className="w-full max-w-6xl flex-col justify-start items-start gap-8 flex">
          {/* Header */}
          <div className="self-stretch flex-col justify-start items-start gap-2 flex">
            <div className="text-black font-['Public_Sans'] text-2xl font-medium leading-[120%] tracking-[-0.48px]">
              AI Personas ({allPersonas.length})
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-6">
              <div className="text-[#2b5469]/70 text-lg font-medium leading-snug w-full md:w-auto">
                Manage AI personas for testing intake conversations.
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center w-full md:w-auto">
                <IconInput
                  placeholder="Search by name"
                  startIcon={<Search fontSize="small" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm flex-1 min-w-[180px]"
                />
                <div className="relative flex-1 min-w-[140px]">
                  <FilterList
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    fontSize="small"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 text-sm pl-10 pr-8 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none w-full"
                  >
                    {STATUS_FILTER_OPTIONS.map(([label, value]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ArrowDropDown
                    className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    fontSize="small"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPersona(null);
                    setIsModalOpen(true);
                  }}
                  className="h-10 px-4 py-2 bg-[#003331] text-white text-sm font-medium rounded-full hover:bg-gray-950 transition-colors whitespace-nowrap"
                >
                  Add New Persona
                </button>
              </div>
            </div>
          </div>

          {/* Personas Table */}
          <div className="w-full rounded-lg flex-col justify-start items-start mb-20">
            {renderPersonasContent()}
          </div>
        </div>
      </div>

      <PersonaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPersona(null);
        }}
        onSuccess={handleCreateSuccess}
        personaId={editingPersona}
      />

      <TestPersonaModal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestingPersona(null);
        }}
        personaId={testingPersona}
      />
    </>
  );
};

export default AIPersonaLibraryPage;
