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

import { renderHook } from "@testing-library/react";
import tk from "timekeeper";

import { useSingleResidentContext } from "~@jii/data";

import { UsAzDisplayedDate } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";
import { useUsAzSingleResidentContext } from "../UsAzSingleResidentContext/UsAzSingleResidentContext";
import { useShowIONBanner } from "./useShowIONBanner";

vi.mock(
  "../UsAzSingleResidentContext/UsAzSingleResidentContext",
  async (importOriginal) => ({
    ...(await importOriginal()),
    useUsAzSingleResidentContext: vi.fn(),
  }),
);

vi.mock("~@jii/data", async (importOriginal) => ({
  ...(await importOriginal()),
  useSingleResidentContext: vi.fn(),
}));

function buildDisplayedDate(
  overrides: Partial<UsAzDisplayedDate> & Pick<UsAzDisplayedDate, "date">,
): UsAzDisplayedDate {
  return {
    dateKey: "tprDate",
    isTentative: false,
    ...overrides,
  };
}

function mockDisplayedDates(displayedDates: UsAzDisplayedDate[]) {
  vi.mocked(useUsAzSingleResidentContext).mockReturnValue({
    displayedDates,
  } as ReturnType<typeof useUsAzSingleResidentContext>);
}

function mockIonReferralFlag(enabled: boolean) {
  vi.mocked(useSingleResidentContext).mockReturnValue({
    residentFlags: enabled ? { usAzIonReferral: true } : {},
  } as ReturnType<typeof useSingleResidentContext>);
}

describe("useShowIONBanner", () => {
  // frozen "today" used throughout the 11-month-boundary tests below
  beforeEach(() => {
    tk.freeze(new Date("2024-01-15"));
    // the feature flag is enabled by default so the date-based tests below
    // exercise the underlying eligibility logic; see the "feature flag"
    // describe block for coverage of the flag itself
    mockIonReferralFlag(true);
  });
  afterEach(() => tk.reset());

  test("is false when there are no dates", () => {
    mockDisplayedDates([]);

    const { result } = renderHook(() => useShowIONBanner());

    expect(result.current).toBeFalse();
  });

  test("is false when all dates are tentative", () => {
    mockDisplayedDates([
      buildDisplayedDate({ date: new Date("2024-01-20"), isTentative: true }),
    ]);

    const { result } = renderHook(() => useShowIONBanner());

    expect(result.current).toBeFalse();
  });

  test("ignores tentative dates when finding the earliest date", () => {
    mockDisplayedDates([
      // earlier chronologically, but excluded since it's tentative
      buildDisplayedDate({ date: new Date("2024-01-20"), isTentative: true }),
      // this is the earliest non-tentative date, more than 11 months out
      buildDisplayedDate({
        date: new Date("2025-06-01"),
        isTentative: false,
      }),
    ]);

    const { result } = renderHook(() => useShowIONBanner());

    expect(result.current).toBeFalse();
  });

  test("uses the earliest date regardless of array order", () => {
    mockDisplayedDates([
      buildDisplayedDate({ date: new Date("2025-06-01") }),
      // listed last, but chronologically earliest and within 11 months
      buildDisplayedDate({ date: new Date("2024-06-01") }),
      buildDisplayedDate({ date: new Date("2024-12-01") }),
    ]);

    const { result } = renderHook(() => useShowIONBanner());

    expect(result.current).toBeTrue();
  });

  test("does not mutate the input dates array", () => {
    const dates = [
      buildDisplayedDate({ date: new Date("2025-06-01") }),
      buildDisplayedDate({ date: new Date("2024-06-01") }),
      buildDisplayedDate({ date: new Date("2024-12-01") }),
    ];
    const datesInOriginalOrder = [...dates];
    mockDisplayedDates(dates);

    // sort() mutates in place, so calling the hook is what could reorder
    // the array if the earliest date weren't computed off of a copy
    const { result } = renderHook(() => useShowIONBanner());

    expect(result.current).toBeDefined();
    expect(dates).toEqual(datesInOriginalOrder);
  });

  test("is true when the earliest date is in the past", () => {
    mockDisplayedDates([
      buildDisplayedDate({ date: new Date("2020-01-01") }),
      buildDisplayedDate({ date: new Date("2025-06-01") }),
    ]);

    const { result } = renderHook(() => useShowIONBanner());

    expect(result.current).toBeTrue();
  });

  describe("the 11-full-months boundary (frozen 'today' is January 15)", () => {
    test("is true for a date one day before the boundary (December 14)", () => {
      mockDisplayedDates([
        buildDisplayedDate({ date: new Date("2024-12-14") }),
      ]);

      const { result } = renderHook(() => useShowIONBanner());

      expect(result.current).toBeTrue();
    });

    test("is true for a date exactly 11 full months out (December 15)", () => {
      mockDisplayedDates([
        buildDisplayedDate({ date: new Date("2024-12-15") }),
      ]);

      const { result } = renderHook(() => useShowIONBanner());

      expect(result.current).toBeTrue();
    });

    test("is false for a date after the boundary (December 16)", () => {
      mockDisplayedDates([
        buildDisplayedDate({ date: new Date("2024-12-16") }),
      ]);

      const { result } = renderHook(() => useShowIONBanner());

      expect(result.current).toBeFalse();
    });

    test("is false for a date well beyond the boundary", () => {
      mockDisplayedDates([
        buildDisplayedDate({ date: new Date("2025-06-01") }),
      ]);

      const { result } = renderHook(() => useShowIONBanner());

      expect(result.current).toBeFalse();
    });
  });

  describe("feature flag", () => {
    test("is false when the flag is disabled, even if the dates would otherwise show the banner", () => {
      mockIonReferralFlag(false);
      mockDisplayedDates([
        buildDisplayedDate({ date: new Date("2024-06-01") }),
      ]);

      const { result } = renderHook(() => useShowIONBanner());

      expect(result.current).toBeFalse();
    });

    test("is true when the flag is enabled and the dates would show the banner", () => {
      mockIonReferralFlag(true);
      mockDisplayedDates([
        buildDisplayedDate({ date: new Date("2024-06-01") }),
      ]);

      const { result } = renderHook(() => useShowIONBanner());

      expect(result.current).toBeTrue();
    });
  });
});
