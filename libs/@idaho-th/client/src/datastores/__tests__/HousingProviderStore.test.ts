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

import { beforeEach, describe, expect, it } from "vitest";

import { buildIdahoTHStore } from "../../test/renderWithStore";
import type { IdahoTHStore } from "../IdahoTHStore";

const ORG_A = { id: "housing-provider-a", name: "Sunrise House" };
const ORG_B = { id: "housing-provider-b", name: "Lakeside Home" };

let store: IdahoTHStore;

beforeEach(() => {
  store = buildIdahoTHStore();
});

describe("HousingProviderStore", () => {
  it("starts with no provider and no forced selection", () => {
    const housingProviderStore = store.housingProviderStore;

    expect(housingProviderStore.activeProviderId).toBeNull();
    expect(housingProviderStore.mustSelectHousingProvider).toBe(false);
  });

  it("keeps the active provider out of browser storage", () => {
    store.housingProviderStore.setActiveHousingProvider(ORG_A);

    // The identifier travels in a request header only. Anything persisted here
    // would outlive the tab and survive a sign-out on a shared machine.
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.search).toBe("");
    expect(document.cookie).toBe("");
  });

  it("keeps the active provider while the picker is open and closes it again", () => {
    const housingProviderStore = store.housingProviderStore;
    housingProviderStore.setActiveHousingProvider(ORG_A);

    housingProviderStore.openHousingProviderSelection();

    expect(housingProviderStore.mustSelectHousingProvider).toBe(true);
    expect(housingProviderStore.activeProviderId).toBe(ORG_A.id);

    housingProviderStore.closeHousingProviderSelection();

    expect(housingProviderStore.mustSelectHousingProvider).toBe(false);
    expect(housingProviderStore.activeProviderId).toBe(ORG_A.id);
  });

  it("replaces the provider in effect when another is chosen", () => {
    const housingProviderStore = store.housingProviderStore;

    housingProviderStore.setActiveHousingProvider(ORG_A);
    housingProviderStore.setActiveHousingProvider(ORG_B);

    expect(housingProviderStore.activeProviderId).toBe(ORG_B.id);
  });

  it("drops the provider and demands a fresh choice on the forbidden recovery", () => {
    const housingProviderStore = store.housingProviderStore;
    housingProviderStore.setActiveHousingProvider(ORG_A);

    housingProviderStore.requireHousingProviderSelection();

    expect(housingProviderStore.activeProviderId).toBeNull();
    expect(housingProviderStore.mustSelectHousingProvider).toBe(true);
  });

  it("clears the forced choice once a provider is chosen", () => {
    const housingProviderStore = store.housingProviderStore;
    housingProviderStore.requireHousingProviderSelection();

    housingProviderStore.setActiveHousingProvider(ORG_B);

    expect(housingProviderStore.mustSelectHousingProvider).toBe(false);
    expect(housingProviderStore.activeProviderId).toBe(ORG_B.id);
  });
});

describe("IdahoTHStore.reset", () => {
  it("drops everything scoped to one provider", () => {
    store.housingProviderStore.setActiveHousingProvider(ORG_A);
    store.housingApplicationsStore.setCurrentApplicationId("application-a");
    store.housingApplicationsStore.addPendingUpload({
      applicationId: "application-a",
      documentId: "document-a",
      fileName: "notes.pdf",
      loadedBytes: 0,
      pendingId: "pending-a",
      progress: 0,
      status: "uploading",
      totalBytes: 10,
    });

    store.reset();

    expect(store.housingApplicationsStore.currentApplicationId).toBeUndefined();
    expect(store.housingApplicationsStore.pendingUploads.size).toBe(0);
    expect(store.housingProviderStore.activeProviderId).toBeNull();
  });
});
