// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { runInAction } from "mobx";

import flags from "../../../flags";
import RootStore from "../../../RootStore";
import LibertyPopulationSnapshotMetric from "../../models/LibertyPopulationSnapshotMetric";
import OverTimeMetric from "../../models/OverTimeMetric";
import PathwaysMetric from "../../models/PathwaysMetric";
import PopulationProjectionOverTimeMetric from "../../models/PopulationProjectionOverTimeMetric";
import SupervisionPopulationSnapshotMetric from "../../models/SupervisionPopulationSnapshotMetric";
import VitalsMetrics from "../../models/VitalsMetrics";
import CoreStore from "..";

let coreStore: CoreStore;

jest.mock("../../../RootStore/UserStore", () => {
  return jest.fn().mockImplementation(() => ({
    user: {},
  }));
});

jest.mock("../../models/VitalsMetrics");
jest.mock("../../../RootStore/TenantStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentTenantId: "US_TN",
  }));
});

describe("MetricsStore", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
  });

  describe("metrics", () => {
    beforeEach(() => {
      flags.defaultMetricBackend = "OLD";
      // @ts-ignore
      flags.metricBackendOverrides = {};
    });

    it("has a reference to the vitals metrics", () => {
      expect(coreStore.metricsStore.vitals).toBeInstanceOf(VitalsMetrics);
    });

    it("has a reference to the projectedPrisonPopulationOverTime metric", () => {
      expect(
        coreStore.metricsStore.projectedPrisonPopulationOverTime
      ).toBeInstanceOf(PopulationProjectionOverTimeMetric);
    });

    it("defaults metrics to the old backend when no flags are configured", () => {
      expect(
        coreStore.metricsStore.libertyToPrisonPopulationByAgeGroup
      ).toBeInstanceOf(LibertyPopulationSnapshotMetric);
    });

    it("defaults metrics to the specified backend", () => {
      flags.defaultMetricBackend = "NEW";
      expect(
        coreStore.metricsStore.libertyToPrisonPopulationOverTime
      ).toBeInstanceOf(OverTimeMetric);
    });

    it("correctly overrides the metric backend", () => {
      flags.defaultMetricBackend = "NEW";
      flags.metricBackendOverrides = {
        supervisionToPrisonPopulationByOfficer: "OLD_WITH_DIFFING",
      };
      expect(
        coreStore.metricsStore.supervisionToPrisonPopulationByOfficer
      ).toBeInstanceOf(SupervisionPopulationSnapshotMetric);
    });
  });

  describe("all properties are the same on the old and new backends", () => {
    // set these values here instead of in a beforeAll/beforeEach so they can be used in the test
    // suite construction.
    flags.defaultMetricBackend = "OLD";
    coreStore = new CoreStore(RootStore);
    const pathwaysMetrics = Object.entries(
      Object.getOwnPropertyDescriptors(coreStore.metricsStore)
    )
      .map(([name, descriptor]) => {
        return [name, descriptor?.get?.call(coreStore.metricsStore)];
      })
      .filter(([_name, result]) => {
        return result instanceof PathwaysMetric;
      });

    it("has metrics", () => {
      expect(pathwaysMetrics.length).toBeGreaterThanOrEqual(10); // arbitrary number to ensure we found some
    });

    // create multiple tests of the format
    // MetricsStore › all properties are the same on the old and new backends › supervisionToPrisonPopulationByOfficer
    it.each(pathwaysMetrics)("%s", (_name, metric) => {
      const { newBackendMetric } = metric;
      if (newBackendMetric) {
        expect(newBackendMetric.id).toEqual(metric.id);
        expect(newBackendMetric.rootStore).toEqual(metric.rootStore);
        expect(newBackendMetric.tenantId).toEqual(metric.tenantId);
        expect(newBackendMetric.filters).toEqual(metric.filters);
        // Use !! to consider false and undefined equivalent
        expect(!!newBackendMetric?.enableMetricModeToggle).toEqual(
          !!metric.enableMetricModeToggle
        );
        expect(!!newBackendMetric.isHorizontal).toEqual(!!metric.isHorizontal);
        expect(!!newBackendMetric.isGeographic).toEqual(!!metric.isGeographic);
        expect(!!newBackendMetric.rotateLabels).toEqual(!!metric.rotateLabels);
        expect(!!newBackendMetric.accessorIsNotFilterType).toEqual(
          !!metric.accessorIsNotFilterType
        );
      }
    });
  });

  describe("when the tenantId changes", () => {
    it("fetches new vitals metrics for the new tenantId", () => {
      runInAction(() => {
        coreStore.tenantStore.currentTenantId = "US_ID";
        expect(coreStore.metricsStore.vitals).toBeInstanceOf(VitalsMetrics);
        expect(VitalsMetrics).toHaveBeenCalledWith({
          tenantId: "US_ID",
          sourceEndpoint: "vitals",
        });
      });
    });
  });
});
