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

import { Calendar } from "lucide-react";
import type React from "react";

import type { components } from "~@reentry/openapi-types";

const UserSummary: React.FC<{
  clientData: components["schemas"]["ClientRecordResponse"] | null;
  sessionData: components["schemas"]["RecordingSessionResponse"] | null;
}> = ({ clientData, sessionData }) => {
  return (
    <div className="flex flex-col justify-start items-start gap-3 md:gap-4 w-full">
      <div className="inline-flex justify-start items-center gap-3 md:gap-4">
        <div className="w-10 h-10 relative bg-white rounded-[40px] overflow-hidden flex-shrink-0">
          <div className="w-10 h-10 left-0 top-0 absolute bg-[#4c6290]" />
          <div className="w-[29.90px] h-[46.15px] left-[0.45px] top-[10.88px] absolute origin-top-left rotate-[-46deg] bg-[#90aeb5] blur-[4.55px]" />
          <div className="w-[50.70px] h-[40.30px] left-[6.22px] top-[39.60px] absolute origin-top-left rotate-[-69deg] mix-blend-overlay bg-[#25636f] blur-[4.55px]" />
          <div className="w-10 left-0 top-[11.43px] absolute text-center justify-start text-white text-[10px] font-bold font-['Public_Sans'] leading-[17.14px] tracking-tight">
            {clientData?.full_name?.given_names
              ? clientData.full_name.given_names.charAt(0)
              : "--"}
          </div>
        </div>
        <div className="justify-start text-[#003331] text-lg sm:text-xl md:text-2xl font-medium font-['Public_Sans'] leading-tight break-words">
          {clientData?.full_name?.given_names && clientData.full_name?.surname
            ? `${clientData.full_name.given_names} ${clientData.full_name.surname}`
            : "--"}
        </div>
      </div>
      <div className="inline-flex justify-center items-center gap-4 md:gap-6">
        <div className="flex justify-start items-center gap-2 md:gap-3">
          <Calendar size={18} className="text-[#2B5469]/85 flex-shrink-0 sm:w-5 sm:h-5" />
          <div className="justify-start text-[#2a5469]/90 text-sm sm:text-base font-medium font-['Public_Sans'] leading-tight">
            {sessionData && new Date(sessionData?.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSummary;
