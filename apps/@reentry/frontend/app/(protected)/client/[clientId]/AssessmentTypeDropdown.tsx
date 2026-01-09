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
}

export default function AssessmentTypeDropdown({
  clientData,
  refetchIntakeData,
}: AssessmentTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: assessmentList, isLoading: assessmentListLoading } = $api.useQuery(
      "get",
      "/assessment-configs",
      {
          params: {
            query: {
              state_code: clientData?.state_code
            }
          },
          headers: {
              Authorization: `Bearer ${useAuth().getAccessToken()}`,
              "Content-Type": "application/json",
          },
      },
  );
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
      <PrimaryButton
        buttonText={
          <>
            <span>Enable New Assessment</span>
            <ChevronDownFilled
              className={`transition-transform ${open ? "" : "rotate-180"}`}
            />
          </>
        }
        className="py-4 px-6 md:px-5 md:py-2 text-white  md:!text-sm font-medium rounded-md bg-[#006B66] hover:bg-[#005c59] normal-case w-full max-w-[9rem] md:max-w-sm  m-auto"
        onClick={() => setOpen(!open)}
        ignoreCapabilities={true}
      ></PrimaryButton>

      {/* Dropdown Menu TODO Loading state */}
      {open && assessmentListLoading && (
        <div>loading</div>
      )}
      {open && assessmentList && (
          <div className="flex flex-col absolute left-0 mt-2 w-full md:w-60 py-2 bg-white rounded-lg z-20 shadow-[0px_8px_56px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_rgba(43,84,105,0.10)]">
          {assessmentList?.map(assessment => (
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
