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

import { CaseDetailsFixture } from "../../api/offlineFixtures";
import { createMockPSIStore } from "../../utils/test";

const psiStore = createMockPSIStore();
const { caseStore } = psiStore;

test("loads case details", async () => {
  const caseId = Object.keys(CaseDetailsFixture)[0];
  vi.spyOn(psiStore.apiClient, "getCaseDetails").mockResolvedValue(
    CaseDetailsFixture[caseId],
  );

  expect(caseStore.caseDetailsById[caseId]).toBeUndefined();
  await flowResult(caseStore.loadCaseDetails(caseId));
  expect(caseStore.caseDetailsById[caseId]).toBeDefined();
  expect(caseStore.caseDetailsById[caseId]).toEqual(CaseDetailsFixture[caseId]);
});

test("update case details", async () => {
  const caseId = Object.keys(CaseDetailsFixture)[0];
  const updates = { lsirScore: 22 };
  const apiClientUpdateCaseDetailsFn = vi
    .spyOn(psiStore.apiClient, "updateCaseDetails")
    .mockResolvedValue();

  await flowResult(caseStore.updateCaseDetails(caseId, { lsirScore: 22 }));
  expect(apiClientUpdateCaseDetailsFn).toHaveBeenCalledTimes(1);
  expect(apiClientUpdateCaseDetailsFn).toHaveBeenCalledWith(caseId, updates);
});
