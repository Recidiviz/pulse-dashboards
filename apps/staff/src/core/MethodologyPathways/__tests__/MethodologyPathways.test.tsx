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

import { useLocation } from "react-router-dom";
import { Mock } from "vitest";

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

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useLocation: vi.fn(),
}));
vi.mock("../../../components/StoreProvider");
vi.mock("../../content/page/default.ts");
vi.mock("../../content/page/us_id.ts");
vi.mock("../../content/metric/default.ts");
vi.mock("../../content/metric/us_id.ts");

describe("MethodologyPathways", () => {
  beforeEach(() => {
    // @ts-expect-error
    vi.mocked(useLocation).mockReturnValue({
      pathname: "/methodology/system",
    });
  });

  describe("when the tenant is US_ID", () => {
    const allowedNavigation: Record<string, Array<string>> = {
      system: ["prison", "supervision"],
      prison: ["projectedCountOverTime"],
      supervision: [],
      supervisionToPrison: ["countOverTime"],
      supervisionToLiberty: [],
    };

    beforeEach(() => {
      (useRootStore as Mock).mockReturnValue({
        userStore: {
          userAllowedNavigation: allowedNavigation,
        },
        currentTenantId: "US_ID",
      });
    });

    describe("TOC links", () => {
      // @ts-expect-error
      const { pageCopy } = getMethodologyCopy("US_ID").system;

      it.each(allowedNavigation.system)(
        "renders the TOC link for %s",
        (pageId) => {
          const { getByRole } = render(<MethodologyPathways />);
          expect(
            getByRole("link", { name: pageCopy[pageId].title }),
          ).toBeInTheDocument();
        },
      );

      const notAllowedNavigation = Object.keys(pageCopy).filter(
        (page) => !allowedNavigation.system.includes(page),
      );

      it.each(notAllowedNavigation)(
        "does not render the TOC link for %s",
        (pageId) => {
          const { queryByRole } = render(<MethodologyPathways />);
          expect(
            queryByRole("link", { name: pageCopy[pageId].title }),
          ).toBeNull();
        },
      );
    });

    describe.each(allowedNavigation.system)(
      "Methodology blocks for %s",
      (pageId) => {
        // @ts-ignore
        const { metricCopy, pageCopy } = getMethodologyCopy("US_ID").system;
        it("renders the methodology block", () => {
          const { getByRole } = render(<MethodologyPathways />);
          expect(
            getByRole("heading", { name: pageCopy[pageId].title }),
          ).toBeInTheDocument();
        });

        const allowedSections = allowedNavigation[pageId];
        const allowedMetrics = Object.keys(metricCopy).filter(
          (metricId) =>
            allowedSections.includes(
              getSectionIdForMetric(metricId as MetricId),
            ) &&
            getMetricIdsForPage(pageId as PathwaysPage).includes(
              metricId as MetricId,
            ),
        );

        it.each(allowedMetrics)(
          "renders the methodology block for %s",
          (metricId) => {
            const { getByRole } = render(<MethodologyPathways />);
            expect(
              getByRole("heading", { name: metricCopy[metricId].title }),
            ).toBeInTheDocument();
          },
        );

        const notAllowedMetrics = Object.keys(metricCopy).filter(
          (metricId) =>
            !allowedSections.includes(
              getSectionIdForMetric(metricId as MetricId),
            ) &&
            getMetricIdsForPage(pageId as PathwaysPage).includes(
              metricId as MetricId,
            ),
        );

        it.each(notAllowedMetrics)(
          "does not render the methodology block for %s",
          (metricId) => {
            const { queryByRole } = render(<MethodologyPathways />);
            expect(
              queryByRole("heading", { name: metricCopy[metricId].title }),
            ).toBeNull();
          },
        );

        it("does not render the methodology blocks for other pages", () => {
          const notAllowedPages = Object.keys(pageCopy).filter(
            (page) => !allowedNavigation.system.includes(page),
          );
          const { queryByRole } = render(<MethodologyPathways />);
          notAllowedPages.forEach((otherPageId) => {
            expect(
              queryByRole("heading", { name: pageCopy[otherPageId].title }),
            ).toBeNull();
          });
          expect.hasAssertions();
        });
      },
    );
  });
});
