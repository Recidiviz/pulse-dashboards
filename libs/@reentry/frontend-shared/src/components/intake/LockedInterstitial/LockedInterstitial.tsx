// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import type React from "react";

import { useApplicationContext } from "../../../contexts/ApplicationContext";
import { clearIntakeSession } from "../../../utils/clearIntakeSession";
import styles from "./LockedInterstitial.module.css";

export const LockedInterstitial: React.FC = () => {
  const { navigateAfterIntake } = useApplicationContext();

  const handleHome = () => {
    clearIntakeSession();
    navigateAfterIntake();
  };

  return (
    <div className={styles["page"]}>
      <div className={styles["inner"]}>
        <div className={styles["card"]}>
          <h1 className={styles["heading"]}>
            This assessment is temporarily locked.
          </h1>
          <p className={styles["body"]}>
            This assessment chat is temporarily locked. Please contact the staff
            member who originally enabled this assessment to unlock it.
          </p>
          <button
            type="button"
            onClick={handleHome}
            className={styles["button"]}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};
