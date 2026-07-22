// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import moment from "moment";

import { isSARArchived } from "~@sentencing/trpc-types";

export const isBeforeDueDate = (dueDate: Date | null, offset?: number) => {
  if (!dueDate) return;

  return (
    moment().utc() <
    moment(dueDate)
      .utc()
      .add(offset ?? 1, "day")
  );
};

export const isBeforeDueDateWithExtraDayOffset = (dueDate: Date | null) => {
  if (!dueDate) return;
  /**
   * This due date offset will allow PSI an extra day to access their due cases within
   * the Active status filter before they get archived
   * @example a case that's due on 5/15/2025 should be archived on 5/17/2025
   */
  return isBeforeDueDate(dueDate, 2);
};

/** The two independent "completion" signals a SAR can have: `status` reaches
 * Complete as soon as a PO finishes all fields in-app, but the report isn't
 * archived until MODOC closes the investigation in OPII and `completionDate`
 * is set. Shared by any UI that branches on this distinction (e.g. a Reports
 * section label and its download-vs-builder-link action) so they can't fall
 * out of sync on what counts as "done." */
export type SARCompletionState =
  | { kind: "archivedInOpii"; date: Date }
  | { kind: "completeInApp"; date: Date }
  | { kind: "active" };

export const getSARCompletionState = (sar: {
  status: string;
  completionDate?: Date | null;
  updatedAt: Date;
}): SARCompletionState => {
  if (isSARArchived(sar)) {
    return { kind: "archivedInOpii", date: sar.completionDate };
  }
  if (sar.status === "Complete") {
    return { kind: "completeInApp", date: sar.updatedAt };
  }
  return { kind: "active" };
};

// PSI: archived when dueDate has passed (with extra day grace period).
export const isPSICaseArchived = (psiCase: {
  dueDate?: Date | null;
}): boolean =>
  !!psiCase.dueDate && !isBeforeDueDateWithExtraDayOffset(psiCase.dueDate);
