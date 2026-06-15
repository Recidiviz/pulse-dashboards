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

import { render, screen } from "@testing-library/react";
import { useRef } from "react";

import { ChartWrapper } from "../ChartWrapper";

describe("ChartWrapper", () => {
  it("renders children inside the wrapper", () => {
    render(
      <ChartWrapper>
        <div data-testid="chart-child">child</div>
      </ChartWrapper>,
    );
    expect(screen.getByTestId("chart-child")).toBeInTheDocument();
  });

  it("forwards className to the wrapper", () => {
    const { container } = render(
      <ChartWrapper className="my-wrapper">
        <div>child</div>
      </ChartWrapper>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "my-wrapper",
    );
  });

  it("exposes the underlying DOM node through forwardRef", () => {
    let captured: HTMLDivElement | null = null;
    const Probe = () => {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <ChartWrapper
          ref={(node) => {
            ref.current = node;
            captured = node;
          }}
        >
          <span>inner</span>
        </ChartWrapper>
      );
    };
    render(<Probe />);
    expect(captured).not.toBeNull();
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });
});
