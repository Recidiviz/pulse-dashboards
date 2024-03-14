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
import RootStore from "..";
import type AnalyticsStore from "../AnalyticsStore";

describe("AnalyticsStore", () => {
  let analyticsStore: AnalyticsStore;

  beforeEach(() => {
    vi.resetModules();
  });

  const mockRootStore = {
    isImpersonating: false,
    userStore: {
      isRecidivizUser: false,
    },
  } as typeof RootStore;

  async function getAnalyticsStoreWithEnv(
    env: string,
    authEnv: string,
    rootStore: typeof RootStore = mockRootStore,
  ) {
    vi.stubEnv("MODE", env);
    vi.stubEnv("VITE_AUTH_ENV", authEnv);
    const AnalyticsStore = (await import("../AnalyticsStore")).default;

    return new AnalyticsStore({ rootStore });
  }

  describe("Recidiviz user in staging", () => {
    beforeEach(async () => {
      const rootStore = {
        isImpersonating: false,
        userStore: {
          isRecidivizUser: true,
        },
      } as typeof RootStore;
      analyticsStore = await getAnalyticsStoreWithEnv(
        "staging",
        "staging",
        rootStore,
      );
    });

    it("disables analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeTrue();
    });

    it("does not call track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).not.toHaveBeenCalled();
    });
  });

  describe("Recidiviz user in production", () => {
    beforeEach(async () => {
      const rootStore = {
        isImpersonating: false,
        userStore: {
          isRecidivizUser: true,
        },
      } as typeof RootStore;
      analyticsStore = await getAnalyticsStoreWithEnv(
        "production",
        "production",
        rootStore,
      );
    });

    it("disables analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeTrue();
    });

    it("does not call track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).not.toHaveBeenCalled();
    });
  });

  describe("Impersonator", () => {
    beforeEach(async () => {
      const rootStore = {
        isImpersonating: true,
        userStore: {
          isRecidivizUser: false,
        },
      } as typeof RootStore;
      analyticsStore = await getAnalyticsStoreWithEnv(
        "production",
        "production",
        rootStore,
      );
    });

    it("disables analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeTrue();
    });

    it("does not call track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).not.toHaveBeenCalled();
    });
  });

  describe("Demo mode", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv("staging", "demo");
    });

    it("disables analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeTrue();
    });

    it("does not call track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).not.toHaveBeenCalled();
    });
  });

  describe("Development environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv(
        "development",
        "development",
      );
    });

    it("disables analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeTrue();
    });

    it("does not call track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).not.toHaveBeenCalled();
    });
  });

  describe("Test environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv("test", "test");
    });

    it("disables analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeTrue();
    });

    it("does not call track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).not.toHaveBeenCalled();
    });
  });

  describe("Staging environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv("staging", "staging");
    });

    it("does not disable analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeFalse();
    });

    it("does call analytics to track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).toHaveBeenCalled();
    });
  });

  describe("Production environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv(
        "production",
        "production",
      );
    });

    it("does not disable analytics", () => {
      expect(analyticsStore.disableAnalytics).toBeFalse();
    });

    it("does call analytics to track", () => {
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(window.analytics.track).toHaveBeenCalled();
    });
  });
});
