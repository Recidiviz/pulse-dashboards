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
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Checkbox } from "~design-system";

import {
  DefaultOffenseTypeOrder,
  FILTER_TYPES,
  FilterOption,
  PopulationFilter,
  sortByLabel,
} from "../../";
import { FilterTitle } from "../FilterSectionLayout/FilterTitle.styles";
import {
  HeaderRow,
  PathwaysCheckboxGroup,
  ShowMoreButton,
} from "./CheckboxGroup.styles";

const COLLAPSED_ROWS = 2;

type SelectAllConfig = {
  ariaLabel: string;
  checked: boolean;
  indeterminate: boolean;
  onChange: (next: boolean) => void;
};

type CheckboxGroupProps = {
  filter: PopulationFilter;
  selectedOptions: FilterOption[];
  onChange: (options: FilterOption[], filterType: string) => void;
  collapsible?: boolean;
  selectAll?: SelectAllConfig;
  headerTitle?: string;
  headerSuffix?: ReactNode;
};

const SELECT_ALL_VALUE = "__select_all__";

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  filter,
  selectedOptions,
  onChange,
  collapsible = false,
  selectAll,
  headerTitle,
  headerSuffix,
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

  const selectedValues = useMemo(
    () => selectedOptions.map((o) => o.value),
    [selectedOptions],
  );

  const handleChange = useCallback(
    (nextValues: string[]) => {
      // If nothing is selected, fall back to all enabled options.
      const finalOptions =
        nextValues.length === 0
          ? [...enabledOptions]
          : enabledOptions.filter((o) => nextValues.includes(o.value));

      onChange(finalOptions, filter.type);
    },
    [enabledOptions, onChange, filter.type],
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
      <PathwaysCheckboxGroup
        ref={gridRef}
        ariaLabel={filter.title}
        value={selectedValues}
        onChange={handleChange}
      >
        {(selectAll || headerTitle) && (
          <HeaderRow>
            {selectAll && (
              <Checkbox
                value={SELECT_ALL_VALUE}
                checked={selectAll.checked}
                indeterminate={selectAll.indeterminate}
                onChange={selectAll.onChange}
                ariaLabel={selectAll.ariaLabel}
                testId="checkbox-select-all"
              />
            )}
            {headerTitle && <FilterTitle>{headerTitle}</FilterTitle>}
            {headerSuffix}
          </HeaderRow>
        )}
        {displayedOptions.map((option) => (
          <Checkbox
            key={option.value}
            value={option.value}
            testId={`checkbox-${option.value}`}
          >
            {option.label}
          </Checkbox>
        ))}
      </PathwaysCheckboxGroup>
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
