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

import { act, fireEvent, render } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { vi } from "vitest";

import { defaultPathwaysTheme } from "../../PathwaysTheme";
import type { SnapshotDataPoint } from "../PopulationSnapshotChart";
import PopulationSnapshotChart from "../PopulationSnapshotChart";

vi.mock("semiotic", () => ({
  ResponsiveOrdinalFrame: () => <div data-testid="mock-ordinal-frame" />,
}));

function makeData(count: number): SnapshotDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    accessorValue: `val-${i}`,
    accessorLabel: `Label ${i}`,
    tooltipLabel: `Tooltip ${i}`,
    value: String(Math.round(Math.random() * 100)),
  }));
}

const SCROLL_THRESHOLD = 20;

const defaultProps = {
  metricId: "test-metric",
  title: "Test Chart",
  accessor: "district",
  isRate: false,
  isHorizontal: false,
  rotateLabels: false,
  isGeographic: false,
  pickedId: ["ALL"],
  dataSeries: [],
};

function renderChart(dataCount: number) {
  return render(
    <ThemeProvider theme={defaultPathwaysTheme}>
      <PopulationSnapshotChart {...defaultProps} data={makeData(dataCount)} />
    </ThemeProvider>,
  );
}

describe("PopulationSnapshotChart scroll behavior", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 400;
      },
    });
  });

  describe("when data count is at or below the scroll threshold", () => {
    it("does not render the scroll layout", () => {
      const { container } = renderChart(SCROLL_THRESHOLD);
      expect(container.querySelector("svg")).toBeNull();
    });
  });

  describe("when data count exceeds the scroll threshold", () => {
    const DATA_COUNT = 30;

    it("renders the scroll layout with a sticky axis", () => {
      const { container } = renderChart(DATA_COUNT);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.querySelectorAll("text").length).toBeGreaterThan(0);
    });

    it("starts with zero scroll offset", () => {
      const { container } = renderChart(DATA_COUNT);
      const scrollContent = container.querySelector(
        "[style*='translateX']",
      ) as HTMLElement;
      expect(scrollContent).not.toBeNull();
      expect(scrollContent.style.transform).toBe("translateX(-0px)");
    });

    describe("wheel scrolling", () => {
      function getScrollWrapper(container: HTMLElement) {
        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        return scrollContent.parentElement as HTMLElement;
      }

      it("scrolls right on vertical wheel down", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaY: 100, deltaX: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-100px)");
      });

      it("scrolls using deltaX when it exceeds deltaY", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaY: 10, deltaX: 50 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-50px)");
      });

      it("clamps scroll offset to zero (cannot scroll left past start)", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaY: -200, deltaX: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-0px)");
      });

      it("clamps scroll offset to max (cannot scroll past end)", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaY: 99999, deltaX: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        // scrollWidth = 30 * 28 + 40 + 50 = 930, clientWidth = 400, max = 530
        expect(scrollContent.style.transform).toBe("translateX(-530px)");
      });

      it("accumulates scroll from multiple wheel events", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaY: 50, deltaX: 0 });
        fireEvent.wheel(scrollWrapper, { deltaY: 75, deltaX: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-125px)");
      });
    });

    describe("keyboard navigation scrolling", () => {
      function getChartWrapper(container: HTMLElement) {
        // ChartWrapper is the direct child of the [role="figure"] element
        return container.querySelector("[role='figure'] > div") as HTMLElement;
      }

      function dispatchArrow(el: HTMLElement, key: "ArrowRight" | "ArrowLeft") {
        el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      }

      it("scrolls to keep the focused bar visible on ArrowRight", () => {
        const { container } = renderChart(DATA_COUNT);
        const chartWrapper = getChartWrapper(container);

        act(() => {
          for (let i = 0; i < 15; i++) {
            dispatchArrow(chartWrapper, "ArrowRight");
          }
        });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        const offset = parseFloat(
          scrollContent.style.transform.replace(/[^0-9.-]/g, ""),
        );
        expect(Math.abs(offset)).toBeGreaterThan(0);
      });

      it("scrolls back on ArrowLeft after navigating right", () => {
        const { container } = renderChart(DATA_COUNT);
        const chartWrapper = getChartWrapper(container);

        act(() => {
          for (let i = 0; i < 20; i++) {
            dispatchArrow(chartWrapper, "ArrowRight");
          }
        });

        const afterRight = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        const offsetRight = parseFloat(
          afterRight.style.transform.replace(/[^0-9.-]/g, ""),
        );

        act(() => {
          for (let i = 0; i < 20; i++) {
            dispatchArrow(chartWrapper, "ArrowLeft");
          }
        });

        const afterLeft = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        const offsetLeft = parseFloat(
          afterLeft.style.transform.replace(/[^0-9.-]/g, ""),
        );

        expect(Math.abs(offsetRight)).toBeGreaterThan(0);
        expect(Math.abs(offsetLeft)).toBeLessThan(Math.abs(offsetRight));
      });

      it("clamps keyboard nav index at first bar", () => {
        const { container } = renderChart(DATA_COUNT);
        const chartWrapper = getChartWrapper(container);

        act(() => {
          dispatchArrow(chartWrapper, "ArrowLeft");
          dispatchArrow(chartWrapper, "ArrowLeft");
        });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-0px)");
      });

      it("clamps keyboard nav index at last bar", () => {
        const { container } = renderChart(DATA_COUNT);
        const chartWrapper = getChartWrapper(container);

        act(() => {
          for (let i = 0; i < DATA_COUNT + 10; i++) {
            dispatchArrow(chartWrapper, "ArrowRight");
          }
        });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        const offset = parseFloat(
          scrollContent.style.transform.replace(/[^0-9.-]/g, ""),
        );
        // Max scroll is 530
        expect(Math.abs(offset)).toBeLessThanOrEqual(530);
      });

      it("ignores non-arrow keys", () => {
        const { container } = renderChart(DATA_COUNT);
        const chartWrapper = getChartWrapper(container);

        act(() => {
          chartWrapper.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
          );
          chartWrapper.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
          );
          chartWrapper.dispatchEvent(
            new KeyboardEvent("keydown", { key: "a", bubbles: true }),
          );
        });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-0px)");
      });
    });
  });
});
