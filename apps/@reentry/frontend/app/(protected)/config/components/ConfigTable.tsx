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

import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable, { TableColumn } from "react-data-table-component";

import { StatusBadge } from "./StatusBadge";

export interface AssessmentConfig {
  id: string;
  state_code: string;
  code: string;
  version: number;
  display_name: string;
  status: string;
  is_active: boolean;
}

export interface OutputConfig {
  id: string;
  output_type: string;
  code: string;
  version: number;
  display_name: string;
  status: string;
  is_active: boolean;
}

interface AssessmentTableProps {
  type: "assessment";
  data: AssessmentConfig[];
  isLoading: boolean;
  onExport: (id: string) => void;
}

interface OutputTableProps {
  type: "output";
  data: OutputConfig[];
  isLoading: boolean;
  onExport: (id: string) => void;
}

type ConfigTableProps = AssessmentTableProps | OutputTableProps;

const customStyles = {
  header: {
    style: {
      minHeight: "56px",
      backgroundColor: "#f8fafc",
    },
  },
  rows: {
    style: {
      minHeight: "56px",
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

const AssessmentTable = ({
  data,
  isLoading,
  onExport,
}: {
  data: AssessmentConfig[];
  isLoading: boolean;
  onExport: (id: string) => void;
}) => {
  const router = useRouter();

  const columns: TableColumn<AssessmentConfig>[] = [
    {
      name: "Name",
      selector: (row) => row.display_name,
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.display_name}</div>
          <div className="text-sm text-gray-500">
            {row.state_code}/{row.code}
          </div>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Version",
      selector: (row) => row.version,
      cell: (row) => <span className="text-gray-700">v{row.version}</span>,
      width: "100px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} isActive={row.is_active} />,
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Link
            href={`/config/${row.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {row.status === "draft" ? "Edit" : "View"}
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(row.id);
            }}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Export
          </button>
        </div>
      ),
      width: "150px",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <DataTable
        columns={columns}
        data={data}
        customStyles={customStyles}
        progressPending={isLoading}
        noHeader
        highlightOnHover
        pointerOnHover
        onRowClicked={(row) => {
          router.push(`/config/${row.id}`);
        }}
        noDataComponent={
          <div className="py-8 text-center text-gray-500">
            No assessment configs found.
          </div>
        }
      />
    </div>
  );
};

const OutputTable = ({
  data,
  isLoading,
  onExport,
}: {
  data: OutputConfig[];
  isLoading: boolean;
  onExport: (id: string) => void;
}) => {
  const router = useRouter();

  const columns: TableColumn<OutputConfig>[] = [
    {
      name: "Name",
      selector: (row) => row.display_name,
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.display_name}</div>
          <div className="text-sm text-gray-500">{row.code}</div>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Type",
      selector: (row) => row.output_type,
      cell: (row) => (
        <span className="text-gray-700 capitalize">
          {row.output_type.replace("_", " ")}
        </span>
      ),
      width: "140px",
    },
    {
      name: "Version",
      selector: (row) => row.version,
      cell: (row) => <span className="text-gray-700">v{row.version}</span>,
      width: "100px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} isActive={row.is_active} />,
      width: "120px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Link
            href={`/config/${row.id}?type=output`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {row.status === "draft" ? "Edit" : "View"}
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(row.id);
            }}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Export
          </button>
        </div>
      ),
      width: "150px",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <DataTable
        columns={columns}
        data={data}
        customStyles={customStyles}
        progressPending={isLoading}
        noHeader
        highlightOnHover
        pointerOnHover
        onRowClicked={(row) => {
          router.push(`/config/${row.id}?type=output`);
        }}
        noDataComponent={
          <div className="py-8 text-center text-gray-500">
            No output configs found.
          </div>
        }
      />
    </div>
  );
};

export const ConfigTable = (props: ConfigTableProps) => {
  if (props.type === "assessment") {
    return (
      <AssessmentTable
        data={props.data}
        isLoading={props.isLoading}
        onExport={props.onExport}
      />
    );
  }

  return (
    <OutputTable
      data={props.data}
      isLoading={props.isLoading}
      onExport={props.onExport}
    />
  );
};

export default ConfigTable;
