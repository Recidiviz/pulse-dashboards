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

import { ClipboardIcon } from "~@reentry/frontend/components/icons/ClipboardIcon";
import { formatAddress, formatDateMMDDYYYY } from "~@reentry/frontend/utils";
import { getStateName } from "~@reentry/frontend/utils/states";
import { showSuccessToast } from "~@reentry/frontend-shared";
import { components } from "~@reentry/openapi-types";

interface ClientMetadataProps {
  clientData: components["schemas"]["ClientRecordResponse"] | null | undefined;
  intakeAddress:
    | components["schemas"]["ClientAddressResponse"]
    | null
    | undefined;
}

export default function ClientMetadata({
  clientData,
  intakeAddress,
}: ClientMetadataProps) {
  return (
    <div className="flex flex-wrap max-w-7xl w-full bg-[#f9fafa] p-2 md:p-6 rounded border-b border-[#2b5469]/20 gap-4 md:gap-0 ">
      <div className="flex items-center gap-4 sm:w-auto md:!w-[40%]">
        {/* Column 1 */}
        <div className="flex-shrink-0 w-10 h-10 md:w-[48px] md:h-[48px] relative bg-white rounded-full bg-[url('/images/profile.png')]">
          <div className="absolute inset-0 flex justify-center items-center text-white text-[14px] font-bold">
            {clientData?.full_name?.given_names?.charAt(0) ?? "--"}
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-1">
          <span className="text-black font-['Public_Sans'] text-2xl font-medium leading-[120%] tracking-[-0.48px]">
            {clientData?.full_name?.given_names}{" "}
            {clientData?.full_name?.surname}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[#012322] font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
              {clientData?.external_client_id}
            </span>
            <button
              onClick={() => {
                showSuccessToast(`DOC ID copied to clipboard`);
                navigator.clipboard.writeText(
                  clientData?.external_client_id as string,
                );
              }}
              className="p-1 rounded hover:bg-gray-100 transition"
            >
              <ClipboardIcon className="w-4 h-4 text-[#2b5469]" />
            </button>
          </div>
        </div>
      </div>

      {/* Column 3 */}
      <div className="flex gap-6 basis-full sm:basis-auto !w-[30%]">
        <div className="flex flex-col gap-2 w-[85px]">
          <span className="text-[rgba(43,84,105,0.5)] font-public-sans text-[14px] font-bold leading-[1.2] tracking-[-0.14px] uppercase">
            Full Name
          </span>
          <span className="text-[rgba(43,84,105,0.5)] font-public-sans text-[14px] font-bold leading-[1.2] tracking-[-0.14px] uppercase">
            Birth Date
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[#012322] font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
            {clientData?.full_name?.given_names}{" "}
            {clientData?.full_name?.surname}
          </span>
          <span className="text-[#012322] font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
            {formatDateMMDDYYYY(clientData?.birthdate)}
          </span>
        </div>
      </div>

      {/* Column 4*/}
      <div className="flex gap-6 basis-full sm:basis-auto !w-[30%]">
        <div className="flex flex-col gap-2 w-[85px] ">
          <span className="text-[rgba(43,84,105,0.5)] font-public-sans text-[14px] font-bold leading-[1.2] tracking-[-0.14px] uppercase">
            Address
          </span>
          <span className="text-[rgba(43,84,105,0.5)] font-public-sans text-[14px] font-bold leading-[1.2] tracking-[-0.14px] uppercase">
            State
          </span>
        </div>
        <div className="flex flex-col gap-2 ">
          <span className="text-[#012322] font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
            {formatAddress(intakeAddress) || "—"}
          </span>
          <span className="text-[#012322] font-['Public_Sans'] text-sm font-medium leading-[120%] tracking-[-0.14px]">
            {getStateName(clientData?.state_code)}
          </span>
        </div>
      </div>
    </div>
  );
}
