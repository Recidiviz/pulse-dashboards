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

import common from "~@reentry/frontend/components/IntakeChatV2/Common.module.css";
import styles from "~@reentry/frontend/components/IntakeChatV2/IntakeComplete/IntakeComplete.module.css";

const IntakeCompleted: React.FC = () => {
  const handleBack = () => {
    sessionStorage.removeItem("intake_token");
    window.location.href = "/assessment";
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
            className={`${styles["buttonCommon"]} ${styles["secondary"]} ${common["buttonBase"]} ${common["buttonSecondary"]}`}
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
