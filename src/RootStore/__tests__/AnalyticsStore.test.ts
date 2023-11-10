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
import AnalyticsStore from "../AnalyticsStore";

describe("AnalyticsStore", () => {
  const OLD_ENV = process.env;
  let analyticsStore: AnalyticsStore;

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  const mockRootStore = {
    isImpersonating: false,
    userStore: {
      isRecidivizUser: false,
    },
  } as typeof RootStore;

  function getAnalyticsStoreWithEnv(
    env: string,
    authEnv: string,
    rootStore: typeof RootStore = mockRootStore
  ) {
    process.env = Object.assign(process.env, {
      NODE_ENV: env,
      REACT_APP_AUTH_ENV: authEnv,
    });
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-shadow
    const AnalyticsStore = require("../AnalyticsStore").default;

    return new AnalyticsStore({ rootStore });
  }

  describe("Recidiviz user in staging", () => {
    beforeEach(() => {
      const rootStore = {
        isImpersonating: false,
        userStore: {
          isRecidivizUser: true,
        },
      } as typeof RootStore;
      analyticsStore = getAnalyticsStoreWithEnv(
        "staging",
        "staging",
        rootStore
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
    beforeEach(() => {
      const rootStore = {
        isImpersonating: false,
        userStore: {
          isRecidivizUser: true,
        },
      } as typeof RootStore;
      analyticsStore = getAnalyticsStoreWithEnv(
        "production",
        "production",
        rootStore
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
    beforeEach(() => {
      const rootStore = {
        isImpersonating: true,
        userStore: {
          isRecidivizUser: false,
        },
      } as typeof RootStore;
      analyticsStore = getAnalyticsStoreWithEnv(
        "production",
        "production",
        rootStore
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
    beforeEach(() => {
      analyticsStore = getAnalyticsStoreWithEnv("staging", "demo");
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
    beforeEach(() => {
      analyticsStore = getAnalyticsStoreWithEnv("development", "development");
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
    beforeEach(() => {
      analyticsStore = getAnalyticsStoreWithEnv("test", "test");
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
    beforeEach(() => {
      analyticsStore = getAnalyticsStoreWithEnv("staging", "staging");
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
    beforeEach(() => {
      analyticsStore = getAnalyticsStoreWithEnv("production", "production");
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
