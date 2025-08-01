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
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import DataTable from "react-data-table-component";

import { $api } from "@/app/api";
import Breadcrumb from "@/app/components/base/Breadcrumb";
import { useAuth } from "@/app/lib/auth";

const DecisionTreeTable = () => {
	const [page, setPage] = useState(1);
	const [perPage] = useState(10);
	const router = useRouter();
	const breadcrumbRoutes = [
		{ label: "Home", href: "/" },
		{ label: "Decision Trees", href: "/decision-tree" },
	];

	const { data, error, isLoading } = $api.useQuery("get", "/decision-trees", {
		params: {
			query: {
				page: page,
				size: perPage,
			},
		},
		headers: {
			Authorization: `Bearer ${useAuth().getAccessToken()}`,
			"Content-Type": "application/json",
		},
	});

	const columns = [
		{ name: "Name", selector: (row) => row.name, sortable: true },
		{
			name: "Created At",
			selector: (row) => new Date(row.created_at).toLocaleString(),
			sortable: true,
		},
		{
			name: "Enabled",
			selector: (row) => row.enabled.toString(),
			sortable: true,
		},
		{
			name: "Actions",
			cell: (row) => (
				<>
					<button
						type={"button"}
						onClick={() => router.push(`/decision-tree/${row.id}`)}
						className="text-blue-500 hover:text-blue-700 underline"
					>
						Show
					</button>
					<button
						type={"button"}
						onClick={() => router.push(`/decision-tree/${row.id}/add-revision`)}
						className="text-blue-500 hover:text-blue-700 underline ml-4"
					>
						Add revision
					</button>
				</>
			),
		},
	];

	const handlePageChange = (page: number) => {
		setPage(page);
	};

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
			<div className="max-w-6xl w-full">
				<Breadcrumb routes={breadcrumbRoutes} />
				<div className="flex justify-between items-center py-4">
					<h1 className="text-4xl font-bold text-gray-800">Decision Trees</h1>
					<button
						type={"button"}
						onClick={() => router.push("/decision-tree/create")}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
					>
						Create
					</button>
				</div>
				{error ? (
					<div className="text-red-500">An error occured while loading</div>
				) : null}
				<div className="bg-white shadow-lg rounded-lg p-6">
					<DataTable
						columns={columns}
						data={data?.items || []}
						progressPending={isLoading}
						pagination
						paginationServer
						paginationTotalRows={data?.total || 0}
						paginationDefaultPage={page}
						onChangePage={handlePageChange}
						paginationPerPage={perPage}
						highlightOnHover
						persistTableHead
						noDataComponent={
							<div className="text-gray-600">No Decision Trees found.</div>
						}
						className="bg-white"
						customStyles={{
							headCells: {
								style: {
									backgroundColor: "#f1f5f9",
									color: "#374151",
									fontWeight: "bold",
									padding: "12px",
								},
							},
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default DecisionTreeTable;
