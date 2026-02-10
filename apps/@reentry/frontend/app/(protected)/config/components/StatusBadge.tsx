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

interface StatusBadgeProps {
  status: string;
  isActive?: boolean; // Kept for backwards compatibility, but status is the source of truth
}

export const StatusBadge = ({ status, isActive }: StatusBadgeProps) => {
  // Determine the display status based on status field
  // isActive is kept for backwards compat but status is authoritative
  let displayStatus = status;
  let colorClass = "";

  // Use isActive as fallback if status doesn't match expected values
  const effectiveStatus = status === "active" || isActive ? "active" : status;

  if (effectiveStatus === "active") {
    displayStatus = "Active";
    colorClass = "bg-green-100 text-green-800";
  } else if (effectiveStatus === "draft") {
    displayStatus = "Draft";
    colorClass = "bg-yellow-100 text-yellow-800";
  } else if (effectiveStatus === "inactive") {
    displayStatus = "Inactive";
    colorClass = "bg-gray-100 text-gray-600";
  } else {
    // Fallback for any other status
    displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
    colorClass = "bg-gray-100 text-gray-600";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {displayStatus}
    </span>
  );
};

export default StatusBadge;
