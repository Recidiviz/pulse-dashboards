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

import styles from "./ResourceBankSkeleton.module.css";

const SkeletonTile = () => (
  <div className={styles["skeletonTile"]}>
    <div
      className={`${styles["skeletonLine"]} ${styles["skeletonLineLong"]}`}
    />
    <div
      className={`${styles["skeletonLine"]} ${styles["skeletonLineMedium"]}`}
    />
    <div
      className={`${styles["skeletonLine"]} ${styles["skeletonLineShort"]}`}
    />
  </div>
);

export const ResourceBankTilesSkeleton = () => (
  <>
    <SkeletonTile />
    <SkeletonTile />
    <SkeletonTile />
  </>
);

export const ResourceBankSectionSkeleton = () => (
  <div className={styles["section"]}>
    <div
      className={`${styles["skeletonLine"]} ${styles["skeletonLineLong"]} ${styles["skeletonTitle"]}`}
    />
    <div className={styles["tileList"]}>
      <SkeletonTile />
      <SkeletonTile />
      <SkeletonTile />
    </div>
  </div>
);
