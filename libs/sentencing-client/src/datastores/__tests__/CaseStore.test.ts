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

import { flowResult } from "mobx";

import { Case } from "../../api/APIClient";
import { createMockPSIStore } from "../../utils/tests";

const psiStore = createMockPSIStore();
const { psiCaseStore } = psiStore;

test("loads case info", async () => {
  const mockCaseId = "123";
  vi.spyOn(psiStore.apiClient, "getCaseDetails").mockResolvedValue({} as Case);

  expect(psiCaseStore.caseDetailsById[mockCaseId]).toBeUndefined();
  await flowResult(psiCaseStore.loadCaseDetails(mockCaseId));
  expect(psiCaseStore.caseDetailsById[mockCaseId]).toBeDefined();
});
