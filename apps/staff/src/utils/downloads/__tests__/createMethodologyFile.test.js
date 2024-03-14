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

import createMethodologyFile from "../createMethodologyFile";

vi.mock("../../../utils/i18nSettings");
describe("createMethodologyFile functions", () => {
  const mockChartId = "revocations_count";
  const mockChartTitle = "Revocations Count";
  const mockTimeWindowDescription = "20 November 2019 - 20 November 2020";
  const mockMethodologyTitle = "methodology header";
  const mockMethodology = "methodology body";
  const methodology = {
    [mockChartId]: [
      {
        title: mockMethodologyTitle,
        methodology: mockMethodology,
      },
    ],
  };
  const filters = "some filters text";
  const violation = "some violation text";
  const lastUpdatedOn = "4/6/2021";

  const nowSpy = vi.spyOn(Date, "now");

  beforeEach(() => {
    nowSpy.mockReturnValue(1605866733144);
  });

  it("should return methodology file for MO", () => {
    const actual = createMethodologyFile({
      chartTitle: mockChartTitle,
      timeWindowDescription: mockTimeWindowDescription,
      filters,
      methodologyContent: methodology[mockChartId],
      violation,
      lastUpdatedOn,
    });
    expect(actual.data).toBe(
      "Chart: Revocations Count\n" +
        "Dates: 20 November 2019 - 20 November 2020\n" +
        "Applied filters:\n" +
        "- some filters text\n" +
        "- some violation text\n" +
        "Data last updated on: 4/6/2021\n\n" +
        "Export Date: 11/20/2020\n\n" +
        "methodology header\n" +
        "methodology body\n\n",
    );
  });

  it("should remove markdown in the methodology body", () => {
    const methodologyWithMarkup = [
      {
        title: mockMethodologyTitle,
        methodology: `**${mockMethodology}**`,
      },
    ];
    const actual = createMethodologyFile({
      chartTitle: mockChartTitle,
      methodologyContent: methodologyWithMarkup,
    });

    expect(actual.data).toBe(
      "Chart: Revocations Count\n\n" +
        "Export Date: 11/20/2020\n\n" +
        "methodology header\n" +
        "methodology body\n\n",
    );
  });

  describe("when the headers are undefined", () => {
    it("should not insert the header line", () => {
      const methodologyWithoutHeader = {
        [mockChartId]: [
          {
            methodology: mockMethodology,
          },
        ],
      };
      const actual = createMethodologyFile({
        chartTitle: mockChartTitle,
        timeWindowDescription: mockTimeWindowDescription,
        filters,
        methodologyContent: methodologyWithoutHeader[mockChartId],
        violation,
      });
      expect(actual.data).toBe(
        "Chart: Revocations Count\n" +
          "Dates: 20 November 2019 - 20 November 2020\n" +
          "Applied filters:\n" +
          "- some filters text\n" +
          "- some violation text\n\n" +
          "Export Date: 11/20/2020\n\n" +
          "methodology body\n\n",
      );
    });
  });
});
