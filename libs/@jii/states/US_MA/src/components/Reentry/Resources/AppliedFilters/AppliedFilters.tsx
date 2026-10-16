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

import { useRef, useState } from "react";

import { useUsMaTranslations } from "~@jii/translation";
import { Button } from "~design-system";

import { Chip } from "../Chip/Chip";
import {
  getAppliedOptions,
  NO_SELECTION,
  toggleOption,
} from "../filters/filterConfig";
import { SelectedFilters } from "../filters/types";
import {
  ChipRow,
  ClearAllButton,
  ExpandToggle,
  Wrapper,
} from "./AppliedFilters.styles";

// TODO(REE-181): Revisit the cap once filters for other attributes exist.
/** How many chips show before the rest collapse behind "+N more". */
export const MAX_VISIBLE_CHIPS = 4;

type AppliedFiltersProps = {
  appliedFilters: SelectedFilters;
  onChange: (filters: SelectedFilters) => void;
  onOpenSheet: () => void;
};

/**
 * The Filters button with a row of removable chips for the applied filters
 * below it. Past MAX_VISIBLE_CHIPS, the rest collapse behind a "+N more" toggle.
 */
export const AppliedFilters = ({
  appliedFilters,
  onChange,
  onOpenSheet,
}: AppliedFiltersProps) => {
  const { t } = useUsMaTranslations();
  const [expanded, setExpanded] = useState(false);

  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  const appliedOptions = getAppliedOptions(appliedFilters);
  const count = appliedOptions.length;
  const hiddenCount = Math.max(count - MAX_VISIBLE_CHIPS, 0);
  const visibleOptions = expanded
    ? appliedOptions
    : appliedOptions.slice(0, MAX_VISIBLE_CHIPS);

  const remove = (index: number) => {
    const { param, option } = visibleOptions[index];
    // Move focus to the next chip, else the Filters button.
    const neighbor = visibleOptions[index + 1] ?? visibleOptions[index - 1];
    (neighbor
      ? chipRefs.current.get(neighbor.key)
      : filtersButtonRef.current
    )?.focus();
    onChange(toggleOption(appliedFilters, param, option));
  };

  const clearAll = () => {
    filtersButtonRef.current?.focus();
    onChange(NO_SELECTION);
  };

  return (
    <Wrapper>
      <Button kind="secondary" ref={filtersButtonRef} onClick={onOpenSheet}>
        {t(($) => $.reentry.resources.filters.openButton, { count })}
      </Button>

      {count > 0 && (
        <ChipRow>
          {visibleOptions.map(({ key, option }, index) => {
            const label = option.label(t);
            return (
              <Chip
                key={key}
                ref={(element) => {
                  if (!element) return;
                  chipRefs.current.set(key, element);
                  return () => {
                    chipRefs.current.delete(key);
                  };
                }}
                removeLabel={t(
                  ($) => $.reentry.resources.filters.applied.remove,
                  {
                    label,
                  },
                )}
                onRemove={() => remove(index)}
              >
                {label}
              </Chip>
            );
          })}

          {hiddenCount > 0 && (
            <ExpandToggle
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? t(($) => $.reentry.resources.filters.applied.showLess)
                : t(($) => $.reentry.resources.filters.applied.more, {
                    count: hiddenCount,
                  })}
            </ExpandToggle>
          )}

          {count >= 2 && (
            <ClearAllButton kind="link" onClick={clearAll}>
              {t(($) => $.reentry.resources.filters.applied.clearAll)}
            </ClearAllButton>
          )}
        </ChipRow>
      )}
    </Wrapper>
  );
};
