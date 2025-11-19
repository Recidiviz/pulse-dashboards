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

import { render } from "@testing-library/react";
import React from "react";

import styles from "../../CoreConstants.module.scss";
import PercentDelta, { ROTATE_DOWN, ROTATE_UP } from "../PercentDelta";

describe("PercentDelta", () => {
  type PropTypes = {
    value?: number;
    width?: number;
    height?: number;
    improvesOnIncrease?: boolean;
  };

  const renderPercentDelta = ({
    value,
    width = 12,
    height = 10,
    improvesOnIncrease = false,
  }: PropTypes) => {
    return render(
      <PercentDelta
        value={value}
        width={width}
        height={height}
        improvesOnIncrease={improvesOnIncrease}
      />,
    );
  };

  const expected = {
    improvedOnIncrease: {
      color: styles.signalLinks,
      rotate: ROTATE_UP,
    },
    improvedOnDecrease: {
      color: styles.signalLinks,
      rotate: ROTATE_DOWN,
    },
    worsenedOnIncrease: {
      color: styles.crimsonDark,
      rotate: ROTATE_UP,
    },
    worsenedOnDecrease: {
      color: styles.crimsonDark,
      rotate: ROTATE_DOWN,
    },
  };

  it("sets the correct color and icon direction", () => {
    [
      [20, true, expected.improvedOnIncrease],
      [-60, true, expected.worsenedOnDecrease],
      [-5, false, expected.improvedOnDecrease],
      [80, false, expected.worsenedOnIncrease],
    ].forEach((testSetup) => {
      const [value, improvesOnIncrease, expectedProps]: any[] = testSetup;

      const { container } = renderPercentDelta({
        value,
        improvesOnIncrease,
      });
      const percentDelta = container.querySelector(
        ".PercentDelta",
      ) as HTMLElement;
      expect(percentDelta).toHaveStyle({ color: expectedProps.color });

      const icon = container.querySelector("svg");
      expect(icon?.getAttribute("fill")).toEqual(expectedProps.color);
      expect(icon?.getAttribute("transform")).toEqual(
        `rotate(${expectedProps.rotate})`,
      );
    });
  });

  it("does not render an icon when there is no change", () => {
    const { container } = renderPercentDelta({
      value: 0,
    });
    const percentDelta = container.querySelector(
      ".PercentDelta",
    ) as HTMLElement;
    expect(percentDelta).toHaveStyle({ color: styles.slate60 });

    const icon = container.querySelector("svg");
    expect(icon).not.toBeInTheDocument();
  });

  it("does not render an icon when the change is undefined", () => {
    const { container } = renderPercentDelta({
      value: undefined,
    });
    const percentDelta = container.querySelector(
      ".PercentDelta",
    ) as HTMLElement;
    expect(percentDelta).toHaveStyle({ color: styles.slate60 });

    const icon = container.querySelector("svg");
    expect(icon).not.toBeInTheDocument();
  });

  it("displays N/A when the change is undefined", () => {
    const { container } = renderPercentDelta({
      value: undefined,
    });
    const percentDeltaValue = container.querySelector(".PercentDelta__value");
    expect(percentDeltaValue).toHaveTextContent("N/A");
  });
});
