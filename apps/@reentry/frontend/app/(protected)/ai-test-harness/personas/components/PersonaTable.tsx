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

import { Tooltip } from "@mui/material";
import { History, Pencil, Play, Trash2 } from "lucide-react";
import React, { useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";

import { $api } from "~@reentry/frontend/api";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

import { PersonaTriggerListModal } from "./PersonaTriggerListModal";

export interface AIPersona {
  id: string;
  name: string;
  age: number;
  background: string;
  challenges: string;
  communication_style: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PersonaTableProps {
  data: AIPersona[];
  isLoading: boolean;
  onEdit: (personaId: string) => void;
  onTest: (personaId: string) => void;
  onDeleteSuccess: () => void;
}

const customStyles = {
  header: {
    style: {
      minHeight: "56px",
      backgroundColor: "#f8fafc",
    },
  },
  rows: {
    style: {
      minHeight: "72px",
      borderBottomColor: "#e5e7eb",
    },
  },
  headCells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      fontWeight: "600",
      fontSize: "12px",
      color: "#6b7280",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
};

export const PersonaTable = ({
  data,
  isLoading,
  onEdit,
  onTest,
  onDeleteSuccess,
}: PersonaTableProps) => {
  const [triggerModalPersona, setTriggerModalPersona] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = $api.useMutation(
    "delete",
    "/ai-personas/{persona_id}",
  );

  const handleDelete = async (personaId: string) => {
    if (!confirm("Are you sure you want to delete this persona?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        params: { path: { persona_id: personaId } },
      });
      showSuccessToast("Persona deleted successfully");
      onDeleteSuccess();
    } catch {
      showErrorToast("Failed to delete persona");
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const columns: TableColumn<AIPersona>[] = [
    {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">Age: {row.age}</div>
        </div>
      ),
      width: "200px",
    },
    {
      name: "Background",
      selector: (row) => row.background,
      cell: (row) => (
        <div className="text-sm text-gray-700">
          {truncateText(row.background, 100)}
        </div>
      ),
      grow: 2,
    },
    {
      name: "Challenges",
      selector: (row) => row.challenges,
      cell: (row) => (
        <div className="text-sm text-gray-700">
          {truncateText(row.challenges, 80)}
        </div>
      ),
      grow: 1.5,
    },
    {
      name: "Communication Style",
      selector: (row) => row.communication_style,
      cell: (row) => (
        <div className="text-sm text-gray-700">
          {truncateText(row.communication_style, 60)}
        </div>
      ),
      grow: 1,
    },
    {
      name: "Status",
      selector: (row) => row.is_active,
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
      width: "100px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Tooltip title="Test persona" arrow>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTest(row.id);
              }}
              className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-800 transition-colors"
            >
              <Play size={16} />
            </button>
          </Tooltip>
          <Tooltip title="View triggers" arrow>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTriggerModalPersona({ id: row.id, name: row.name });
              }}
              className="p-1.5 rounded hover:bg-purple-50 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <History size={16} />
            </button>
          </Tooltip>
          <Tooltip title="Edit persona" arrow>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.id);
              }}
              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Pencil size={16} />
            </button>
          </Tooltip>
          <Tooltip title="Delete persona" arrow>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.id);
              }}
              className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      ),
      width: "140px",
    },
  ];

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          customStyles={customStyles}
          progressPending={isLoading}
          noHeader
          highlightOnHover
          pointerOnHover
          noDataComponent={
            <div className="py-8 text-center text-gray-500">
              No AI personas found. Click "Add New Persona" to create one.
            </div>
          }
        />
      </div>

      {triggerModalPersona && (
        <PersonaTriggerListModal
          isOpen={!!triggerModalPersona}
          onClose={() => setTriggerModalPersona(null)}
          personaId={triggerModalPersona.id}
          personaName={triggerModalPersona.name}
        />
      )}
    </>
  );
};

export default PersonaTable;
