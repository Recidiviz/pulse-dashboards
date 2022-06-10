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

import React from "react";

import { useRootStore } from "../../../components/StoreProvider";
import { render } from "../../../testUtils";
import { getMethodologyCopy } from "../../content";
import { MetricId } from "../../models/types";
import {
  getMetricIdsForPage,
  getSectionIdForMetric,
  PathwaysPage,
} from "../../views";
import MethodologyPathways from "..";

jest.mock("react-router-dom", () => ({
  // @ts-ignore
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn().mockReturnValue({
    pathname: "/id-methodology/system",
  }),
}));
jest.mock("../../../components/StoreProvider");
jest.mock("../../content/page/default.ts");
jest.mock("../../content/page/us_id.ts");
jest.mock("../../content/metric/default.ts");
jest.mock("../../content/metric/us_id.ts");

describe("MethodologyPathways", () => {
  describe("when the tenant is US_ID", () => {
    const allowedNavigation = {
      system: ["prison", "supervision"],
      prison: ["projectedCountOverTime"],
      supervision: [],
      supervisionToPrison: ["countOverTime"],
      supervisionToLiberty: [],
    };

    beforeEach(() => {
      (useRootStore as jest.Mock).mockReturnValue({
        userStore: {
          userAllowedNavigation: allowedNavigation,
        },
        currentTenantId: "US_ID",
      });
    });

    describe("TOC links", () => {
      // @ts-ignore
      const { pageCopy } = getMethodologyCopy("US_ID").system;
      allowedNavigation.system.forEach((pageId: string) => {
        it(`renders the TOC link for ${pageId}`, () => {
          const { getByRole } = render(<MethodologyPathways />);
          expect(getByRole("link", { name: pageCopy[pageId].title }));
        });
      });

      const notAllowedNavigation = Object.keys(pageCopy).filter(
        (page) => !allowedNavigation.system.includes(page)
      );
      notAllowedNavigation.forEach((pageId: string) => {
        it(`does not render the TOC link for ${pageId}`, () => {
          const { queryByRole } = render(<MethodologyPathways />);
          expect(
            queryByRole("link", { name: pageCopy[pageId].title })
          ).toBeNull();
        });
      });
    });

    describe("Methodology blocks", () => {
      // @ts-ignore
      const { metricCopy, pageCopy } = getMethodologyCopy("US_ID").system;
      allowedNavigation.system.forEach((pageId: string) => {
        it(`renders the methodology block for page ${pageId}`, () => {
          const { getByRole } = render(<MethodologyPathways />);
          expect(getByRole("heading", { name: pageCopy[pageId].title }));
        });

        // @ts-ignore
        const allowedSections = allowedNavigation[pageId];
        const allowedMetrics = Object.keys(metricCopy).filter(
          (metricId) =>
            allowedSections.includes(
              getSectionIdForMetric(metricId as MetricId)
            ) &&
            getMetricIdsForPage(pageId as PathwaysPage).includes(
              metricId as MetricId
            )
        );

        allowedMetrics.forEach((metricId) => {
          it(`renders the methodology block for the ${pageId} page's metric ${metricId}`, () => {
            const { getByRole } = render(<MethodologyPathways />);
            expect(getByRole("heading", { name: metricCopy[metricId].title }));
          });
        });

        const notAllowedMetrics = Object.keys(metricCopy).filter(
          (metricId) =>
            !allowedSections.includes(
              getSectionIdForMetric(metricId as MetricId)
            ) &&
            getMetricIdsForPage(pageId as PathwaysPage).includes(
              metricId as MetricId
            )
        );
        notAllowedMetrics.forEach((metricId) => {
          it(`does not render the methodology block for the ${pageId} page's metric ${metricId}`, () => {
            const { queryByRole } = render(<MethodologyPathways />);
            expect(
              queryByRole("heading", { name: metricCopy[metricId].title })
            ).toBeNull();
          });
        });
      });

      const notAllowedPages = Object.keys(pageCopy).filter(
        (page) => !allowedNavigation.system.includes(page)
      );
      notAllowedPages.forEach((pageId: string) => {
        it(`does not render the methodology block for page ${pageId}`, () => {
          const { queryByRole } = render(<MethodologyPathways />);
          expect(
            queryByRole("heading", { name: pageCopy[pageId].title })
          ).toBeNull();
        });
      });
    });
  });
});
