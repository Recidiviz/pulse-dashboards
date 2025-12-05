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

interface StatusBadgeProps {
  intakeFrontendStatus?: string;
}

const getStatusText = (status: string | undefined): string => {
  switch (status) {
    case "new":
      return "New";
    case "intake_enabled":
      return "Enabled";
    case "intake_in_progress":
      return "In Progress";
    case "processing":
      return "Processing";
    case "intake_complete":
      return "Completed";
    case "error":
      return "Error";
    default:
      return "";
  }
};

const getStatusClasses = (status: string | undefined): string => {
  switch (status) {
    case "new":
      return "bg-[#F4F7FE] outline-[#C7D3F6] text-[#2D4A78]";
    case "intake_enabled":
      return "bg-[#EFF3FF] outline-[#A2B3EF] text-[#00387C]";
    case "intake_in_progress":
      return "bg-[#FFF8DE] outline-[#FCD579] text-[#A82C00]";
    case "processing":
      return "bg-[#E8FBFF] outline-[#8DE5F2] text-[#005A67]";
    case "intake_complete":
      return "bg-[#EFFFE5] outline-[#A6EB84] text-[#1B5900]";
    case "error":
      return "bg-[#FFECEC] outline-[#F5A3A3] text-[#7A0000]";
    default:
      return "bg-gray-100 outline-gray-300 text-gray-800";
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ intakeFrontendStatus }) => {
  const badgeText = getStatusText(intakeFrontendStatus);
  const badgeClasses = getStatusClasses(intakeFrontendStatus);

  return (
    <div
      className={`h-5 w-20 px-1.5  rounded outline outline-1 inline-flex justify-center items-center gap-1 ${badgeClasses}`}
    >
      <div
        className={
          "justify-center text-xs font-semibold font-['Public_Sans'] leading-4"
        }
      >
        {badgeText}
      </div>
    </div>
  );
};

export default StatusBadge;
