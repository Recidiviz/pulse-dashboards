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

import { useRouter } from "next/navigation";

import BackButton from "~@reentry/frontend/components/base/BackButton";
import WarningCircleIcon from "~@reentry/frontend/components/icons/WarningCircleIcon";

import { ResourceBankSectionSkeleton } from "./ResourceBankSkeleton";
import planStyles from "./styles/PlanContent.module.css";
import styles from "./styles/PlanContentSkeleton.module.css";

const PlanTextBlockSkeleton = () => (
  <div className={styles["textBlock"]}>
    <div
      className={`${styles["skeletonLine"]} ${styles["h18"]} ${styles["w40"]}`}
    />
    <div className={`${styles["skeletonLine"]} ${styles["w95"]}`} />
    <div className={`${styles["skeletonLine"]} ${styles["w80"]}`} />
    <div className={`${styles["skeletonLine"]} ${styles["w95"]}`} />
    <div className={`${styles["skeletonLine"]} ${styles["w65"]}`} />
  </div>
);

const PlanHeaderSkeleton = () => (
  <div className={planStyles["planHeader"]}>
    <div
      className={`${styles["skeletonLine"]} ${styles["w18"]} ${planStyles["planLabel"]}`}
    />
    <div
      className={`${styles["skeletonLine"]} ${styles["h28"]} ${styles["w40"]} ${planStyles["planTitle"]}`}
    />
  </div>
);

export const SidePanelSkeleton = () => {
  const router = useRouter();
  return (
    <div>
      <div className={styles["profileRow"]}>
        <BackButton href="" onClick={() => router.back()} buttonText="Back" />
        <div className={styles["profileAvatarRow"]}>
          <div className={styles["avatar"]} />
          <div className={styles["profileName"]}>
            <div className={`${styles["skeletonLine"]} ${styles["w55"]}`} />
            <div className={`${styles["skeletonLine"]} ${styles["w40"]}`} />
          </div>
        </div>
      </div>
      <div className={styles["addressBlock"]}>
        <div
          className={`${styles["skeletonLine"]} ${styles["h18"]} ${styles["w40"]}`}
        />
        <div className={`${styles["skeletonLine"]} ${styles["w65"]}`} />
        <div className={`${styles["skeletonLine"]} ${styles["w55"]}`} />
      </div>
    </div>
  );
};

export const PlanErrorContent = () => (
  <div className={planStyles["container"]}>
    <div className={planStyles["inner"]}>
      <div className={styles["planError"]}>
        <WarningCircleIcon />
        Failed to load the action plan. Please try again.
      </div>
    </div>
  </div>
);

export const PlanContentSkeleton = () => (
  <div className={planStyles["container"]}>
    <div className={planStyles["inner"]}>
      <div className={styles["buttonRow"]}>
        <div className={`${styles["skeletonLine"]} ${styles["h36"]}`} />
      </div>
      <PlanHeaderSkeleton />
      <PlanTextBlockSkeleton />
      <ResourceBankSectionSkeleton />
      <PlanTextBlockSkeleton />
      <ResourceBankSectionSkeleton />
    </div>
  </div>
);
