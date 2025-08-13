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

import styles from "~@reentry/frontend/components/IntakeChatV2/Chat/Sidebar.module.css";
import { StepStatus } from "~@reentry/frontend/components/IntakeChatV2/Chat/types";

interface StepIndicatorProps {
  status: StepStatus;
  hasNext: boolean;
  text: string;
  description: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  status,
  hasNext,
  text,
  description,
}) => {
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";

  return (
    <div className={styles["step"]}>
      <div className={styles["iconContainer"]}>
        {isCompleted ? (
          <div className={styles["completedIcon"]}>
            <svg viewBox="0 0 24 24" fill="none">
              <title>Check Mark</title>
              <path
                d="M4 13l5 6L15 5"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <div
            className={`${styles["pendingIcon"]} ${isInProgress ? styles["inProgress"] : styles["notStarted"]}`}
          >
            <div
              className={`${styles["pendingInner"]} ${isInProgress ? styles["inProgressInner"] : styles["notStartedInner"]}`}
            />
          </div>
        )}
        {hasNext && (
          <div
            className={`${styles["connector"]} ${isCompleted || isInProgress ? styles["connectorActive"] : ""}`}
          />
        )}
      </div>
      <div className={styles["content"]}>
        <h3 className={styles["title"]}>{text}</h3>
        <p className={styles["description"]}>{description}</p>
      </div>
    </div>
  );
};
