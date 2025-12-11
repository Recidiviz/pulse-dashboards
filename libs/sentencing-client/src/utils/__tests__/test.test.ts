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

import { createMockRootStore, createMockSentencingStore } from "../test";

const overrideId = "123";
const defaultUserPseudoId = "TestID-123";

test("mockRootStore has expected properties", () => {
  const mockRootStore = createMockRootStore();

  expect(mockRootStore.userStore).toBeDefined();
  expect(createMockRootStore().userStore.userPseudoId).toBeDefined();
  expect(createMockRootStore().userStore.getToken).toBeDefined();
});

test("mockSentencingStore has expected properties", () => {
  const mockSentencingStore = createMockSentencingStore();
  expect(mockSentencingStore.rootStore).toBeDefined();
  expect(mockSentencingStore.staffStore).toBeDefined();
  expect(mockSentencingStore.PSIStore).toBeDefined();
  expect(mockSentencingStore.apiClient).toBeDefined();
});

test("mockRootStore uses default userPseudoId when no override is provided", () => {
  expect(createMockRootStore().userStore.userPseudoId).toBe(
    defaultUserPseudoId,
  );
});

test("mockRootStore overrides userPseudoId with provided id", () => {
  expect(createMockRootStore(overrideId).userStore.userPseudoId).toBe(
    overrideId,
  );
});

test("mockRootStore overrides userPseudoId to `undefined` when null is passed in", () => {
  expect(createMockRootStore(null).userStore.userPseudoId).toBeUndefined();
});

test("mock sentencingStore references default userPseudoId", () => {
  expect(createMockSentencingStore().rootStore.userStore.userPseudoId).toBe(
    defaultUserPseudoId,
  );
});

test("mock sentencingStore references overridden userPseudoId", () => {
  expect(
    createMockSentencingStore({ userPseudoIdOverride: overrideId }).rootStore
      .userStore.userPseudoId,
  ).toBe(overrideId);
});
