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
import JSZip from "jszip";
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

// Real JSZip round-trips through jsdom's incomplete Blob/ArrayBuffer support
// unreliably (its ArrayBuffer instanceof check can fail purely due to how the
// test environment constructs buffers, unrelated to the code under test), so
// zip building is faked here. The fake stores whatever's passed to `.file()`
// verbatim and returns it from `generateAsync()`, letting tests assert on the
// exported file names/content without touching real zip binary handling.
type FakeZipEntry = {
  name: string;
  dir?: boolean;
  async: () => Promise<unknown>;
};
vi.mock("jszip", () => {
  class FakeJSZip {
    files: Record<string, unknown> = {};

    file(name: string, data: unknown) {
      this.files[name] = data;
      return this;
    }

    async generateAsync() {
      return this.files;
    }

    static loadAsync =
      vi.fn<
        (data: unknown) => Promise<{ files: Record<string, FakeZipEntry> }>
      >();
  }
  return { default: FakeJSZip };
});

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

    const METHODOLOGY_PDF_ENTRY =
      "New York State DOCCS Dashboard Methodology.pdf";

    // downloadjs's real signature doesn't overlap with the fake zip's plain
    // {filename: content} export shape, so extracting its mock call args
    // needs to go through `unknown` first.
    const lastDownloadjsCall = (): [Record<string, unknown>, string] =>
      vi.mocked(downloadjs).mock.calls[0] as unknown as [
        Record<string, unknown>,
        string,
      ];

    describe("bulk export (snapshotDate is null)", () => {
      beforeEach(() => {
        fetchMock.mockResponse("fake bulk export blob contents");
        vi.mocked(JSZip.loadAsync).mockResolvedValue({
          files: {
            "us_ny_individual_level_data_2024-04-01.csv": {
              name: "us_ny_individual_level_data_2024-04-01.csv",
              dir: false,
              async: async () => "a,b\n1,2",
            },
            "us_ny_individual_level_data_2024-05-01.csv": {
              name: "us_ny_individual_level_data_2024-05-01.csv",
              dir: false,
              async: async () => "a,b\n3,4",
            },
            // A directory entry, as real zips include for their contents'
            // parent folders; must be excluded from the flattened export.
            "some-folder/": {
              name: "some-folder/",
              dir: true,
              async: async () => "",
            },
          },
        } as unknown as Awaited<ReturnType<typeof JSZip.loadAsync>>);
      });

      it("requests the bulk endpoint and flattens its CSV entries into the export, alongside the methodology PDF", async () => {
        await metricsStore.downloadIndividualLevelData(null);

        expect(fetchMock.mock.calls[0][0]).toEqual(
          `${BASE_URL}/public_pathways/US_NY/PrisonPopulationIndividualLevelBulk`,
        );
        expect(downloadjs).toHaveBeenCalledOnce();
        const [exportFiles, exportFilename] = lastDownloadjsCall();
        expect(exportFilename).toBe("export_data.zip");

        expect(Object.keys(exportFiles).sort()).toEqual(
          [
            "us_ny_individual_level_data_2024-04-01.csv",
            "us_ny_individual_level_data_2024-05-01.csv",
            METHODOLOGY_PDF_ENTRY,
          ].sort(),
        );
        expect(exportFiles["us_ny_individual_level_data_2024-04-01.csv"]).toBe(
          "a,b\n1,2",
        );
        expect(exportFiles["us_ny_individual_level_data_2024-05-01.csv"]).toBe(
          "a,b\n3,4",
        );
      });

      it("still exports the CSVs, without the methodology PDF, when the methodology PDF fetch fails", async () => {
        fetchMock.mockResponseOnce("fake bulk export blob contents");
        fetchMock.mockResponseOnce("", {
          status: 404,
          statusText: "Not Found",
        });

        await metricsStore.downloadIndividualLevelData(null);

        const [exportFiles] = lastDownloadjsCall();
        expect(Object.keys(exportFiles).sort()).toEqual(
          [
            "us_ny_individual_level_data_2024-04-01.csv",
            "us_ny_individual_level_data_2024-05-01.csv",
          ].sort(),
        );
        expect(exportFiles).not.toHaveProperty(METHODOLOGY_PDF_ENTRY);
      });
    });

    describe("single snapshot (snapshotDate is given)", () => {
      it("requests the snapshot endpoint with year/month query params and zips the response using the filename from the Content-Disposition header, alongside the methodology PDF", async () => {
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
        const [exportFiles, exportFilename] = lastDownloadjsCall();
        expect(exportFilename).toBe("export_data.zip");

        expect(Object.keys(exportFiles).sort()).toEqual(
          [
            "us_ny_individual_level_data_2021-12-01.csv",
            METHODOLOGY_PDF_ENTRY,
          ].sort(),
        );
      });

      it("falls back to a default filename for the bundled export when Content-Disposition is missing", async () => {
        fetchMock.mockResponse("fake csv contents");

        await metricsStore.downloadIndividualLevelData(new Date(2021, 11, 15));

        const [exportFiles] = lastDownloadjsCall();
        expect(Object.keys(exportFiles)).toContain("individual_level_data.csv");
      });

      it("still exports the CSV, without the methodology PDF, when the methodology PDF fetch fails", async () => {
        fetchMock.mockResponseOnce("fake csv contents", {
          headers: {
            "Content-Disposition":
              'attachment; filename="us_ny_individual_level_data_2021-12-01.csv"',
          },
        });
        fetchMock.mockResponseOnce("", {
          status: 404,
          statusText: "Not Found",
        });

        await metricsStore.downloadIndividualLevelData(new Date(2021, 11, 15));

        const [exportFiles] = lastDownloadjsCall();
        expect(Object.keys(exportFiles)).toEqual([
          "us_ny_individual_level_data_2021-12-01.csv",
        ]);
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
