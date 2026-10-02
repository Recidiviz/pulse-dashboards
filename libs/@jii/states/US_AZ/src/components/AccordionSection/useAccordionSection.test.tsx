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

import { act, renderHook } from "@testing-library/react";

import {
  AccordionSectionProps,
  useAccordionSection,
} from "./useAccordionSection";

const accordionCopy = {
  panelOne: { header: "Panel one", content: "First answer" },
  panelTwo: { header: "Panel two", content: "Second answer" },
};

const sectionCopy = {
  header: "Common questions",
  openAllCopy: "Open all content",
  closeAllCopy: "Close all content",
};

function buildProps(
  overrides: Partial<AccordionSectionProps> = {},
): AccordionSectionProps {
  return { id: "dates-faq", accordionCopy, sectionCopy, ...overrides };
}

describe("initial state", () => {
  test("starts with every panel closed", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    expect(result.current.toggledPanels).toEqual({});
  });
});

describe("toggle", () => {
  test("opens a closed panel", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    act(() => result.current.toggle("panelOne"));

    expect(result.current.toggledPanels).toEqual({ panelOne: true });
  });

  test("closes an open panel", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    act(() => result.current.toggle("panelOne"));
    act(() => result.current.toggle("panelOne"));

    expect(result.current.toggledPanels).toEqual({ panelOne: false });
  });

  test("leaves other panels alone", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    act(() => result.current.toggle("panelOne"));
    act(() => result.current.toggle("panelTwo"));

    expect(result.current.toggledPanels).toEqual({
      panelOne: true,
      panelTwo: true,
    });
  });
});

describe("showOrHideAll", () => {
  test("offers to open all while any panel is closed", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    act(() => result.current.toggle("panelOne"));

    expect(result.current.showOrHideAll.buttonCopy).toBe(
      sectionCopy.openAllCopy,
    );
  });

  test("opens every panel", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    act(() => result.current.showOrHideAll.onButtonClick());

    expect(result.current.toggledPanels).toEqual({
      panelOne: true,
      panelTwo: true,
    });
  });

  test("offers to close all once every panel is open", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    act(() => result.current.showOrHideAll.onButtonClick());

    expect(result.current.showOrHideAll.buttonCopy).toBe(
      sectionCopy.closeAllCopy,
    );
  });

  test("closes every panel", () => {
    const { result } = renderHook(() => useAccordionSection(buildProps()));

    act(() => result.current.showOrHideAll.onButtonClick());
    act(() => result.current.showOrHideAll.onButtonClick());

    expect(result.current.toggledPanels).toEqual({});
  });
});
