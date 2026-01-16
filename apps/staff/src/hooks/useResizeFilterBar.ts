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

import { useEffect, useState } from "react";

import { EnabledFilters } from "../core/types/filters";

const useResizeFilterBar = (
  filtersRef: React.RefObject<HTMLElement | undefined>,
  containerRef: React.RefObject<HTMLElement | undefined>,
  enabledFilters: EnabledFilters,
  enableMetricModeToggle?: boolean,
): number => {
  const [renderCount, setRenderCount] = useState(enabledFilters.length);

  const getRenderCount = (
    array: number[],
    outerWidth: number,
    initialWidth: number,
    gap = 24, // 1.5rem padding-right per filter
  ) => {
    let total = initialWidth;
    for (let i = 0; i < array.length; i += 1) {
      const nextTotal = total + array[i] + gap;
      if (outerWidth > 0 && nextTotal > outerWidth) {
        return i;
      }
      total = nextTotal;
    }
    return array.length;
  };

  useEffect(() => {
    if (!filtersRef.current) {
      return;
    }
    const filtersWidths = Array.from(filtersRef.current?.children).map(
      (item: any) => item.getBoundingClientRect().width,
    );

    const handleResize = () => {
      if (!containerRef.current) {
        return;
      }
      const containerWidth = containerRef.current?.offsetWidth;
      const count = getRenderCount(filtersWidths, containerWidth, 140);
      setRenderCount(enableMetricModeToggle ? count - 1 : count);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [
    filtersRef,
    containerRef,
    enabledFilters,
    enabledFilters.length,
    enableMetricModeToggle,
  ]);

  return renderCount;
};

export default useResizeFilterBar;
