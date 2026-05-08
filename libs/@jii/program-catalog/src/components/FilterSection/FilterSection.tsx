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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Checkbox, Selector } from "~@jii/common-ui";
import { Icon, palette } from "~design-system";

import { ProgramCatalogPresenter } from "../../presenter/ProgramCatalogPresenter";
import { TFn } from "../../types";

const ResultsCount = styled.p`
  ${typography.Sans14};
  color: ${palette.slate70};
`;

const HighlightedCount = styled.span`
  color: ${palette.opportunitiesAppGreen};
`;

const Chevron = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  transform: rotate(0deg);
  margin-left: auto;
`;

const FilterToggleButton = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${rem(spacing.sm)};
  padding: ${rem(12)} ${rem(spacing.md)};
  ${typography.Sans14};
  color: ${palette.pine3};
  border: 1px solid ${palette.slate30};
  border-radius: ${rem(4)};
  min-height: ${rem(32)};
  min-width: ${rem(32)};
  background-color: transparent;
  transition-duration: 500ms;
  transition-property: color, background-color, border-color;

  &:hover {
    background-color: ${palette.slate20};
    color: ${palette.pine4};
  }
`;

const FilterSummary = styled.summary`
  list-style: none;
  margin: 0;
  &::-webkit-details-marker {
    display: none;
  }

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.sm)};
  cursor: pointer;

  &:focus-visible ${FilterToggleButton} {
    background-color: ${palette.slate20};
    color: ${palette.pine4};
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }
`;

const FilterDetails = styled.details`
  margin-bottom: ${rem(spacing.lg)};
  padding: ${rem(spacing.md)};
  border-top: 1px solid ${palette.slate20};
  border-bottom: 1px solid ${palette.slate20};

  &[open] > ${FilterSummary} ${FilterToggleButton} {
    border-color: ${palette.pine4};
    color: ${palette.signal.links};
  }

  &[open] ${Chevron} {
    transform: rotate(180deg);
  }
`;

const Panel = styled.div`
  background: ${palette.pine2};
  border: 1px solid ${palette.slate10};
  border-radius: ${rem(8)};
  padding: ${rem(spacing.md)};
  padding-bottom: ${rem(spacing.xl)};
  margin-top: ${rem(spacing.sm)};
`;

const FilterRow = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};

  &:not(:last-child) {
    margin-bottom: ${rem(18)};
  }
`;

const DropdownWrapper = styled.div`
  flex: 1;
  min-width: ${rem(150)};
`;

const DropdownLabel = styled.label`
  display: block;
  ${typography.Sans14};
  color: ${palette.white90};
  margin-bottom: ${rem(spacing.sm)};
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(21)};
  flex: 1;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  cursor: pointer;
`;

const CheckboxText = styled.span`
  ${typography.Sans12};
  color: ${palette.white90};
`;

const ClearAllLink = styled.button`
  ${typography.Sans12};
  color: ${palette.white90};
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  margin-left: auto;
  padding: 0;

  &:hover {
    color: ${palette.white80};
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: 2px;
  }
`;

interface FilterSectionProps {
  presenter: ProgramCatalogPresenter;
  showCredits?: boolean;
  t: TFn;
}

export const FilterSection: FC<FilterSectionProps> = ({
  presenter,
  showCredits,
  t,
}) => {
  const {
    categories,
    facilities,
    filteredProgramCount,
    selectedCategory,
    selectedFacility,
    showOnlyEarnCredits,
    showOnlyStarred,
    hasActiveFilters,
    setSelectedCategory,
    setSelectedFacility,
    setShowOnlyEarnCredits,
    setShowOnlyStarred,
    clearAllFilters,
  } = presenter;

  const categoryNames = categories.map(({ name }) => name);

  const allCategoriesLabel = t(($) => $.programs.filters.allCategories);
  const allFacilitiesLabel = t(($) => $.programs.filters.allFacilities);

  const toOption = (value: string) => ({ label: value, value });

  const checkboxProps = {
    $size: 16,
    $accentColor: palette.opportunitiesAppGreen,
    $uncheckedBackground: palette.white,
  } as const;

  return (
    <FilterDetails>
      <FilterSummary>
        <ResultsCount>
          <HighlightedCount>
            {t(($) => $.programs.resultsCount, { count: filteredProgramCount })}
          </HighlightedCount>{" "}
          {t(($) => $.programs.resultsHint)}
        </ResultsCount>
        <FilterToggleButton>
          <Icon
            kind={"Filter"}
            size={12}
            color={hasActiveFilters ? palette.pine4 : palette.slate30}
          />
          {t(($) => $.programs.filters.button)}
          <Chevron>
            <Icon kind="DownChevron" width={rem(8)} height={rem(4)} />
          </Chevron>
        </FilterToggleButton>
      </FilterSummary>

      <Panel>
        <FilterRow>
          <DropdownWrapper>
            <DropdownLabel id="category-select-label">
              {t(($) => $.programs.filters.categoryLabel)}
            </DropdownLabel>
            <Selector
              labelId="category-select-label"
              placeholder={allCategoriesLabel}
              options={[
                { label: allCategoriesLabel, value: undefined },
                ...categoryNames.map(toOption),
              ]}
              value={
                selectedCategory
                  ? toOption(selectedCategory)
                  : { label: allCategoriesLabel, value: undefined }
              }
              onChange={setSelectedCategory}
            />
          </DropdownWrapper>

          <DropdownWrapper>
            <DropdownLabel id="facility-select-label">
              {t(($) => $.programs.filters.facilityLabel)}
            </DropdownLabel>
            <Selector
              labelId="facility-select-label"
              placeholder={allFacilitiesLabel}
              options={[
                { label: allFacilitiesLabel, value: undefined },
                ...facilities.map(toOption),
              ]}
              value={
                selectedFacility
                  ? toOption(selectedFacility)
                  : { label: allFacilitiesLabel, value: undefined }
              }
              onChange={setSelectedFacility}
            />
          </DropdownWrapper>
        </FilterRow>

        <FilterRow>
          <CheckboxRow>
            {showCredits && (
              <CheckboxLabel>
                <Checkbox
                  {...checkboxProps}
                  checked={showOnlyEarnCredits}
                  onChange={(e) => setShowOnlyEarnCredits(e.target.checked)}
                />
                <CheckboxText>
                  {t(($) => $.programs.filters.onlyEarnCredits)}
                </CheckboxText>
              </CheckboxLabel>
            )}

            <CheckboxLabel>
              <Checkbox
                {...checkboxProps}
                checked={showOnlyStarred}
                onChange={(e) => setShowOnlyStarred(e.target.checked)}
              />
              <CheckboxText>
                {t(($) => $.programs.filters.onlyStarred)}
              </CheckboxText>
            </CheckboxLabel>
          </CheckboxRow>

          <ClearAllLink type="button" onClick={clearAllFilters}>
            {t(($) => $.programs.filters.clearAll)}
          </ClearAllLink>
        </FilterRow>
      </Panel>
    </FilterDetails>
  );
};
