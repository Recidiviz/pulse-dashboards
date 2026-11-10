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

import { FALLBACK_STRATEGY } from "../../constants";
import {
  buildPageLabelRegex,
  isFallbackStrategy,
  isLabelInRange,
} from "../pageLabel";

describe("buildPageLabelRegex", () => {
  it("matches common OCR footer forms for the configured page count", () => {
    const regex = buildPageLabelRegex(4);
    expect("1 of 4".match(regex)?.[1]).toBe("1");
    expect("2 oF 4".match(regex)?.[1]).toBe("2");
    expect("3 0f 4".match(regex)?.[1]).toBe("3");
    expect("5 of 4".match(regex)).toBeNull();
  });
});

describe("isFallbackStrategy", () => {
  it("detects the physical-order fallback strategy", () => {
    expect(isFallbackStrategy(FALLBACK_STRATEGY)).toBe(true);
    expect(isFallbackStrategy("footer")).toBe(false);
    expect(isFallbackStrategy(null)).toBe(false);
  });
});

describe("isLabelInRange", () => {
  it("accepts labels from 1 through totalPages inclusive", () => {
    expect(isLabelInRange(1, 4)).toBe(true);
    expect(isLabelInRange(4, 4)).toBe(true);
    expect(isLabelInRange(0, 4)).toBe(false);
    expect(isLabelInRange(5, 4)).toBe(false);
  });
});
