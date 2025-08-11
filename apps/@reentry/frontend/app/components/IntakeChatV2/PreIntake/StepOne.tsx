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

import styles from "~@reentry/frontend/components/IntakeChatV2/PreIntake/PreIntake.module.css";

interface StepOneProps {
  onContinue: () => void;
  onGoBack: () => void;
}

const StepOne: React.FC<StepOneProps> = ({ onContinue, onGoBack }) => (
  <div className={styles["noteContainer"]}>
    <div className={styles["noteInner"]}>
      <div className={styles["noteCard"]}>
        <h1 className={styles["noteOneTitle"]}>Your Community Intake</h1>
        <div className={styles["noteOneContent"]}>
          <div className={styles["noteOneText"]}>
            <p>
              This intake is designed to help your case manager and parole or
              probation officer learn more about your reentry goals, plans, and
              needs. This helps them start thinking about the best ways to
              support you as you transition back into the community.
            </p>
            <p>
              To make this process as effective as possible, please provide
              honest and complete answers. This information will help create a
              personalized case plan to help you achieve stability quickly. If
              you&rsquo;d prefer to skip this intake and answer questions with
              your supervision officer in person, stop here and let your case
              manager know.
            </p>
          </div>
        </div>
        <div className={styles["noteButtonContainer"]}>
          <button
            type="button"
            onClick={onGoBack}
            className={`${styles["buttonCommon"]} ${styles["goBack"]}`}
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className={`${styles["buttonCommon"]} ${styles["continue"]}`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default StepOne;
