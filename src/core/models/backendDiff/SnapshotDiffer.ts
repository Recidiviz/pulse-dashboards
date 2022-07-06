/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { SnapshotDataRecord } from "../types";
import { Differ } from "./Differ";

/**
 * Differ that compares counts between records with records with keys of a specific type.
 */
/* eslint-disable class-methods-use-this */
export class SnapshotDiffer extends Differ<SnapshotDataRecord, number> {
  diffKey: keyof SnapshotDataRecord;

  emptyValue = 0;

  constructor(diffKey: keyof SnapshotDataRecord) {
    super();
    this.diffKey = diffKey;
  }

  getKey(result: SnapshotDataRecord): string {
    return result[this.diffKey]?.toString() || "";
  }

  getValue(result: SnapshotDataRecord): number {
    return result.count;
  }

  compare(value: number, other: number): boolean {
    return value === other;
  }
}
