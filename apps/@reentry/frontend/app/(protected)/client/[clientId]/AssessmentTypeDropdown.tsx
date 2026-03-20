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

import { useEffect, useRef, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { ChevronDownFilled } from "~@reentry/frontend/components/icons/ChevronDownFilled";
import CreateIntake from "~@reentry/frontend/components/intake/CreateIntake";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { components } from "~@reentry/openapi-types";

interface AssessmentTypeDropdownProps {
  clientData: components["schemas"]["ClientRecordResponse"];
  refetchIntakeData: () => void;
  blockingStatus?: string;
}

const BLOCKING_TOOLTIP: Record<string, string> = {
  created:
    "This client already has an assessment enabled. Remove the active assessment to enable a new one.",
  in_progress:
    "This client already has an assessment in progress. Complete the active assessment to enable a new one.",
};

export default function AssessmentTypeDropdown({
  clientData,
  refetchIntakeData,
  blockingStatus,
}: AssessmentTypeDropdownProps) {
  const tooltipText = blockingStatus
    ? BLOCKING_TOOLTIP[blockingStatus]
    : undefined;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: assessmentList, isLoading: assessmentListLoading } =
    $api.useQuery("get", "/assessment-configs", {
      params: {
        query: {
          state_code: clientData?.state_code,
        },
      },
      headers: {
        Authorization: `Bearer ${useAuth().getAccessToken()}`,
        "Content-Type": "application/json",
      },
    });
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Dropdown Button */}
      <div className="group relative">
        <PrimaryButton
          buttonText={
            <>
              <span>Enable New Assessment</span>
              {!blockingStatus && (
                <ChevronDownFilled
                  className={`transition-transform ${open ? "" : "rotate-180"}`}
                />
              )}
            </>
          }
          className={`py-4 px-6 md:px-5 md:py-2 text-white md:!text-sm font-medium rounded-md normal-case w-full max-w-[9rem] md:max-w-sm m-auto ${
            blockingStatus
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[#006B66] hover:bg-[#005c59]"
          }`}
          onClick={() => !blockingStatus && setOpen(!open)}
          disabled={!!blockingStatus}
          ignoreCapabilities={true}
        />
        {tooltipText && (
          <div className="pointer-events-none absolute right-0 top-full mt-2 w-64 rounded-md bg-gray-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-30">
            {tooltipText}
          </div>
        )}
      </div>

      {/* Dropdown Menu TODO Loading state */}
      {open && assessmentListLoading && <div>loading</div>}
      {open && assessmentList && (
        <div className="flex flex-col absolute left-0 mt-2 w-full md:w-60 py-2 bg-white rounded-lg z-20 shadow-[0px_8px_56px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_rgba(43,84,105,0.10)]">
          {assessmentList?.map((assessment) => (
            <CreateIntake
              clientData={clientData}
              onIntakeUpdate={refetchIntakeData}
              assessmentConfigData={assessment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
