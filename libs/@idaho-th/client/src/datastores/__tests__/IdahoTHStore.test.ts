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

import { autorun, isObservableProp, makeAutoObservable } from "mobx";
import { describe, expect, it, vi } from "vitest";

import { USER_ROLE, type UserRole } from "~@idaho-th/shared";

import { TAB_IDS } from "../../components/PreviewModal/constants";
import {
  HousingApplicationsStore,
  type PendingUpload,
} from "../HousingApplicationsStore";
import { IdahoTHStore, type RootStore } from "../IdahoTHStore";
import { PreviewModalStore } from "../PreviewModalStore";

/**
 * The host's userStore, as a class instance rather than a plain object.
 *
 * This matters: `IdahoTHStore` calls `makeAutoObservable(this)` after assigning
 * `rootStore`, which annotates the property `observable.deep`. MobX leaves a
 * class instance alone but *copies* a plain object into a fresh observable — so
 * a plain-object double would silently stop tracking the host's own mutations
 * and any assertion about a role change would pass for the wrong reason.
 */
class HostUserStore {
  isAuthorized = true;

  userIsLoading = false;

  user?: { role?: UserRole };

  constructor(role?: UserRole) {
    if (role) this.user = { role };
    makeAutoObservable(this);
  }

  authorize = vi.fn();

  loginWithRedirect = vi.fn();

  loginWithEmail = vi.fn();
}

class HostRootStore {
  userStore: HostUserStore;

  constructor(role?: UserRole) {
    this.userStore = new HostUserStore(role);
    makeAutoObservable(this);
  }
}

function rootStore(role?: UserRole): RootStore {
  return new HostRootStore(role) as unknown as RootStore;
}

function pendingUpload(overrides: Partial<PendingUpload> = {}): PendingUpload {
  return {
    pendingId: "pending-1",
    applicationId: "app-1",
    documentId: "",
    fileName: "scan.pdf",
    status: "uploading",
    progress: 0,
    loadedBytes: 0,
    totalBytes: 2048,
    ...overrides,
  };
}

describe("IdahoTHStore", () => {
  it("constructs its sub-stores and keeps a back-reference to the host root store", () => {
    const root = rootStore();

    const store = new IdahoTHStore(root);

    expect(store.rootStore.userStore).toBe(root.userStore);
    expect(store.housingApplicationsStore).toBeInstanceOf(
      HousingApplicationsStore,
    );
    expect(store.previewModalStore).toBeInstanceOf(PreviewModalStore);
    expect(store.housingApplicationsStore.parent).toBe(store);
    expect(store.previewModalStore.parent).toBe(store);
  });
});

describe("HousingApplicationsStore", () => {
  function build() {
    return new IdahoTHStore(rootStore()).housingApplicationsStore;
  }

  it("starts with no current application and no pending uploads", () => {
    const store = build();

    expect(store.currentApplicationId).toBeUndefined();
    expect(store.pendingUploads.size).toBe(0);
  });

  it("sets and clears the current application id", () => {
    const store = build();

    store.setCurrentApplicationId("app-1");
    expect(store.currentApplicationId).toBe("app-1");

    store.setCurrentApplicationId(undefined);
    expect(store.currentApplicationId).toBeUndefined();
  });

  it("adds a pending upload keyed by its pendingId", () => {
    const store = build();
    const upload = pendingUpload();

    store.addPendingUpload(upload);

    expect(store.pendingUploads.get("pending-1")).toEqual(upload);
  });

  it("merges a patch into an existing upload", () => {
    const store = build();
    store.addPendingUpload(pendingUpload());

    store.updatePendingUpload("pending-1", {
      status: "scanning",
      progress: 100,
    });

    expect(store.pendingUploads.get("pending-1")).toEqual({
      ...pendingUpload(),
      status: "scanning",
      progress: 100,
    });
  });

  it("ignores a patch for an id that is no longer tracked", () => {
    // A cancelled upload is removed while its async chain is still in flight;
    // the late patch must not resurrect it.
    const store = build();

    store.updatePendingUpload("pending-1", { status: "success" });

    expect(store.pendingUploads.has("pending-1")).toBe(false);
  });

  it("removes a pending upload", () => {
    const store = build();
    store.addPendingUpload(pendingUpload());

    store.removePendingUpload("pending-1");

    expect(store.pendingUploads.has("pending-1")).toBe(false);
  });

  it("keeps other uploads when one is removed", () => {
    const store = build();
    store.addPendingUpload(pendingUpload({ pendingId: "pending-1" }));
    store.addPendingUpload(pendingUpload({ pendingId: "pending-2" }));

    store.removePendingUpload("pending-1");

    expect([...store.pendingUploads.keys()]).toEqual(["pending-2"]);
  });

  it("exposes observable state, so a component re-renders on an upload change", () => {
    const store = build();
    const seen: number[] = [];
    const dispose = autorun(() => seen.push(store.pendingUploads.size));

    store.addPendingUpload(pendingUpload());
    store.removePendingUpload("pending-1");
    dispose();

    expect(seen).toEqual([0, 1, 0]);
    expect(isObservableProp(store, "currentApplicationId")).toBe(true);
  });
});

describe("PreviewModalStore", () => {
  function build(role?: UserRole) {
    return new IdahoTHStore(rootStore(role)).previewModalStore;
  }

  it("opens a provider on the application details tab", () => {
    // A provider has no providers tab to land on.
    expect(build(USER_ROLE.PROVIDER).activeTab).toBe(
      TAB_IDS.APPLICATION_DETAILS,
    );
  });

  it("opens staff on the providers tab", () => {
    expect(build(USER_ROLE.STAFF).activeTab).toBe(TAB_IDS.PROVIDERS);
  });

  it("falls back to the staff default when no user is loaded yet", () => {
    expect(build().activeTab).toBe(TAB_IDS.PROVIDERS);
  });

  it("honours an explicit tab selection over the role default", () => {
    const store = build(USER_ROLE.PROVIDER);

    store.setActiveTab(TAB_IDS.DOCUMENTS);

    expect(store.activeTab).toBe(TAB_IDS.DOCUMENTS);
  });

  it("opens on the initial tab the caller supplied for the row", () => {
    const store = build(USER_ROLE.PROVIDER);

    store.setInitialTab(TAB_IDS.HOME_PLAN);

    expect(store.activeTab).toBe(TAB_IDS.HOME_PLAN);
  });

  it("honours an explicit tab selection over the row's initial tab", () => {
    // Landing tab picked from the row's stage must not fight the viewer's click.
    const store = build(USER_ROLE.PROVIDER);
    store.setInitialTab(TAB_IDS.HOME_PLAN);

    store.setActiveTab(TAB_IDS.TIMELINE);

    expect(store.activeTab).toBe(TAB_IDS.TIMELINE);
  });

  it("returns to the role default after a reset", () => {
    const store = build(USER_ROLE.PROVIDER);
    store.setInitialTab(TAB_IDS.HOME_PLAN);
    store.setActiveTab(TAB_IDS.TIMELINE);

    store.reset();

    expect(store.activeTab).toBe(TAB_IDS.APPLICATION_DETAILS);
  });

  it("recomputes the default when the signed-in role changes", () => {
    // A user switch must not leave the previous user's default tab in place.
    const root = rootStore(USER_ROLE.PROVIDER);
    const store = new IdahoTHStore(root).previewModalStore;
    expect(store.activeTab).toBe(TAB_IDS.APPLICATION_DETAILS);

    root.userStore.user = { role: USER_ROLE.STAFF };

    expect(store.activeTab).toBe(TAB_IDS.PROVIDERS);
  });

  it("tracks the host's userStore by reference, not as a snapshot", () => {
    // The lib reads the host's live auth state; a copy would keep serving the
    // signed-out user's role after logout.
    const root = rootStore(USER_ROLE.PROVIDER);
    const store = new IdahoTHStore(root);

    expect(store.rootStore.userStore).toBe(root.userStore);
  });
});
