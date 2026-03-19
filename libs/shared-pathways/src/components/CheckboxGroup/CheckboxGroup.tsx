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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DefaultOffenseTypeOrder,
  FILTER_TYPES,
  FilterOption,
  PopulationFilter,
  sortByLabel,
} from "../../";
import Checkbox from "./Checkbox";
import { CheckboxGroupGrid, ShowMoreButton } from "./CheckboxGroup.styles";

const COLLAPSED_ROWS = 2;

type CheckboxGroupProps = {
  filter: PopulationFilter;
  selectedOptions: FilterOption[];
  onChange: (options: FilterOption[], filterType: string) => void;
  collapsible?: boolean;
};

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  filter,
  selectedOptions,
  onChange,
  collapsible = false,
}) => {
  const enabledOptions = filter.options.slice(1);
  const isOffenseType = filter.type === FILTER_TYPES.OFFENSE_TYPE;
  const [expanded, setExpanded] = useState(false);
  const [columnCount, setColumnCount] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const sortedOptions = useMemo(() => {
    const opts = [...enabledOptions];
    sortByLabel({
      dataPoints: opts,
      labelKey: "label",
      valueKey: isOffenseType ? "value" : undefined,
      sortOverride: isOffenseType ? DefaultOffenseTypeOrder : undefined,
    });
    return opts;
  }, [enabledOptions, isOffenseType]);

  const handleChange = useCallback(
    (option: FilterOption) => {
      const isSelected = selectedOptions.some((o) => o.value === option.value);

      let newOptions: FilterOption[];
      if (isSelected) {
        newOptions = selectedOptions.filter((o) => o.value !== option.value);
      } else {
        newOptions = [...selectedOptions, option];
      }

      // If nothing is selected, fall back to all options
      if (newOptions.length === 0) {
        newOptions = [...enabledOptions];
      }

      onChange(newOptions, filter.type);
    },
    [selectedOptions, enabledOptions, onChange, filter.type],
  );

  // Measure column count from the grid after first render
  useEffect(() => {
    if (!collapsible) return;
    const el = gridRef.current;
    if (!el) return;
    const columns = getComputedStyle(el)
      .gridTemplateColumns.split(" ")
      .filter(Boolean).length;
    setColumnCount(columns);
  }, [collapsible]);

  const totalCount = sortedOptions.length;
  const visibleCount =
    collapsible && columnCount != null
      ? COLLAPSED_ROWS * columnCount
      : totalCount;
  const needsCollapse = collapsible && totalCount > visibleCount;

  const displayedOptions =
    needsCollapse && !expanded
      ? sortedOptions.slice(0, visibleCount)
      : sortedOptions;

  return (
    <>
      <CheckboxGroupGrid ref={gridRef}>
        {displayedOptions.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            checked={selectedOptions.some((o) => o.value === option.value)}
            onChange={() => handleChange(option)}
          >
            {option.label}
          </Checkbox>
        ))}
      </CheckboxGroupGrid>
      {needsCollapse && (
        <ShowMoreButton
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less" : `Show all ${totalCount}`}
        </ShowMoreButton>
      )}
    </>
  );
};

export default CheckboxGroup;
