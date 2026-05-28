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
import { ResponsiveOrdinalFrame } from "semiotic";
import { ThemeProvider } from "styled-components";
import { vi } from "vitest";

import { defaultPathwaysTheme } from "../../PathwaysTheme";
import {
  computeHorizontalLeftMargin,
  type SnapshotDataPoint,
} from "../PopulationSnapshotChart";
import PopulationSnapshotChart from "../PopulationSnapshotChart";

vi.mock("semiotic", () => ({
  ResponsiveOrdinalFrame: vi.fn(() => <div data-testid="mock-ordinal-frame" />),
}));

const MockFrame = vi.mocked(ResponsiveOrdinalFrame);

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
  dataSeries: [],
};

function renderChart(dataCount: number) {
  return render(
    <ThemeProvider theme={defaultPathwaysTheme}>
      <PopulationSnapshotChart {...defaultProps} data={makeData(dataCount)} />
    </ThemeProvider>,
  );
}

// Thresholds derived from the constants in computeHorizontalLeftMargin:
//   CHAR_WIDTH_PX = 7, LABEL_PADDING_PX = 16, MIN = 60, MAX = 220
describe("computeHorizontalLeftMargin", () => {
  function makeHorizontalData(labels: string[]): SnapshotDataPoint[] {
    return labels.map((label, i) => ({
      index: i,
      accessorValue: label,
      accessorLabel: label,
      tooltipLabel: label,
      value: "10",
    }));
  }

  it("clamps to MIN_MARGIN when labels are very short", () => {
    // "Hi" → 2 chars → 2*7+16 = 30, clamped to 60
    const margin = computeHorizontalLeftMargin(
      makeHorizontalData(["Hi", "Ok"]),
      undefined,
    );
    expect(margin).toBe(60);
  });

  it("computes margin proportional to the longest label", () => {
    // "Hello World" → 11 chars → 11*7+16 = 93
    const margin = computeHorizontalLeftMargin(
      makeHorizontalData(["Short", "Hello World"]),
      undefined,
    );
    expect(margin).toBe(93);
  });

  it("clamps to MAX_MARGIN when labels are very long", () => {
    // 32-char label → 32*7+16 = 240, clamped to 220
    const longLabel = "A".repeat(32);
    const margin = computeHorizontalLeftMargin(
      makeHorizontalData([longLabel]),
      undefined,
    );
    expect(margin).toBe(220);
  });

  it("applies the formatter before measuring length", () => {
    // Raw label is long, but formatter truncates it to 5 chars → 5*7+16=51, clamped to 60
    const margin = computeHorizontalLeftMargin(
      makeHorizontalData(["A very long label that would normally be wide"]),
      () => "Short",
    );
    expect(margin).toBe(60);
  });

  it("uses the formatter output, not the raw label, for margin calculation", () => {
    // Formatter doubles each label's length
    // "Hello" → 10 chars → 10*7+16 = 86
    const margin = computeHorizontalLeftMargin(
      makeHorizontalData(["Hello"]),
      (l) => l + l,
    );
    expect(margin).toBe(86);
  });

  it("returns MIN_MARGIN for an empty dataset (Math.max spread edge case)", () => {
    // Math.max(...[]) === -Infinity; the MIN clamp must rescue it
    expect(computeHorizontalLeftMargin([], undefined)).toBe(60);
  });

  it("handles undefined formatter the same as identity formatter", () => {
    const data = makeHorizontalData(["District One"]);
    // "District One" → 12 chars → 12*7+16 = 100
    expect(computeHorizontalLeftMargin(data, undefined)).toBe(100);
    expect(computeHorizontalLeftMargin(data, (l) => l)).toBe(100);
  });
});

describe("PopulationSnapshotChart horizontal margin integration", () => {
  beforeEach(() => {
    MockFrame.mockClear();
  });

  function renderHorizontalChart(labels: string[]) {
    const data: SnapshotDataPoint[] = labels.map((label, i) => ({
      index: i,
      accessorValue: label,
      accessorLabel: label,
      tooltipLabel: label,
      value: "10",
    }));
    return render(
      <ThemeProvider theme={defaultPathwaysTheme}>
        <PopulationSnapshotChart
          metricId="test"
          title="Test"
          accessor="district"
          isRate={false}
          isHorizontal
          rotateLabels={false}
          isGeographic={false}
          dataSeries={[]}
          data={data}
        />
      </ThemeProvider>,
    );
  }

  it("passes a smaller left margin for short labels than for long labels", () => {
    renderHorizontalChart(["Hi", "Ok"]);
    const shortMargin = (
      MockFrame.mock.lastCall?.[0] as { margin?: { left: number } }
    )?.margin?.left;

    MockFrame.mockClear();

    renderHorizontalChart(["A much longer district label"]);
    const longMargin = (
      MockFrame.mock.lastCall?.[0] as { margin?: { left: number } }
    )?.margin?.left;

    if (shortMargin === undefined || longMargin === undefined) {
      throw new Error("Expected both margins to be defined");
    }
    expect(longMargin).toBeGreaterThan(shortMargin);
  });

  it("passes the computed left margin, not the old hardcoded 135", () => {
    // "Hi" and "Ok" are 2 chars → clamped to MIN 60, well below the old 135
    renderHorizontalChart(["Hi", "Ok"]);
    const margin = (
      MockFrame.mock.lastCall?.[0] as { margin?: { left: number } }
    )?.margin?.left;
    expect(margin).toBe(60);
  });
});

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

      it("scrolls right on horizontal wheel", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaX: 100, deltaY: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-100px)");
      });

      it("ignores vertical-only wheel events", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaY: 100, deltaX: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-0px)");
      });

      it("scrolls using deltaX when it exceeds deltaY", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaX: 50, deltaY: 10 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-50px)");
      });

      it("clamps scroll offset to zero (cannot scroll left past start)", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaX: -200, deltaY: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        expect(scrollContent.style.transform).toBe("translateX(-0px)");
      });

      it("clamps scroll offset to max (cannot scroll past end)", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaX: 99999, deltaY: 0 });

        const scrollContent = container.querySelector(
          "[style*='translateX']",
        ) as HTMLElement;
        // scrollWidth = 30 * 28 + 40 + 50 = 930, clientWidth = 400, max = 530
        expect(scrollContent.style.transform).toBe("translateX(-530px)");
      });

      it("accumulates scroll from multiple wheel events", () => {
        const { container } = renderChart(DATA_COUNT);
        const scrollWrapper = getScrollWrapper(container);

        fireEvent.wheel(scrollWrapper, { deltaX: 50, deltaY: 0 });
        fireEvent.wheel(scrollWrapper, { deltaX: 75, deltaY: 0 });

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
