// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { Searchable, SystemId } from "../core/models/types";
import { StaffRecord } from "../FirestoreStore";

export class Officer implements Searchable {
  record: StaffRecord;

  constructor(record: StaffRecord) {
    this.record = record;
  }

  get systemId(): SystemId | undefined {
    if (this.record.hasCaseload) return "SUPERVISION";
    if (this.record.hasFacilityCaseload) return "INCARCERATION";
  }

  get searchLabel(): string {
    return `${this.record.givenNames} ${this.record.surname}`.trim();
  }

  get searchId(): string {
    return this.record.id;
  }
}