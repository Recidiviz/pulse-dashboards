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

import React from "react";

const RevisionsTable = ({ revisions }) => {
	return (
		<div className="flex flex-col mt-6">
			<h3 className="text-xl font-bold text-gray-700">Revisions History</h3>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white rounded-lg shadow">
					<thead>
						<tr className="bg-gray-200 text-gray-600">
							<th className="py-2 px-4">Revision ID</th>
							<th className="py-2 px-4">Created At</th>
							<th className="py-2 px-4">Updated At</th>
						</tr>
					</thead>
					<tbody>
						{revisions?.map((rev) => (
							<tr key={rev.id} className="border-t text-gray-600 text-sm">
								<td className="py-2 px-4">{rev.id}</td>
								<td className="py-2 px-4">
									{new Date(rev.created_at).toLocaleString()}
								</td>
								<td className="py-2 px-4">
									{new Date(rev.updated_at).toLocaleString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default RevisionsTable;
