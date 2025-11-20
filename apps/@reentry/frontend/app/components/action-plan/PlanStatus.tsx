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

import { PrimaryButton } from "~@reentry/frontend-shared";

const PlanStatus = () => {
  return (
    <div className="self-stretch h-[178px] px-8 py-6 border-b border-[#2b5469]/20 flex-col justify-start items-start gap-3 flex">
      <div className="justify-start items-center gap-2 inline-flex">
        <div className="text-[#002321] text-sm font-medium leading-[16.80px]">
          Plan status
        </div>
        <Image
          src="/images/info_icon.svg"
          alt="info icon"
          width={15}
          height={15}
          priority
        />
      </div>
      <div className="text-[#2a5469]/90 text-sm font-medium leading-[16.80px]">
        Last edited: Never
      </div>
      <div className="self-stretch flex-col justify-start items-start gap-2 flex">
        <PrimaryButton buttonText="Save as Draft" />
        <PrimaryButton buttonText="Save as Official Plan" />
      </div>
    </div>
  );
};
export default PlanStatus;
