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

import { isDemoMode, isOfflineMode } from "~client-env-utils";
import {
  ParoleCase,
  paroleCasesFixtureByState,
  ParoleHearing,
  paroleHearingsFixtureByState,
} from "~datatypes";

import { RootStore } from "../../RootStore";
import { ParoleAPIClient } from "../api/ParoleAPIClient";
import { ParoleOfflineAPIClient } from "../api/ParoleOfflineAPIClient";
import { ParoleStore } from "../ParoleStore";

vi.mock("~client-env-utils");

describe("ParoleStore", () => {
  describe("config", () => {
    it("returns the current tenant's paroleConfig", () => {
      const rootStore = new RootStore();
      rootStore.tenantStore.currentTenantId = "US_CO";
      const paroleStore = new ParoleStore(rootStore);

      expect(paroleStore.config).toEqual(
        rootStore.tenantStore.currentTenantConfig?.paroleConfig,
      );
    });

    it("throws when no tenant is configured", () => {
      const paroleStore = new ParoleStore(new RootStore());

      expect(() => paroleStore.config).toThrow(/no current tenant configured/);
    });

    it("throws when the current tenant has no paroleConfig set", () => {
      const rootStore = new RootStore();
      // US_CO always sets paroleConfig in practice -- build a copy of
      // tenantConfigs with it stripped from US_CO, rather than mutating the
      // real (module-singleton) US_CO config, to exercise a tenant that
      // enables Parole nav without configuring it.

      const { paroleConfig, ...usCoWithoutParoleConfig } =
        rootStore.tenantStore.tenantConfigs.US_CO;
      rootStore.tenantStore.tenantConfigs = {
        ...rootStore.tenantStore.tenantConfigs,
        US_CO: usCoWithoutParoleConfig,
      };
      rootStore.tenantStore.currentTenantId = "US_CO";
      const paroleStore = new ParoleStore(rootStore);

      expect(() => paroleStore.config).toThrow(
        /Tenant \[US_CO\] has no paroleConfig set/,
      );
    });
  });

  describe("apiClient", () => {
    beforeEach(() => {
      vi.mocked(isOfflineMode).mockReturnValue(false);
      vi.mocked(isDemoMode).mockReturnValue(false);
    });

    it.each(["US_ID", "US_CO"] as const)(
      "returns a real ParoleAPIClient for %s outside offline/demo mode",
      (tenantId) => {
        const rootStore = new RootStore();
        rootStore.tenantStore.currentTenantId = tenantId;

        expect(new ParoleStore(rootStore).apiClient).toBeInstanceOf(
          ParoleAPIClient,
        );
      },
    );

    it("returns the offline client for an unsupported tenant", () => {
      const rootStore = new RootStore();
      rootStore.tenantStore.currentTenantId = "US_TN";

      expect(new ParoleStore(rootStore).apiClient).toBeInstanceOf(
        ParoleOfflineAPIClient,
      );
    });

    it.each([
      ["offline mode", isOfflineMode],
      ["demo mode", isDemoMode],
    ])(
      "returns the offline client for US_ID when in %s",
      (_description, mockedFn) => {
        vi.mocked(mockedFn).mockReturnValue(true);
        const rootStore = new RootStore();
        rootStore.tenantStore.currentTenantId = "US_ID";

        expect(new ParoleStore(rootStore).apiClient).toBeInstanceOf(
          ParoleOfflineAPIClient,
        );
      },
    );

    // currentTenantId is unset when ParoleStore is constructed in the real
    // app; it resolves later via auth/URL. apiClient must be a computed
    // getter, not a value frozen at construction, or every real user gets
    // stuck on the fixture client.
    it("reflects a currentTenantId that resolves after construction", () => {
      const rootStore = new RootStore();
      const paroleStore = new ParoleStore(rootStore);
      expect(paroleStore.apiClient).toBeInstanceOf(ParoleOfflineAPIClient);

      rootStore.tenantStore.currentTenantId = "US_ID";

      expect(paroleStore.apiClient).toBeInstanceOf(ParoleAPIClient);
    });
  });

  describe("hydration caches", () => {
    beforeEach(() => {
      vi.mocked(isOfflineMode).mockReturnValue(true);
      vi.mocked(isDemoMode).mockReturnValue(false);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function storeForTenant(tenantId: "US_CO" | "US_ID"): ParoleStore {
      const rootStore = new RootStore();
      rootStore.tenantStore.currentTenantId = tenantId;
      return new ParoleStore(rootStore);
    }

    it("fetches the docket once and serves later calls from the cache", async () => {
      const hearingsSpy = vi.spyOn(
        ParoleOfflineAPIClient.prototype,
        "hearings",
      );
      const paroleStore = storeForTenant("US_CO");

      await paroleStore.populateHearings();
      await paroleStore.populateHearings();

      expect(hearingsSpy).toHaveBeenCalledTimes(1);
      expect(paroleStore.hearings).toEqual(paroleHearingsFixtureByState.US_CO);
    });

    // An empty docket is a real result, not a cache miss. A truthiness check
    // in populateHearings would refetch it on every return trip.
    it("caches an empty docket", async () => {
      const hearingsSpy = vi
        .spyOn(ParoleOfflineAPIClient.prototype, "hearings")
        .mockResolvedValue([]);
      const paroleStore = storeForTenant("US_CO");

      await paroleStore.populateHearings();
      await paroleStore.populateHearings();

      expect(hearingsSpy).toHaveBeenCalledTimes(1);
      expect(paroleStore.hearings).toEqual([]);
    });

    it("fetches each case profile once, keyed by DOC id", async () => {
      const caseDetailSpy = vi.spyOn(
        ParoleOfflineAPIClient.prototype,
        "caseDetail",
      );
      const paroleStore = storeForTenant("US_CO");
      const [firstDocId, secondDocId] = Object.keys(
        paroleCasesFixtureByState.US_CO,
      );

      await paroleStore.populateCaseDetail(firstDocId);
      await paroleStore.populateCaseDetail(firstDocId);
      await paroleStore.populateCaseDetail(secondDocId);

      expect(caseDetailSpy).toHaveBeenCalledTimes(2);
      expect([...paroleStore.caseDetailsByDocId.keys()]).toEqual([
        firstDocId,
        secondDocId,
      ]);
    });

    it("drops both caches when the user's identity changes", async () => {
      const paroleStore = storeForTenant("US_CO");
      paroleStore.rootStore.userStore.user = { email: "user@example.com" };
      const [docId] = Object.keys(paroleCasesFixtureByState.US_CO);

      await paroleStore.populateHearings();
      await paroleStore.populateCaseDetail(docId);

      // e.g. switching to an impersonated user
      paroleStore.rootStore.userStore.user = {
        email: "impersonated@example.com",
      };

      expect(paroleStore.hearings).toBeUndefined();
      expect(paroleStore.caseDetailsByDocId.size).toBe(0);
    });

    // Auth0 rehydrates the app_metadata claim shortly after login: a new user
    // object with new nested references but identical content. A reference
    // comparison would drop a filled cache on every login.
    it("keeps both caches when the user object is replaced with identical content", async () => {
      const paroleStore = storeForTenant("US_CO");
      const identicalUser = () => ({
        email: "user@example.com",
        "https://dashboard.recidiviz.org/app_metadata": { stateCode: "US_CO" },
      });
      paroleStore.rootStore.userStore.user = identicalUser();

      await paroleStore.populateHearings();

      paroleStore.rootStore.userStore.user = identicalUser();

      expect(paroleStore.hearings).toBeDefined();
    });

    // A tenant switch mid-flight must not let the previous state's response
    // land in the cache the new tenant reads from. The docket fetch takes
    // seconds, so this window is wide in practice.
    it("discards a docket fetch that resolves after a tenant change", async () => {
      let resolveUsCo: (hearings: Array<ParoleHearing>) => void = () => {
        throw new Error("hearings() was never called");
      };
      const hearingsSpy = vi
        .spyOn(ParoleOfflineAPIClient.prototype, "hearings")
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveUsCo = resolve;
            }),
        );
      const paroleStore = storeForTenant("US_CO");

      const populated = paroleStore.populateHearings();
      paroleStore.rootStore.tenantStore.currentTenantId = "US_ID";
      resolveUsCo(paroleHearingsFixtureByState.US_CO);
      await populated;

      expect(hearingsSpy).toHaveBeenCalledTimes(2);
      expect(paroleStore.hearings).toEqual(paroleHearingsFixtureByState.US_ID);
    });

    it("discards a case profile fetch that resolves after a tenant change", async () => {
      const [usCoDocId] = Object.keys(paroleCasesFixtureByState.US_CO);
      let resolveUsCo: (caseDetail: ParoleCase) => void = () => {
        throw new Error("caseDetail() was never called");
      };
      vi.spyOn(ParoleOfflineAPIClient.prototype, "caseDetail")
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveUsCo = resolve;
            }),
        )
        .mockResolvedValueOnce(paroleCasesFixtureByState.US_ID[usCoDocId]);
      const paroleStore = storeForTenant("US_CO");

      const populated = paroleStore.populateCaseDetail(usCoDocId);
      paroleStore.rootStore.tenantStore.currentTenantId = "US_ID";
      resolveUsCo(paroleCasesFixtureByState.US_CO[usCoDocId]);
      await populated;

      expect(paroleStore.caseDetailsByDocId.get(usCoDocId)).toEqual(
        paroleCasesFixtureByState.US_ID[usCoDocId],
      );
    });

    // DOC ids are unique within a state, not across states, so a cache that
    // outlived a tenant switch would serve one state's case profile to another.
    it("drops both caches when the tenant changes", async () => {
      const paroleStore = storeForTenant("US_CO");
      const [docId] = Object.keys(paroleCasesFixtureByState.US_CO);

      await paroleStore.populateHearings();
      await paroleStore.populateCaseDetail(docId);

      paroleStore.rootStore.tenantStore.currentTenantId = "US_ID";

      expect(paroleStore.hearings).toBeUndefined();
      expect(paroleStore.caseDetailsByDocId.size).toBe(0);
    });
  });
});
