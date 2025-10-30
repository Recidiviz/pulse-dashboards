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

import { useMemo } from "react";
import DataTable, {
  SortOrder,
  TableColumn,
  TableStyles,
} from "react-data-table-component";

import CustomPagination from "~@reentry/frontend/components/base/CustomPagination";
import { useAuth } from "~@reentry/frontend/lib/auth";
import type { components } from "~@reentry/frontend/recidiviz-schema";
import { trpc } from "~@reentry/frontend/trpc";

type ClientResponse = components["schemas"]["ClientResponse"];

interface ClientsTableV2Props {
  items: ClientResponse[];
  total: number;
  page: number;
  rowsPerPage: number;
  customStyles: TableStyles;
  onSort: (
    column: TableColumn<ClientResponse>,
    sortDirection: SortOrder,
  ) => void;
  SortIconComp: React.ReactNode;
  buildColumns: (statusLoading?: boolean) => TableColumn<ClientResponse>[];
  activeRowId: string | null;
}

// V2-only table that fetches statuses via tRPC and merges into items
export const ClientsTableV2: React.FC<ClientsTableV2Props> = ({
  items,
  total,
  page,
  rowsPerPage,
  customStyles,
  onSort,
  SortIconComp,
  buildColumns,
  activeRowId,
}) => {
  const auth = useAuth();
  const stateCode = auth.userAppMetadata?.stateCode ?? "";
  const staffPseudoId = auth.userAppMetadata?.pseudonymizedId;
  const enableGetClientsIntakeStatus = Boolean(stateCode && staffPseudoId);

  const { data, isLoading } =
    trpc.staff.getAllClientsIntakeStatusAndDate.useQuery(
      {
        staffPseudoId: staffPseudoId ?? "",
      },
      {
        enabled: enableGetClientsIntakeStatus,
        staleTime: 30000, // Cache for 30 seconds to prevent excessive refetching
        refetchOnMount: false, // Don't refetch on mount if data is still fresh
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
      },
    );

  const updatedItems = useMemo(() => {
    return items.map((item) => {
      if (!enableGetClientsIntakeStatus || !data) return item;
      const pseudoId = item.client?.pseudonymized_client_id;
      const statusOverride = pseudoId ? data[pseudoId]?.status : undefined;
      const intakeDateOverride = pseudoId
        ? data[pseudoId]?.intakeDate?.toISOString()
        : undefined;

      return {
        ...item,
        frontend_status: statusOverride || item.frontend_status,
        intake_date: intakeDateOverride ?? item.intake?.updated_at,
      };
    });
  }, [items, data, enableGetClientsIntakeStatus]);

  const columns = useMemo(
    () => buildColumns(isLoading),
    [buildColumns, isLoading],
  );

  return (
    <DataTable
      columns={columns}
      data={updatedItems}
      customStyles={customStyles}
      sortIcon={SortIconComp}
      onSort={onSort}
      noHeader
      responsive
      highlightOnHover
      noDataComponent={
        <div className="text-gray-600 py-4 ">No clients found.</div>
      }
      conditionalRowStyles={[
        {
          when: (row) => row.client_pseudo_id === activeRowId,
          style: {
            backgroundColor: "bg-gray-200",
            "&:hover": { backgroundColor: "bg-gray-200" },
          },
        },
      ]}
      pagination
      paginationComponent={() => (
        <CustomPagination
          currentPage={page}
          totalRows={total}
          rowsPerPage={rowsPerPage}
        />
      )}
      onRowClicked={(row) => {
        if (row.processing_status === "not_started") {
          window.location.href = `/clients/intake/${row.client_pseudo_id}`;
        }
      }}
      pointerOnHover
    />
  );
};
