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

import RootStore from "..";
import type AnalyticsStore from "../AnalyticsStore";

describe("AnalyticsStore", () => {
  let analyticsStore: AnalyticsStore;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockRootStore = {
    isImpersonating: false,
    userStore: {
      isRecidivizUser: false,
    },
  } as typeof RootStore;

  async function getAnalyticsStoreWithEnv(
    env: string,
    deploy_env: string,
    authEnv: string,
    rootStore: typeof RootStore = mockRootStore,
  ) {
    vi.stubEnv("MODE", env);
    vi.stubEnv("VITE_DEPLOY_ENV", deploy_env);
    vi.stubEnv("VITE_AUTH_ENV", authEnv);
    const AnalyticsStore = (await import("../AnalyticsStore")).default;

    return new AnalyticsStore({ rootStore, isTestMode: true });
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
        "staging",
        rootStore,
      );
    });

    it("should log analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeTrue();
    });

    it("does call track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).toHaveBeenCalled();
    });

    it("does call page", () => {
      const page = vi.spyOn(analyticsStore.segment, "page");
      analyticsStore.page("/foo");
      expect(page).toHaveBeenCalled();
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
        "production",
        rootStore,
      );
    });

    it("should log analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeTrue();
    });

    it("does not call track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).not.toHaveBeenCalled();
    });

    it("does not call page", () => {
      const page = vi.spyOn(analyticsStore.segment, "page");
      analyticsStore.page("/foo");
      expect(page).not.toHaveBeenCalled();
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
        "production",
        rootStore,
      );
    });

    it("should log analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeTrue();
    });

    it("does not call track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).not.toHaveBeenCalled();
    });

    it("does not call page", () => {
      const page = vi.spyOn(analyticsStore.segment, "page");
      analyticsStore.page("/foo");
      expect(page).not.toHaveBeenCalled();
    });
  });

  describe("Demo mode", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv(
        "staging",
        "staging",
        "demo",
      );
    });

    it("should log analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeTrue();
    });

    it("does not call track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).not.toHaveBeenCalled();
    });

    it("does not call page", () => {
      analyticsStore.page("/foo");
      expect(window.analytics.page).not.toHaveBeenCalled();
    });
  });

  describe("Development environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv(
        "development",
        "development",
        "development",
      );
    });

    it("logs analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeTrue();
    });

    it("does not call track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).not.toHaveBeenCalled();
    });

    it("does not call page", () => {
      const page = vi.spyOn(analyticsStore.segment, "page");
      analyticsStore.page("/foo");
      expect(page).not.toHaveBeenCalled();
    });
  });

  describe("Test environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv("test", "test", "test");
    });

    it("should log analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeTrue();
    });

    it("does not call track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).not.toHaveBeenCalled();
    });

    it("does not call page", () => {
      const page = vi.spyOn(analyticsStore.segment, "page");
      analyticsStore.page("/foo");
      expect(page).not.toHaveBeenCalled();
    });
  });

  describe("Staging environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv(
        "staging",
        "staging",
        "staging",
      );
    });

    it("does not log analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeFalse();
    });

    it("does call analytics to track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).toHaveBeenCalled();
    });

    it("does call analytics for pageview", () => {
      const page = vi.spyOn(analyticsStore.segment, "page");
      analyticsStore.page("/foo");
      expect(page).toHaveBeenCalledWith("/foo");
    });
  });

  describe("Production environment", () => {
    beforeEach(async () => {
      analyticsStore = await getAnalyticsStoreWithEnv(
        "production",
        "production",
        "production",
      );
    });

    it("does not log analytics", () => {
      expect(analyticsStore.shouldLogAnalyticsEvent).toBeFalse();
    });

    it("does call analytics to track", () => {
      const track = vi.spyOn(analyticsStore.segment, "track");
      analyticsStore.trackReferralFormViewed({
        justiceInvolvedPersonId: "",
        opportunityType: "LSU",
      });
      expect(track).toHaveBeenCalled();
    });

    it("does call analytics for pageview", () => {
      const page = vi.spyOn(analyticsStore.segment, "page");
      analyticsStore.page("/foo");
      expect(page).toHaveBeenCalledWith("/foo");
    });
  });
});
