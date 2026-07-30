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

import {
  ParoleCase,
  paroleCasesFixture,
  ParoleHearing,
  paroleHearingsFixture,
} from "~datatypes";

import { ParoleStore } from "../ParoleStore";
import { ParoleAPI } from "./interface";

export class ParoleOfflineAPIClient implements ParoleAPI {
  constructor(public readonly paroleStore: ParoleStore) {}

  async hearings(): Promise<Array<ParoleHearing>> {
    return paroleHearingsFixture;
  }

  async caseDetail(docId: string): Promise<ParoleCase> {
    const caseDetail = paroleCasesFixture[docId];
    if (!caseDetail) {
      throw new Error(`Parole case ${docId} not present in fixture data`);
    }
    return caseDetail;
  }
}
