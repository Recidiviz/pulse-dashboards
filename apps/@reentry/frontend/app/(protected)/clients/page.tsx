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
import { useCallback, useMemo, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";

import { $api } from "~@reentry/frontend/api";
import CustomPagination from "~@reentry/frontend/components/base/CustomPagination";
import {InfoTooltip} from "~@reentry/frontend/components/base/InfoTooltip";
import { IconInput } from "~@reentry/frontend/components/base/SortingInput";
import {PrimaryButton} from "~@reentry/frontend/components/buttons/PrimaryButton";
import AddClientModal, {
  type AddClientFormData,
} from "~@reentry/frontend/components/clients/AddClientModal";
import {ClipboardIcon} from "~@reentry/frontend/components/icons/ClipboardIcon";
import { ClientsTableV2 } from "~@reentry/frontend/components/IntakeChatV2/ClientsTableV2/ClientsTableV2";
import { PageView } from "~@reentry/frontend/components/PageView";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import {useAuthUserCapabilities} from "~@reentry/frontend/contexts/AuthUserCapabilitiesContext";
import { IS_V2_INTAKE_CHAT } from "~@reentry/frontend/featureFlags";
import { useClientStatusPolling } from "~@reentry/frontend/hooks/useClientStatusPolling";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { isFeatureEnabled } from "~@reentry/frontend/utils/featureFlagsRuntime";
import { showSuccessToast } from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";


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
      borderBottomColor: "#2b5469/30",
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


const ClientsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { track } = useAnalytics();
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("last_assessment_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeRowId, ] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const { isZeroCaseloadUser } = useAuthUserCapabilities();

  const uniqueIntakeStatusOptions = [
    ["New", "new"],
    ["Assessment Enabled", "intake_enabled"],
    ["Assessment In Progress", "intake_in_progress"],
    ["Processing", "processing"],
    ["Assessment Complete", "intake_complete"],
    ["Error", "error"],
  ];

  const executeSearch = () => {
    setActiveSearchTerm(searchTerm);
    // Reset to page 1 when searching
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
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
          is_zero_caseload_user: isZeroCaseloadUser,
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

  const { mutateAsync: addClientMutation } = $api.useMutation(
    "post",
    "/clients/admin/add",
  );

  const handleAddClient = async (data: AddClientFormData) => {
    setIsAddingClient(true);
    try {
      await addClientMutation({
        body: {
          given_names: data.given_names,
          surname: data.surname,
          birthdate: data.birthdate,
          state_code: data.state_code,
        },
        headers: {
          Authorization: `Bearer ${auth.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      setIsAddClientModalOpen(false);
      refetch();

      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleSort = (column, sortDirection) => {
    const columnMapping = {
      Name: "name",
      STATUS: "status",
      "Last Assessment Date": "last_assessment_date",
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

  const getIntakeCompletedDate = (intake) => {
    if (!intake) return "-";

    if (intake.completed_at) {
        return formatDate(intake.completed_at);
    }

    if (intake.status === "completed") {
        return formatDate(intake.updated_at);
    }

    return "-";
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
    interval: 10000, // Poll every 10 seconds
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

  const buildColumns = (): TableColumn<ClientResponse>[] => [
    {
      name: "Name",
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
          <div className="flex items-center gap-1.5">
            <span className="text-[#002321] text-sm pointer-events-none">
              {row.client?.external_client_id || "-"}
            </span>
              <button
                  onClick={() => {
                      showSuccessToast(`DOC ID copied to clipboard`);
                      navigator.clipboard.writeText(
                          row.client?.external_client_id as string,
                      );
                  }}
                  className="p-1 rounded hover:bg-gray-100 transition"
              >
                  <ClipboardIcon/>
              </button>
          </div>
      ),
      sortable: false,
    },
    {
      name: (
          <div className="flex items-center gap-1">
              <span  className={"text-[12px] md:text-[14px]"}>Number of Assessments</span>
              <InfoTooltip
                  text="The total number of assessments associated with the client, including enabled, in progress, and completed assessments"
                  position="top"
                  className={"w-3 h-3"}
              />
          </div>
      ),
      selector: (row: ClientResponse) => (row.intake ? 1 : 0),
      cell: (row: ClientResponse) => (
          <span className="text-[#002321] text-sm pointer-events-none">
              { row.intake? "1": "0" }
          </span>
        ),
        sortable: true,
    },
    {
      name: (
          <div className="flex flex-col leading-tight w-full text-[12px] md:text-[14px]">
              <span>Last Assessment</span>
              <span>Completed</span>
          </div>
      ),
      selector: (row: ClientResponse) => row.intake?.completed_at || "",
      cell: (row: ClientResponse) => (
          <span className="text-[#002321] text-sm pointer-events-none">
              {getIntakeCompletedDate(row.intake)}
          </span>
      ),
      sortable: true,
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
          paginationPerPage={rowsPerPage}
          paginationTotalRows={data?.total || 0}
          paginationServer
          paginationComponent={() => (
            <CustomPagination
              currentPage={page}
              totalRows={data?.total || 0}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
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
              <div className="text-black font-['Public_Sans'] text-2xl font-medium leading-[120%] tracking-[-0.48px] ">
                  All Clients ({data?.total || 0})
              </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-6">
              <div className="text-[#2b5469]/70 text-lg font-medium leading-snug">
                  {!isZeroCaseloadUser? "All clients on your caseload are displayed below.": "All clients in your assigned facilities are displayed below."}
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <IconInput
                  placeholder="Search by name"
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
                {isFeatureEnabled("CLIENT_ADDITION") && (
                  <PrimaryButton
                      buttonText={"Add Client"}
                    onClick={() => setIsAddClientModalOpen(true)}
                    className="px-4 py-2 bg-[#003331] text-white text-sm font-medium rounded-full hover:bg-gray-950 transition-colors whitespace-nowrap"
                      ignoreCapabilities={true}
                  />
                )}
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
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSubmit={handleAddClient}
        isLoading={isAddingClient}
      />
    </>
  );
};

export default ClientsPage;
