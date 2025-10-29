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

"use client";
import {
  ArrowDropDown,
  ArrowDropUp,
  FilterList,
  Search,
} from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable, {
  SortOrder,
  TableColumn,
  TableStyles,
} from "react-data-table-component";

import { $api } from "~@reentry/frontend/api";
import CustomPagination from "~@reentry/frontend/components/base/CustomPagination";
import { IconInput } from "~@reentry/frontend/components/base/SortingInput";
import ActionButton from "~@reentry/frontend/components/clients/ActionButton";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import { useClientStatusPolling } from "~@reentry/frontend/hooks/useClientStatusPolling";
import { useAuth } from "~@reentry/frontend/lib/auth";
import type { components } from "~@reentry/frontend/recidiviz-schema";
import { trpc } from "~@reentry/frontend/trpc";

type ClientResponse = components["schemas"]["ClientResponse"];

// Styles
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
      borderBottomColor: "#2b5469/10",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      overflowY: "auto" as any,
    },
  },
  headCells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      fontWeight: "500",
      fontSize: "14px",
      color: "#2b5469",
      backgroundColor: "#fff",
      borderBottomColor: "#2b5469/30",
      borderBottomWidth: "1.5px",
      opacity: 1,
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
};

const SortIcon = () => (
  <div className="relative flex flex-col items-center w-4 h-6 text-slate-400 mt-1">
    <ArrowDropDown className="absolute bottom-2 h-6 w-6 rotate-180" />
    <ArrowDropUp className="absolute bottom-0.5 h-6 w-6" />
  </div>
);

// Formatting
const formatInitials = (row: ClientResponse) => {
  if (!row.client || !row.client.full_name) return null;
  return row.client.full_name.given_names.charAt(0);
};

const formatName = (row: ClientResponse) => {
  if (!row.client || !row.client.full_name) return null;
  return `${row.client.full_name.given_names} ${row.client.full_name.surname}`;
};

const formatFrontendStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    new: "New",
    intake_enabled: "Intake Enabled",
    intake_in_progress: "Intake In Progress",
    processing: "Processing",
    intake_complete: "Intake Complete",
    error: "Error",
    unknown: "Unknown",
  };
  return statusMap[status] || "Unknown";
};

const ClientsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { track } = useAnalytics();
  const rowsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // Ref to detect clicks outside dropdowm
  const dropdownRef = useRef<HTMLDivElement>(null);

  // useEffect to close the dropdown
  useEffect(() => {
    if (!openDropdownId) return;

    const handleClickOutside = (event: MouseEvent) => {
      const clickedToggleButton = (event.target as HTMLElement).closest(
        "[data-dropdown-toggle]",
      );

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !clickedToggleButton
      ) {
        setOpenDropdownId(null);
        setActiveRowId(null);
      }
    };
    if (openDropdownId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  const uniqueIntakeStatusOptions = [
    ["New", "new"],
    ["Intake Enabled", "intake_enabled"],
    ["Intake In Progress", "intake_in_progress"],
    ["Processing", "processing"],
    ["Intake Complete", "intake_complete"],
    ["Error", "error"],
  ];

  const executeSearch = () => {
    setActiveSearchTerm(searchTerm);
    // Reset to page 1 when searching
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleToggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => {
      if (prev !== id) {
        setActiveRowId(id.replace("dropdown-", ""));
      } else {
        setActiveRowId(null);
      }
      return prev === id ? null : id;
    });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      executeSearch();
    }
  };

  const auth = useAuth();

  // Get page from URL query parameters, default to 1
  const page = Number(searchParams.get("page") || 1);

  const { data, error, isLoading, refetch } = $api.useQuery(
    "get",
    "/clients/",
    {
      params: {
        query: {
          page: page,
          size: rowsPerPage,
          ...(activeSearchTerm && { search: activeSearchTerm }),
          ...(statusFilter && { status_filter: statusFilter }),
          ...(sortBy && { sort_by: sortBy }),
          ...(sortOrder && { sort_order: sortOrder }),
        },
      },
      headers: {
        Authorization: `Bearer ${auth.getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
  );

  const handleSort = (column, sortDirection) => {
    const columnMapping = {
      NAME: "name",
      STATUS: "status",
    };

    const apiSortBy = columnMapping[column.name];
    if (apiSortBy) {
      setSortBy(apiSortBy);
      setSortOrder(sortDirection);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Client Status Polling
  // State to track status updates from polling
  const [statusUpdates, setStatusUpdates] = useState<Map<string, string>>(
    new Map(),
  );

  // Determine if any clients are in progress and need polling
  const hasInProgressClients = useMemo(() => {
    if (!data?.items) return false;
    return data.items.some(
      (client) => client.processing_status === "in_progress",
    );
  }, [data?.items]);

  // Handle status updates from polling
  const handleStatusUpdate = useCallback(
    (
      inProgressClients: Array<{
        client_pseudo_id: string;
        processing_status: string;
      }>,
    ) => {
      const newUpdates = new Map<string, string>();

      // Update status for clients that are still in progress
      for (const client of inProgressClients) {
        newUpdates.set(client.client_pseudo_id, client.processing_status);
      }

      // Check if any previously in-progress clients are no longer in the list (completed)
      for (const [clientPseudoId, status] of statusUpdates) {
        if (status === "in_progress" && !newUpdates.has(clientPseudoId)) {
          // Client was in progress but is no longer - it likely completed
          // Trigger a full refetch to get updated data
          refetch();
        }
      }

      setStatusUpdates(newUpdates);
    },
    [statusUpdates, refetch],
  );

  // Set up polling for status updates
  useClientStatusPolling({
    enabled: hasInProgressClients,
    interval: 5000, // Poll every 5 seconds
    onStatusUpdate: handleStatusUpdate,
  });

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
          Loading intake information...
        </Typography>
      </Box>
    );
  }

  // V2-only table that fetches statuses via tRPC and merges into items
  const ClientsTableV2: React.FC<{
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
  }> = ({
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
        { enabled: enableGetClientsIntakeStatus },
      );

    // Merges the status of existing clients with the new server's statuses
    const updatedItems = items.map((item) => {
      if (!enableGetClientsIntakeStatus || !data) return item;
      const pseudoId = item.client?.pseudonymized_client_id;
      const statusOverride = pseudoId ? data[pseudoId]?.status : undefined;
      const intakeDateOverride = pseudoId
        ? data[pseudoId]?.intakeDate?.toISOString()
        : undefined;

      return {
        ...item,
        frontend_status: statusOverride || item.frontend_status,
        intake_date_override: intakeDateOverride ?? item.intake?.updated_at,
      };
    });

    const columns = buildColumns(isLoading);

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

  const buildColumns = (
    statusLoading?: boolean,
  ): TableColumn<ClientResponse>[] => [
    {
      name: "NAME",
      cell: (row: ClientResponse) => (
        <div className="flex items-center gap-3 pointer-events-none">
          <div className="w-10 h-10 bg-white rounded-full text-center font-bold text-[14px] flex justify-center items-center text-white bg-[url('/images/profile.png')] hidden md:flex">
            {formatInitials(row)}
          </div>
          <span className="text-[#002321] text-base font-medium">
            {formatName(row)}
          </span>
        </div>
      ),
      sortable: true,
      grow: 2,
    },
    {
      name: "DOC ID",
      selector: (row: ClientResponse) => row.client?.external_client_id || "",
      cell: (row: ClientResponse) => (
        <span className="text-[#002321] text-sm pointer-events-none">
          {row.client?.external_client_id || "-"}
        </span>
      ),
      sortable: false,
    },
    {
      name: "INTAKE DATE",
      selector: (row: ClientResponse) => row.intake?.created_at || "",
      cell: (row: ClientResponse & { intake_date_override?: string }) => (
        <span className="text-[#002321] text-sm pointer-events-none">
          {formatDate(row.intake_date_override) ??
            (row.intake?.updated_at ? formatDate(row.intake.updated_at) : "-")}
        </span>
      ),
      sortable: false,
    },
    {
      name: "STATUS",
      cell: (row: ClientResponse) => (
        <div className="flex gap-2 items-center pointer-events-none">
          <span className="text-[#002321] text-sm font-medium">
            {statusLoading ? (
              <Loading type="mini" message="" />
            ) : (
              formatFrontendStatus(row.frontend_status)
            )}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      name: "",
      cell: (row: ClientResponse) => (
        <ActionButton
          dropdownRef={dropdownRef}
          client={row}
          isOpen={openDropdownId === `dropdown-${row.client_pseudo_id}`}
          onToggle={() =>
            handleToggleDropdown(`dropdown-${row.client_pseudo_id}`)
          }
          onRefetch={refetch}
        />
      ),
      width: "50px",
    },
  ];

  const renderClientsTable = () => {
    if (error) {
      return (
        <div className="text-red-500">
          An error occurred while loading, please try again later
        </div>
      );
    }
    if (IS_V2_INTAKE_CHAT) {
      return (
        <ClientsTableV2
          items={data?.items || []}
          total={data?.total || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          customStyles={customStyles}
          onSort={handleSort}
          SortIconComp={<SortIcon />}
          buildColumns={buildColumns}
          activeRowId={activeRowId}
        />
      );
    }
    return (
      <div className="w-full overflow-x-auto">
        <DataTable
          columns={buildColumns()}
          data={data?.items || []}
          customStyles={customStyles}
          sortIcon={<SortIcon />}
          onSort={handleSort}
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
                "&:hover": {
                  backgroundColor: "bg-gray-200",
                },
              },
            },
          ]}
          pagination
          paginationComponent={() => (
            <CustomPagination
              currentPage={page}
              totalRows={data?.total || 0}
              rowsPerPage={rowsPerPage}
            />
          )}
          onRowClicked={(row) => {
            router.push(`/clients/intake/${row.client_pseudo_id}`);
            track("clients_page_navigate_to_client_profile_link_clicked", {
              justiceInvolvedPersonId: row.client_pseudo_id,
            });
          }}
          pointerOnHover
        />
      </div>
    );
  };

  return (
    <>
      <PageView />
      <div className="w-full p-6 md:p-14 flex-col justify-start items-center gap-2 inline-flex bg-[#f9fafa] flex-grow">
        <div className="w-full flex-col justify-start items-start gap-8 flex sm:w-[100%] xl:w-[80%] 2xl:w-[60%]">
          <div className="self-stretch flex-col justify-start items-start gap-2 flex">
            <div className="self-stretch text-[#003331] text-[34px] font-normal font-['Libre Baskerville'] leading-[40.80px]  ">
              Clients
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-6">
              <div className="text-[#2b5469]/70 text-lg font-medium leading-snug">
                All clients on your caseload are displayed below.
              </div>
              <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                <IconInput
                  placeholder="Search by name..."
                  startIcon={
                    <button
                      type="button"
                      onClick={() => {
                        if (searchTerm.trim()) {
                          executeSearch();
                        }
                      }}
                      className="focus:outline-none"
                    >
                      <Search fontSize="small" />
                    </button>
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="h-10 text-sm border border-gray-300 rounded-md flex-1 min-w-[100px]"
                />

                <div className="relative flex-1 min-w-[100px]">
                  <FilterList
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    fontSize="small"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      // Reset to page 1 when filter changes
                      const params = new URLSearchParams(searchParams);
                      params.set("page", "1");
                      router.push(`?${params.toString()}`);
                      track("clients_page_client_status_filtered", {
                        updated_status_filter: e.target.value,
                      });
                    }}
                    className="h-10 text-sm pl-10 pr-8 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none w-full"
                  >
                    <option value="">All</option>
                    {uniqueIntakeStatusOptions.map(([label, value]) => (
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
              </div>
            </div>
          </div>
          <div className="w-full rounded-lg flex-col justify-start items-start mb-20">
            {activeSearchTerm && (
              <div className="text-sm text-gray-600 px-4 pt-4">
                Showing results for {<strong>{activeSearchTerm}</strong>}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSearchTerm("");
                    setSearchTerm("");
                    // Reset to page 1 when clearing search
                    const params = new URLSearchParams(searchParams);
                    params.set("page", "1");
                    router.push(`?${params.toString()}`);
                  }}
                  className="ml-2 text-blue-500 underline text-xs"
                >
                  Clear search
                </button>
              </div>
            )}
            {renderClientsTable()}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientsPage;
