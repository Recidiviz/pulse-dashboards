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

"use client";

import React from "react";

import {
  getIntakeTenantConfig,
  navigateAfterIntake,
} from "../../configs/tenantConfig";
import { useSocket } from "../../websockets/IntakeSocketContext";

const IntakeCompleted: React.FC = () => {
  const { intakeContext } = useSocket();
  const tenantConfig = getIntakeTenantConfig(intakeContext.client_state);

  const handleBack = () => {
    sessionStorage.removeItem("intake_token");
    navigateAfterIntake(tenantConfig);
  };

  return (
    <div className="flex justify-center pt-12 md:pt-16">
      <div className="w-full max-w-[640px] md:max-w-[720px] px-6">
        <div className="text-center bg-white rounded-sm shadow-[0_4px_4px_rgba(0,0,0,0.25)] p-8 md:p-12">
          <h1 className="font-['Libre Baskerville'] font-normal text-[32px] leading-[40px] tracking-[-0.04em] text-black mb-6 md:mb-8">
            You&apos;re all set.
          </h1>

          <p className="font-['Public_Sans'] font-medium text-[18px] leading-[1.2] tracking-[-0.02em] text-black text-center mb-8 md:mb-12 mx-auto">
            Your intake is complete. Thank you for taking the time to fill it
            out. Your case manager and supervision officer will receive the
            details you provided and work with you on the next steps.
          </p>
          <button
            type="button"
            className="w-[269px] h-12 px-8 py-3 rounded-md font-['Public_Sans'] text-sm leading-6 tracking-[-0.01em] cursor-pointer border border-[var(--ink-4-a20)] bg-transparent text-[var(--ink-4-a85)] hover:bg-[var(--gray-50)]"
            onClick={handleBack}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntakeCompleted;
