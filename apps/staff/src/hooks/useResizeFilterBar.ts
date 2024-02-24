// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  filtersRef: React.MutableRefObject<HTMLElement>,
  containerRef: React.MutableRefObject<HTMLElement>,
  enabledFilters: EnabledFilters,
  enableMetricModeToggle?: boolean
): number => {
  const [renderCount, setRenderCount] = useState(enabledFilters.length);

  const getRenderCount = (
    array: number[],
    outerWidth: number,
    initialWidth: number
  ) => {
    let total = initialWidth;
    for (let i = 0; i < array.length; i += 1) {
      if (outerWidth > 0 && total + array[i] > outerWidth) {
        return i;
      }
      total += array[i];
    }
    return array.length;
  };

  useEffect(() => {
    const filtersWidths = Array.from(filtersRef.current?.children).map(
      (item: any) => item.getBoundingClientRect().width
    );

    const handleResize = () => {
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
