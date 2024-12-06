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

import {
  CaseDetailsFixture,
  StaffInfoFixture,
} from "../../api/offlineFixtures";
import { GEO_CONFIG } from "../../geoConfigs/geoConfigs";
import { createMockPSIStore } from "../../utils/test";

const psiStore = createMockPSIStore();
const { caseStore } = psiStore;

const initializeCaseStore = async () => {
  const caseId = Object.keys(CaseDetailsFixture)[0];

  vi.spyOn(psiStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );
  vi.spyOn(psiStore.apiClient, "getCaseDetails").mockResolvedValue(
    CaseDetailsFixture[caseId],
  );

  await flowResult(psiStore.staffStore.loadStaffInfo());
  await flowResult(caseStore.loadCaseDetails(caseId));

  caseStore.activeCaseId = caseId;
};

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

test("caseAttributes filters based on state-specific exclusions list", async () => {
  await initializeCaseStore();

  const stateCode1 = "US_ND";
  const stateCode2 = "US_ID";

  if (psiStore.staffStore.staffInfo) {
    psiStore.staffStore.staffInfo.stateCode = stateCode1;
  }

  // Case Attributes should not have any properties in the US_ND exclusion list
  expect(caseStore.stateCode).toBe(stateCode1);
  expect(
    GEO_CONFIG[stateCode1]?.excludedAttributeKeys?.some((key) =>
      Object.keys(caseStore.caseAttributes).includes(key),
    ),
  ).toBe(false);

  if (psiStore.staffStore.staffInfo) {
    psiStore.staffStore.staffInfo.stateCode = stateCode2;
  }

  await initializeCaseStore();

  // Case Attributes should not have any properties in the US_ID exclusion list
  expect(caseStore.stateCode).toBe(stateCode2);
  expect(
    GEO_CONFIG[stateCode2]?.excludedAttributeKeys?.some((key) =>
      Object.keys(caseStore.caseAttributes).includes(key),
    ),
  ).toBe(false);
});
