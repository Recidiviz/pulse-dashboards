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

import Image from "next/image";

import type { components } from "~@reentry/openapi-types";

import BackButton from "../base/BackButton";

interface ProfileDetailProps {
  clientRecord:
    | components["schemas"]["ClientRecordResponse"]
    | null
    | undefined;
  setIsExpanded: (value: boolean) => void;
  isExpanded: boolean | undefined;
}

const ProfileDetail = ({
  clientRecord,
  setIsExpanded,
  isExpanded,
}: ProfileDetailProps) => {
  return (
    <div className="self-stretch  md:h-[169px] p-2 md:p-8 border-b border-[#2b5469]/20 flex-col justify-start items-start gap-6 md:gap-8 flex">
      <div className="justify-start items-center gap-2 inline-flex">
        <BackButton />
      </div>
      <div className="self-stretch justify-start items-center gap-2 inline-flex">
        <div className="w-14 h-14 relative bg-white rounded-[56px] bg-[url('/images/profile.png')] md:flex">
          <div className="w-14 left-0 top-[16px] absolute text-center text-white text-[14px] font-bold leading-normal tracking-tight">
            {clientRecord?.full_name?.given_names
              ? clientRecord.full_name.given_names.charAt(0)
              : "--"}
          </div>
        </div>
        <div className="grow shrink basis-0 flex-col justify-start items-start inline-flex">
          <div className="self-stretch justify-start items-center gap-3 inline-flex">
            <div className="justify-start  gap-1 flex md:flex-row flex-col">
              <div className="text-[#003331] text-lg font-medium leading-snug">
                {clientRecord?.full_name?.given_names &&
                clientRecord.full_name?.surname
                  ? `${clientRecord.full_name.given_names} ${clientRecord.full_name.surname}`
                  : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isExpanded !== undefined && (
        <div
          className={
            "flex w-full items-end justify-end md:hidden -mt-6 pr-2 pb-2"
          }
        >
          <Image
            src={"/images/arrow_down.svg"}
            alt="toggle arrow"
            width={15}
            height={15}
            priority
            onClick={() => setIsExpanded(!isExpanded)}
            className={`cursor-pointer transition-transform duration-200 ${!isExpanded ? "-rotate-90" : ""}`}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileDetail;
