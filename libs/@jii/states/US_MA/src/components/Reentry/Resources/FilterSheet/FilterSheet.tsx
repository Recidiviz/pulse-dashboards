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

import { useState } from "react";

import { useUsMaTranslations } from "~@jii/translation";
import { Button } from "~design-system";

import { Chip } from "../Chip/Chip";
import {
  countSelectedOptions,
  isOptionSelected,
  isSameSelection,
  NO_SELECTION,
  toggleOption,
} from "../filters/filterConfig";
import { FilterGroup, SelectedFilters } from "../filters/types";
import {
  Divider,
  GroupLabel,
  GroupOptions,
  Header,
  HeaderActions,
  Subtitle,
  Title,
} from "./FilterSheet.styles";

type FilterSheetProps = {
  groups: FilterGroup[];
  appliedFilters: SelectedFilters;
  onApply: (filters: SelectedFilters) => void;
  onClose: () => void;
};

/**
 * The content of the filter BottomSheet. Selections stay in a draft until
 * Apply, and Cancel or tapping outside the sheet discards them. BottomSheet
 * mounts its content only while open, so each opening starts a new draft from
 * appliedFilters. Groups without options, such as County when no resource
 * has a county, are left out.
 */
export const FilterSheet = ({
  groups,
  appliedFilters,
  onApply,
  onClose,
}: FilterSheetProps) => {
  const { t } = useUsMaTranslations();
  const [pendingFilters, setPendingFilters] = useState(appliedFilters);
  const selectedCount = countSelectedOptions(pendingFilters);

  return (
    <>
      <Header>
        <Title>{t(($) => $.reentry.resources.filters.sheet.title)}</Title>
        <HeaderActions>
          {selectedCount > 0 && (
            <Button kind="link" onClick={() => setPendingFilters(NO_SELECTION)}>
              {t(($) => $.reentry.resources.filters.sheet.clearAll)}
            </Button>
          )}
          <Button kind="secondary" onClick={onClose}>
            {t(($) => $.reentry.resources.filters.sheet.cancel)}
          </Button>
          <Button
            kind="primary"
            disabled={isSameSelection(pendingFilters, appliedFilters)}
            onClick={() => {
              onApply(pendingFilters);
              onClose();
            }}
          >
            {t(($) => $.reentry.resources.filters.sheet.apply, {
              count: selectedCount,
            })}
          </Button>
        </HeaderActions>
      </Header>
      <Divider />
      <Subtitle>
        {t(($) => $.reentry.resources.filters.sheet.subtitle)}
      </Subtitle>

      {groups
        .filter(({ options }) => options.length > 0)
        .map(({ param, label, options }) => (
          <section key={param} aria-labelledby={`filter-group-${param}`}>
            <GroupLabel id={`filter-group-${param}`}>{label(t)}</GroupLabel>
            <GroupOptions>
              {options.map((option) => (
                <Chip
                  key={option.id}
                  selected={isOptionSelected(pendingFilters, param, option)}
                  onClick={() =>
                    setPendingFilters(
                      toggleOption(pendingFilters, param, option),
                    )
                  }
                >
                  {option.label(t)}
                </Chip>
              ))}
            </GroupOptions>
          </section>
        ))}
    </>
  );
};
