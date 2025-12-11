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
import { createMockSentencingStore } from "../../utils/test";

const sentencingStore = createMockSentencingStore();
const { PSIStore } = sentencingStore;

const initializePSIStore = async () => {
  const caseId = Object.keys(CaseDetailsFixture)[0];

  vi.spyOn(sentencingStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );
  vi.spyOn(sentencingStore.apiClient, "getCaseDetails").mockResolvedValue(
    CaseDetailsFixture[caseId],
  );

  await flowResult(sentencingStore.staffStore.loadStaffInfo());
  await flowResult(PSIStore.loadCaseDetails(caseId));

  PSIStore.activeCaseId = caseId;
};

test("loads case details", async () => {
  const caseId = Object.keys(CaseDetailsFixture)[0];
  vi.spyOn(sentencingStore.apiClient, "getCaseDetails").mockResolvedValue(
    CaseDetailsFixture[caseId],
  );

  expect(PSIStore.caseDetailsById[caseId]).toBeUndefined();
  await flowResult(PSIStore.loadCaseDetails(caseId));
  expect(PSIStore.caseDetailsById[caseId]).toBeDefined();
  expect(PSIStore.caseDetailsById[caseId]).toEqual(CaseDetailsFixture[caseId]);
});

test("update case details", async () => {
  const caseId = Object.keys(CaseDetailsFixture)[0];
  const updates = { lsirScore: 22 };
  const apiClientUpdateCaseDetailsFn = vi
    .spyOn(sentencingStore.apiClient, "updateCaseDetails")
    .mockResolvedValue();

  await flowResult(PSIStore.updateCaseDetails(caseId, { lsirScore: 22 }));
  expect(apiClientUpdateCaseDetailsFn).toHaveBeenCalledTimes(1);
  expect(apiClientUpdateCaseDetailsFn).toHaveBeenCalledWith(caseId, updates);
});

test("caseAttributes filters based on state-specific exclusions list", async () => {
  await initializePSIStore();

  const stateCode1 = "US_ND";
  const stateCode2 = "US_ID";

  const sentencingStore = createMockSentencingStore();
  const { PSIStore } = sentencingStore;

  sentencingStore.rootStore.userStore.stateCode = stateCode1;

  // Case Attributes should not have any properties in the US_ND exclusion list
  expect(PSIStore.stateCode).toBe(stateCode1);
  expect(
    sentencingStore.geoConfig.excludedAttributeKeys.some((key) =>
      Object.keys(PSIStore.caseAttributes).includes(key),
    ),
  ).toBe(false);

  sentencingStore.rootStore.userStore.stateCode = stateCode2;

  await initializePSIStore();

  // Case Attributes should not have any properties in the US_ID exclusion list
  expect(PSIStore.stateCode).toBe(stateCode2);
  expect(
    sentencingStore.geoConfig.excludedAttributeKeys.some((key) =>
      Object.keys(PSIStore.caseAttributes).includes(key),
    ),
  ).toBe(false);
});
