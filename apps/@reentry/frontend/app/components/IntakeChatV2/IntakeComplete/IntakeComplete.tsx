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

import {
  IntakeChatV2CommonStyles as common,
  IntakeCompleteStyles as styles,
} from "~@reentry/frontend-shared";

interface IntakeCompleteProps {
  onBackToHome?: () => void;
}

const IntakeComplete: React.FC<IntakeCompleteProps> = () => {
  const handleBack = () => {
    window.location.href = "/assessment";
  };

  return (
    <div className={styles["container"]}>
      <div
        className={`${styles["card"]} ${common["cardBase"]} ${common["card714"]} ${common["cardPaddingLg"]}`}
      >
        <div className={styles["header"]}>
          <h1 className={`${styles["title"]} ${common["titleSerifLg"]}`}>
            You're all set.
          </h1>
          <p className={`${styles["subtitle"]} ${common["subtitleSans"]}`}>
            Your intake is complete. Thank you for taking the time to fill it
            out. Your case manager and supervision officer will receive the
            details you provided and work with you on the next steps.
          </p>
        </div>

        <div className={styles["body"]}>
          <div className={styles["buttonRow"]}>
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
    </div>
  );
};

export default IntakeComplete;
