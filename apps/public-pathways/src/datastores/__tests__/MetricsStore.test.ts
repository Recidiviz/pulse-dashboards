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

import downloadjs from "downloadjs";
import { autorun, when } from "mobx";

import { isHydrated } from "~hydration-utils";
import {
  downloadChartAsData,
  OverTimeMetric,
  PATHWAYS_SECTIONS,
  type PathwaysSection,
  SnapshotMetric,
} from "~shared-pathways";

import FiltersStore from "../FiltersStore";
import MetricsStore from "../MetricsStore";
import type { RootStore } from "../RootStore";

vi.mock("~shared-pathways", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~shared-pathways")>();
  return {
    ...actual,
    downloadChartAsData: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("downloadjs", () => ({
  default: vi.fn(),
}));

const mockRootStore = {
  currentTenantId: "US_NY",
  section: PATHWAYS_SECTIONS["countOverTime"],
  userStore: {
    getTokenSilently: vi.fn().mockResolvedValue("test-token"),
  },
} as unknown as RootStore;
mockRootStore.filtersStore = new FiltersStore({
  rootStore: mockRootStore,
});

describe("MetricsStore", () => {
  let metricsStore: MetricsStore;

  beforeEach(() => {
    fetchMock.mockResponse(JSON.stringify({ data: [], metadata: {} }));
    metricsStore = new MetricsStore({ rootStore: mockRootStore });
    mockRootStore.metricsStore = metricsStore;
  });

  it("has page set to prison", () => {
    expect(metricsStore.page).toBe("prison");
  });

  it("has section defaulting to countOverTime", () => {
    expect(metricsStore.section).toBe(PATHWAYS_SECTIONS["countOverTime"]);
  });

  it("has currentTenantId set to US_NY", () => {
    expect(metricsStore.currentTenantId).toBe("US_NY");
  });

  it("has filtersStore with default monthRange", () => {
    expect(metricsStore.filtersStore.monthRange).toBe(6);
  });

  it("has default filter values", () => {
    expect(metricsStore.filters.timePeriod).toEqual(["6"]);
    expect(metricsStore.filters.facility).toEqual(["ALL"]);
    expect(metricsStore.filters.sex).toEqual(["ALL"]);
    expect(metricsStore.filters.race).toEqual(["ALL"]);
  });

  describe("metrics", () => {
    it("has prisonPopulationOverTime as an OverTimeMetric", () => {
      expect(metricsStore.prisonPopulationOverTime).toBeInstanceOf(
        OverTimeMetric,
      );
    });

    it.each([
      "prisonFacilityPopulation",
      "prisonPopulationByRace",
      "prisonPopulationByAgeGroup",
      "prisonPopulationByGender",
      "prisonPopulationBySex",
      "prisonPopulationByEthnicity",
      "prisonPopulationBySentenceLengthMin",
      "prisonPopulationBySentenceLengthMax",
    ] as const)("%s is a SnapshotMetric", (metricName) => {
      expect(
        metricsStore[metricName as keyof typeof metricsStore],
      ).toBeInstanceOf(SnapshotMetric);
    });
  });

  describe("map", () => {
    it("has 16 entries", () => {
      expect(Object.keys(metricsStore.map)).toHaveLength(16);
    });

    it("maps each section to a metric", () => {
      const expectedSections = [
        "countOverTime",
        "countByLocation",
        "countByRace",
        "countByAgeGroup",
        "countByGender",
        "countBySex",
        "countByEthnicity",
        "countBySentenceLengthMin",
        "countBySentenceLengthMax",
        "countByChargeCountyCode",
        "countByOffenseType",
        "countByChargeDescription",
        "countByAdmissionReason",
        "countByReligion",
        "countByMaritalStatus",
        "countByTimeAtFacility",
      ];

      expectedSections.forEach((section) => {
        expect(metricsStore.map[PATHWAYS_SECTIONS[section]]).toBeDefined();
      });
    });

    it("maps countOverTime to an OverTimeMetric", () => {
      expect(
        metricsStore.map[PATHWAYS_SECTIONS["countOverTime"]],
      ).toBeInstanceOf(OverTimeMetric);
    });

    it("maps countByLocation to a SnapshotMetric", () => {
      expect(
        metricsStore.map[PATHWAYS_SECTIONS["countByLocation"]],
      ).toBeInstanceOf(SnapshotMetric);
    });
  });

  describe("current", () => {
    it("returns an OverTimeMetric by default", () => {
      expect(metricsStore.current).toBeInstanceOf(OverTimeMetric);
    });

    it("falls back to prisonPopulationOverTime for unknown sections", () => {
      mockRootStore.section = "nonExistentSection" as PathwaysSection;
      expect(metricsStore.current).toBeInstanceOf(OverTimeMetric);
    });
  });

  describe("download", () => {
    beforeEach(() => {
      mockRootStore.section = PATHWAYS_SECTIONS["countOverTime"];
      vi.mocked(downloadChartAsData).mockClear();
    });

    it("strips the rolling average and renames Population in OverTimeMetric downloads", async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          data: [
            { year: 2022, month: 1, count: 1000, avg90day: 1000 },
            { year: 2022, month: 2, count: 2000, avg90day: 1500 },
            { year: 2022, month: 3, count: 3000, avg90day: 2000 },
          ],
          metadata: { lastUpdated: "2022-04-01" },
        }),
      );

      const dispose = autorun(() => metricsStore.current);
      const metric = metricsStore.current as OverTimeMetric;
      metric.hydrate();
      await when(() => isHydrated(metric));

      await metricsStore.download();

      expect(downloadChartAsData).toHaveBeenCalledOnce();
      const { fileContents } = vi.mocked(downloadChartAsData).mock.calls[0][0];
      const rows = fileContents[0]?.chartDatasets[0].data as Record<
        string,
        number
      >[];

      expect(rows).toEqual([
        { "NYS DOCCS Population Under Custody": 1000 },
        { "NYS DOCCS Population Under Custody": 2000 },
        { "NYS DOCCS Population Under Custody": 3000 },
      ]);

      dispose();
    });
  });

  describe("downloadIndividualLevelData", () => {
    const BASE_URL = "http://localhost:5000";

    beforeEach(() => {
      vi.stubEnv("VITE_PUBLIC_PATHWAYS_API_URL_BASE", BASE_URL);
      vi.mocked(downloadjs).mockClear();
    });

    describe("bulk export (snapshotDate is null)", () => {
      it("requests the bulk endpoint and downloads using the filename from the Content-Disposition header", async () => {
        fetchMock.mockResponse("fake zip contents", {
          headers: {
            "Content-Disposition":
              'attachment; filename="us_ny_individual_level_data_last_5_years_2022-08-03.zip"',
          },
        });

        await metricsStore.downloadIndividualLevelData(null);

        expect(fetchMock.mock.calls[0][0]).toEqual(
          `${BASE_URL}/public_pathways/US_NY/PrisonPopulationIndividualLevelBulk`,
        );
        expect(downloadjs).toHaveBeenCalledOnce();
        const [blob, filename] = vi.mocked(downloadjs).mock.calls[0];
        expect(filename).toBe(
          "us_ny_individual_level_data_last_5_years_2022-08-03.zip",
        );
        await expect((blob as Blob).text()).resolves.toBe("fake zip contents");
      });

      it("falls back to a default filename when Content-Disposition is missing", async () => {
        fetchMock.mockResponse("fake zip contents");

        await metricsStore.downloadIndividualLevelData(null);

        const [, filename] = vi.mocked(downloadjs).mock.calls[0];
        expect(filename).toBe("individual_level_data_last_5_years.zip");
      });
    });

    describe("single snapshot (snapshotDate is given)", () => {
      it("requests the snapshot endpoint with year/month query params and downloads using the filename from the Content-Disposition header", async () => {
        fetchMock.mockResponse("fake csv contents", {
          headers: {
            "Content-Disposition":
              'attachment; filename="us_ny_individual_level_data_2021-12-01.csv"',
          },
        });

        await metricsStore.downloadIndividualLevelData(new Date(2021, 11, 15));

        expect(fetchMock.mock.calls[0][0]).toEqual(
          `${BASE_URL}/public_pathways/US_NY/PrisonPopulationIndividualLevel?year=2021&month=12`,
        );
        const [blob, filename] = vi.mocked(downloadjs).mock.calls[0];
        expect(filename).toBe("us_ny_individual_level_data_2021-12-01.csv");
        await expect((blob as Blob).text()).resolves.toBe("fake csv contents");
      });

      it("falls back to a default filename when Content-Disposition is missing", async () => {
        fetchMock.mockResponse("fake csv contents");

        await metricsStore.downloadIndividualLevelData(new Date(2021, 11, 15));

        const [, filename] = vi.mocked(downloadjs).mock.calls[0];
        expect(filename).toBe("individual_level_data.csv");
      });
    });

    it("rejects and does not call downloadjs when the response is not ok", async () => {
      fetchMock.mockResponse(JSON.stringify({ message: "boom" }), {
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        metricsStore.downloadIndividualLevelData(null),
      ).rejects.toThrow(
        'Fetching file from API failed.\nStatus: 500 - Internal Server Error\nErrors: "boom"',
      );

      expect(downloadjs).not.toHaveBeenCalled();
    });
  });
});
