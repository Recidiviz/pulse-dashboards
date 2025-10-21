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

export const StatusPill = ({ status }: { status: string }) => {
  const statusStyles = {
    completed: "bg-green-100 text-green-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    not_started: "bg-gray-100 text-gray-800",
  };

  const labelMap = {
    completed: "Completed",
    in_progress: "In Progress",
    not_started: "Not Started",
  };

  return (
    <span
      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${statusStyles[status]}`}
    >
      {labelMap[status]}
    </span>
  );
};
